import { format } from 'date-fns';
import { useMyBookings, useCancelBooking } from '../hooks/useBooking';

export default function MyBookingsPage() {
  const { data: bookings, isLoading } = useMyBookings();
  const cancelBooking = useCancelBooking();

  const handleCancel = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      try {
        await cancelBooking.mutateAsync(bookingId);
        alert('Booking cancelled successfully');
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        alert(error.response?.data?.message || 'Failed to cancel booking');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

      {bookings && bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{booking.court?.name}</h3>
                  <p className="text-gray-600 mt-1">
                    {format(new Date(booking.startTime), 'PPP p')} -{' '}
                    {format(new Date(booking.endTime), 'p')}
                  </p>
                  {booking.notes && <p className="text-sm text-gray-500 mt-2">{booking.notes}</p>}
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold">€{Number(booking.totalPrice).toFixed(2)}</p>
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm mt-2 ${
                      booking.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : booking.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>

              {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') &&
                new Date(booking.startTime) > new Date() && (
                  <div className="mt-4">
                    <button
                      onClick={() => handleCancel(String(booking.id))}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">
          <p>You don't have any bookings yet.</p>
          <a href="/" className="text-blue-600 hover:underline mt-2 inline-block">
            Book a court now
          </a>
        </div>
      )}
    </div>
  );
}
