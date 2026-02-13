
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Lock, ArrowLeft, ShieldCheck, ChevronRight, BarChart3, UserPlus, Mail } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { PerformanceToggle } from './PerformanceToggle';
import { authService } from '../lib/auth';

interface LoginProps {
    onLogin: (user: User) => void;
    users: User[];
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    performanceMode: boolean;
    togglePerformanceMode: () => void;
}

export const Login: React.FC<LoginProps> = ({
    onLogin,
    users,
    theme,
    toggleTheme,
    performanceMode,
    togglePerformanceMode
}) => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // --- First Access State (When no users exist) ---
    const [isFirstAccess, setIsFirstAccess] = useState(users.length === 0);
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPass, setNewAdminPass] = useState('');

    useEffect(() => {
        setIsFirstAccess(users.length === 0);
    }, [users]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setError('');

        try {
            // Login with email or username (API accepts both)
            const data = await authService.login(selectedUser.email, password);

            // Map API response to CRM User type
            const authenticatedUser: User = {
                id: data.user_id.toString(),
                name: data.user.name,
                email: data.user.email,
                avatarUrl: data.user.avatar_url,
                role: data.user.role,
                initials: data.user.name.substring(0, 2).toUpperCase(),
                color: selectedUser.color || 'bg-indigo-600',
                isAdmin: data.user.role === 'admin',
                password: undefined // Don't store password
            };

            // Store token for reference (cookie is primary auth method)
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(authenticatedUser));

            onLogin(authenticatedUser);

        } catch (error: any) {
            console.error('Login error:', error);
            setError(error.message || 'Usuário ou senha incorretos.');
        }
    };

    const handleCreateFirstAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminName || !newAdminEmail || !newAdminPass) {
            setError('Preencha todos os campos.');
            return;
        }

        const newAdmin: User = {
            id: `u-${Date.now()}`,
            name: newAdminName,
            email: newAdminEmail,
            password: newAdminPass,
            role: 'Administrador',
            initials: newAdminName.substring(0, 2).toUpperCase(),
            color: 'bg-indigo-600',
            isAdmin: true
        };

        // In a real app, this would hit the backend API.
        // Here we just pass it up to App.tsx via onLogin (simulating immediate login)
        // Note: App.tsx needs to handle adding this user to state if it wants persistence in this session.
        // Ideally, Login shouldn't mutate Users, but for "First Access" simulation, we trigger login directly.
        localStorage.setItem('user', JSON.stringify(newAdmin));
        onLogin(newAdmin);
    };


    const handleGuestLogin = () => {
        const guestUser: User = {
            id: 'guest',
            name: 'Visitante Executivo',
            email: 'guest@menubrands.com.br',
            role: 'Visualização',
            initials: 'EX',
            color: 'bg-slate-700',
            isAdmin: false,
            isGuest: true
        };
        localStorage.setItem('user', JSON.stringify(guestUser));
        onLogin(guestUser);
    };


    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        setPassword('');
        setError('');
    };

    const handleBack = () => {
        setSelectedUser(null);
        setPassword('');
        setError('');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f0202] flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-red-500/30 transition-colors duration-500">

            {/* --- Ambient Background Effects (Red Toned) --- */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                {/* Glowing Orbs - Modified for Light/Dark modes */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-200/40 dark:bg-red-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-200/30 dark:bg-orange-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-rose-200/40 dark:bg-rose-600/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]"></div>
            </div>

            {/* --- Global Controls (Universal Toggles) --- */}
            <div className="absolute top-6 right-6 z-50 hidden md:flex items-center gap-3 bg-white/50 dark:bg-black/30 backdrop-blur-md p-2 rounded-full border border-slate-200/50 dark:border-white/10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <PerformanceToggle isActive={performanceMode} toggle={togglePerformanceMode} />
                <div className="w-px h-6 bg-slate-300 dark:bg-white/10"></div>
                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>

            {/* --- Main Content Container --- */}
            <div className="z-10 w-full max-w-5xl flex flex-col items-center px-4">

                {/* Brand Header */}
                <div className="mb-10 text-center animate-in fade-in slide-in-from-top-8 duration-700">
                    <div className="w-20 h-20 bg-white dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-slate-200 dark:shadow-red-500/20 group hover:scale-105 transition-transform duration-500">
                        <img
                            src="https://menubrands.com.br/wp-content/uploads/2020/04/Menu.png"
                            alt="MenuBrands Logo"
                            className="h-12 w-auto object-contain drop-shadow-sm"
                        />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Menu<span className="text-red-600 dark:text-red-500">Brands</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-3 text-lg tracking-wide">Infra CRM <span className="text-red-600 dark:text-red-500 font-bold">v1.0</span></p>
                </div>

                {/* --- Glass Card --- */}
                <div className="w-full bg-white/70 dark:bg-[#1a0505]/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl shadow-2xl dark:shadow-black/50 overflow-hidden relative animate-in zoom-in-95 duration-500 ring-1 ring-slate-200 dark:ring-white/5 transition-colors duration-500">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>

                    <div className="p-8 md:p-12 min-h-[400px] flex flex-col items-center justify-center">

                        {/* VIEW 0: FIRST ACCESS (EMPTY DB) */}
                        {isFirstAccess && (
                            <div className="w-full max-w-xs flex flex-col items-center animate-in fade-in duration-500">
                                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                                    <UserPlus size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Primeiro Acesso</h2>
                                <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6">
                                    Nenhum usuário encontrado. Crie uma conta de Administrador para iniciar.
                                </p>

                                <form onSubmit={handleCreateFirstAdmin} className="w-full space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Nome Completo"
                                        className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={newAdminName}
                                        onChange={e => setNewAdminName(e.target.value)}
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={newAdminEmail}
                                        onChange={e => setNewAdminEmail(e.target.value)}
                                        required
                                    />
                                    <input
                                        type="password"
                                        placeholder="Criar Senha"
                                        className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={newAdminPass}
                                        onChange={e => setNewAdminPass(e.target.value)}
                                        required
                                    />

                                    {error && <div className="text-red-500 text-xs text-center">{error}</div>}

                                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all">
                                        Criar Admin e Entrar
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* VIEW 1: PROFILE SELECTION */}
                        {!isFirstAccess && !selectedUser && (
                            <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
                                <h2 className="text-2xl font-light text-slate-800 dark:text-white mb-8">Quem está acessando?</h2>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full mb-8 max-w-3xl">
                                    {users.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleUserSelect(user)}
                                            className="group relative flex flex-col items-center gap-4 p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10 hover:border-red-500/50 dark:hover:border-red-500/50 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md"
                                        >
                                            <div className="relative w-20 h-20 group-hover:scale-110 transition-transform duration-300">
                                                <div className={`w-full h-full rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg ring-4 ring-slate-100 dark:ring-slate-900/50 overflow-hidden ${!user.avatarUrl ? user.color : 'bg-gray-800'}`}>
                                                    {user.avatarUrl ? (
                                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.initials
                                                    )}
                                                </div>
                                                {user.isAdmin && (
                                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-lg ring-2 ring-white dark:ring-slate-900 z-10">
                                                        <ShieldCheck className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center w-full">
                                                <h3 className="font-semibold text-base text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">{user.name}</h3>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">{user.role.split(' ')[0]}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Executive Guest Login */}
                                <button
                                    onClick={handleGuestLogin}
                                    className="flex items-center gap-3 px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all text-sm font-medium group hover:border-indigo-500/30 shadow-sm"
                                >
                                    <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/30 transition-colors">
                                        <BarChart3 size={16} />
                                    </div>
                                    <span>Acesso Executivo (Apenas Relatórios)</span>
                                    <ChevronRight size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </button>
                            </div>
                        )}

                        {/* VIEW 2: PASSWORD INPUT */}
                        {selectedUser && (
                            <div className="w-full max-w-xs flex flex-col items-center animate-in slide-in-from-right-10 duration-300">
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-2xl mb-4 ring-4 ring-white dark:ring-slate-800 overflow-hidden ${!selectedUser.avatarUrl ? selectedUser.color : 'bg-gray-800'}`}>
                                    {selectedUser.avatarUrl ? (
                                        <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-full h-full object-cover" />
                                    ) : (
                                        selectedUser.initials
                                    )}
                                </div>

                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{selectedUser.name}</h2>
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-8 bg-red-100 dark:bg-red-500/10 px-3 py-1 rounded-full border border-red-200 dark:border-red-500/20">
                                    {selectedUser.role}
                                </p>

                                <form onSubmit={handleLogin} className="w-full space-y-4">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-red-500 dark:group-focus-within:text-red-400 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            placeholder="Senha de acesso"
                                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200 sm:text-sm shadow-inner"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                setError('');
                                            }}
                                            autoFocus
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs text-center font-medium animate-pulse">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 active:scale-95 group"
                                    >
                                        Entrar no Sistema
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </form>

                                <button
                                    onClick={handleBack}
                                    className="mt-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors text-sm py-2 px-4 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Escolher outro usuário
                                </button>
                            </div>
                        )}

                    </div>

                    {/* Card Footer */}
                    <div className="bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-white/5 p-4 text-center">
                        <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
                            <ShieldCheck className="w-3 h-3" /> Ambiente Seguro e Monitorado
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-600">
                    © 2026 MenuBrands Infraestrutura. Todos os direitos reservados.
                </div>

            </div>
        </div>
    );
};
