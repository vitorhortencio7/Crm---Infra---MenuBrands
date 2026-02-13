import { useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../lib/auth';

/**
 * Authentication hook
 * Manages user state and validates token on mount
 */
export function useAuth() {
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    const [isValidating, setIsValidating] = useState(true);

    useEffect(() => {
        // Validate token on mount
        const validateSession = async () => {
            if (user) {
                const isValid = await authService.validateToken();
                if (!isValid) {
                    setUser(null);
                    localStorage.removeItem('user');
                    localStorage.removeItem('access_token');
                }
            }
            setIsValidating(false);
        };

        validateSession();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return {
        user,
        setUser: login,
        logout,
        isValidating
    };
}
