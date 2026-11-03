const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, '');
export const API_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
};