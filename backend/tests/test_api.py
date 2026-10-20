import os
import sys
from fastapi.testclient import TestClient

# Añadir ruta del backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "storage_backend" in data

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "/docs" in data["docs_url"]

def test_login_admin():
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@universidad.edu", "password": "Admin1234!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "ADMIN"
    return data["access_token"]

def test_login_coordinator():
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "coordinador@universidad.edu", "password": "Coord1234!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "COORDINADOR"
    return data["access_token"]

def test_login_postulante_ana():
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "postulante.ana@ejemplo.com", "password": "Post1234!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "POSTULANTE"
    return data["access_token"]

def test_dashboard_metrics():
    admin_token = test_login_admin()
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/v1/dashboard/metrics", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_postulantes"] >= 2
    assert data["distribucion_riesgo"]["alto"] >= 1
    assert data["distribucion_riesgo"]["bajo"] >= 1
    assert "metricas_por_programa" in data

def test_postulante_progress():
    ana_token = test_login_postulante_ana()
    headers = {"Authorization": f"Bearer {ana_token}"}
    response = client.get("/api/v1/enrollments/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["completion_percentage"] >= 30.0

def test_export_consolidated_matrix_excel():
    admin_token = test_login_admin()
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/v1/reports/consolidated-matrix/excel", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert len(response.content) > 100

def test_export_traceability_excel():
    admin_token = test_login_admin()
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/v1/reports/traceability/excel", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert len(response.content) > 100

def test_export_applicant_pdf():
    admin_token = test_login_admin()
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/v1/reports/applicant/1/pdf", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")

if __name__ == "__main__":
    print("Ejecutando pruebas de integración...")
    test_health_check()
    print(" [OK] test_health_check")
    test_root_endpoint()
    print(" [OK] test_root_endpoint")
    test_login_admin()
    print(" [OK] test_login_admin")
    test_login_coordinator()
    print(" [OK] test_login_coordinator")
    test_login_postulante_ana()
    print(" [OK] test_login_postulante_ana")
    test_dashboard_metrics()
    print(" [OK] test_dashboard_metrics")
    test_postulante_progress()
    print(" [OK] test_postulante_progress")
    test_export_consolidated_matrix_excel()
    print(" [OK] test_export_consolidated_matrix_excel")
    test_export_traceability_excel()
    print(" [OK] test_export_traceability_excel")
    test_export_applicant_pdf()
    print(" [OK] test_export_applicant_pdf")
    print("\n -> ¡TODAS LAS PRUEBAS PASARON SATISFACTORIAMENTE (10/10)!")

