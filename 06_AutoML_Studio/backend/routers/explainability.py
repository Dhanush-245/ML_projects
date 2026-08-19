from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, TrainedModel, Experiment, Dataset
from pydantic import BaseModel, Field
from typing import Union
import joblib
from engines.data_engine import load_dataset
from engines.preprocessing_engine import apply_pipeline
from engines.xai_engine import compute_shap_values, compute_lime_explanation, compute_pdp, compute_counterfactual

router = APIRouter()

@router.get("/models")
def list_explainable_models(db: Session = Depends(get_db)):
    rows = (
        db.query(TrainedModel, Experiment, Dataset)
        .join(Experiment, TrainedModel.experiment_id == Experiment.id)
        .join(Dataset, Experiment.dataset_id == Dataset.id)
        .filter(Experiment.status == "completed")
        .order_by(TrainedModel.created_at.desc())
        .all()
    )
    return [
        {
            "id": model.id,
            "model_id": model.id,
            "algorithm": model.algorithm,
            "experiment_id": experiment.id,
            "dataset_name": dataset.name,
            "problem_type": experiment.problem_type,
        }
        for model, experiment, dataset in rows
    ]

class XAIRequest(BaseModel):
    instance: list = Field(default_factory=list)
    row_index: int = 0

class CounterFactualRequest(BaseModel):
    instance: list = Field(default_factory=list)
    desired_outcome: Union[int, str] = 1

def get_model_data(model_id: int, db: Session):
    tm = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not tm:
        raise HTTPException(404, "Model not found")
    exp = db.query(Experiment).filter(Experiment.id == tm.experiment_id).first()
    ds = db.query(Dataset).filter(Dataset.id == exp.dataset_id).first()
    df = load_dataset(ds.file_path)
    df = df.loc[df[exp.target_column].notna()].copy()
    X_train, X_test, y_train, y_test, pipeline = apply_pipeline(df, exp.target_column, exp.config)
    model = joblib.load(tm.file_path)

    try:
        feature_names = pipeline.get_feature_names_out().tolist()
    except Exception:
        feature_names = [f"f{i}" for i in range(X_train.shape[1])]

    return model, tm, exp, ds, X_train, X_test, y_train, y_test, pipeline, feature_names

@router.post("/shap/{model_id}")
def get_shap(model_id: int, db: Session = Depends(get_db)):
    model, tm, exp, ds, X_train, X_test, y_train, y_test, pipeline, feature_names = get_model_data(model_id, db)
    sample_size = min(100, X_test.shape[0])
    X_sample = X_test[:sample_size]
    res = compute_shap_values(model, X_sample, feature_names)
    return res

@router.post("/lime/{model_id}")
def get_lime(model_id: int, req: XAIRequest, db: Session = Depends(get_db)):
    model, tm, exp, ds, X_train, X_test, y_train, y_test, pipeline, feature_names = get_model_data(model_id, db)
    saved_classes = (exp.config or {}).get("_target_classes", [])
    class_names = ([str(c) for c in saved_classes] or [str(c) for c in sorted(y_train.unique())]) if exp.problem_type == "classification" else None
    if req.instance:
        instance = req.instance
    elif hasattr(X_test, "toarray"):
        instance = X_test[req.row_index % X_test.shape[0]].toarray().ravel().tolist()
    else:
        row = X_test[req.row_index % X_test.shape[0]]
        instance = row.tolist() if hasattr(row, "tolist") else list(row)
    res = compute_lime_explanation(model, X_train, instance, feature_names, class_names)
    prediction = model.predict([instance])[0]
    if hasattr(prediction, "item"):
        prediction = prediction.item()
    if saved_classes and isinstance(prediction, int) and 0 <= prediction < len(saved_classes):
        prediction = saved_classes[prediction]
    return {
        "explanations": [{"feature": feature, "impact": float(impact)} for feature, impact in res],
        "prediction": prediction,
    }

@router.post("/pdp/{model_id}")
def get_pdp(model_id: int, db: Session = Depends(get_db)):
    model, tm, exp, ds, X_train, X_test, y_train, y_test, pipeline, feature_names = get_model_data(model_id, db)
    features_to_plot = feature_names[:min(2, len(feature_names))]
    res = compute_pdp(model, X_train, feature_names, features_to_plot)
    return {"pdp": res}

@router.post("/counterfactual/{model_id}")
def get_counterfactual(model_id: int, req: CounterFactualRequest, db: Session = Depends(get_db)):
    model, tm, exp, ds, X_train, X_test, y_train, y_test, pipeline, feature_names = get_model_data(model_id, db)
    if req.instance:
        instance = req.instance
    elif hasattr(X_test, "toarray"):
        instance = X_test[0].toarray().ravel().tolist()
    else:
        row = X_test[0]
        instance = row.tolist() if hasattr(row, "tolist") else list(row)

    desired_outcome = req.desired_outcome
    saved_classes = (exp.config or {}).get("_target_classes", [])
    if saved_classes and isinstance(desired_outcome, str):
        matching = [index for index, value in enumerate(saved_classes) if str(value) == desired_outcome]
        desired_outcome = matching[0] if matching else 1
    res = compute_counterfactual(model, instance, int(desired_outcome), feature_names, X_train)
    if saved_classes and 0 <= int(desired_outcome) < len(saved_classes):
        res["prediction"] = saved_classes[int(desired_outcome)]
    return res
