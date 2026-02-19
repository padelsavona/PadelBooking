import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth';
import { useAuthStore } from '../stores/authStore';
import { LoginRequest, RegisterRequest, TokenResponse, User } from '../types';

type ApiError = AxiosError<{ detail?: string }>;

const getErrorMessage = (error?: ApiError): string => {
  const detail = error?.response?.data?.detail as unknown;

  if (typeof detail === 'string' && detail.trim().length > 0) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const firstItem = detail[0] as { msg?: string };
    if (firstItem && typeof firstItem.msg === 'string') {
      return firstItem.msg;
    }
    return 'Dati di accesso non validi.';
  }

  if (detail && typeof detail === 'object') {
    const maybeMsg = (detail as { msg?: string }).msg;
    if (typeof maybeMsg === 'string' && maybeMsg.trim().length > 0) {
      return maybeMsg;
    }
    return 'Dati di accesso non validi.';
  }

  return error?.message || 'Operazione non riuscita.';
};

function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });

  const loginMutation = useMutation<TokenResponse, ApiError, LoginRequest>({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      const user = await authService.getCurrentUser(data.access_token);
      setAuth(user, data.access_token);
      navigate('/');
    },
  });

  const registerMutation = useMutation<User, ApiError, RegisterRequest>({
    mutationFn: authService.register,
    onSuccess: () => {
      setIsRegister(false);
      setFormData({ email: '', password: '', full_name: '' });
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isRegister) {
      registerMutation.mutate({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
      });
    } else {
      loginMutation.mutate({
        email: formData.email,
        password: formData.password,
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegister ? 'Crea il tuo account' : 'Accedi al tuo account'}
          </h2>
          {!isRegister && registerMutation.isSuccess && (
            <div className="mt-2 text-center text-sm text-green-600">
              Registrazione completata. Ora puoi accedere.
            </div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {isRegister && (
              <div>
                <label htmlFor="full-name" className="sr-only">
                  Nome completo
                </label>
                <input
                  id="full-name"
                  name="full_name"
                  type="text"
                  required={isRegister}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Nome completo"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">
                Indirizzo email
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
                placeholder="Indirizzo email"
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
              {isRegister && (
                <p className="mt-2 text-xs text-gray-500">
                  La password deve avere almeno 8 caratteri, una lettera maiuscola, una minuscola e un numero.
                </p>
              )}
            </div>
          </div>

          {(loginMutation.error || registerMutation.error) && (
            <div className="text-red-600 text-sm text-center">
              {getErrorMessage(loginMutation.error) || getErrorMessage(registerMutation.error)}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loginMutation.isPending || registerMutation.isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loginMutation.isPending || registerMutation.isPending
                ? 'Elaborazione...'
                : isRegister
                  ? 'Registrati'
                  : 'Accedi'}
            </button>
          </div>

          <div className="text-sm text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {isRegister
                ? 'Hai già un account? Accedi'
                : 'Non hai un account? Registrati'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
