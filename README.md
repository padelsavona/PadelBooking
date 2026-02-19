# PadelBooking

Production-grade Padel Court Booking System built with modern web technologies and enterprise architectural patterns.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Contributing](#contributing)

## 🏗️ Architecture

**Pattern**: Modular Monolith with Ports & Adapters (Hexagonal Architecture)

```
├── backend/           # FastAPI + SQLModel backend
│   ├── app/
│   │   ├── api/       # REST API endpoints
│   │   ├── core/      # Configuration, security, logging
│   │   ├── models/    # Database models
│   │   ├── schemas/   # Pydantic schemas for validation
│   │   └── db/        # Database session and utilities
│   ├── alembic/       # Database migrations
│   └── tests/         # Backend tests
│
├── frontend/          # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API client services
│   │   ├── stores/      # Zustand state management
│   │   └── types/       # TypeScript types
│   └── public/        # Static assets
│
└── infrastructure/    # Docker, CI/CD, IaC
```

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI 0.115+ (async, high performance)
- **ORM**: SQLModel (type-safe, Pydantic-based)
- **Database**: PostgreSQL 15
- **Migrations**: Alembic
- **Authentication**: JWT with passlib + python-jose
- **Validation**: Pydantic v2
- **Rate Limiting**: SlowAPI
- **Observability**: OpenTelemetry
- **Testing**: pytest + pytest-cov
- **Code Quality**: Ruff, Black, mypy

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Testing**: Vitest
- **Code Quality**: ESLint, Prettier, TypeScript

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Security Scanning**: Trivy, TruffleHog
- **Web Server**: Nginx (production)

## ✨ Features

### Core Features
- ✅ User authentication & authorization (JWT-based)
- ✅ Role-based access control (RBAC): User, Manager, Admin
- ✅ Court management
- ✅ Booking system with conflict detection
- ✅ Real-time availability checking
- ✅ Price calculation
- ✅ Booking cancellation

### Non-Functional Requirements
- 🔒 **Security**: OWASP ASVS compliant, input validation, rate limiting
- 📊 **Observability**: Structured logging, health/readiness endpoints, OpenTelemetry
- 🚀 **Performance**: Database indexing, connection pooling, caching strategy
- ♿ **Accessibility**: WCAG 2.2 AA compliant
- 📱 **Responsive**: Mobile-first design
- 🔄 **Reliability**: Health checks, graceful shutdown, error handling

## 📦 Prerequisites

- **Docker** 24+ and **Docker Compose** v2
- **Python** 3.11+ (for local development)
- **Node.js** 20+ (for local development)
- **PostgreSQL** 15+ (for local development without Docker)

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dimmiditutto/PadelBooking.git
   cd PadelBooking
   ```

2. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/docs
   - Health Check: http://localhost:8000/api/health

5. **Stop the application**
   ```bash
   docker-compose down
   ```

## 💻 Development

### Backend Development

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements-dev.txt
   ```

4. **Set up database**
   ```bash
   # Make sure PostgreSQL is running
   alembic upgrade head
   ```

5. **Run development server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Code quality checks**
   ```bash
   # Linting
   ruff check .
   
   # Formatting
   black .
   
   # Type checking
   mypy app/
   ```

### Frontend Development

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Code quality checks**
   ```bash
   # Linting
   npm run lint
   
   # Formatting
   npm run format
   
   # Type checking
   npm run type-check
   ```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/api/test_auth.py

# Run specific test
pytest tests/api/test_auth.py::test_register_user
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test -- --watch
```

## 🌐 Deployment

### Production Build

#### Backend
```bash
cd backend
docker build -t padelbooking-backend:latest .
```

#### Frontend
```bash
cd frontend
docker build -t padelbooking-frontend:latest .
```

### Environment Variables

#### Backend (.env)
```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=your-strong-secret-key

# Optional
DEBUG=false
LOG_LEVEL=INFO
CORS_ORIGINS=https://yourdomain.com
RATE_LIMIT_PER_MINUTE=60
```

#### Frontend (.env)
```env
VITE_API_URL=https://api.yourdomain.com
```

## 📚 API Documentation

### Health Endpoints
- `GET /api/health` - Service health status
- `GET /api/ready` - Readiness check (includes DB connectivity)
- `GET /api/live` - Liveness check

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Users
- `GET /api/users/me` - Get current user profile
- `GET /api/users` - List all users (admin only)
- `GET /api/users/{id}` - Get user by ID
- `PATCH /api/users/{id}` - Update user

### Courts
- `POST /api/courts` - Create court (admin/manager)
- `GET /api/courts` - List all courts
- `GET /api/courts/{id}` - Get court by ID
- `PATCH /api/courts/{id}` - Update court (admin/manager)
- `DELETE /api/courts/{id}` - Soft delete court (admin/manager)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List user bookings (all for admin/manager)
- `GET /api/bookings/{id}` - Get booking by ID
- `PATCH /api/bookings/{id}` - Update booking
- `DELETE /api/bookings/{id}` - Cancel booking

### Interactive Documentation
When `DEBUG=true`, access interactive API documentation:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc
- OpenAPI JSON: http://localhost:8000/api/openapi.json

## 🔒 Security

### Implemented Security Measures

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (RBAC)
   - Password hashing with bcrypt
   - Strong password validation

2. **Input Validation**
   - Pydantic schema validation
   - SQL injection prevention (ORM)
   - XSS prevention
   - CSRF protection

3. **Rate Limiting**
   - API rate limiting (60 requests/minute default)
   - Prevents brute force attacks

4. **Security Headers**
   - X-Frame-Options
   - X-Content-Type-Options
   - X-XSS-Protection
   - Referrer-Policy

5. **HTTPS/TLS**
   - Production deployment should use HTTPS
   - Secure cookie flags in production

6. **Secrets Management**
   - Environment variables for sensitive data
   - No hardcoded secrets
   - `.env.example` templates provided

7. **Dependency Scanning**
   - Automated vulnerability scanning with Trivy
   - Secret scanning with TruffleHog
   - Regular dependency updates

### Security Best Practices

- Change default `SECRET_KEY` in production
- Use strong database passwords
- Enable HTTPS in production
- Regularly update dependencies
- Monitor security advisories
- Implement backup and disaster recovery
- Use principle of least privilege for database access

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Format
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build/tooling changes

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **PadelBooking Team** - [Dimmiditutto](https://github.com/Dimmiditutto)

## 🙏 Acknowledgments

- FastAPI framework
- React ecosystem
- SQLModel/Pydantic
- TailwindCSS
- All open-source contributors

---

**Built with ❤️ following enterprise-grade best practices**