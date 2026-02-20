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
     - **IMPORTANTE**: il frontend vuole sapere dove è il backend.
       Questo avviene tramite `VITE_API_BASE_URL` (o l'alias compatibile
       `VITE_API_URL`). Il valore può essere:
       * Un percorso relativo (es. `/api`) — utile solo quando frontend e backend
         sono serviti dallo stesso dominio (tipico in Docker compose o deploy
         a singolo host).
       * Un URL completo a un servizio separato, p.es. `https://padel-backend.onrender.com`
         (l'esempio è quello che Render assegna al servizio Python). Puoi omettere
         la parte `/api` finale perché il codice la aggiunge per te se manca.
       * Se fornisci solamente il dominio (`https://padel-backend.onrender.com`)
         verrà normalizzato in `https://padel-backend.onrender.com/api`.
       * **ATTENZIONE**: non scrivere mai `padel-backend.onrender.com` senza
         schema, altrimenti axios lo considera relativo e finirai per chiamare
         l'indirizzo sbagliato (di solito la tua app frontend), con conseguenti
         404 confessionali come in questa issue.
       
       In locale il valore predefinito (`/api`) viene amplificato dal proxy di
       Vite verso `http://127.0.0.1:8000`.

     - **CORS**: il backend legge `FRONTEND_URL` (per il server Node) o
       `CORS_ORIGINS`/`cors_origins` (per il server Python) per decidere quali
       origini sono autorizzate. Entrambi possono contenere una lista separata da
       virgole (es. `https://foo.onrender.com,https://foo-1.onrender.com`). Nel
       deploy su Render è essenziale impostare le variabili di ambiente su **entrambi**
       i servizi:
       * il servizio React ha bisogno di `VITE_API_BASE_URL` puntante al dominio
         del backend;
       * il servizio Python deve avere `CORS_ORIGINS` che include il dominio della SPA.
       
       Il codice Python supporta anche la vecchia variabile `CORS_ORIGIN` (singolare);
       se la inserisci per errore viene automaticamente utilizzata come fallback.
       
       Se dimentichi di impostare `CORS_ORIGINS`/`CORS_ORIGIN`, il backend
       risponderà a ogni richiesta con **200 ma senza `Access-Control-Allow-Origin`**,
       causando i famosi messaggi "header CORS mancante" nel browser. Controlla i
       log di avvio del backend: vengono visualizzate le origini attive
       (`CORS allowed origins: [...]`).
       
       ⚠️ **Attenzione al trailing slash** – `https://foo.com/` viene trattato in
       modo diverso da `https://foo.com`. Per evitare problemi, il codice ora
       normalizza le origini rimuovendo eventuali slash finali, ma è buona
       norma impostare la variabile senza `/` finale durante la configurazione.
       
       Assicurati che la lista contenga la stessa host da cui viene caricata la
       SPA, altrimenti vedrai errori di tipo "header CORS non corrisponde" come
       quelli mostrati nei log.
2. Avvia i servizi:
   - `docker-compose up -d`
3. Esegui migrazioni backend:
   - `cd backend && alembic upgrade head`
3. URL utili:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000`
   - Health: `http://localhost:8000/api/health`

### Operazioni su Render
Quando viene distribuito con *render.yaml*, la configurazione prevede due
servizi distinti:

```yaml
- type: web
  name: padel-backend    # API Python
  ...
- type: web
  name: padel-frontend   # SPA React
  ...
```

Il dominio pubblico del backend sarà qualcosa come
`https://padel-backend.onrender.com` e **non** lo stesso del frontend
(`https://padel-frontend.onrender.com`). Per funzionare la SPA deve quindi
avere `VITE_API_BASE_URL` impostato a quell'URL (o all'URL con `/api` in coda).
Altrimenti tutte le chiamate finiscono sul server statico e restituiscono 404.
`render.yaml` e la dashboard di Render ti mostrano il nome esatto del servizio.

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
