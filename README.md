# PadelBooking

Sistema di prenotazione campi padel full-stack.

## Funzionalità MVP
- Prenotazioni tra `00:00` e `24:00` (slot da 30 minuti)
- Cancellazione prenotazioni
- Pagamento online con Stripe Checkout
- Ruoli:
   - `user/player`: crea prenotazioni e paga
   - `admin`/`manager`: blocca slot senza pagamento

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
3. Esegui migrazioni backend:
   - `cd backend && alembic upgrade head`
3. URL utili:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000`
   - Health: `http://localhost:8000/api/health`

## Variabili Stripe (backend/.env)
Partendo da `backend/.env.example`, configura:
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`

## Sviluppo locale
### Backend
- `cd backend`
- `pip install -r requirements-dev.txt`
- `alembic upgrade head`
- `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

### Test backend (mirati)
- `cd backend`
- `pytest -q tests/api/test_bookings.py tests/api/test_payments.py`

### Frontend
- `cd frontend`
- `npm install`
- `npm run dev`
