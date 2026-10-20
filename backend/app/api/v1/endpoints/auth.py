from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, record_audit
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.schemas.token import Token
from app.services.notification import notify_registration

router = APIRouter()

@router.post("/login", response_model=Token, summary="Inicio de sesión para obtener token JWT")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Autenticación compatible con OAuth2 (Swagger UI y clientes REST).
    El campo 'username' corresponde al correo electrónico del usuario.
    """
    user = db.query(User).filter(User.email == form_data.username.lower().strip()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas (correo o contraseña no válidos)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta de usuario inactiva o deshabilitada"
        )

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value
    )
    
    # Registro de auditoría
    record_audit(db, user_id=user.id, action="LOGIN", entity_name="User", entity_id=str(user.id), details="Inicio de sesión exitoso")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email
    }


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED, summary="Registro público de postulantes")
def register_applicant(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Permite el autoregistro de postulantes. Por defecto se asigna el rol POSTULANTE.
    """
    normalized_email = user_in.email.lower().strip()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario registrado con este correo electrónico"
        )

    # Forzar rol POSTULANTE en registro público (salvo que sea creado desde el endpoint administrativo)
    role = UserRole.POSTULANTE if user_in.role is None else user_in.role

    new_user = User(
        email=normalized_email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        phone=user_in.phone,
        document_id=user_in.document_id,
        role=role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Disparar notificación automática de bienvenida
    notify_registration(db, new_user)

    # Auditoría
    record_audit(db, user_id=new_user.id, action="REGISTRO", entity_name="User", entity_id=str(new_user.id), details=f"Registro de nuevo usuario: {new_user.email}")

    return new_user


@router.get("/me", response_model=UserOut, summary="Obtener perfil del usuario autenticado")
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    return current_user


@router.put("/me", response_model=UserOut, summary="Actualizar perfil del usuario autenticado")
def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name.strip()
    if user_update.phone is not None:
        current_user.phone = user_update.phone.strip()
    if user_update.document_id is not None:
        current_user.document_id = user_update.document_id.strip()
    if user_update.password:
        current_user.hashed_password = get_password_hash(user_update.password)

    db.commit()
    db.refresh(current_user)

    record_audit(db, user_id=current_user.id, action="ACTUALIZACION_PERFIL", entity_name="User", entity_id=str(current_user.id))

    return current_user
