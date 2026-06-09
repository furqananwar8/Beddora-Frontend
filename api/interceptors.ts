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
      const errorCode = error?.response?.data?.errorCode;

      if (SESSION_ERRORS.includes(errorCode) && !isLoggingOut) {
        isLoggingOut = true;

        // Call the Next.js API route to clear the HTTP-only cookie server-side
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include', // ← include is safer for cross-subdomain
          });
        } catch (e) {
          console.error('Logout API failed:', e);
        }

        // Hard redirect to root (login page is now at /)
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }

        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );
}