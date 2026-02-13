import { API_URL } from './config';



export interface ApiRequestOptions extends RequestInit {
    skipAuth?: boolean;
    params?: Record<string, any>;
}

/**
 * API client with automatic authentication
 * Uses HttpOnly cookies for authentication, fallbacks to Bearer if token exists
 */
export async function apiRequest<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
): Promise<T> {
    const { skipAuth, params, ...fetchOptions } = options;

    // Handle Query Params
    let url = `${API_URL}${endpoint}`;
    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, value.toString());
            }
        });
        const queryString = searchParams.toString();
        if (queryString) {
            url += (url.includes('?') ? '&' : '?') + queryString;
        }
    }

    // Auth Headers fallback for Bearer (if Cookie-based not enough/configured)
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers as Record<string, string>)
    };

    const token = localStorage.getItem('access_token');
    if (token && !skipAuth && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...fetchOptions,
        credentials: 'include',
        headers
    });


    // Handle authentication errors
    if (response.status === 401 && !skipAuth) {
        // Token expired or invalid
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        window.location.href = '/';
        throw new Error('Session expired');
    }

    // Handle other errors
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Helper methods for common HTTP verbs
 */
export const api = {
    get: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
        apiRequest<T>(endpoint, { ...options, method: 'GET' }),

    post: <T = any>(endpoint: string, data?: any, options?: ApiRequestOptions) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        }),

    put: <T = any>(endpoint: string, data?: any, options?: ApiRequestOptions) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined
        }),

    delete: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
        apiRequest<T>(endpoint, { ...options, method: 'DELETE' })
};
