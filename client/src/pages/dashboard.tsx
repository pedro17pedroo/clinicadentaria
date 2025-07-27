import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { DashboardMetrics } from "@/components/dashboard/metrics";
import { TodaysSchedule } from "@/components/dashboard/schedule";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { FinancialOverview } from "@/components/dashboard/financial-overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Activity, CreditCard, Stethoscope, AlertTriangle, CheckCircle } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { pt } from "date-fns/locale";

interface DashboardMetricsType {
  todayAppointments: number;
  pendingPayments: number;
  monthlyRevenue: number;
  activePatients: number;
}

export default function Dashboard() {
  // Buscar dados das APIs
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetricsType>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments"],
  });

  const { data: procedures, isLoading: proceduresLoading } = useQuery({
    queryKey: ["/api/procedures"],
  });

  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: procedureTypes } = useQuery({
    queryKey: ["/api/procedure-types"],
  });

  const { data: transactionTypes } = useQuery({
    queryKey: ["/api/transaction-types"],
  });

  const isLoading = metricsLoading || transactionsLoading || appointmentsLoading || proceduresLoading || patientsLoading;

  // Função para formatar moeda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
    }).format(amount);
  };

  // Gerar dados para gráfico de receita dos últimos 7 dias
  const generateRevenueData = () => {
    if (!transactions || !Array.isArray(transactions)) return [];
    
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Filtrar apenas transações com datas válidas
      const validTransactions = transactions.filter((t: any) => isValidDate(t.transactionDate));
      
      const dayRevenue = validTransactions
        .filter((t: any) => {
          try {
            const transactionDate = format(new Date(t.transactionDate), 'yyyy-MM-dd');
            return t.status === 'paid' && t.transactionTypeId?.category === 'income' && transactionDate === dateStr;
          } catch (error) {
            console.warn('Erro ao formatar data da transação:', t.transactionDate);
            return false;
          }
        })
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      
      data.push({
        date: format(date, 'dd/MM', { locale: pt }),
        receita: dayRevenue
      });
    }
    
    return data;
  };

  // Calcular métricas financeiras
  const calculateFinancialMetrics = () => {
    if (!transactions || !Array.isArray(transactions)) {
      return {
        totalReceita: 0,
        totalDespesas: 0,
        lucroLiquido: 0,
        receitaHoje: 0,
        despesasHoje: 0,
        transacoesPendentes: 0
      };
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    // Filtrar apenas transações pagas e com datas válidas
    const paidTransactions = transactions.filter((t: any) => t.status === 'paid' && isValidDate(t.transactionDate));
    
    const totalReceita = paidTransactions
      .filter((t: any) => t.transactionTypeId?.category === 'income')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    
    const totalDespesas = paidTransactions
      .filter((t: any) => t.transactionTypeId?.category === 'expense')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    
    const receitaHoje = paidTransactions
      .filter((t: any) => {
        try {
          const transactionDate = format(new Date(t.transactionDate), 'yyyy-MM-dd');
          return t.transactionTypeId?.category === 'income' && transactionDate === today;
        } catch (error) {
          console.warn('Erro ao formatar data da transação:', t.transactionDate);
          return false;
        }
      })
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    
    const despesasHoje = paidTransactions
      .filter((t: any) => {
        try {
          const transactionDate = format(new Date(t.transactionDate), 'yyyy-MM-dd');
          return t.transactionTypeId?.category === 'expense' && transactionDate === today;
        } catch (error) {
          console.warn('Erro ao formatar data da transação:', t.transactionDate);
          return false;
        }
      })
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    
    const transacoesPendentes = transactions
      .filter((t: any) => t.status === 'pending')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    
    return {
      totalReceita,
      totalDespesas,
      lucroLiquido: totalReceita - totalDespesas,
      receitaHoje,
      despesasHoje,
      transacoesPendentes
    };
  };

  // Gerar dados para gráfico de procedimentos por tipo
  const generateProcedureData = () => {
    if (!procedures || !Array.isArray(procedures) || !procedureTypes || !Array.isArray(procedureTypes)) return [];
    
    const typeCount: { [key: string]: number } = {};
    
    procedures.forEach((procedure: any) => {
      // Verificar se procedureTypeId é um objeto populado ou apenas um ID
      let procedureTypeId = procedure.procedureTypeId;
      if (typeof procedureTypeId === 'object' && procedureTypeId !== null) {
        procedureTypeId = procedureTypeId._id;
      }
      
      const type = procedureTypes.find((pt: any) => pt._id === procedureTypeId || pt.id === procedureTypeId);
      if (type) {
        typeCount[type.name] = (typeCount[type.name] || 0) + 1;
      }
    });
    
    return Object.entries(typeCount).map(([name, count]) => ({ name, value: count }));
  };

  // Função auxiliar para validar e formatar datas
  const isValidDate = (date: any): boolean => {
    if (!date) return false;
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  };

  // Calcular estatísticas de consultas
  const calculateAppointmentStats = () => {
    if (!appointments || !Array.isArray(appointments)) {
      return {
        hoje: 0,
        semana: 0,
        agendadas: 0,
        concluidas: 0,
        canceladas: 0
      };
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    
    // Filtrar apenas appointments com datas válidas
    const validAppointments = appointments.filter((a: any) => isValidDate(a.date));
    
    const hoje = validAppointments.filter((a: any) => {
      try {
        const appointmentDate = format(new Date(a.date), 'yyyy-MM-dd');
        return appointmentDate === today;
      } catch (error) {
        console.warn('Erro ao formatar data do appointment:', a.date);
        return false;
      }
    }).length;
    
    const semana = validAppointments.filter((a: any) => {
      try {
        const appointmentDate = format(new Date(a.date), 'yyyy-MM-dd');
        return appointmentDate >= weekAgo && appointmentDate <= today;
      } catch (error) {
        console.warn('Erro ao formatar data do appointment:', a.date);
        return false;
      }
    }).length;
    
    const agendadas = appointments.filter((a: any) => a.status === 'scheduled').length;
    const concluidas = appointments.filter((a: any) => a.status === 'completed').length;
    const canceladas = appointments.filter((a: any) => a.status === 'cancelled').length;
    
    return { hoje, semana, agendadas, concluidas, canceladas };
  };

  const revenueData = generateRevenueData();
  const financialMetrics = calculateFinancialMetrics();
  const procedureData = generateProcedureData();
  const appointmentStats = calculateAppointmentStats();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="Dashboard" 
          subtitle="Bem-vindo de volta ao seu sistema de gestão de clínica dentária"
        />
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <DashboardMetrics metrics={metrics} />
        )}

        {/* Métricas Financeiras Expandidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(financialMetrics.totalReceita)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Hoje: {formatCurrency(financialMetrics.receitaHoje)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Despesas Totais</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(financialMetrics.totalDespesas)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Hoje: {formatCurrency(financialMetrics.despesasHoje)}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lucro Líquido</p>
                  <p className={`text-2xl font-bold ${financialMetrics.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(financialMetrics.lucroLiquido)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Margem: {financialMetrics.totalReceita > 0 ? ((financialMetrics.lucroLiquido / financialMetrics.totalReceita) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className={`w-12 h-12 ${financialMetrics.lucroLiquido >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-lg flex items-center justify-center`}>
                  <DollarSign className={`h-6 w-6 ${financialMetrics.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pagamentos Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{financialMetrics.transacoesPendentes}</p>
                  <p className="text-xs text-muted-foreground mt-1">Requer atenção</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos e Análises */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Receita */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Receita dos Últimos 7 Dias</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), 'Receita']}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="receita" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribuição de Procedimentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5" />
                <span>Distribuição de Procedimentos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={procedureData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {procedureData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas de Consultas */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{appointmentStats.hoje}</p>
              <p className="text-sm text-muted-foreground">Consultas Hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{appointmentStats.semana}</p>
              <p className="text-sm text-muted-foreground">Esta Semana</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{appointmentStats.concluidas}</p>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{appointmentStats.agendadas}</p>
              <p className="text-sm text-muted-foreground">Agendadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{appointmentStats.canceladas}</p>
              <p className="text-sm text-muted-foreground">Canceladas</p>
            </CardContent>
          </Card>
        </div>

        {/* Layout Original */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <TodaysSchedule />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>

        <FinancialOverview />
      </main>
    </div>
  );
}
