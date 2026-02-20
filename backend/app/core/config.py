from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # Feature flags
    payments_enabled: bool = True

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    # Application
    app_name: str = "PadelBooking"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = False
    log_level: str = "INFO"

    # Security
    secret_key: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Database
    database_url: str = "sqlite:///./padelbooking.db"

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    # legacy/single-variable fallback; some deploys mistakenly set
    # CORS_ORIGIN instead of CORS_ORIGINS.  The property below will merge
    # the two values so that a typo doesn't silently disable CORS.
    cors_origin: Optional[str] = None

    # Rate Limiting
    rate_limit_per_minute: int = 60

    # OpenTelemetry
    otel_service_name: str = "padelbooking-api"
    otel_exporter_otlp_endpoint: str = "http://localhost:4317"

    # Stripe
    stripe_secret_key: str = "sk_test_dev_key"
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_currency: str = "eur"
    stripe_success_url: str = "http://localhost:5173/bookings?payment=success"
    stripe_cancel_url: str = "http://localhost:5173/bookings?payment=cancel"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string.

        Priority order:
        1. If the environment explicitly sets `CORS_ORIGINS` or the legacy
           `CORS_ORIGIN`, use that value (this overrides the default from the
           class attribute).
        2. Otherwise fall back to the hardcoded default `cors_origins` field.

        The previous implementation failed when only `CORS_ORIGIN` was provided
        because `cors_origins` already contained a non-empty default; the
        fallback branch never ran.  Inspecting `os.environ` lets us detect
        whether the user really supplied a value.

        Each origin string is trimmed and any trailing slash removed; empty
        items are ignored.  This produces an exact-match list suitable for the
        FastAPI CORS middleware.
        """
        import os

        # prefer env vars directly so we know they were set explicitly
        env_val = None
        if 'CORS_ORIGINS' in os.environ:
            env_val = os.environ.get('CORS_ORIGINS')
        elif 'CORS_ORIGIN' in os.environ:
            env_val = os.environ.get('CORS_ORIGIN')

        raw = env_val if env_val is not None else self.cors_origins

        origins: list[str] = []
        for origin in (raw or '').split(','):
            o = origin.strip()
            if not o:
                continue
            # remove trailing slash; `https://foo.com/` != `https://foo.com`
            if o.endswith('/'):
                o = o[:-1]
            origins.append(o)

        return origins


settings = Settings()
