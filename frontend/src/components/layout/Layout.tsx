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
    Sun,
    Moon,
    FileText,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
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
    { name: 'Auditoria', href: '/audit', icon: FileText, adminOnly: true },
];

export default function Layout({ children }: { children?: React.ReactNode }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { theme, setTheme } = useTheme();
    const isAdmin = user?.role.name === 'admin';

    const userInitials = user?.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    return (
        <div className="min-h-screen bg-background font-sans">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } bg-card/80 backdrop-blur-xl border-r border-border shadow-[0_0_15px_rgba(0,0,0,0.03)]`}
                style={{ width: '17rem' }}
            >
                <div className="h-full px-5 py-6 overflow-y-auto">
                    {/* Logo */}
                    <div className="flex items-center px-2 mb-8">
                        <div className="bg-gradient-to-br from-primary to-green-600 w-10 h-10 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-green-500/20">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">Estocka</h1>
                    </div>

                    {/* Navigation */}
                    <ul className="space-y-1.5">
                        {navigation.map((item) => {
                            if (item.adminOnly && !isAdmin) return null;
                            const isActive = location.pathname === item.href || (item.href === '/dashboard' && location.pathname === '/');
                            return (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                                ? 'bg-primary/10 text-primary font-semibold'
                                                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                                        <span className="text-sm">{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-[17rem]' : 'ml-0'}`}>
                {/* Top Header */}
                <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-30">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>

                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            >
                                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Alternar tema</span>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <div className="flex items-center gap-3 cursor-pointer">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">
                                            {user?.full_name}
                                        </span>
                                        <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                            <AvatarFallback className="bg-gradient-to-br from-primary to-green-600 text-white font-medium">
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
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children || <Outlet />}
                </main>
            </div>
        </div>
    );
}
