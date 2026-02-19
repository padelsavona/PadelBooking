#!/usr/bin/env bash
set -euo pipefail

cd /workspaces/PadelBooking/backend

python - <<'PY'
from sqlmodel import Session, select
from app.db.session import engine
from app.models import Court
from seed_db import seed_database

with Session(engine) as session:
    courts = session.exec(select(Court)).all()

if not courts:
    print("Nessun campo trovato: eseguo seed...")
    seed_database()

with Session(engine) as session:
    courts = session.exec(select(Court)).all()
    for court in courts:
        court.is_active = True
        session.add(court)
    session.commit()

print(f"Operazione completata: campi attivi = {len(courts)}")
PY

echo "Verifica endpoint:"
curl -s "http://127.0.0.1:8000/api/courts/?active_only=true"
echo
