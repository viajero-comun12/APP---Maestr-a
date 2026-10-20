"""
Punto de entrada alternativo directo para permitir tanto:
  uvicorn main:app
como:
  uvicorn app.main:app
"""
from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
