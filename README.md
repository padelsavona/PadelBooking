# PadelBooking

Sistema di prenotazione campi padel full-stack.

## Stack
- Backend: FastAPI + SQLModel + PostgreSQL
- Frontend: React + Vite + Tailwind
- DevOps: Docker Compose + GitHub Actions

## Avvio rapido
1. Copia i file env:
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.example frontend/.env`
2. Avvia i servizi:
   - `docker-compose up -d`
3. URL utili:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000`
   - Health: `http://localhost:8000/api/health`

## Sviluppo locale
### Backend
- `cd backend`
- `pip install -r requirements-dev.txt`
- `alembic upgrade head`
- `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

### Frontend
- `cd frontend`
- `npm install`
- `npm run dev`
