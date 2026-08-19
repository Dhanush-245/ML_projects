from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, TrainedModel, Deployment, Experiment, Dataset
from pydantic import BaseModel
import joblib
import pandas as pd
from typing import List
from engines.data_engine import load_dataset
from engines.preprocessing_engine import apply_pipeline

router = APIRouter()

class PredictRequest(BaseModel):
    features: dict

class PredictBatchRequest(BaseModel):
    features: List[dict]

@router.post("/deploy/{model_id}")
def deploy_model(model_id: int, db: Session = Depends(get_db)):
    tm = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not tm:
        raise HTTPException(404, "Model not found")
    dep = Deployment(model_id=model_id, name=f"Deployment_{model_id}", status="active", endpoint_url="pending")
    db.add(dep)
    db.flush()
    dep.endpoint_url = f"/api/v1/deployment/predict/{dep.id}"
    db.commit()
    db.refresh(dep)
    return dep

def get_prediction_pipeline(deployment_id: int, db: Session):
    dep = db.query(Deployment).filter(Deployment.id == deployment_id).first()
    if not dep:
        raise HTTPException(404, "Deployment not found")

    tm = db.query(TrainedModel).filter(TrainedModel.id == dep.model_id).first()
    if not tm:
        raise HTTPException(404, "Model not found")

    exp = db.query(Experiment).filter(Experiment.id == tm.experiment_id).first()
    ds = db.query(Dataset).filter(Dataset.id == exp.dataset_id).first()

    df = load_dataset(ds.file_path)
    df = df.loc[df[exp.target_column].notna()].copy()
    _, _, _, _, pipeline = apply_pipeline(df, exp.target_column, exp.config)

    model = joblib.load(tm.file_path)
    target_classes = (exp.config or {}).get("_target_classes", [])
    return model, pipeline, target_classes

def decode_prediction(value, target_classes):
    if hasattr(value, "item"):
        value = value.item()
    if target_classes:
        try:
            index = int(value)
            if 0 <= index < len(target_classes):
                return target_classes[index]
        except (TypeError, ValueError):
            pass
    return value

@router.post("/predict/{deployment_id}")
def predict(deployment_id: int, req: PredictRequest, db: Session = Depends(get_db)):
    model, pipeline, target_classes = get_prediction_pipeline(deployment_id, db)
    df_new = pd.DataFrame([req.features])
    X_new = pipeline.transform(df_new)
    prediction = model.predict(X_new)

    pred_val = decode_prediction(prediction[0], target_classes)
    return {"prediction": pred_val}

@router.post("/predict/{deployment_id}/batch")
def predict_batch(deployment_id: int, req: PredictBatchRequest, db: Session = Depends(get_db)):
    model, pipeline, target_classes = get_prediction_pipeline(deployment_id, db)
    df_new = pd.DataFrame(req.features)
    X_new = pipeline.transform(df_new)
    predictions = model.predict(X_new)

    pred_list = [decode_prediction(value, target_classes) for value in predictions]
    return {"predictions": pred_list}

@router.get("/")
def list_deployments(db: Session = Depends(get_db)):
    return db.query(Deployment).all()
