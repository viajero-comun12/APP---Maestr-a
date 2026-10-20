from datetime import date, datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

class MasterProgram(Base):
    __tablename__ = "master_programs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    call_for_applications = Column(String(100), nullable=False)  # Convocatoria (ej: 2026-I)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    min_passing_score = Column(Float, default=70.0)  # Puntuación mínima aprobatoria
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    courses = relationship("PreparatoryCourse", back_populates="program", cascade="all, delete-orphan")
    enrollments = relationship("ApplicantEnrollment", back_populates="program")


class PreparatoryCourse(Base):
    __tablename__ = "preparatory_courses"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("master_programs.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    max_deadline_days = Column(Integer, default=30)  # Plazo máximo en días
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    program = relationship("MasterProgram", back_populates="courses")
    activities = relationship("Activity", back_populates="course", cascade="all, delete-orphan")


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("preparatory_courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    weighting = Column(Float, default=0.0)  # Ponderación porcentual (ej: 25.0%)
    deadline = Column(DateTime, nullable=True)
    evidence_type = Column(String(50), default="CERTIFICADO_PDF")  # "CERTIFICADO_PDF", "PROYECTO", "DOCUMENTO"
    is_mandatory = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    course = relationship("PreparatoryCourse", back_populates="activities")
    evidences = relationship("Evidence", back_populates="activity")
