import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, TrendingUp, Users, Calendar, DollarSign, Activity, CreditCard, Stethoscope, PieChart as PieChartIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
export default function Reports() {
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("revenue");

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments"],
  });

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: consultationTypes } = useQuery({
    queryKey: ["/api/consultation-types"],
  });

  const { data: procedureTypes } = useQuery({
    queryKey: ["/api/procedure-types"],
  });

  const { data: transactionTypes } = useQuery({
    queryKey: ["/api/transaction-types"],
  });

  const { data: procedures } = useQuery({
    queryKey: ["/api/procedures"],
  });

  // Generate revenue chart data
  const generateRevenueData = () => {
    if (!transactions || !Array.isArray(transactions)) return [];
    
    const days = parseInt(dateRange);
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayRevenue = transactions
        .filter((t: any) => t.status === 'paid' && format(new Date(t.transactionDate), 'yyyy-MM-dd') === dateStr)
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      
      data.push({
        date: format(date, 'MMM dd'),
        revenue: dayRevenue
      });
    }
    
    return data;
  };

  // Generate procedure type distribution based on actual procedures
  const generateProcedureTypeData = () => {
    if (!procedures || !Array.isArray(procedures) || !procedureTypes || !Array.isArray(procedureTypes)) return [];
    
    const typeCount: { [key: string]: { count: number; revenue: number; category: string } } = {};
    
    procedures.forEach((procedure: any) => {
      if (procedure.status === 'completed' && procedure.procedureTypeId) {
        const procedureType = procedureTypes.find((pt: any) => 
          pt._id === procedure.procedureTypeId._id || pt._id === procedure.procedureTypeId
        );
        
        if (procedureType) {
          const typeName = procedureType.name;
          const category = procedureType.category || 'Outros';
          const cost = Number(procedure.cost) || Number(procedureType.price) || 0;
          
          if (!typeCount[typeName]) {
            typeCount[typeName] = { count: 0, revenue: 0, category };
          }
          
          typeCount[typeName].count += 1;
          typeCount[typeName].revenue += cost;
        }
      }
    });
    
    return Object.entries(typeCount).map(([name, data]) => ({ 
      name, 
      value: data.revenue, 
      count: data.count,
      category: data.category
    }));
  };

  // Generate transaction type analysis
  const generateTransactionTypeData = () => {
    if (!transactions || !Array.isArray(transactions) || !transactionTypes || !Array.isArray(transactionTypes)) return { income: [], expense: [] };
    
    const incomeData: { [key: string]: number } = {};
    const expenseData: { [key: string]: number } = {};
    
    transactions.forEach((transaction: any) => {
      if (transaction.status === 'paid' && transaction.transactionTypeId) {
        const transactionType = transactionTypes.find((tt: any) => 
          tt._id === transaction.transactionTypeId._id || tt._id === transaction.transactionTypeId
        );
        
        if (transactionType) {
          const amount = Number(transaction.amount) || 0;
          const typeName = transactionType.name;
          
          if (transactionType.category === 'income') {
            incomeData[typeName] = (incomeData[typeName] || 0) + amount;
          } else if (transactionType.category === 'expense') {
            expenseData[typeName] = (expenseData[typeName] || 0) + amount;
          }
        }
      }
    });
    
    return {
      income: Object.entries(incomeData).map(([name, value]) => ({ name, value })),
      expense: Object.entries(expenseData).map(([name, value]) => ({ name, value }))
    };
  };

  // Generate category analysis
  const generateCategoryAnalysis = () => {
    if (!procedures || !Array.isArray(procedures) || !procedureTypes || !Array.isArray(procedureTypes)) return [];
    
    const categoryData: { [key: string]: { count: number; revenue: number } } = {};
    
    procedures.forEach((procedure: any) => {
      if (procedure.status === 'completed' && procedure.procedureTypeId) {
        const procedureType = procedureTypes.find((pt: any) => 
          pt._id === procedure.procedureTypeId._id || pt._id === procedure.procedureTypeId
        );
        
        if (procedureType) {
          const category = procedureType.category || 'Outros';
          const cost = Number(procedure.cost) || Number(procedureType.price) || 0;
          
          if (!categoryData[category]) {
            categoryData[category] = { count: 0, revenue: 0 };
          }
          
          categoryData[category].count += 1;
          categoryData[category].revenue += cost;
        }
      }
    });
    
    return Object.entries(categoryData).map(([name, data]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value: data.revenue, 
      count: data.count 
    }));
  };

  // Generate financial summary
  const generateFinancialSummary = () => {
    if (!transactions || !Array.isArray(transactions) || !transactionTypes || !Array.isArray(transactionTypes)) return { totalIncome: 0, totalExpense: 0, netProfit: 0 };
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach((transaction: any) => {
      if (transaction.status === 'paid' && transaction.transactionTypeId) {
        const transactionType = transactionTypes.find((tt: any) => 
          tt._id === transaction.transactionTypeId._id || tt._id === transaction.transactionTypeId
        );
        
        if (transactionType) {
          const amount = Number(transaction.amount) || 0;
          
          if (transactionType.category === 'income') {
            totalIncome += amount;
          } else if (transactionType.category === 'expense') {
            totalExpense += amount;
          }
        }
      }
    });
    
    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense
    };
  };

  // Generate monthly comparison data
  const generateMonthlyData = () => {
    if (!transactions || !Array.isArray(transactions)) return [];
    
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthRevenue = transactions
        .filter((t: any) => {
          const tDate = new Date(t.transactionDate);
          return t.status === 'paid' && tDate >= monthStart && tDate <= monthEnd;
        })
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      
      data.push({
        month: format(date, 'MMM yyyy'),
        revenue: monthRevenue
      });
    }
    
    return data;
  };

  const revenueData = generateRevenueData();
  const procedureTypeData = generateProcedureTypeData();
  const monthlyData = generateMonthlyData();
  const transactionTypeData = generateTransactionTypeData();
  const categoryData = generateCategoryAnalysis();
  const financialSummary = generateFinancialSummary();

  const COLORS = ['hsl(221, 83%, 53%)', 'hsl(160, 60%, 45%)', 'hsl(30, 80%, 55%)', 'hsl(280, 65%, 60%)', 'hsl(340, 75%, 55%)'];

  const exportData = () => {
    // Simple CSV export
    const csvData = revenueData.map(item => `${item.date},${item.revenue}`).join('\n');
    const blob = new Blob([`Data,Receita\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="Relatórios e Análises" 
          subtitle="Visualize relatórios detalhados e análises financeiras"
        />

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar tipo de relatório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Relatório de Receitas</SelectItem>
                <SelectItem value="procedures">Análise de Procedimentos</SelectItem>
                <SelectItem value="transactions">Análise de Transações</SelectItem>
                <SelectItem value="categories">Análise por Categorias</SelectItem>
                <SelectItem value="financial">Resumo Financeiro</SelectItem>
                <SelectItem value="monthly">Comparação Mensal</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receitas Totais</p>
                  <p className="text-2xl font-bold text-green-600">
                    {financialSummary.totalIncome.toFixed(2)} AOA
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Despesas Totais</p>
                  <p className="text-2xl font-bold text-red-600">
                    {financialSummary.totalExpense.toFixed(2)} AOA
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lucro Líquido</p>
                  <p className={`text-2xl font-bold ${
                    financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {financialSummary.netProfit.toFixed(2)} AOA
                  </p>
                </div>
                <DollarSign className={`h-8 w-8 ${
                  financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Pacientes</p>
                  <p className="text-2xl font-bold">{(patients && Array.isArray(patients)) ? patients.length : 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Consultas</p>
                  <p className="text-2xl font-bold">{(appointments && Array.isArray(appointments)) ? appointments.length : 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Procedimentos</p>
                  <p className="text-2xl font-bold">
                    {(procedures && Array.isArray(procedures)) ? procedures.filter((p: any) => p.status === 'completed').length : 0}
                  </p>
                </div>
                <Stethoscope className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          {reportType === "revenue" && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Receita ao Longo do Tempo</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} AOA`, 'Receita']} />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(221, 83%, 53%)" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(221, 83%, 53%)' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Procedure Types Chart */}
          {reportType === "procedures" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Stethoscope className="h-5 w-5" />
                    <span>Receita por Tipo de Procedimento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={procedureTypeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {procedureTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${Number(value).toFixed(2)} AOA`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhamento de Procedimentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {procedureTypeData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <Badge variant="outline" className="ml-2">{item.category}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{Number(item.value).toFixed(2)} AOA</div>
                          <div className="text-sm text-muted-foreground">{item.count} procedimentos</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Transaction Types Analysis */}
          {reportType === "transactions" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>Receitas por Tipo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={transactionTypeData.income}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} AOA`, 'Receita']} />
                        <Bar dataKey="value" fill="hsl(160, 60%, 45%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-red-600" />
                    <span>Despesas por Tipo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={transactionTypeData.expense}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} AOA`, 'Despesa']} />
                        <Bar dataKey="value" fill="hsl(340, 75%, 55%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Categories Analysis */}
          {reportType === "categories" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChartIcon className="h-5 w-5" />
                    <span>Receita por Categoria de Procedimento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${Number(value).toFixed(2)} AOA`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Análise Detalhada por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{Number(item.value).toFixed(2)} AOA</div>
                          <div className="text-sm text-muted-foreground">{item.count} procedimentos</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Financial Summary */}
          {reportType === "financial" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Fluxo de Caixa</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                        <div className="text-2xl font-bold text-green-600">
                          {financialSummary.totalIncome.toFixed(2)} AOA
                        </div>
                        <div className="text-sm text-green-600">Total de Receitas</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                        <div className="text-2xl font-bold text-red-600">
                          {financialSummary.totalExpense.toFixed(2)} AOA
                        </div>
                        <div className="text-sm text-red-600">Total de Despesas</div>
                      </div>
                      <div className={`text-center p-4 rounded-lg border ${
                        financialSummary.netProfit >= 0 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className={`text-2xl font-bold ${
                          financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {financialSummary.netProfit.toFixed(2)} AOA
                        </div>
                        <div className={`text-sm ${
                          financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Lucro Líquido
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-semibold mb-4">Margem de Lucro</h4>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className={`h-4 rounded-full ${
                            financialSummary.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${Math.min(Math.abs((financialSummary.netProfit / financialSummary.totalIncome) * 100), 100)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {financialSummary.totalIncome > 0 
                          ? `${((financialSummary.netProfit / financialSummary.totalIncome) * 100).toFixed(1)}%`
                          : '0%'
                        } de margem
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Transações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-green-600 mb-2">Principais Receitas</h5>
                        <div className="space-y-2">
                          {transactionTypeData.income.slice(0, 3).map((item, index) => (
                            <div key={item.name} className="flex justify-between text-sm">
                              <span>{item.name}</span>
                              <span className="font-medium">{Number(item.value).toFixed(2)} AOA</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-red-600 mb-2">Principais Despesas</h5>
                        <div className="space-y-2">
                          {transactionTypeData.expense.slice(0, 3).map((item, index) => (
                            <div key={item.name} className="flex justify-between text-sm">
                              <span>{item.name}</span>
                              <span className="font-medium">{Number(item.value).toFixed(2)} AOA</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Monthly Comparison Chart */}
          {reportType === "monthly" && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Comparação de Receita Mensal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} AOA`, 'Receita']} />
                      <Bar dataKey="revenue" fill="hsl(221, 83%, 53%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
