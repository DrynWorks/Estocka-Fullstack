import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    Package,
    ArrowLeftRight,
    BarChart3,
    Users,
    LogOut,
    Menu,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Produtos', href: '/products', icon: Package },
    { name: 'Movimentações', href: '/movements', icon: ArrowLeftRight },
    { name: 'Relatórios', href: '/reports', icon: BarChart3 },
    { name: 'Usuários', href: '/users', icon: Users, adminOnly: true },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const isAdmin = user?.role.name === 'admin';

    const userInitials = user?.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 h-screen transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } bg-slate-900 border-r border-slate-800`}
                style={{ width: '16rem' }}
            >
                <div className="h-full px-3 pb-4 overflow-y-auto">
                    {/* Logo */}
                    <div className="flex items-center justify-center py-6 mb-6 border-b border-slate-800">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center mr-3">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Estocka</h1>
                    </div>

                    {/* Navigation */}
                    <ul className="space-y-2">
                        {navigation.map((item) => {
                            if (item.adminOnly && !isAdmin) return null;
                            const isActive = location.pathname === item.href;
                            return (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        className={`flex items-center p-3 rounded-lg transition-colors ${isActive
                                                ? 'bg-blue-600 text-white'
                                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5 mr-3" />
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`transition-all ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
                {/* Top Header */}
                <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <div className="flex items-center gap-3 cursor-pointer">
                                    <span className="text-sm font-medium text-slate-700 hidden sm:block">
                                        {user?.full_name}
                                    </span>
                                    <Avatar>
                                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div>
                                        <div className="font-medium">{user?.full_name}</div>
                                        <div className="text-xs text-slate-500">{user?.email}</div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
