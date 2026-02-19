# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-19

### Added
- Initial release of PadelBooking system
- FastAPI backend with SQLModel ORM
- React frontend with Vite and Tailwind CSS
- User authentication with JWT
- Role-based access control (RBAC)
- Court management system
- Booking system with conflict detection
- Database migrations with Alembic
- Docker and Docker Compose setup
- Comprehensive test suite (backend)
- CI/CD pipeline with GitHub Actions
- Security scanning (Trivy, TruffleHog)
- Health and readiness endpoints
- API documentation with OpenAPI/Swagger
- Rate limiting protection
- Input validation
- Structured JSON logging
- Comprehensive README documentation

### Security
- Password hashing with bcrypt
- JWT-based authentication
- SQL injection prevention
- XSS protection
- CSRF protection
- Security headers
- Secrets management via environment variables
