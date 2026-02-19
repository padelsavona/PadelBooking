import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth';
import { useAuthStore } from '../stores/authStore';

function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      const user = await authService.getCurrentUser();
      setAuth(user, data.access_token);
      navigate('/');
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      setIsRegister(false);
      // Clear form
      setFormData({ email: '', password: '', full_name: '' });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegister) {
      registerMutation.mutate({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
      });
    } else {
      loginMutation.mutate({
        username: formData.email,
        password: formData.password,
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegister ? 'Create your account' : 'Sign in to your account'}
          </h2>
          {!isRegister && registerMutation.isSuccess && (
            <div className="mt-2 text-center text-sm text-green-600">
              Registration successful! Please login below.
            </div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {isRegister && (
              <div>
                <label htmlFor="full-name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="full-name"
                  name="full_name"
                  type="text"
                  required={isRegister}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${
                  !isRegister ? 'rounded-t-md' : ''
                } focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          {(loginMutation.error || registerMutation.error) && (
            <div className="text-red-600 text-sm text-center">
              {loginMutation.error?.message || registerMutation.error?.message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loginMutation.isPending || registerMutation.isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loginMutation.isPending || registerMutation.isPending
                ? 'Processing...'
                : isRegister
                  ? 'Register'
                  : 'Sign in'}
            </button>
          </div>

          <div className="text-sm text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {isRegister
                ? 'Already have an account? Sign in'
                : "Don't have an account? Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
