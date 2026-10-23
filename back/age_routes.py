from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, field_validator
from sqlalchemy import Date, select
from sqlalchemy.orm import Mapped, Session, mapped_column

from database import Base, get_db


# ---------- Model (schema da tabela) ----------
class BirthDate(Base):
    """Guarda só a data de nascimento; a idade é sempre calculada na leitura."""

    __tablename__ = "birth_dates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)


# ---------- Regra de negócio ----------
def calculate_age(birth_date: date, today: date | None = None) -> int:
    """Idade em anos completos. Aniversário de 29/02 conta a partir de 01/03
    em anos não bissextos."""
    today = today or date.today()
    had_birthday = (today.month, today.day) >= (birth_date.month, birth_date.day)
    return today.year - birth_date.year - (0 if had_birthday else 1)


# ---------- Schemas (Pydantic) ----------
class BirthDateBase(BaseModel):
    birth_date: date

    @field_validator("birth_date")
    @classmethod
    def not_in_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("A data de nascimento não pode estar no futuro")
        return value


class BirthDateCreate(BirthDateBase):
    pass


class BirthDateUpdate(BirthDateBase):
    pass


class AgeOut(BaseModel):
    id: int
    birth_date: date
    age: int


def _to_out(obj: BirthDate) -> AgeOut:
    return AgeOut(id=obj.id, birth_date=obj.birth_date, age=calculate_age(obj.birth_date))


# ---------- Rotas ----------
router = APIRouter(prefix="/ages", tags=["ages"])


def _get_or_404(db: Session, age_id: int) -> BirthDate:
    obj = db.get(BirthDate, age_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Registro não encontrado")
    return obj


@router.get("", response_model=list[AgeOut])
def list_ages(db: Session = Depends(get_db)):
    rows = db.scalars(select(BirthDate).order_by(BirthDate.id)).all()
    return [_to_out(r) for r in rows]


@router.get("/{age_id}", response_model=AgeOut)
def get_age(age_id: int, db: Session = Depends(get_db)):
    return _to_out(_get_or_404(db, age_id))


@router.post("", response_model=AgeOut, status_code=status.HTTP_201_CREATED)
def create_age(payload: BirthDateCreate, db: Session = Depends(get_db)):
    obj = BirthDate(birth_date=payload.birth_date)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _to_out(obj)


@router.put("/{age_id}", response_model=AgeOut)
def update_age(age_id: int, payload: BirthDateUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, age_id)
    obj.birth_date = payload.birth_date
    db.commit()
    db.refresh(obj)
    return _to_out(obj)


@router.delete("/{age_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_age(age_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, age_id)
    db.delete(obj)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
