import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { courtService } from '../services/courts';
import { bookingService } from '../services/bookings';
import { useAuthStore } from '../stores/authStore';
import { pricingService } from '../services/pricing';

function HomePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const role = user?.role?.toLowerCase();
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [courtId, setCourtId] = useState<number | string | ''>('');
  const [date, setDate] = useState<string>(today);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('09:00');
  const [notes, setNotes] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const { data: courts = [], isLoading, isError, error } = useQuery({
    queryKey: ['courts'],
    queryFn: async () => {
      const activeCourts = await courtService.getCourts(true);
      if (activeCourts.length > 0) {
        return activeCourts;
      }

      return courtService.getCourts(false);
    },
  });

  useEffect(() => {
    if (courtId !== '' || courts.length === 0) {
      return;
    }

    const firstActiveCourt = courts.find((court) => court.is_active);
    if (firstActiveCourt) {
      setCourtId(firstActiveCourt.id);
      return;
    }

    setCourtId(courts[0].id);
  }, [courts, courtId]);

  const { data: availability, isLoading: isAvailabilityLoading } = useQuery({
    queryKey: ['courtAvailability', courtId, date],
    queryFn: () => courtService.getAvailability(courtId, date),
    enabled: Boolean(courtId && date),
    refetchInterval: 15000,
  });

  const toIsoDateTime = (selectedDate: string, selectedTime: string): string => {
    if (selectedTime === '24:00') {
      const nextDay = new Date(`${selectedDate}T00:00:00`);
      nextDay.setDate(nextDay.getDate() + 1);
      return nextDay.toISOString();
    }
    return new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
  };

  const startQuoteIso = useMemo(() => toIsoDateTime(date, startTime), [date, startTime]);
  const endQuoteIso = useMemo(() => toIsoDateTime(date, endTime), [date, endTime]);

  const { data: pricingQuote, isLoading: isPricingLoading } = useQuery({
    queryKey: ['pricingQuote', courtId, startQuoteIso, endQuoteIso, user?.id],
    queryFn: () =>
      pricingService.getQuote({
        courtId: String(courtId),
        start: startQuoteIso,
        end: endQuoteIso,
      }),
    enabled: Boolean(courtId && date),
  });

  const createBookingMutation = useMutation({
    mutationFn: bookingService.createBooking,
  });

  const blockTimeslotMutation = useMutation({
    mutationFn: bookingService.blockTimeslot,
  });

  const timeOptions = useMemo(() => {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      options.push(`${String(hour).padStart(2, '0')}:00`);
      options.push(`${String(hour).padStart(2, '0')}:30`);
    }
    options.push('24:00');
    return options;
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (!user) {
      setMessage('Accedi per continuare.');
      return;
    }

    if (!courtId || !date) {
      setMessage('Seleziona campo e data.');
      return;
    }

    if (timeOptions.indexOf(endTime) <= timeOptions.indexOf(startTime)) {
      setMessage('L’orario di fine deve essere successivo all’orario di inizio.');
      return;
    }

    const start_time = toIsoDateTime(date, startTime);
    const end_time = toIsoDateTime(date, endTime);

    try {
      if (role === 'admin' || role === 'manager') {
        await blockTimeslotMutation.mutateAsync({
          court_id: String(courtId),
          start_time,
          end_time,
          notes,
        });
        setMessage('Fascia oraria bloccata con successo.');
      } else {
        await createBookingMutation.mutateAsync({
          court_id: String(courtId),
          start_time,
          end_time,
          notes,
        });
        setMessage('Partita creata con successo.');
      }

      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['courtAvailability', courtId, date] });
      setNotes('');
    } catch (error) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      setMessage(apiError.response?.data?.detail || 'Operazione non riuscita.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Prenotazione Padel</h1>
      <p className="text-gray-600 mb-10">
        Prenota i campi tra le 00:00 e le 24:00. Gli utenti devono essere autenticati per creare una
        partita; gli amministratori possono bloccare fasce orarie.
      </p>

      {user ? (
        <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {user.membership_status === 'MEMBER'
            ? 'Sei tesserato SSD: tariffa agevolata attiva ✅'
            : 'Tariffa standard attiva'}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Campi disponibili</h2>
          {isLoading ? (
            <div className="text-center py-8">Caricamento campi...</div>
          ) : isError ? (
            <div>
              Errore nel caricamento dei campi.
              {error instanceof Error ? ` Dettaglio: ${error.message}` : ''}
            </div>
          ) : courts.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-5 text-gray-700">
              Nessun campo disponibile al momento.
            </div>
          ) : (
            <div className="space-y-4">
              {courts.map((court) => (
                <div key={court.id} className="bg-white shadow rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {court.name}
                    {!court.is_active && (
                      <span className="ml-2 text-xs font-medium text-red-600">Disattivato</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{court.description || 'Nessuna descrizione'}</p>
                  <p className="text-sm mt-2 font-medium text-blue-700">€{court.hourly_rate}/ora</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">
            {role === 'admin' || role === 'manager'
              ? 'Blocca fascia oraria'
              : 'Crea prenotazione'}
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campo</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={courtId}
                onChange={(event) => {
                  const value = event.target.value;
                  setCourtId(value === '' ? '' : value);
                }}
                required
              >
                <option value="">Seleziona campo</option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id} disabled={!court.is_active}>
                    {court.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>

            <div className="border rounded-md p-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Ore occupate/libere</h3>
              {!courtId || !date ? (
                <p className="text-sm text-gray-600">Seleziona campo e data per visualizzare la disponibilità.</p>
              ) : isAvailabilityLoading ? (
                <p className="text-sm text-gray-600">Caricamento disponibilità...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-medium text-red-700 mb-1">Occupate</p>
                    {availability && availability.occupied_hours.length > 0 ? (
                      <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {availability.occupied_hours.map((hour) => (
                          <li key={hour} className="text-gray-700">
                            {hour}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">Nessuna ora occupata.</p>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-green-700 mb-1">Libere</p>
                    {availability && availability.free_hours.length > 0 ? (
                      <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {availability.free_hours.map((hour) => (
                          <li key={hour} className="text-gray-700">
                            {hour}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">Nessuna ora libera.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inizio</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                >
                  {timeOptions.slice(0, -1).map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fine</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                >
                  {timeOptions.slice(1).map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                className="w-full border rounded-md px-3 py-2"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            <div className="border rounded-md p-3 bg-blue-50 text-sm text-blue-900">
              {isPricingLoading ? (
                <p>Calcolo prezzo in corso...</p>
              ) : pricingQuote ? (
                <>
                  <p className="font-semibold">{pricingQuote.tariffLabel}</p>
                  <p>
                    Prezzo orario: €{pricingQuote.hourlyRate.toFixed(2)} · Totale: €
                    {pricingQuote.totalPrice.toFixed(2)}
                  </p>
                </>
              ) : (
                <p>Prezzo non disponibile.</p>
              )}
            </div>

            {message && <div className="text-sm text-red-600">{message}</div>}

            <button
              type="submit"
              disabled={
                createBookingMutation.isPending ||
                blockTimeslotMutation.isPending
              }
              className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {createBookingMutation.isPending ||
              blockTimeslotMutation.isPending
                ? 'Elaborazione...'
                : role === 'admin' || role === 'manager'
                  ? 'Blocca fascia oraria'
                  : 'Crea partita'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
