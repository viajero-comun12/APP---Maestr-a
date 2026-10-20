# Sistema de Gestion de Cursos Preparatorios para Programas de Maestria

Repositorio del sistema de gestion, monitoreo y seguimiento de cursos preparatorios para postulantes a programas de maestria.

## Estructura del Repositorio

- `backend/`: API RESTful desarrollada con FastAPI (Python 3.13), SQLAlchemy y Pydantic, preparada para despliegue en AWS (EC2, RDS, S3).

## Requisitos Previos

- Python 3.10 o superior.
- Git.

## Inicio Rapido

1. Clonar el repositorio:
```bash
git clone https://github.com/viajero-comun12/APP---Maestr-a.git
cd APP---Maestr-a/backend
```

2. Instalar dependencias:
```bash
pip install -r requirements.txt
```

3. Sembrar datos iniciales:
```bash
python scripts/seed_data.py
```

4. Ejecutar servidor de desarrollo:
```bash
uvicorn main:app --reload --port 8000
```

Para mas detalles de configuracion, variables de entorno y arquitectura en AWS, consultar [backend/README.md](backend/README.md).
