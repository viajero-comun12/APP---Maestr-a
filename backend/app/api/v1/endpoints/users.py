from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, RoleChecker, record_audit
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserOut, UserUpdate

router = APIRouter()

@router.get("/", response_model=List[UserOut], summary="Listar usuarios del sistema con filtros")
def list_users(
    role: Optional[UserRole] = Query(None, description="Filtrar por rol"),
    is_active: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR]))
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    return query.order_by(User.id.desc()).all()


@router.get("/tutors", response_model=List[UserOut], summary="Listar todos los tutores disponibles")
def list_available_tutors(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR, UserRole.TUTOR]))
):
    return db.query(User).filter(User.role == UserRole.TUTOR, User.is_active == True).all()


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED, summary="Crear usuario administrativo o académico")
def create_user_by_admin(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN]))
):
    normalized_email = user_in.email.lower().strip()
    if db.query(User).filter(User.email == normalized_email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con este correo"
        )
    
    new_user = User(
        email=normalized_email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        phone=user_in.phone,
        document_id=user_in.document_id,
        role=user_in.role or UserRole.POSTULANTE,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    record_audit(db, user_id=current_user.id, action="CREAR_USUARIO", entity_name="User", entity_id=str(new_user.id), details=f"Usuario creado con rol {new_user.role.value}")

    return new_user


@router.get("/{user_id}", response_model=UserOut, summary="Obtener detalle de usuario por ID")
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.ADMIN, UserRole.COORDINADOR]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user
