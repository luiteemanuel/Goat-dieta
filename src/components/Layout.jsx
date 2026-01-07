import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Utensils, MessageSquare, User, LogOut } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    }

    if (!currentUser) return <Outlet />;

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/log', icon: Utensils, label: 'Alimentação' },
        { path: '/assistant', icon: MessageSquare, label: 'Assistente IA' },
        { path: '/settings', icon: User, label: 'Perfil' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
            <nav className="bg-white border-b md:border-b-0 md:border-r border-slate-200 md:w-64 flex-shrink-0 z-50">
                <div className="h-full flex flex-col">
                    <div className="p-6 flex items-center gap-3">
                        <div className="bg-primary-600 p-2 rounded-xl text-white">
                            <img src="/goat-icon.png" alt="Goat Dieta" className="w-6 h-6 object-contain" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                            Goat Dieta
                        </span>
                    </div>

                    <div className="flex-1 px-4 py-4 md:py-0 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={clsx(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                                        isActive
                                            ? "bg-primary-50 text-primary-700 shadow-sm"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <Icon size={20} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="p-4 border-t border-slate-100">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors font-medium"
                        >
                            <LogOut size={20} />
                            Sair
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-screen">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
