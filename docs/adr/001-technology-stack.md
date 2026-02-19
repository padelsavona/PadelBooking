# ADR 001: Technology Stack Selection

## Status
Accepted

## Context
We need to choose a technology stack for the PadelBooking system that balances development speed, maintainability, security, and performance while following enterprise best practices.

## Decision
We have decided to use:
- **Backend**: FastAPI + SQLModel + PostgreSQL
- **Frontend**: React + Vite + Tailwind CSS
- **DevOps**: Docker + GitHub Actions

## Rationale

### Backend: FastAPI + SQLModel
- **FastAPI**: Modern, fast, auto-generates OpenAPI docs, native async support
- **SQLModel**: Type-safe ORM combining SQLAlchemy and Pydantic
- **PostgreSQL**: Robust, ACID-compliant, excellent for relational data
- **Alembic**: Industry-standard migration tool

### Frontend: React + Vite
- **React**: Large ecosystem, component reusability, wide adoption
- **Vite**: Fast build times, hot module replacement
- **Tailwind CSS**: Utility-first CSS, rapid UI development
- **TypeScript**: Type safety, better developer experience

### Architecture: Modular Monolith
- Simpler deployment and operations initially
- Can be split into microservices if needed
- Ports & Adapters pattern allows flexibility

## Consequences

### Positive
- Fast development with auto-generated docs
- Type safety across the stack (Python + TypeScript)
- Good performance with async operations
- Easy to test and maintain
- Strong typing reduces bugs

### Negative
- Team needs to learn FastAPI if not familiar
- Monolith may need refactoring if scaling requirements change significantly

## Alternatives Considered
- **Node.js/Fastify**: Good, but chose Python for its ecosystem
- **Next.js**: Considered, but separate backend provides more flexibility
- **Microservices**: Premature for initial version
