import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { courtService } from '../services/courts';
import { bookingService } from '../services/bookings';
import { paymentService } from '../services/payments';
import { useAuthStore } from '../stores/authStore';

function HomePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [courtId, setCourtId] = useState<number | ''>('');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('09:00');
  const [notes, setNotes] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const { data: courts = [], isLoading, isError, error } = useQuery({
    queryKey: ['courts'],
    queryFn: () => courtService.getCourts(),
  });

  const createBookingMutation = useMutation({
    mutationFn: bookingService.createBooking,
  });

  const blockTimeslotMutation = useMutation({
    mutationFn: bookingService.blockTimeslot,
  });

  const createCheckoutMutation = useMutation({
    mutationFn: paymentService.createCheckoutSession,
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

  const toIsoDateTime = (selectedDate: string, selectedTime: string): string => {
    if (selectedTime === '24:00') {
      const nextDay = new Date(`${selectedDate}T00:00:00`);
      nextDay.setDate(nextDay.getDate() + 1);
      return nextDay.toISOString();
    }
    return new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (!user) {
      setMessage('Please login to continue.');
      return;
    }

    if (!courtId || !date) {
      setMessage('Please select court and date.');
      return;
    }

    if (timeOptions.indexOf(endTime) <= timeOptions.indexOf(startTime)) {
      setMessage('End time must be after start time.');
      return;
    }

    const start_time = toIsoDateTime(date, startTime);
    const end_time = toIsoDateTime(date, endTime);

    try {
      if (user.role === 'admin' || user.role === 'manager') {
        await blockTimeslotMutation.mutateAsync({
          court_id: Number(courtId),
          start_time,
          end_time,
          notes,
        });
        setMessage('Timeslot blocked successfully.');
      } else {
        const booking = await createBookingMutation.mutateAsync({
          court_id: Number(courtId),
          start_time,
          end_time,
          notes,
        });

        const checkout = await createCheckoutMutation.mutateAsync({ booking_id: Number(booking.id) });
        window.location.href = checkout.checkout_url;
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setNotes('');
    } catch (error) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      setMessage(apiError.response?.data?.detail || 'Operation failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">Padel Booking</h1>
      <p className="text-gray-600 mb-10">
        Book courts between 00:00 and 24:00. Players pay online with Stripe; admins can block
        timeslots without payment.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Available Courts</h2>
          {isLoading ? (
            <div className="text-center py-8">Caricamento campi...</div>
          ) : isError ? (
            <div>
              Errore nel caricamento dei campi.
              {error instanceof Error ? ` Dettaglio: ${error.message}` : ''}
            </div>
          ) : (
            <div className="space-y-4">
              {courts.map((court) => (
                <div key={court.id} className="bg-white shadow rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-900">{court.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{court.description || 'No description'}</p>
                  <p className="text-sm mt-2 font-medium text-blue-700">€{court.hourly_rate}/hour</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">
            {user?.role === 'admin' || user?.role === 'manager' ? 'Block Timeslot' : 'Create Booking'}
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Court</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={courtId}
                onChange={(event) => {
                  const value = event.target.value;
                  setCourtId(value === '' ? '' : Number(value));
                }}
                required
              >
                <option value="">Select court</option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full border rounded-md px-3 py-2"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            {message && <div className="text-sm text-red-600">{message}</div>}

            <button
              type="submit"
              disabled={
                createBookingMutation.isPending ||
                createCheckoutMutation.isPending ||
                blockTimeslotMutation.isPending
              }
              className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {createBookingMutation.isPending ||
              createCheckoutMutation.isPending ||
              blockTimeslotMutation.isPending
                ? 'Processing...'
                : user?.role === 'admin' || user?.role === 'manager'
                  ? 'Block Timeslot'
                  : 'Book & Pay'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
