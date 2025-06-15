import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { Moon, Sun, Torus, Users, Calendar, DollarSign, BarChart3, Shield, FileText, Clock } from "lucide-react";
import { TraditionalLogin } from "@/components/auth/TraditionalLogin";
import { useTraditionalAuth } from "@/hooks/useTraditionalAuth";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export default function Landing() {
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, mustChangePassword, login, logout } = useTraditionalAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState('');
  const [loginError, setLoginError] = useState('');

  // Se está autenticado mas precisa mudar password
  if (isAuthenticated && mustChangePassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <ChangePasswordForm
          isFirstLogin={true}
          onSuccess={() => {
            window.location.href = '/dashboard';
          }}
          onError={(error) => {
            console.error('Erro ao alterar password:', error);
          }}
        />
      </div>
    );
  }

  // Se está autenticado, redirecionar para dashboard
  if (isAuthenticated && !mustChangePassword) {
    window.location.href = '/dashboard';
    return null;
  }

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Torus className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Excelso
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button onClick={() => setShowLogin(!showLogin)}>
              {showLogin ? 'Voltar' : 'Entrar'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {showLogin ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Acesso ao Sistema
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Escolha o método de autenticação
              </p>
            </div>
            
            {loginSuccess && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                {loginSuccess}
              </div>
            )}
            
            {loginError && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {loginError}
              </div>
            )}
            
            <div className="w-full">
              <TraditionalLogin
                onSuccess={(token, user) => {
                  login(token, user);
                  setLoginSuccess('Login realizado com sucesso!');
                  setLoginError('');
                  // Redirecionar será feito automaticamente pelo useEffect
                }}
                onError={(error) => {
                  setLoginError(error);
                  setLoginSuccess('');
                }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Sistema de Gestão
                <span className="block text-blue-600">Excelso</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                Gerencie pacientes, consultas, tratamentos e finanças da sua clínica dentária 
                de forma simples e eficiente.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => setShowLogin(true)} className="text-lg px-8 py-3">
                  Começar Agora
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                  Saber Mais
                </Button>
              </div>
            </div>
            
            {/* Features Grid */}
            <section className="py-20">
              <div className="text-center mb-16">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Tudo o que Precisa para Gerir a Sua Clínica
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  A nossa solução abrangente cobre todos os aspetos da gestão de clínicas dentárias
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Agendamento Inteligente</CardTitle>
                    <CardDescription>
                      Agendamento inteligente de consultas com validação de disponibilidade
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Controlo de disponibilidade médica</li>
                      <li>• Correspondência de tipos de consulta</li>
                      <li>• Deteção automática de conflitos</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Gestão de Pacientes</CardTitle>
                    <CardDescription>
                      Perfis completos de pacientes com histórico clínico e registos de tratamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Registos abrangentes de pacientes</li>
                      <li>• Acompanhamento do histórico clínico</li>
                      <li>• Documentação de tratamentos</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Controlo Financeiro</CardTitle>
                    <CardDescription>
                      Gestão financeira abrangente com geração automática de transações
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Criação automática de faturas</li>
                      <li>• Acompanhamento do estado de pagamentos</li>
                      <li>• Relatórios de receitas</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Relatórios Interativos</CardTitle>
                    <CardDescription>
                      Análises detalhadas e relatórios com gráficos visuais e capacidades de exportação
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Análises de receitas</li>
                      <li>• Estatísticas de pacientes</li>
                      <li>• Exportação para PDF/CSV</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Acesso Baseado em Funções</CardTitle>
                    <CardDescription>
                      Gestão segura de utilizadores com permissões baseadas em funções
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Funções Admin, Funcionário, Médico</li>
                      <li>• Permissões granulares</li>
                      <li>• Autenticação segura</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Torus className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Acompanhamento de Procedimentos</CardTitle>
                    <CardDescription>
                      Documentação detalhada de procedimentos ligada a consultas e pacientes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Categorização de procedimentos</li>
                      <li>• Acompanhamento de custos</li>
                      <li>• Histórico de tratamentos</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        )}
      </main>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Pronto para Otimizar a Sua Clínica?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Junte-se aos profissionais dentários que confiam no nosso sistema para gerir as suas clínicas de forma eficiente.
          </p>
          <Button size="lg" onClick={() => setShowLogin(true)} className="text-lg px-8">
            Comece a Gerir a Sua Clínica Hoje
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Torus className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Sistema Clínica Dentária</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            © 2024 Sistema Clínica Dentária. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
