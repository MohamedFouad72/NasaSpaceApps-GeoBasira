// Automatically detect the API URL based on the current window location
// This allows the app to work on both localhost and when accessed via IP
// It can be overridden by VITE_API_BASE_URL for production deployment
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000`;

