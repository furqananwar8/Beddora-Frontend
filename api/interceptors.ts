import { AxiosInstance } from 'axios';
import { SESSION_NOT_FOUND, SESSION_EXPIRED, SESSION_INVALID } from '@/lib/constants/session'; // adjust path as needed

let isLoggingOut = false;

const SESSION_ERRORS = [SESSION_NOT_FOUND, SESSION_EXPIRED, SESSION_INVALID];

export function interceptors(api: AxiosInstance) {
  api.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const requestUrl = error?.config?.url;
      const errorCode = error?.response?.data?.error;

      // Skip auth check endpoint — AuthCheck handles session state gracefully
      if (requestUrl?.includes('/auth/me')) {
        return Promise.reject(error);
      }

      if (SESSION_ERRORS.includes(errorCode) && !isLoggingOut) {
        isLoggingOut = true;

        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch (e) {
          console.error('Logout API failed:', e);
        }

        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }

        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );
}