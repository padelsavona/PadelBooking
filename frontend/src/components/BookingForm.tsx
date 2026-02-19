import { useState } from 'react';
import { format, addHours, startOfHour, isBefore } from 'date-fns';
import { Court } from '../types';

interface BookingFormProps {
  court: Court;
  onSubmit: (data: { startTime: string; endTime: string; notes?: string }) => void;
  onCancel: () => void;
}

export default function BookingForm({ court, onSubmit, onCancel }: BookingFormProps) {
  const now = startOfHour(addHours(new Date(), 1));
  const [selectedDate, setSelectedDate] = useState(format(now, 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState(format(now, 'HH:mm'));
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const endTime = addHours(startTime, duration);

    onSubmit({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      notes: notes.trim() || undefined,
    });
  };

  const totalPrice = court.pricePerHour * duration;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
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
        <label className="block text-sm font-medium mb-1">Start Time</label>
        <input
          type="time"
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Duration (hours)</label>
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
        >
          {[1, 1.5, 2, 2.5, 3].map((d) => (
            <option key={d} value={d}>
              {d} {d === 1 ? 'hour' : 'hours'}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Price:</span>
          <span className="text-xl font-bold">€{totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Book & Pay
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
