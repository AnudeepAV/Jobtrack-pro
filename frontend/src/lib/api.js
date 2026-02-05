import axios from "axios";

/**
 * Use .env / Netlify env var:
 * VITE_API_BASE_URL=https://jobtrack-pro-api.onrender.com/api
 */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

// -------------------- token helpers --------------------
export function setAccessToken(token) {
  if (token) localStorage.setItem("access_token", token);
  else localStorage.removeItem("access_token");
}

export function setRefreshToken(token) {
  if (token) localStorage.setItem("refresh_token", token);
  else localStorage.removeItem("refresh_token");
}

export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// -------------------- axios instance --------------------
const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Don't redirect here (Netlify builds / SSR-ish routes can behave weird).
// Just clear tokens if unauthorized.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearTokens();
    }
    return Promise.reject(err);
  }
);

export default api;
