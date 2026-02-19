from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    # Application
    app_name: str = "PadelBooking"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = False
    log_level: str = "INFO"

    # Security
    secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Database
    database_url: str

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    # Rate Limiting
    rate_limit_per_minute: int = 60

    # OpenTelemetry
    otel_service_name: str = "padelbooking-api"
    otel_exporter_otlp_endpoint: str = "http://localhost:4317"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
