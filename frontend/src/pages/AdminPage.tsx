import { useState } from 'react';
import { format, addHours, startOfHour } from 'date-fns';
import { useCourts, useBlockTime } from '../hooks/useBooking';

export default function AdminPage() {
  const { data: courts } = useCourts();
  const blockTime = useBlockTime();

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
        courtId: selectedCourtId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: notes.trim() || undefined,
      });
      alert('Time blocked successfully');
      setNotes('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to block time');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="max-w-md bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Block Time Slot</h2>

        <form onSubmit={handleBlock} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Court</label>
            <select
              value={selectedCourtId}
              onChange={(e) => setSelectedCourtId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Select a court</option>
              {courts?.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>

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
              {[1, 1.5, 2, 2.5, 3, 4, 6, 8].map((d) => (
                <option key={d} value={d}>
                  {d} {d === 1 ? 'hour' : 'hours'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reason (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="e.g., Maintenance, Private event"
            />
          </div>

          <button
            type="submit"
            disabled={blockTime.isPending}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {blockTime.isPending ? 'Blocking...' : 'Block Time Slot'}
          </button>
        </form>
      </div>
    </div>
  );
}
