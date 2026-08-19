from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, TrainedModel, Experiment, Dataset
from pydantic import BaseModel
import joblib
from engines.tuning_engine import tune_model
from engines.data_engine import load_dataset
from engines.preprocessing_engine import apply_pipeline
from engines.training_engine import get_model

router = APIRouter()

class TuneRequest(BaseModel):
    model_id: int
    n_trials: int = 20

@router.post("/run")
def run_tuning(req: TuneRequest, db: Session = Depends(get_db)):
    tm = db.query(TrainedModel).filter(TrainedModel.id == req.model_id).first()
    if not tm:
        raise HTTPException(404, "Model not found")

    exp = db.query(Experiment).filter(Experiment.id == tm.experiment_id).first()
    ds = db.query(Dataset).filter(Dataset.id == exp.dataset_id).first()

    df = load_dataset(ds.file_path)
    df = df.loc[df[exp.target_column].notna()].copy()
    X_train, X_test, y_train, y_test, pipeline = apply_pipeline(df, exp.target_column, exp.config)

    target_classes = (exp.config or {}).get("_target_classes", [])
    if exp.problem_type == "classification" and target_classes:
        class_to_index = {str(value): index for index, value in enumerate(target_classes)}
        try:
            y_train = y_train.map(lambda value: class_to_index[str(value)]).astype(int)
            y_test = y_test.map(lambda value: class_to_index[str(value)]).astype(int)
        except KeyError as exc:
            raise HTTPException(422, f"Target class {exc.args[0]!r} was not present during training") from exc

    metric = "accuracy" if exp.problem_type == "classification" else "r2"

    best_params, best_value, trial_history = tune_model(
        algorithm=tm.algorithm,
        X_train=X_train,
        y_train=y_train,
        X_test=X_test,
        y_test=y_test,
        problem_type=exp.problem_type,
        metric=metric,
        n_trials=req.n_trials
    )

    tuned_model = get_model(tm.algorithm, exp.problem_type)
    tuned_model.set_params(**best_params)
    tuned_model.fit(X_train, y_train)
    joblib.dump(tuned_model, tm.file_path)

    tm.hyperparameters = best_params
    db.commit()

    return {"status": "Tuning completed", "best_params": best_params, "trial_history": trial_history}

@router.get("/{run_id}/results")
def get_tuning_results(run_id: int):
    return {"trial_history": []}
