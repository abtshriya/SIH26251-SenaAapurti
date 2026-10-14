from functools import lru_cache
from typing import Dict
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized Zero Trust & PostGIS Configuration for Sena Aapurti."""

    PROJECT_NAME: str = "Sena Aapurti - Defense Logistics Decision Support API"
    VERSION: str = "1.0.0-SIH"
    API_V1_STR: str = "/api/v1"

    # Database Configuration
    POSTGRES_USER: str = "sena_admin"
    POSTGRES_PASSWORD: str = "sena_classified_secret_2026"
    POSTGRES_DB: str = "sena_aapurti_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = (
        "postgresql+psycopg2://sena_admin:sena_classified_secret_2026@localhost:5432/sena_aapurti_db"
    )

    # Cryptographic & Zero Trust Settings
    IOT_HMAC_SECRET: str = (
        "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
    )
    DEVICE_REGISTRY_SECRETS: Dict[str, str] = {
        "SENSOR-FOB-ALPHA-01": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
        "SENSOR-FOB-BRAVO-01": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
        "SENSOR-HQ-01": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    }

    JWT_SECRET_KEY: str = (
        "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a"
    )
    JWT_ALGORITHM: str = "HS256"
    STEP_UP_MFA_SECRET: str = "SENA-HQ-YUBIKEY-OTP-9941-VERIFIED"

    # Replay & Drift Defense Parameters
    MAX_CLOCK_SKEW_SECONDS: int = 300
    NONCE_TTL_SECONDS: int = 900

    # CORS Origins
    FRONTEND_ORIGIN: str = "http://localhost:4200"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
