from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy import String, select
from sqlalchemy.orm import Mapped, Session, mapped_column

from database import Base, get_db


# ---------- Model (schema da tabela) ----------
class Name(Base):
    __tablename__ = "names"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)


# ---------- Schemas (Pydantic) ----------
class NameBase(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("O nome não pode ser vazio")
        if len(value) > 100:
            raise ValueError("O nome deve ter no máximo 100 caracteres")
        return value


class NameCreate(NameBase):
    pass


class NameUpdate(NameBase):
    pass


class NameOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


# ---------- Rotas ----------
router = APIRouter(prefix="/names", tags=["names"])


def _get_or_404(db: Session, name_id: int) -> Name:
    obj = db.get(Name, name_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Nome não encontrado")
    return obj


@router.get("", response_model=list[NameOut])
def list_names(db: Session = Depends(get_db)):
    return db.scalars(select(Name).order_by(Name.id)).all()


@router.get("/{name_id}", response_model=NameOut)
def get_name(name_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, name_id)


@router.post("", response_model=NameOut, status_code=status.HTTP_201_CREATED)
def create_name(payload: NameCreate, db: Session = Depends(get_db)):
    obj = Name(name=payload.name)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{name_id}", response_model=NameOut)
def update_name(name_id: int, payload: NameUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, name_id)
    obj.name = payload.name
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{name_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_name(name_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, name_id)
    db.delete(obj)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
