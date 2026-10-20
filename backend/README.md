# Sistema de Gestion de Cursos Preparatorios para Maestria

Backend desarrollado con FastAPI y Python, estructurado para integracion con servicios AWS (RDS, EC2, S3) y gestionado mediante variables de entorno.

## Arquitectura y Servicios AWS

- **AWS EC2**: Despliegue contenerizado mediante Docker. Incluye endpoint `/health` para balanceadores de carga (ALB).
- **AWS RDS**: Soporte nativo para PostgreSQL en produccion y fallback automatico a SQLite en desarrollo local mediante `DATABASE_URL`.
- **AWS S3**: Abstraccion en `app/services/storage.py` con `boto3` para carga y generacion de URLs prefirmadas cuando `STORAGE_BACKEND="s3"`, o almacenamiento local en `./uploads` cuando es `"local"`.

## Estructura del Proyecto

```
backend/
├── app/
│   ├── main.py                  # Inicializacion de FastAPI, middlewares y CORS
│   ├── core/
│   │   ├── config.py            # Configuracion centralizada (Pydantic Settings)
│   │   └── security.py          # Hasheo Bcrypt y gestion de JWT
│   ├── db/
│   │   └── session.py           # Conexion SQLAlchemy y sesion de base de datos
│   ├── models/                  # Modelos relacionales ORM (User, Program, Enrollment, Tracking)
│   ├── schemas/                 # Validacion y esquemas DTO (Pydantic v2)
│   ├── services/                # Logica de negocio (Storage, Alerts, Notification, Reports)
│   └── api/
│       ├── deps.py              # Inyeccion de dependencias (Auth, Roles, Auditoria)
│       └── v1/                  # Rutas de endpoints RESTful
├── scripts/
│   └── seed_data.py             # Script de datos iniciales
├── tests/
│   └── test_api.py              # Pruebas de integracion
├── .env.example                 # Plantilla de variables de entorno
├── Dockerfile                   # Configuracion de contenedor Docker
├── docker-compose.yml           # Orquestacion de servicios
└── requirements.txt             # Dependencias del proyecto
```

## Variables de Entorno (.env)

| Variable | Descripcion | Valor por Defecto |
|---|---|---|
| `SECRET_KEY` | Clave secreta para tokens JWT | (Definir en produccion) |
| `DATABASE_URL` | URI de conexion (PostgreSQL o SQLite) | `sqlite:///./master_preparatory.db` |
| `STORAGE_BACKEND` | Tipo de almacenamiento (`local` o `s3`) | `local` |
| `LOCAL_UPLOAD_DIR` | Directorio local de evidencias | `./uploads` |
| `AWS_ACCESS_KEY_ID` | Credencial IAM de AWS | - |
| `AWS_SECRET_ACCESS_KEY` | Credencial secreta IAM de AWS | - |
| `AWS_REGION` | Region de AWS | `us-east-1` |
| `AWS_S3_BUCKET_NAME` | Nombre del bucket S3 | `master-preparatory-evidences-bucket` |
| `SMTP_ENABLED` | Habilitacion de envio SMTP | `False` |

## Instalacion y Ejecucion Local

1. Instalar dependencias:
```bash
pip install -r requirements.txt
```

2. Generar datos iniciales de prueba:
```bash
python scripts/seed_data.py
```

3. Iniciar el servidor:
```bash
uvicorn main:app --reload --port 8000
```
*(Si el puerto 8000 esta en uso, ejecutar con `--port 8001`)*

4. Documentacion OpenAPI interactiva:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Credenciales de Prueba

| Rol | Correo | Contrasena | Estado / Descripcion |
|---|---|---|---|
| Admin | `admin@universidad.edu` | `Admin1234!` | Administracion general |
| Coordinador | `coordinador@universidad.edu` | `Coord1234!` | Gestion de cursos y programas |
| Tutor | `tutor.carlos@universidad.edu` | `Tutor1234!` | Registro de seguimiento |
| Postulante (Activo) | `postulante.ana@ejemplo.com` | `Post1234!` | Semaforo: Riesgo Bajo |
| Postulante (En Riesgo) | `postulante.luis@ejemplo.com` | `Post1234!` | Semaforo: Riesgo Alto |

## Funcionalidades del Sistema

- **Programas y Cursos**: Creacion de convocatorias, cursos preparatorios y actividades con ponderacion porcentual.
- **Evidencias**: Carga de certificados PDF y proyectos con revision, asignacion de calificaciones y observaciones.
- **Tutorias y Trazabilidad**: Registro cronologico de contactos (llamada, correo, WhatsApp, videoconferencia, presencial), compromisos y bitacora de auditoria.
- **Semaforo de Riesgo**: Algoritmo automatico de deteccion temprana (Bajo, Medio, Alto) y verificador de vencimiento a 15, 10, 5, 3 y 1 dias.
- **Dashboard Ejecutivo**: Metricas en tiempo real de postulantes, avance promedio, cursos activos y atenciones.
- **Reportes**: Generacion de Reporte Individual en PDF (ReportLab) y Matrices Consolidadas en Excel (OpenPyXL).

## Pruebas

Ejecutar la suite de pruebas unitarias e integracion:
```bash
python tests/test_api.py
```
