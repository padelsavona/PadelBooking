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
     - **IMPORTANTE**: il frontend legge `VITE_API_BASE_URL` (o `VITE_API_URL`).
       può essere:
       * Un percorso relativo (`/api`).
       * Un URL completo (`https://padelbooking-1.onrender.com/api`).
       * Se fornisci solo il dominio (`https://padelbooking-1.onrender.com`), il
         codice aggiunge automaticamente `/api` per te.
       * **NON** specificare soltanto il dominio senza schema (es. `padelbooking.onrender.com`)
         perché axios lo interpreta come percorso relativo e ottieni URL doppi.
       
       Dal 2026 la funzione di normalizzazione corregge automaticamente la maggior
       parte degli errori: aggiunge `https://` quando manca e inserisce `/api`
       quando il path è vuoto. In ogni caso, viene stampato un avviso in
       console se la stringa finale è diversa da quella fornita.
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
