/**
 * HTTP utility with automatic token refresh
 * Handles both JSON requests and file uploads
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5125";

export interface HttpOptions extends RequestInit {
  skipAuth?: boolean; // Skip adding Authorization header
}

/**
 * HTTP wrapper with automatic token refresh
 * @param url - The URL to fetch
 * @param options - Request options
 * @returns Promise<Response>
 */
export const httpWithRefresh = async (url: string, options: HttpOptions = {}): Promise<Response> => {
  const { skipAuth, ...fetchOptions } = options;
  const token = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  
  // Prepare headers
  const headers: Record<string, string> = {};
  
  // Add Authorization header if not skipped and token exists
  if (!skipAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  // Merge with existing headers
  if (fetchOptions.headers) {
    Object.assign(headers, fetchOptions.headers);
  }
  
  let response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Auto refresh on 401
  if (response.status === 401 && refreshToken && !skipAuth) {
    try {
      const refreshed = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (refreshed.ok) {
        const data = await refreshed.json();
        localStorage.setItem("accessToken", data.accessToken);
        
        // Retry with new token
        response = await fetch(url, {
          ...fetchOptions,
          headers: {
            ...headers,
            Authorization: `Bearer ${data.accessToken}`,
          },
        });
      } else {
        // Refresh failed, clear auth and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("refreshTokenExpiresAt");
        localStorage.removeItem("userProfile");
        const currentUrl = window.location.pathname + window.location.search;
        window.location.href = `/login?returnUrl=${encodeURIComponent(currentUrl)}`;
      }
    } catch {
      // Refresh failed, clear auth and redirect to login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("refreshTokenExpiresAt");
      localStorage.removeItem("userProfile");
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `/login?returnUrl=${encodeURIComponent(currentUrl)}`;
    }
  }

  return response;
};

/**
 * Convenience method for JSON requests
 * @param url - The URL to fetch
 * @param options - Request options
 * @returns Promise<T>
 */
export const httpJson = async <T>(url: string, options: HttpOptions = {}): Promise<T> => {
  const response = await httpWithRefresh(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
};

/**
 * Convenience method for file uploads
 * @param url - The URL to upload to
 * @param formData - FormData containing files
 * @param options - Additional options
 * @returns Promise<T>
 */
export const httpUpload = async <T>(url: string, formData: FormData, options: Omit<HttpOptions, 'body'> = {}): Promise<T> => {
  const response = await httpWithRefresh(url, {
    ...options,
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
};

/**
 * Get API base URL
 */
export const getApiBase = () => API_BASE;
