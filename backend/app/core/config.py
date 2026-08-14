from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "env.dev", "backend/env.dev"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application & Environment
    REACT_APP_URL: str = "http://localhost:9001"
    WORMCAT_LOG_LEVEL: str = "DEBUG"
    WORMCAT_OUT_PATH: str = "../frontend/public/dynamic/wormcat_out"
    UPLOAD_DIR: str = "uploads"
    ACTIVATE_DEBUG: str = "FALSE"

    # SMTP Configuration
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_LOGIN: str = "wormcat.emailer@gmail.com"
    SMTP_PASSWD: str = ""

    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str | None = None
    REDIS_STATE_TTL_SECONDS: int = 7200  # 2 hours

    # Celery Configuration
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    @property
    def redis_url(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"


settings = Settings()
