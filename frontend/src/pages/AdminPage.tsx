import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { courtService } from '../services/courts';
import { bookingService } from '../services/bookings';
import { Booking } from '../types';

export default function AdminPage() {
  const queryClient = useQueryClient();

  const { data: courts = [] } = useQuery({
    queryKey: ['admin-courts'],
    queryFn: () => courtService.getCourts(false),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: bookingService.getBookings,
  });

  const createCourt = useMutation({
    mutationFn: courtService.createCourt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courts'] });
      queryClient.invalidateQueries({ queryKey: ['courts'] });
    },
  });

  const toggleCourtStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: number | string; isActive: boolean }) =>
      courtService.updateCourt(id, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courts'] });
      queryClient.invalidateQueries({ queryKey: ['courts'] });
    },
  });

  const updateCourt = useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      hourly_rate,
    }: {
      id: number | string;
      name: string;
      description?: string;
      hourly_rate: number;
    }) => courtService.updateCourt(id, { name, description, hourly_rate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courts'] });
      queryClient.invalidateQueries({ queryKey: ['courts'] });
    },
  });

  const deleteCourt = useMutation({
    mutationFn: courtService.deleteCourt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courts'] });
      queryClient.invalidateQueries({ queryKey: ['courts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
  });

  const createBookingAsAdmin = useMutation({
    mutationFn: bookingService.createBookingAsAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['courtAvailability'] });
    },
  });

  const updateBookingAsAdmin = useMutation({
    mutationFn: ({ id, ...payload }: { id: number | string } & Parameters<typeof bookingService.updateBookingAsAdmin>[1]) =>
      bookingService.updateBookingAsAdmin(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['courtAvailability'] });
    },
  });

  const deleteBookingAsAdmin = useMutation({
    mutationFn: bookingService.deleteBookingAsAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['courtAvailability'] });
    },
  });

  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtDescription, setNewCourtDescription] = useState('');
  const [newCourtPrice, setNewCourtPrice] = useState('25');

  const [adminUserEmail, setAdminUserEmail] = useState('');
  const [adminCourtId, setAdminCourtId] = useState('');
  const [adminDate, setAdminDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [adminStartTime, setAdminStartTime] = useState('18:00');
  const [adminEndTime, setAdminEndTime] = useState('19:30');
  const [adminNotes, setAdminNotes] = useState('');
  const [adminStatus, setAdminStatus] = useState<'PENDING' | 'CONFIRMED' | 'BLOCKED'>('PENDING');

  const [message, setMessage] = useState('');

  const [bookingEdits, setBookingEdits] = useState<Record<string, {
    courtId: string;
    startTime: string;
    endTime: string;
    notes: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'BLOCKED';
  }>>({});

  const [courtEdits, setCourtEdits] = useState<Record<string, { name: string; description: string; hourly_rate: string }>>({});

  const toIso = (date: string, time: string) => new Date(`${date}T${time}:00`).toISOString();
  const toLocalInputValue = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const editableBookings = useMemo(
    () =>
      bookings.map((booking) => {
        const key = String(booking.id);
        const current = bookingEdits[key];
        if (current) {
          return current;
        }

        return {
          courtId: String(booking.courtId ?? booking.court_id ?? booking.court?.id ?? ''),
          startTime: toLocalInputValue(booking.startTime ?? booking.start_time),
          endTime: toLocalInputValue(booking.endTime ?? booking.end_time),
          notes: booking.notes || '',
          status: (String(booking.status).toUpperCase() as 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'BLOCKED') || 'PENDING',
        };
      }),
    [bookings, bookingEdits]
  );

  const handleCreateCourt = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createCourt.mutateAsync({
        name: newCourtName.trim(),
        description: newCourtDescription.trim() || undefined,
        hourly_rate: Number(newCourtPrice),
      });
      setNewCourtName('');
      setNewCourtDescription('');
      setNewCourtPrice('25');
      setMessage('Campo creato con successo.');
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string; message?: string } } };
      setMessage(error.response?.data?.detail || error.response?.data?.message || 'Creazione campo non riuscita.');
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createBookingAsAdmin.mutateAsync({
        userEmail: adminUserEmail.trim(),
        courtId: adminCourtId,
        startTime: toIso(adminDate, adminStartTime),
        endTime: toIso(adminDate, adminEndTime),
        notes: adminNotes.trim() || undefined,
        status: adminStatus,
      });
      setAdminNotes('');
      setMessage('Prenotazione utente creata con successo.');
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string; message?: string } } };
      setMessage(error.response?.data?.detail || error.response?.data?.message || 'Creazione prenotazione non riuscita.');
    }
  };

  const handleToggleCourt = async (courtId: number | string, nextStatus: boolean) => {
    try {
      await toggleCourtStatus.mutateAsync({ id: courtId, isActive: nextStatus });
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string; message?: string } } };
      setMessage(error.response?.data?.detail || error.response?.data?.message || 'Aggiornamento campo non riuscito.');
    }
  };

  const updateCourtEdit = (id: string, field: 'name' | 'description' | 'hourly_rate', value: string) => {
    const current = courtEdits[id] || { name: '', description: '', hourly_rate: '' };
    setCourtEdits((prev) => ({
      ...prev,
      [id]: {
        ...current,
        [field]: value,
      },
    }));
  };

  const saveCourt = async (id: string, fallback: { name: string; description?: string; hourly_rate: number }) => {
    const draft = courtEdits[id];

    try {
      await updateCourt.mutateAsync({
        id,
        name: draft?.name || fallback.name,
        description: draft?.description || fallback.description,
        hourly_rate: Number(draft?.hourly_rate || fallback.hourly_rate),
      });
      setMessage('Campo aggiornato con successo.');
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string; message?: string } } };
      setMessage(error.response?.data?.detail || error.response?.data?.message || 'Modifica campo non riuscita.');
    }
  };

  const removeCourt = async (id: string) => {
    if (!window.confirm('Confermi l’eliminazione del campo e delle prenotazioni collegate?')) {
      return;
    }

    try {
      await deleteCourt.mutateAsync(id);
      setMessage('Campo eliminato con successo.');
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string; message?: string } } };
      setMessage(error.response?.data?.detail || error.response?.data?.message || 'Eliminazione campo non riuscita.');
    }
  };

  const updateBookingEdit = (
    id: string,
    field: 'courtId' | 'startTime' | 'endTime' | 'notes' | 'status',
    value: string
  ) => {
    const base = editableBookings.find((b, index) => String((bookings[index] as Booking).id) === id);
    const current = bookingEdits[id] ||
      base || {
        courtId: '',
        startTime: '',
        endTime: '',
        notes: '',
        status: 'PENDING' as const,
      };

    setBookingEdits((prev) => ({
      ...prev,
      [id]: {
        ...current,
        [field]: field === 'status' ? (value as 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'BLOCKED') : value,
      },
    }));
  };

  const saveBooking = async (id: string, booking: (typeof editableBookings)[number]) => {
    try {
      await updateBookingAsAdmin.mutateAsync({
        id,
        courtId: booking.courtId,
        startTime: new Date(booking.startTime).toISOString(),
        endTime: new Date(booking.endTime).toISOString(),
        notes: booking.notes,
        status: booking.status,
      });
      setMessage('Prenotazione aggiornata con successo.');
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string; message?: string } } };
      setMessage(error.response?.data?.detail || error.response?.data?.message || 'Modifica prenotazione non riuscita.');
    }
  };

  const removeBooking = async (id: string) => {
    if (!window.confirm('Confermi l’eliminazione della prenotazione?')) {
      return;
    }

    try {
      await deleteBookingAsAdmin.mutateAsync(id);
      setMessage('Prenotazione eliminata con successo.');
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string; message?: string } } };
      setMessage(error.response?.data?.detail || error.response?.data?.message || 'Eliminazione prenotazione non riuscita.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Pannello amministratore</h1>
      {message ? <p className="mb-4 text-sm text-blue-700">{message}</p> : null}

      <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Campi e prezzi</h2>

        <form onSubmit={handleCreateCourt} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <input
            type="text"
            placeholder="Nome campo"
            value={newCourtName}
            onChange={(e) => setNewCourtName(e.target.value)}
            className="border rounded-md px-3 py-2"
            required
          />
          <input
            type="text"
            placeholder="Descrizione"
            value={newCourtDescription}
            onChange={(e) => setNewCourtDescription(e.target.value)}
            className="border rounded-md px-3 py-2"
          />
          <input
            type="number"
            min="1"
            step="0.5"
            placeholder="Prezzo €/ora"
            value={newCourtPrice}
            onChange={(e) => setNewCourtPrice(e.target.value)}
            className="border rounded-md px-3 py-2"
            required
          />
          <button
            type="submit"
            disabled={createCourt.isPending}
            className="bg-blue-600 text-white rounded-md px-3 py-2 hover:bg-blue-700 disabled:opacity-50"
          >
            {createCourt.isPending ? 'Creazione...' : 'Aggiungi campo'}
          </button>
        </form>

        <div className="space-y-3">
          {courts.length === 0 ? (
            <p className="text-gray-600">Nessun campo disponibile.</p>
          ) : (
            courts.map((court) => (
              <div key={court.id} className="border rounded-md p-3">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                  <input
                    type="text"
                    defaultValue={court.name}
                    onChange={(e) => updateCourtEdit(String(court.id), 'name', e.target.value)}
                    className="border rounded-md px-2 py-1"
                  />
                  <input
                    type="text"
                    defaultValue={court.description || ''}
                    onChange={(e) => updateCourtEdit(String(court.id), 'description', e.target.value)}
                    className="border rounded-md px-2 py-1"
                  />
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    defaultValue={court.hourly_rate}
                    onChange={(e) => updateCourtEdit(String(court.id), 'hourly_rate', e.target.value)}
                    className="border rounded-md px-2 py-1"
                  />
                  <button
                    type="button"
                    disabled={updateCourt.isPending}
                    onClick={() =>
                      saveCourt(String(court.id), {
                        name: court.name,
                        description: court.description,
                        hourly_rate: court.hourly_rate,
                      })
                    }
                    className="px-3 py-2 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    Salva modifiche
                  </button>
                  <button
                    type="button"
                    disabled={deleteCourt.isPending}
                    onClick={() => removeCourt(String(court.id))}
                    className="px-3 py-2 text-sm rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    Elimina campo
                  </button>
                </div>
                <div className="mt-2">
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
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Crea prenotazione utente</h2>

        <form onSubmit={handleCreateBooking} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Email utente</label>
            <input
              type="email"
              value={adminUserEmail}
              onChange={(e) => setAdminUserEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="utente@email.it"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Campo</label>
            <select
              value={adminCourtId}
              onChange={(e) => setAdminCourtId(e.target.value)}
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
              value={adminDate}
              onChange={(e) => setAdminDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ora inizio</label>
            <input
              type="time"
              value={adminStartTime}
              onChange={(e) => setAdminStartTime(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ora fine</label>
            <input
              type="time"
              value={adminEndTime}
              onChange={(e) => setAdminEndTime(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stato</label>
            <select
              value={adminStatus}
              onChange={(e) => setAdminStatus(e.target.value as 'PENDING' | 'CONFIRMED' | 'BLOCKED')}
              className="w-full border rounded px-3 py-2"
            >
              <option value="PENDING">In attesa</option>
              <option value="CONFIRMED">Confermata</option>
              <option value="BLOCKED">Bloccata</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Note (opzionale)</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="Dettagli prenotazione"
            />
          </div>

          <button
            type="submit"
            disabled={createBookingAsAdmin.isPending}
            className="w-full md:col-span-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {createBookingAsAdmin.isPending ? 'Creazione in corso...' : 'Crea prenotazione utente'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Gestione prenotazioni utenti</h2>

        {bookings.length === 0 ? (
          <p className="text-gray-600">Nessuna prenotazione disponibile.</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, index) => {
              const edit = editableBookings[index];
              return (
                <div key={booking.id} className="border rounded-md p-3">
                  <p className="text-sm text-gray-700 mb-2">
                    Prenotazione #{booking.id} · Utente: {booking.user?.email || booking.user?.name || 'N/D'}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <select
                      value={edit.courtId}
                      onChange={(e) => updateBookingEdit(String(booking.id), 'courtId', e.target.value)}
                      className="border rounded-md px-2 py-1"
                    >
                      <option value="">Campo</option>
                      {courts.map((court) => (
                        <option key={court.id} value={court.id}>
                          {court.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="datetime-local"
                      value={edit.startTime}
                      onChange={(e) => updateBookingEdit(String(booking.id), 'startTime', e.target.value)}
                      className="border rounded-md px-2 py-1"
                    />

                    <input
                      type="datetime-local"
                      value={edit.endTime}
                      onChange={(e) => updateBookingEdit(String(booking.id), 'endTime', e.target.value)}
                      className="border rounded-md px-2 py-1"
                    />

                    <select
                      value={edit.status}
                      onChange={(e) => updateBookingEdit(String(booking.id), 'status', e.target.value)}
                      className="border rounded-md px-2 py-1"
                    >
                      <option value="PENDING">In attesa</option>
                      <option value="CONFIRMED">Confermata</option>
                      <option value="BLOCKED">Bloccata</option>
                      <option value="CANCELLED">Annullata</option>
                    </select>

                    <input
                      type="text"
                      value={edit.notes}
                      onChange={(e) => updateBookingEdit(String(booking.id), 'notes', e.target.value)}
                      placeholder="Note"
                      className="border rounded-md px-2 py-1"
                    />
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={updateBookingAsAdmin.isPending}
                      onClick={() => saveBooking(String(booking.id), edit)}
                      className="px-3 py-2 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      Salva prenotazione
                    </button>
                    <button
                      type="button"
                      disabled={deleteBookingAsAdmin.isPending}
                      onClick={() => removeBooking(String(booking.id))}
                      className="px-3 py-2 text-sm rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      Elimina prenotazione
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
