import { useState } from 'react';
import { format, addHours, startOfHour } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { courtService } from '../services/courts';
import { bookingService } from '../services/bookings';

export default function AdminPage() {
  const queryClient = useQueryClient();

  const { data: courts = [] } = useQuery({
    queryKey: ['admin-courts'],
    queryFn: () => courtService.getCourts(false),
  });

  const blockTime = useMutation({
    mutationFn: bookingService.blockTimeslot,
  });

  const toggleCourtStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) =>
      courtService.updateCourt(id, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courts'] });
      queryClient.invalidateQueries({ queryKey: ['courts'] });
    },
  });

  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState(format(startOfHour(new Date()), 'HH:mm'));
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState('');

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();

    const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const endTime = addHours(startTime, duration);

    try {
      await blockTime.mutateAsync({
        court_id: Number(selectedCourtId),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        notes: notes.trim() || undefined,
      });
      alert('Fascia oraria bloccata con successo');
      setNotes('');
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string; message?: string } } };
      alert(error.response?.data?.detail || error.response?.data?.message || 'Blocco fascia oraria non riuscito');
    }
  };

  const handleToggleCourt = async (courtId: number, nextStatus: boolean) => {
    try {
      await toggleCourtStatus.mutateAsync({ id: courtId, isActive: nextStatus });
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string; message?: string } } };
      alert(error.response?.data?.detail || error.response?.data?.message || 'Aggiornamento campo non riuscito');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Pannello amministratore</h1>

      <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Gestione campi</h2>

        <div className="space-y-3">
          {courts.length === 0 ? (
            <p className="text-gray-600">Nessun campo disponibile.</p>
          ) : (
            courts.map((court) => (
              <div key={court.id} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <p className="font-medium text-gray-900">{court.name}</p>
                  <p className="text-sm text-gray-600">
                    Stato: {court.is_active ? 'Attivo' : 'Disattivato'} · €{court.hourly_rate}/ora
                  </p>
                </div>
                <button
                  type="button"
                  disabled={toggleCourtStatus.isPending}
                  onClick={() => handleToggleCourt(court.id, !court.is_active)}
                  className={`px-3 py-2 text-sm rounded-md text-white disabled:opacity-50 ${
                    court.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {court.is_active ? 'Disattiva' : 'Attiva'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="max-w-md bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Blocca fascia oraria</h2>

        <form onSubmit={handleBlock} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Campo</label>
            <select
              value={selectedCourtId}
              onChange={(e) => setSelectedCourtId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Seleziona un campo</option>
              {courts?.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ora inizio</label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Durata (ore)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            >
              {[1, 1.5, 2, 2.5, 3, 4, 6, 8].map((d) => (
                <option key={d} value={d}>
                  {d} {d === 1 ? 'ora' : 'ore'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Motivo (opzionale)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="es. Manutenzione, evento privato"
            />
          </div>

          <button
            type="submit"
            disabled={blockTime.isPending}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {blockTime.isPending ? 'Blocco in corso...' : 'Blocca fascia oraria'}
          </button>
        </form>
      </div>
    </div>
  );
}
