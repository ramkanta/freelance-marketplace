import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401: attempt silent refresh once, then retry original request
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  res => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);

    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken });
      const newAccess: string = data.accessToken;
      const newRefresh: string = data.refreshToken;

      Cookies.set('accessToken', newAccess, { expires: 1, secure: true, sameSite: 'strict' });
      Cookies.set('refreshToken', newRefresh, { expires: 30, secure: true, sameSite: 'strict' });

      // Update stored user if returned
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      // Flush queued requests
      refreshQueue.forEach(cb => cb(newAccess));
      refreshQueue = [];

      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch {
      // Refresh failed — clear session
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      localStorage.removeItem('user');
      refreshQueue = [];
      window.location.href = '/login';
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
