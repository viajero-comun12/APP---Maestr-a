from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.tracking import ContactType, CaseStatus

class TrackingRecordCreate(BaseModel):
    enrollment_id: int
    contact_date: Optional[datetime] = None
    contact_type: ContactType
    result: str
    commitments: Optional[str] = None
    observations: Optional[str] = None
    recommendations: Optional[str] = None
    next_action: Optional[str] = None
    applicant_response: Optional[str] = None
    case_status: CaseStatus = CaseStatus.EN_SEGUIMIENTO

class TrackingRecordOut(BaseModel):
    id: int
    tracking_number: str
    enrollment_id: int
    tutor_id: int
    tutor_name: Optional[str] = None
    applicant_name: Optional[str] = None
    contact_date: datetime
    contact_type: ContactType
    result: str
    commitments: Optional[str] = None
    observations: Optional[str] = None
    recommendations: Optional[str] = None
    next_action: Optional[str] = None
    applicant_response: Optional[str] = None
    case_status: CaseStatus
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationLogOut(BaseModel):
    id: int
    user_id: int
    enrollment_id: Optional[int] = None
    event_type: str
    recipient_email: str
    subject: str
    message: str
    channel: str
    sent_at: datetime

    class Config:
        from_attributes = True

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity_name: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
