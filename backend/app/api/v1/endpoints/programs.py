from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, RoleChecker, record_audit
from app.models.user import User, UserRole
from app.models.program import MasterProgram, PreparatoryCourse, Activity
from app.schemas.program import (
    MasterProgramCreate, MasterProgramUpdate, MasterProgramOut,
    PreparatoryCourseBase, PreparatoryCourseCreate, PreparatoryCourseOut,
    ActivityBase, ActivityCreate, ActivityUpdate, ActivityOut
)

router = APIRouter()

# ----------------- Programas de Maestría -----------------

@router.get("/", response_model=List[MasterProgramOut], summary="Listar programas de maestría activos")
def list_master_programs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(MasterProgram).filter(MasterProgram.is_active == True).all()


@router.post("/", response_model=MasterProgramOut, status_code=status.HTTP_201_CREATED, summary="Crear un nuevo programa de maestría")
def create_master_program(
    program_in: MasterProgramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR]))
):
    if db.query(MasterProgram).filter(MasterProgram.code == program_in.code.upper().strip()).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un programa con este código")

    program = MasterProgram(
        name=program_in.name.strip(),
        code=program_in.code.upper().strip(),
        description=program_in.description,
        call_for_applications=program_in.call_for_applications.strip(),
        start_date=program_in.start_date,
        end_date=program_in.end_date,
        min_passing_score=program_in.min_passing_score,
        is_active=program_in.is_active
    )
    db.add(program)
    db.commit()
    db.refresh(program)

    record_audit(db, user_id=current_user.id, action="CREAR_PROGRAMA", entity_name="MasterProgram", entity_id=str(program.id), details=f"Programa creado: {program.name}")

    return program


@router.get("/{program_id}", response_model=MasterProgramOut, summary="Obtener detalle de un programa y sus cursos")
def get_master_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    program = db.query(MasterProgram).filter(MasterProgram.id == program_id).first()
    if not program:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Programa no encontrado")
    return program


@router.put("/{program_id}", response_model=MasterProgramOut, summary="Actualizar información de un programa")
def update_master_program(
    program_id: int,
    program_update: MasterProgramUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR]))
):
    program = db.query(MasterProgram).filter(MasterProgram.id == program_id).first()
    if not program:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Programa no encontrado")

    for field, value in program_update.model_dump(exclude_unset=True).items():
        setattr(program, field, value)

    db.commit()
    db.refresh(program)

    record_audit(db, user_id=current_user.id, action="ACTUALIZAR_PROGRAMA", entity_name="MasterProgram", entity_id=str(program.id))
    return program

# ----------------- Cursos Preparatorios -----------------

@router.post("/{program_id}/courses", response_model=PreparatoryCourseOut, status_code=status.HTTP_201_CREATED, summary="Agregar un curso preparatorio al programa")
def add_preparatory_course(
    program_id: int,
    course_in: PreparatoryCourseBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR]))
):
    program = db.query(MasterProgram).filter(MasterProgram.id == program_id).first()
    if not program:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Programa no encontrado")

    course = PreparatoryCourse(
        program_id=program_id,
        name=course_in.name.strip(),
        code=course_in.code.upper().strip(),
        description=course_in.description,
        max_deadline_days=course_in.max_deadline_days,
        is_active=course_in.is_active
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    record_audit(db, user_id=current_user.id, action="CREAR_CURSO", entity_name="PreparatoryCourse", entity_id=str(course.id), details=f"Curso {course.name} en programa {program.name}")

    return course

# ----------------- Actividades / Proyectos -----------------

@router.post("/courses/{course_id}/activities", response_model=ActivityOut, status_code=status.HTTP_201_CREATED, summary="Agregar actividad o proyecto a un curso preparatorio")
def add_activity_to_course(
    course_id: int,
    activity_in: ActivityBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR]))
):
    course = db.query(PreparatoryCourse).filter(PreparatoryCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso preparatorio no encontrado")

    activity = Activity(
        course_id=course_id,
        title=activity_in.title.strip(),
        description=activity_in.description,
        weighting=activity_in.weighting,
        deadline=activity_in.deadline,
        evidence_type=activity_in.evidence_type,
        is_mandatory=activity_in.is_mandatory
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)

    record_audit(db, user_id=current_user.id, action="CREAR_ACTIVIDAD", entity_name="Activity", entity_id=str(activity.id), details=f"Actividad {activity.title} con ponderación {activity.weighting}%")

    return activity


@router.put("/activities/{activity_id}", response_model=ActivityOut, summary="Actualizar una actividad o proyecto")
def update_activity(
    activity_id: int,
    activity_update: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR]))
):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Actividad no encontrada")

    for field, val in activity_update.model_dump(exclude_unset=True).items():
        setattr(activity, field, val)

    db.commit()
    db.refresh(activity)

    record_audit(db, user_id=current_user.id, action="ACTUALIZAR_ACTIVIDAD", entity_name="Activity", entity_id=str(activity.id))
    return activity
