import { User } from '../types';

import { api } from './api';



const realUsersAPI = {
    /**
     * List all users (Admin only)
     */
    async list(): Promise<User[]> {
        const data = await api.get('/auth/listar_usuarios');


        // Map backend fields to frontend User type
        return data.map((u: any) => ({
            id: u.id.toString(),
            name: u.nome_usuario,
            email: u.email || '',
            role: u.role,
            initials: u.nome_usuario.substring(0, 2).toUpperCase(),
            color: 'bg-indigo-500', // Default color
            isAdmin: u.role === 'admin' || u.role.includes('master'), // Map roles to isAdmin flag
            avatarUrl: u.avatar_url,
            isGuest: u.role === 'visitor'
        }));
    },

    /**
     * Create new user
     */
    async create(user: Partial<User>, password?: string): Promise<any> {
        // Map frontend User to backend CadastrarUsuario
        const payload = {
            usuario: user.email?.split('@')[0] || user.name?.toLowerCase().replace(/\s/g, ''), // Generate username
            email: user.email,
            password: password, // Required for creation
            nome_usuario: user.name,
            setor: 'Infraestrutura', // Enforce sector as per user request
            avatar_url: user.avatarUrl,
            role: user.isAdmin ? 'admin' : (user.role || 'visitor')
        };

        return api.post('/auth/cadastrar_usuario', payload);
    },


    /**
     * Update existing user
     */
    async update(user: User): Promise<any> {
        // Map frontend User to backend AtualizarUsuario
        const payload = {
            id: parseInt(user.id),
            nome_usuario: user.name,
            email: user.email,
            avatar_url: user.avatarUrl,
            setor: 'Infraestrutura', // Enforce sector
            role: user.isAdmin ? 'admin' : user.role
            // password is updated separately or if provided
        };

        return api.put('/auth/atualizar_usuario', payload);
    },


    /**
     * Delete user
     */
    async delete(userId: string): Promise<any> {
        return api.delete(`/auth/deletar_usuario/${userId}`);
    }

};

import { USE_MOCK } from './config';
import { mockUsersAPI } from './mockServices';

export const usersAPI = USE_MOCK ? mockUsersAPI : realUsersAPI;
