import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Download, TrendingUp, Users, Calendar, DollarSign } from "lucide-react";
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

  // Generate revenue chart data
  const generateRevenueData = () => {
    if (!transactions) return [];
    
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

  // Generate procedure type distribution
  const generateProcedureTypeData = () => {
    if (!transactions || !consultationTypes) return [];
    
    const typeRevenue: { [key: string]: number } = {};
    
    transactions.forEach((t: any) => {
      if (t.status === 'paid' && t.type === 'consultation') {
        const consultationType = consultationTypes.find((ct: any) => ct.name === t.description?.replace('Consultation: ', ''));
        const typeName = consultationType?.name || 'Other';
        typeRevenue[typeName] = (typeRevenue[typeName] || 0) + Number(t.amount);
      }
    });
    
    return Object.entries(typeRevenue).map(([name, value]) => ({ name, value }));
  };

  // Generate monthly comparison data
  const generateMonthlyData = () => {
    if (!transactions) return [];
    
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

  const COLORS = ['hsl(221, 83%, 53%)', 'hsl(160, 60%, 45%)', 'hsl(30, 80%, 55%)', 'hsl(280, 65%, 60%)', 'hsl(340, 75%, 55%)'];

  const exportData = () => {
    // Simple CSV export
    const csvData = revenueData.map(item => `${item.date},${item.revenue}`).join('\n');
    const blob = new Blob([`Date,Revenue\n${csvData}`], { type: 'text/csv' });
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
          title="Reports & Analytics" 
          subtitle="View detailed reports and financial analytics"
        />

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue Report</SelectItem>
                <SelectItem value="procedures">Procedure Analysis</SelectItem>
                <SelectItem value="monthly">Monthly Comparison</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ${transactions?.filter((t: any) => t.status === 'paid')
                      .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
                      .toFixed(2) || '0.00'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                  <p className="text-2xl font-bold">{patients?.length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
                  <p className="text-2xl font-bold">{appointments?.length || 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Revenue/Day</p>
                  <p className="text-2xl font-bold">
                    ${(revenueData.reduce((sum, item) => sum + item.revenue, 0) / revenueData.length || 0).toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
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
                  <span>Revenue Over Time</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
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
                  <CardTitle>Revenue by Procedure Type</CardTitle>
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
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Procedure Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {procedureTypeData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="font-bold">${Number(item.value).toFixed(2)}</span>
                      </div>
                    ))}
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
                  <span>Monthly Revenue Comparison</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
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
