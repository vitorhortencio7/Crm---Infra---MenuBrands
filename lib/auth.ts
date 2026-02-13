import { API_URL } from './config';

export interface LoginResponse {
    message: string;
    access_token: string;
    refresh_token: string;
    user_id: number;
    user: {
        username: string;
        name: string;
        email: string;
        avatar_url?: string;
        role: string;
    };
    token: string;
    session_duration: number;
}

const realAuthService = {
    /**
     * Login with username or email
     * @param identifier - Can be username or email
     * @param password - User password
     */
    async login(identifier: string, password: string): Promise<LoginResponse> {
        const isEmail = identifier.includes('@');

        const response = await fetch(`${API_URL}/auth/autenticacao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Important: Receive HttpOnly cookie
            body: JSON.stringify({
                [isEmail ? 'email' : 'usuario']: identifier,
                senha: password
            })
        });

        const data = await response.json();

        if (!response.ok || data.error || !data.access_token) {
            throw new Error(data.message || data.error || 'Login falhou');
        }

        return data;
    },

    /**
     * Validate current token
     */
    async validateToken(): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/auth/validacao_token`, {
                method: 'POST',
                credentials: 'include'
            });
            return response.ok;
        } catch {
            return false;
        }
    },

    /**
     * Logout and clear session
     */
    async logout(): Promise<void> {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('access_token');
        }
    },

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken: string): Promise<LoginResponse> {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        return response.json();
    }
};

import { USE_MOCK } from './config';
import { mockAuthService } from './mockServices';

export const authService = USE_MOCK ? mockAuthService : realAuthService;
