from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, Dataset, Experiment
from engines.data_engine import load_dataset, get_profile, get_quality_score, auto_clean
import os
import shutil
import json
from pathlib import Path
from uuid import uuid4

router = APIRouter()
STORAGE_DIR = Path(__file__).resolve().parents[1] / "storage" / "datasets"
SUPPORTED_EXTENSIONS = {".csv", ".xlsx", ".parquet", ".json"}

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    original_name = Path(file.filename or "").name
    extension = Path(original_name).suffix.lower()
    if not original_name or extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Upload a CSV, Excel, Parquet, or JSON dataset.")
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex}_{original_name}"
    file_path = STORAGE_DIR / stored_name
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        df = load_dataset(str(file_path))
    except Exception as e:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=str(e))
        
    ds = Dataset(
        name=original_name,
        filename=original_name,
        file_path=str(file_path),
        rows=df.shape[0],
        columns=df.shape[1],
        column_names=df.columns.tolist(),
        dtypes={col: str(dt) for col, dt in df.dtypes.items()},
        missing_values=int(df.isnull().sum().sum()),
        quality_score=get_quality_score(df)
    )
    db.add(ds)
    db.commit()
    db.refresh(ds)
    return ds

@router.delete("/{id}", status_code=204)
def delete_dataset(id: int, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if db.query(Experiment).filter(Experiment.dataset_id == id).first():
        raise HTTPException(status_code=409, detail="Dataset is used by an experiment and cannot be deleted")
    referenced = db.query(Dataset).filter(Dataset.file_path == ds.file_path, Dataset.id != id).first()
    db.delete(ds)
    db.commit()
    if not referenced:
        Path(ds.file_path).unlink(missing_ok=True)

@router.get("/")
def list_datasets(db: Session = Depends(get_db)):
    return db.query(Dataset).all()

@router.get("/{id}")
def get_dataset(id: int, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return ds

@router.get("/{id}/preview")
def preview_dataset(id: int, page: int = 1, page_size: int = 50, db: Session = Depends(get_db)):
    ds = get_dataset(id, db)
    df = load_dataset(ds.file_path)
    start = (page - 1) * page_size
    end = start + page_size
    # pandas uses NaN/NaT internally, but strict JSON requires null.
    return json.loads(df.iloc[start:end].to_json(orient="records", date_format="iso"))

@router.get("/{id}/profile")
def profile_dataset(id: int, db: Session = Depends(get_db)):
    ds = get_dataset(id, db)
    df = load_dataset(ds.file_path)
    return get_profile(df)

@router.get("/{id}/quality")
def quality_dataset(id: int, db: Session = Depends(get_db)):
    ds = get_dataset(id, db)
    return {"quality_score": ds.quality_score}

@router.post("/{id}/clean")
def clean_dataset(id: int, fixes: list, db: Session = Depends(get_db)):
    ds = get_dataset(id, db)
    df = load_dataset(ds.file_path)
    cleaned = auto_clean(df, fixes)
    cleaned_path = STORAGE_DIR / f"{uuid4().hex}_cleaned_{Path(ds.filename).name}"
    cleaned.to_csv(cleaned_path, index=False)
    
    new_ds = Dataset(
        name=f"Cleaned {ds.name}",
        filename=f"cleaned_{ds.filename}",
        file_path=str(cleaned_path),
        rows=cleaned.shape[0],
        columns=cleaned.shape[1],
        column_names=cleaned.columns.tolist(),
        dtypes={col: str(dt) for col, dt in cleaned.dtypes.items()},
        missing_values=int(cleaned.isnull().sum().sum()),
        quality_score=get_quality_score(cleaned)
    )
    db.add(new_ds)
    db.commit()
    db.refresh(new_ds)
    return new_ds
