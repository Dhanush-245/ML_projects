from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, TrainedModel

router = APIRouter()

@router.get("/models")
def list_registry(db: Session = Depends(get_db)):
    return db.query(TrainedModel).filter(TrainedModel.is_champion == True).all()

@router.post("/models/{model_id}/promote")
def promote_model(model_id: int, db: Session = Depends(get_db)):
    tm = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if not tm:
        raise HTTPException(404, "Model not found")
    tm.is_champion = True
    db.commit()
    db.refresh(tm)
    return tm

@router.delete("/models/{model_id}")
def archive_model(model_id: int, db: Session = Depends(get_db)):
    tm = db.query(TrainedModel).filter(TrainedModel.id == model_id).first()
    if tm:
        tm.is_champion = False
        db.commit()
    return {"status": "archived"}
