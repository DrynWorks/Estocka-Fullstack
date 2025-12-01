import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2 } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

export default function SignupPage() {
    const [formData, setFormData] = useState({
        organization_name: '',
        user_full_name: '',
        user_email: '',
        user_password: ''
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validações client-side
        if (formData.user_password.length < 8) {
            setError('A senha deve ter no mínimo 8 caracteres');
            return;
        }

        if (formData.user_password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('/auth/signup', formData);
            const { access_token, organization_name } = response.data;

            // Salvar token
            localStorage.setItem('token', access_token);

            // Mostrar mensagem de sucesso
            toast.success(`Bem-vindo à ${organization_name}!`);

            // Redirecionar para dashboard
            navigate('/dashboard');

            // Recarregar para atualizar AuthContext
            window.location.reload();
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || 'Erro ao criar conta';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-3 text-center">
                    <div className="mx-auto bg-gradient-to-br from-green-600 to-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold">Criar Conta</CardTitle>
                    <CardDescription>Cadastre sua empresa e comece a usar o Estocka</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="organization_name">Nome da Empresa *</Label>
                            <Input
                                id="organization_name"
                                type="text"
                                placeholder="Minha Empresa Ltda"
                                value={formData.organization_name}
                                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                                required
                                minLength={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="user_full_name">Seu Nome Completo *</Label>
                            <Input
                                id="user_full_name"
                                type="text"
                                placeholder="João Silva"
                                value={formData.user_full_name}
                                onChange={(e) => setFormData({ ...formData, user_full_name: e.target.value })}
                                required
                                minLength={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="user_email">Email *</Label>
                            <Input
                                id="user_email"
                                type="email"
                                placeholder="seu@email.com"
                                value={formData.user_email}
                                onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="user_password">Senha *</Label>
                            <Input
                                id="user_password"
                                type="password"
                                placeholder="Mínimo 8 caracteres"
                                value={formData.user_password}
                                onChange={(e) => setFormData({ ...formData, user_password: e.target.value })}
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirmar Senha *</Label>
                            <Input
                                id="confirm_password"
                                type="password"
                                placeholder="Digite a senha novamente"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Criando conta...' : 'Criar Conta'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        <p>
                            Já tem uma conta?{' '}
                            <Link to="/login" className="text-primary hover:underline font-medium">
                                Fazer login
                            </Link>
                        </p>
                    </div>

                    <div className="mt-4 text-center text-xs text-muted-foreground">
                        <p>Ao criar uma conta, você será o <strong>Admin</strong></p>
                        <p>com acesso completo ao sistema.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
