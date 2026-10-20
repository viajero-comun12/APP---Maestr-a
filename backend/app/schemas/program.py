from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# ----------------- Actividades -----------------
class ActivityBase(BaseModel):
    title: str
    description: Optional[str] = None
    weighting: float = Field(..., ge=0, le=100, description="Ponderación porcentual (0 a 100)")
    deadline: Optional[datetime] = None
    evidence_type: str = "CERTIFICADO_PDF"
    is_mandatory: bool = True

class ActivityCreate(ActivityBase):
    course_id: int

class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    weighting: Optional[float] = None
    deadline: Optional[datetime] = None
    evidence_type: Optional[str] = None
    is_mandatory: Optional[bool] = None

class ActivityOut(ActivityBase):
    id: int
    course_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Cursos Preparatorios -----------------
class PreparatoryCourseBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    max_deadline_days: int = 30
    is_active: bool = True

class PreparatoryCourseCreate(PreparatoryCourseBase):
    program_id: int

class PreparatoryCourseOut(PreparatoryCourseBase):
    id: int
    program_id: int
    created_at: datetime
    activities: List[ActivityOut] = []

    class Config:
        from_attributes = True

# ----------------- Programas de Maestría -----------------
class MasterProgramBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    call_for_applications: str
    start_date: date
    end_date: date
    min_passing_score: float = 70.0
    is_active: bool = True

class MasterProgramCreate(MasterProgramBase):
    pass

class MasterProgramUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    call_for_applications: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    min_passing_score: Optional[float] = None
    is_active: Optional[bool] = None

class MasterProgramOut(MasterProgramBase):
    id: int
    created_at: datetime
    courses: List[PreparatoryCourseOut] = []

    class Config:
        from_attributes = True
