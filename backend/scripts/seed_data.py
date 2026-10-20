import os
import sys
from datetime import datetime, timezone, timedelta, date

# Añadir directorio backend al PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.program import MasterProgram, PreparatoryCourse, Activity
from app.models.enrollment import ApplicantEnrollment, Evidence, EnrollmentStatus, RiskLevel, EvidenceStatus
from app.models.tracking import TrackingRecord, ContactType, CaseStatus, NotificationLog, AuditLog
from app.services.alerts import recalculate_enrollment_progress

def seed_database():
    print("Iniciando creación de tablas y sembrado de datos básicos...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Crear Usuarios de prueba para cada Rol
        users_data = [
            {
                "email": "admin@universidad.edu",
                "full_name": "Administrador General",
                "phone": "+593 99 111 2222",
                "document_id": "1710000001",
                "role": UserRole.ADMIN,
                "password": "Admin1234!"
            },
            {
                "email": "coordinador@universidad.edu",
                "full_name": "Dra. María Elena Ramos (Coordinadora)",
                "phone": "+593 99 222 3333",
                "document_id": "1710000002",
                "role": UserRole.COORDINADOR,
                "password": "Coord1234!"
            },
            {
                "email": "tutor.carlos@universidad.edu",
                "full_name": "Mgtr. Carlos Mendoza (Tutor)",
                "phone": "+593 99 333 4444",
                "document_id": "1710000003",
                "role": UserRole.TUTOR,
                "password": "Tutor1234!"
            },
            {
                "email": "postulante.ana@ejemplo.com",
                "full_name": "Ana Gómez (Postulante)",
                "phone": "+593 99 444 5555",
                "document_id": "1710000004",
                "role": UserRole.POSTULANTE,
                "password": "Post1234!"
            },
            {
                "email": "postulante.luis@ejemplo.com",
                "full_name": "Luis Morales (Postulante)",
                "phone": "+593 99 555 6666",
                "document_id": "1710000005",
                "role": UserRole.POSTULANTE,
                "password": "Post1234!"
            }
        ]

        users_map = {}
        for u in users_data:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                new_u = User(
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    full_name=u["full_name"],
                    phone=u["phone"],
                    document_id=u["document_id"],
                    role=u["role"],
                    is_active=True
                )
                db.add(new_u)
                db.commit()
                db.refresh(new_u)
                users_map[u["email"]] = new_u
                print(f" -> Usuario creado: {new_u.email} ({new_u.role.value})")
            else:
                users_map[u["email"]] = existing

        # 2. Crear Programa de Maestría
        program_code = "MCD-2026-I"
        program = db.query(MasterProgram).filter(MasterProgram.code == program_code).first()
        if not program:
            program = MasterProgram(
                name="Maestría en Ciencia de Datos e Inteligencia Artificial",
                code=program_code,
                description="Programa de posgrado orientado a la formación avanzada en análisis de datos, Machine Learning y Big Data.",
                call_for_applications="Convocatoria 2026 - Período I",
                start_date=date(2026, 4, 1),
                end_date=date(2026, 7, 31),
                min_passing_score=70.0,
                is_active=True
            )
            db.add(program)
            db.commit()
            db.refresh(program)
            print(f" -> Programa creado: {program.name}")

        # 3. Crear Cursos Preparatorios
        course_data = [
            {
                "name": "Fundamentos Estadísticos y Matemáticos",
                "code": "PREP-EST-01",
                "description": "Nivelación en cálculo multivariable, álgebra lineal y probabilidad aplicada.",
                "max_deadline_days": 30
            },
            {
                "name": "Programación y Algoritmos para Ciencia de Datos",
                "code": "PREP-PRG-02",
                "description": "Nivelación en Python aplicado, estructuras de datos y manipulación con Pandas.",
                "max_deadline_days": 45
            }
        ]

        courses_map = {}
        for cd in course_data:
            existing_c = db.query(PreparatoryCourse).filter(
                PreparatoryCourse.program_id == program.id,
                PreparatoryCourse.code == cd["code"]
            ).first()
            if not existing_c:
                new_c = PreparatoryCourse(
                    program_id=program.id,
                    name=cd["name"],
                    code=cd["code"],
                    description=cd["description"],
                    max_deadline_days=cd["max_deadline_days"],
                    is_active=True
                )
                db.add(new_c)
                db.commit()
                db.refresh(new_c)
                courses_map[cd["code"]] = new_c
                print(f" -> Curso preparatorio creado: {new_c.name}")
            else:
                courses_map[cd["code"]] = existing_c

        # 4. Crear Actividades con ponderaciones y fechas límite
        activities_data = [
            {
                "course_code": "PREP-EST-01",
                "title": "Certificado de Álgebra y Probabilidad",
                "description": "Cargar certificado en PDF del curso preparatorio de matemáticas.",
                "weighting": 30.0,
                "evidence_type": "CERTIFICADO_PDF",
                "days_offset": 15
            },
            {
                "course_code": "PREP-PRG-02",
                "title": "Proyecto Integrador en Python",
                "description": "Cargar archivo o documento de proyecto con análisis exploratorio de un dataset real.",
                "weighting": 40.0,
                "evidence_type": "PROYECTO",
                "days_offset": 30
            },
            {
                "course_code": "PREP-PRG-02",
                "title": "Certificado de Estructuras de Datos",
                "description": "Cargar constancia de aprobación del módulo de programación.",
                "weighting": 30.0,
                "evidence_type": "CERTIFICADO_PDF",
                "days_offset": 45
            }
        ]

        acts_list = []
        for ad in activities_data:
            c = courses_map.get(ad["course_code"])
            if c:
                existing_act = db.query(Activity).filter(
                    Activity.course_id == c.id,
                    Activity.title == ad["title"]
                ).first()
                if not existing_act:
                    dl = datetime.now(timezone.utc) + timedelta(days=ad["days_offset"])
                    new_act = Activity(
                        course_id=c.id,
                        title=ad["title"],
                        description=ad["description"],
                        weighting=ad["weighting"],
                        deadline=dl,
                        evidence_type=ad["evidence_type"],
                        is_mandatory=True
                    )
                    db.add(new_act)
                    db.commit()
                    db.refresh(new_act)
                    acts_list.append(new_act)
                    print(f" -> Actividad creada: {new_act.title} (Ponderación: {new_act.weighting}%)")
                else:
                    acts_list.append(existing_act)

        # 5. Crear Inscripciones
        ana_user = users_map["postulante.ana@ejemplo.com"]
        luis_user = users_map["postulante.luis@ejemplo.com"]
        tutor_user = users_map["tutor.carlos@universidad.edu"]

        # Inscripción de Ana (Al día - Riesgo Bajo)
        enr_ana = db.query(ApplicantEnrollment).filter(
            ApplicantEnrollment.applicant_id == ana_user.id,
            ApplicantEnrollment.program_id == program.id
        ).first()

        if not enr_ana:
            enr_ana = ApplicantEnrollment(
                applicant_id=ana_user.id,
                program_id=program.id,
                assigned_tutor_id=tutor_user.id,
                enrollment_date=datetime.now(timezone.utc) - timedelta(days=10),
                status=EnrollmentStatus.EN_PROCESO,
                risk_level=RiskLevel.BAJO,
                completion_percentage=0.0
            )
            db.add(enr_ana)
            db.commit()
            db.refresh(enr_ana)

            # Agregar evidencia aprobada a Ana (Actividad 1: 30%)
            if acts_list:
                ev_ana = Evidence(
                    enrollment_id=enr_ana.id,
                    activity_id=acts_list[0].id,
                    file_url="certificados/ana_gomez_matematicas.pdf",
                    file_name="ana_gomez_matematicas.pdf",
                    file_size=1024 * 350,
                    upload_date=datetime.now(timezone.utc) - timedelta(days=2),
                    status=EvidenceStatus.APROBADO,
                    score=95.0,
                    observations="Certificado válido y emitido por institución acreditada.",
                    reviewed_by_id=tutor_user.id,
                    reviewed_at=datetime.now(timezone.utc) - timedelta(days=1)
                )
                db.add(ev_ana)
                db.commit()

            recalculate_enrollment_progress(db, enr_ana)
            print(" -> Inscripción creada para Ana Gómez con evidencia aprobada (Riesgo Bajo).")

        # Inscripción de Luis (En Riesgo Alto - Sin entregas y sin respuesta)
        enr_luis = db.query(ApplicantEnrollment).filter(
            ApplicantEnrollment.applicant_id == luis_user.id,
            ApplicantEnrollment.program_id == program.id
        ).first()

        if not enr_luis:
            enr_luis = ApplicantEnrollment(
                applicant_id=luis_user.id,
                program_id=program.id,
                assigned_tutor_id=tutor_user.id,
                enrollment_date=datetime.now(timezone.utc) - timedelta(days=20),
                last_activity_at=datetime.now(timezone.utc) - timedelta(days=12),
                status=EnrollmentStatus.EN_RIESGO,
                risk_level=RiskLevel.ALTO,
                completion_percentage=0.0
            )
            db.add(enr_luis)
            db.commit()
            db.refresh(enr_luis)

            # Registro de seguimiento del tutor con caso SIN_RESPUESTA
            trk = TrackingRecord(
                tracking_number="TRK-2026-0001",
                enrollment_id=enr_luis.id,
                tutor_id=tutor_user.id,
                contact_date=datetime.now(timezone.utc) - timedelta(days=3),
                contact_type=ContactType.LLAMADA,
                result="Llamada no atendida, buzón de voz ocupado.",
                commitments="Ninguno concretado.",
                observations="Postulante no responde llamadas ni WhatsApp de tutoría.",
                recommendations="Enviar alerta formal vía correo y escalar a coordinación.",
                next_action="Reintentar llamada en 48 horas.",
                applicant_response="Sin respuesta.",
                case_status=CaseStatus.SIN_RESPUESTA
            )
            db.add(trk)
            db.commit()

            recalculate_enrollment_progress(db, enr_luis)
            print(" -> Inscripción creada para Luis Morales con seguimiento 'Sin Respuesta' (Riesgo Alto).")

        print("\n¡Sembrado completado con éxito!")
        print("\nCredenciales para probar la API en /docs:")
        print("  - Admin:       admin@universidad.edu / Admin1234!")
        print("  - Coordinador: coordinador@universidad.edu / Coord1234!")
        print("  - Tutor:       tutor.carlos@universidad.edu / Tutor1234!")
        print("  - Postulante:  postulante.ana@ejemplo.com / Post1234!")
        print("  - Postulante:  postulante.luis@ejemplo.com / Post1234!")

    except Exception as e:
        db.rollback()
        print(f"Error durante el sembrado: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
