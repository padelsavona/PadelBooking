import { useQuery } from '@tanstack/react-query';
import { courtService } from '../services/courts';

function HomePage() {
  const { data: courts = [], isLoading } = useQuery({
    queryKey: ['courts'],
    queryFn: () => courtService.getCourts(),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Welcome to PadelBooking</h1>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">About Our Service</h2>
        <p className="text-gray-600 mb-4">
          Book your padel court easily and efficiently. Choose from our available courts and
          secure your playing time.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Available Courts</h2>
        {isLoading ? (
          <div className="text-center py-8">Loading courts...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courts.map((court) => (
              <div key={court.id} className="bg-white shadow rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2">{court.name}</h3>
                {court.description && (
                  <p className="text-gray-600 mb-4">{court.description}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-600">
                    €{court.hourly_rate}/hour
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      court.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {court.is_active ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
