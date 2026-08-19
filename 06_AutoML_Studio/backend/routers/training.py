from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, Experiment, TrainedModel, Dataset
from engines.data_engine import load_dataset
from engines.preprocessing_engine import apply_pipeline
from engines.training_engine import train_models
import joblib
from pydantic import BaseModel
from pathlib import Path
from sklearn.preprocessing import LabelEncoder

router = APIRouter()
MODEL_DIR = Path(__file__).resolve().parents[1] / "storage" / "models"

class TrainRequest(BaseModel):
    dataset_id: int
    target_column: str
    problem_type: str
    algorithms: list
    cv_folds: int = 5
    metric: str = "accuracy"
    preprocessing_config: dict

@router.post("/run")
def run_training(req: TrainRequest, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == req.dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if req.problem_type not in {"classification", "regression"}:
        raise HTTPException(status_code=422, detail="Problem type must be classification or regression")
    if req.cv_folds < 2 or req.cv_folds > 20:
        raise HTTPException(status_code=422, detail="Cross-validation folds must be between 2 and 20")
    if not req.algorithms:
        raise HTTPException(status_code=422, detail="Select at least one algorithm")
        
    exp = Experiment(
        name=f"Exp_{req.dataset_id}",
        dataset_id=req.dataset_id,
        target_column=req.target_column,
        problem_type=req.problem_type,
        status="running",
        config=req.preprocessing_config
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    
    df = load_dataset(ds.file_path)
    if req.target_column not in df.columns:
        exp.status = "failed"
        db.commit()
        raise HTTPException(status_code=422, detail=f"Target column '{req.target_column}' was not found")

    try:
        missing_targets = int(df[req.target_column].isna().sum())
        if missing_targets:
            df = df.loc[df[req.target_column].notna()].copy()
        if len(df) < max(10, req.cv_folds * 2):
            raise ValueError("Not enough rows with a valid target value for the selected cross-validation folds")

        X_train, X_test, y_train, y_test, pipeline = apply_pipeline(df, req.target_column, req.preprocessing_config)

        experiment_config = dict(req.preprocessing_config)
        if req.problem_type == "classification":
            label_encoder = LabelEncoder()
            label_encoder.fit(df[req.target_column])
            if len(label_encoder.classes_) < 2:
                raise ValueError("Classification requires at least two distinct target classes")
            y_train = label_encoder.transform(y_train)
            y_test = label_encoder.transform(y_test)
            experiment_config["_target_classes"] = [
                value.item() if hasattr(value, "item") else value
                for value in label_encoder.classes_
            ]
        experiment_config["_ignored_missing_target_rows"] = missing_targets
        exp.config = experiment_config
        db.commit()

        results = train_models(X_train, y_train, X_test, y_test, req.algorithms, req.problem_type, req.cv_folds)
    except Exception as exc:
        exp.status = "failed"
        db.commit()
        raise HTTPException(status_code=422, detail=f"Training could not be completed: {exc}") from exc
    
    for res in results:
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        safe_algorithm = "_".join(str(res["algorithm"]).split())
        model_path = MODEL_DIR / f"model_{exp.id}_{safe_algorithm}.pkl"
        joblib.dump(res['fitted_model'], model_path)
        
        tm = TrainedModel(
            experiment_id=exp.id,
            algorithm=res['algorithm'],
            hyperparameters={},
            metrics=res['metrics'],
            file_path=str(model_path)
        )
        db.add(tm)
    
    exp.status = "completed"
    db.commit()
    return {"experiment_id": exp.id, "status": "completed"}

@router.get("/experiments")
def list_experiments(db: Session = Depends(get_db)):
    return db.query(Experiment).all()

@router.get("/experiments/{id}")
def get_experiment(id: int, db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == id).first()
    models = db.query(TrainedModel).filter(TrainedModel.experiment_id == id).all()
    return {"experiment": exp, "models": models}

@router.get("/experiments/{id}/leaderboard")
def experiment_leaderboard(id: int, db: Session = Depends(get_db)):
    models = db.query(TrainedModel).filter(TrainedModel.experiment_id == id).all()
    sorted_models = sorted(models, key=lambda x: x.metrics.get('accuracy', 0) if x.metrics else 0, reverse=True)
    return sorted_models

@router.get("/experiments/{id}/evaluation/{model_id}")
def model_evaluation(id: int, model_id: int, db: Session = Depends(get_db)):
    tm = db.query(TrainedModel).filter(TrainedModel.id == model_id, TrainedModel.experiment_id == id).first()
    if not tm:
        raise HTTPException(status_code=404, detail="Model not found")
    return tm.metrics
