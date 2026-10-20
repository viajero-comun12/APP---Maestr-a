from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from app.db.session import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    COORDINADOR = "COORDINADOR"
    TUTOR = "TUTOR"
    POSTULANTE = "POSTULANTE"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    document_id = Column(String(50), nullable=True)  # DNI / Pasaporte / Cédula
    role = Column(Enum(UserRole), default=UserRole.POSTULANTE, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    enrollments = relationship("ApplicantEnrollment", back_populates="applicant", foreign_keys="ApplicantEnrollment.applicant_id")
    assigned_enrollments = relationship("ApplicantEnrollment", back_populates="tutor", foreign_keys="ApplicantEnrollment.assigned_tutor_id")
    tracking_records = relationship("TrackingRecord", back_populates="tutor")
    reviewed_evidences = relationship("Evidence", back_populates="reviewer")
    audit_logs = relationship("AuditLog", back_populates="user")
