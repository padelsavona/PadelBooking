import { useState } from 'react';
import { useCourts, useCreateBooking, useCreateCheckout } from '../hooks/useBooking';
import BookingForm from '../components/BookingForm';
import { Court } from '../types';

export default function HomePage() {
  const { data: courts, isLoading } = useCourts();
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const createBooking = useCreateBooking();
  const createCheckout = useCreateCheckout();

  const handleBookingSubmit = async (data: {
    startTime: string;
    endTime: string;
    notes?: string;
  }) => {
    if (!selectedCourt) return;

    try {
      const booking = await createBooking.mutateAsync({
        courtId: selectedCourt.id,
        ...data,
      });

      // Redirect to Stripe checkout
      const checkout = await createCheckout.mutateAsync(booking.id);
      if (checkout.sessionUrl) {
        window.location.href = checkout.sessionUrl;
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Booking failed');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading courts...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Book a Court</h1>

      {selectedCourt ? (
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">{selectedCourt.name}</h2>
          <p className="text-gray-600 mb-4">{selectedCourt.description}</p>
          <p className="text-lg font-semibold mb-6">€{selectedCourt.pricePerHour}/hour</p>

          <BookingForm
            court={selectedCourt}
            onSubmit={handleBookingSubmit}
            onCancel={() => setSelectedCourt(null)}
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courts?.map((court) => (
            <div key={court.id} className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-2">{court.name}</h2>
              <p className="text-gray-600 mb-4">{court.description}</p>
              <p className="text-2xl font-bold text-blue-600 mb-4">
                €{court.pricePerHour}/hour
              </p>
              <button
                onClick={() => setSelectedCourt(court)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      )}

      {(!courts || courts.length === 0) && (
        <div className="text-center text-gray-500">
          No courts available at the moment.
        </div>
      )}
    </div>
  );
}
