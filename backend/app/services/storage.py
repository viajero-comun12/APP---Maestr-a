import os
import uuid
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.core.config import settings

class StorageService(ABC):
    @abstractmethod
    def save_file(self, file_content: bytes, original_filename: str) -> Dict[str, Any]:
        """Saves a file and returns its metadata including access path/URL."""
        pass

    @abstractmethod
    def read_file(self, file_path_or_key: str) -> bytes:
        """Reads file content as bytes."""
        pass

    @abstractmethod
    def get_download_url(self, file_path_or_key: str) -> str:
        """Gets a downloadable URL or direct reference."""
        pass


class LocalStorageService(StorageService):
    def __init__(self, upload_dir: Optional[str] = None):
        self.upload_dir = upload_dir or settings.LOCAL_UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)

    def save_file(self, file_content: bytes, original_filename: str) -> Dict[str, Any]:
        # Sanitizar nombre y evitar colisiones usando UUID
        clean_name = os.path.basename(original_filename).replace(" ", "_")
        unique_filename = f"{uuid.uuid4().hex}_{clean_name}"
        destination_path = os.path.join(self.upload_dir, unique_filename)

        with open(destination_path, "wb") as f:
            f.write(file_content)

        return {
            "file_url": unique_filename,  # Clave/nombre de archivo almacenado
            "file_name": clean_name,
            "file_size": len(file_content),
            "storage_type": "local"
        }

    def read_file(self, file_path_or_key: str) -> bytes:
        file_path = os.path.join(self.upload_dir, file_path_or_key)
        if not os.path.exists(file_path):
            # Intento por si fue guardado con ruta completa
            if os.path.exists(file_path_or_key):
                file_path = file_path_or_key
            else:
                raise FileNotFoundError(f"Archivo no encontrado: {file_path_or_key}")

        with open(file_path, "rb") as f:
            return f.read()

    def get_download_url(self, file_path_or_key: str) -> str:
        return f"/api/v1/evidences/download/{file_path_or_key}"


class S3StorageService(StorageService):
    def __init__(self):
        import boto3
        from botocore.config import Config

        self.bucket_name = settings.AWS_S3_BUCKET_NAME
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            config=Config(signature_version="s3v4")
        )

    def save_file(self, file_content: bytes, original_filename: str) -> Dict[str, Any]:
        clean_name = os.path.basename(original_filename).replace(" ", "_")
        s3_key = f"evidencias/{uuid.uuid4().hex}_{clean_name}"

        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=s3_key,
            Body=file_content,
            ContentType="application/octet-stream"
        )

        return {
            "file_url": s3_key,
            "file_name": clean_name,
            "file_size": len(file_content),
            "storage_type": "s3"
        }

    def read_file(self, file_path_or_key: str) -> bytes:
        response = self.s3_client.get_object(Bucket=self.bucket_name, Key=file_path_or_key)
        return response["Body"].read()

    def get_download_url(self, file_path_or_key: str) -> str:
        # Generar presigned URL válida por 1 hora
        return self.s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": file_path_or_key},
            ExpiresIn=3600
        )


def get_storage_service() -> StorageService:
    """Devuelve el servicio de almacenamiento configurado según variables de entorno."""
    if settings.STORAGE_BACKEND.lower() == "s3" and settings.AWS_S3_BUCKET_NAME and settings.AWS_ACCESS_KEY_ID:
        try:
            return S3StorageService()
        except Exception:
            # Fallback seguro a local si faltan credenciales activas
            return LocalStorageService()
    return LocalStorageService()
