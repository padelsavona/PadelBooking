import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import BookingsPage from './pages/BookingsPage';

function App() {
  const { user, logout, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="text-xl font-bold text-gray-900">
                  PadelBooking
                </Link>
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link
                    to="/"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Home
                  </Link>
                  {user && (
                    <Link
                      to="/bookings"
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      My Bookings
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                {user ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">
                      {user.full_name} ({user.role})
                    </span>
                    <button
                      onClick={logout}
                      className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
