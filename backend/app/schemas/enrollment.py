from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.enrollment import EnrollmentStatus, RiskLevel, EvidenceStatus

# ----------------- Evidencias -----------------
class EvidenceBase(BaseModel):
    observations: Optional[str] = None

class EvidenceReview(BaseModel):
    status: EvidenceStatus  # APROBADO o RECHAZADO
    score: Optional[float] = None
    observations: Optional[str] = None

class EvidenceOut(BaseModel):
    id: int
    enrollment_id: int
    activity_id: int
    activity_title: Optional[str] = None
    file_url: str
    file_name: str
    file_size: Optional[int] = None
    upload_date: datetime
    status: EvidenceStatus
    score: Optional[float] = None
    observations: Optional[str] = None
    reviewed_by_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- Inscripción -----------------
class EnrollmentCreate(BaseModel):
    program_id: int

class EnrollmentAssignTutor(BaseModel):
    tutor_id: int

class EnrollmentStatusUpdate(BaseModel):
    status: Optional[EnrollmentStatus] = None
    risk_level: Optional[RiskLevel] = None

class EnrollmentOut(BaseModel):
    id: int
    applicant_id: int
    applicant_name: Optional[str] = None
    applicant_email: Optional[str] = None
    program_id: int
    program_name: Optional[str] = None
    program_call: Optional[str] = None
    assigned_tutor_id: Optional[int] = None
    tutor_name: Optional[str] = None
    enrollment_date: datetime
    status: EnrollmentStatus
    risk_level: RiskLevel
    completion_percentage: float
    last_activity_at: Optional[datetime] = None
    evidences: List[EvidenceOut] = []

    class Config:
        from_attributes = True

class ApplicantProgressOut(BaseModel):
    enrollment_id: int
    program_name: str
    completion_percentage: float
    status: EnrollmentStatus
    risk_level: RiskLevel
    total_activities: int
    completed_activities: int
    pending_activities: int
    days_remaining: int
    assigned_tutor: Optional[str] = None
