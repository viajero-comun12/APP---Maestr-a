import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.db.session import engine, Base
import app.models  # Importa todos los modelos para SQLAlchemy Base
from app.api.v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas automáticamente al iniciar (compatible con SQLite y AWS RDS)
    Base.metadata.create_all(bind=engine)
    # Asegurar directorio de subidas local
    if settings.STORAGE_BACKEND.lower() == "local":
        os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API para el Sistema de Gestión, Monitoreo y Seguimiento de Cursos Preparatorios para Programas de Maestría.",
    version="1.0.0",
    lifespan=lifespan
)

# Configuración de CORS para permitir conexión con cualquier frontend web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoint de salud para AWS EC2 Load Balancer (Health Check)
@app.get("/health", tags=["Salud del Sistema"], summary="Health check para AWS ALB / EC2")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "storage_backend": settings.STORAGE_BACKEND
    }

# Endpoint raíz informativo
@app.get("/", tags=["General"], summary="Información de la API")
def root():
    return {
        "message": f"Bienvenido al {settings.PROJECT_NAME}",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "api_v1": settings.API_V1_STR
    }

# Montar el enrutador versión 1
app.include_router(api_router, prefix=settings.API_V1_STR)

# Si el backend de almacenamiento es local, montar directorio estático protegido
if os.path.exists(settings.LOCAL_UPLOAD_DIR):
    app.mount("/static-uploads", StaticFiles(directory=settings.LOCAL_UPLOAD_DIR), name="static-uploads")
