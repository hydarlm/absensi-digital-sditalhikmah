// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Generic fetch wrapper with authentication
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    throw new Error(`API Error: ${response.status}`);
  }

  // Handle 204 No Content - don't try to parse JSON
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Auth API
export const authAPI = {
  login: async (username: string, password: string): Promise<{ access_token: string; role: string }> => {
    // Backend expects form-data for OAuth2PasswordRequestForm
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    return response.json();
  },

  logout: async (): Promise<void> => {
    return apiFetch<void>('/auth/logout', { method: 'POST' });
  },

  me: async (): Promise<{ id: number; username: string; role: string; is_active: boolean; created_at: string }> => {
    return apiFetch('/auth/me');
  },
};

export { API_BASE_URL };
