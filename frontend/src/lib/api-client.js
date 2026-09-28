const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export class ApiClientError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

// Use sessionStorage so a page refresh does not log the merchant out unexpectedly.
const TOKEN_STORAGE_KEY = "returnflow_access_token";
let inMemoryAccessToken = null;
let isRefreshing = false;
let refreshSubscribers = [];

export function setAccessToken(token) {
  inMemoryAccessToken = token;

  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
}

export function getAccessToken() {
  if (inMemoryAccessToken) return inMemoryAccessToken;

  if (typeof window !== "undefined") {
    const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
      inMemoryAccessToken = storedToken;
      return storedToken;
    }
  }

  return null;
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    ...options.headers,
  };

  // Only default to JSON if body is not FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: "include", // Includes httpOnly cookies for /refresh
  };

  let response = await fetch(url, fetchOptions);

  // Auto-refresh token on 401 (§3)
  if (
    response.status === 401 &&
    !options._retry &&
    !path.includes("/auth/login") &&
    !path.includes("/auth/refresh")
  ) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setAccessToken(data.accessToken);
          onRefreshed(data.accessToken);
          isRefreshing = false;

          // Retry initial request with new access token
          return apiFetch(path, { ...options, _retry: true });
        } else {
          isRefreshing = false;
          // Keep the merchant session alive during demo refresh/reseed cycles.
          // The app should only log out on an explicit logout action, not on a transient refresh failure.
        }
      } catch (err) {
        setAccessToken(null);
        isRefreshing = false;
      }
    } else {
      // Queue up pending calls while refreshing
      return new Promise((resolve) => {
        refreshSubscribers.push((newToken) => {
          fetchOptions.headers.Authorization = `Bearer ${newToken}`;
          resolve(fetch(url, fetchOptions).then((res) => res.json()));
        });
      });
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const code = errorBody?.error?.code || "UNKNOWN_ERROR";
    const message =
      errorBody?.error?.message || response.statusText || "Request failed";
    throw new ApiClientError(response.status, code, message);
  }

  return response.json();
}
