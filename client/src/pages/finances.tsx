import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, User, Calendar, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { TransactionForm } from "@/components/forms/transaction-form";

export default function Finances() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/transactions", statusFilter !== "all" ? { status: statusFilter } : {}],
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients"],
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PUT", `/api/transactions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Sucesso",
        description: "Status da transação atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getPatientName = (patientId: any) => {
    // Se patientId é um objeto populado, usar o nome diretamente
    if (typeof patientId === 'object' && patientId?.name) {
      return patientId.name;
    }
    // Caso contrário, buscar pelo ID
    const id = typeof patientId === 'object' ? patientId._id || patientId.id : patientId;
    const patient = Array.isArray(patients) ? patients.find((p: any) => (p._id || p.id) === id) : null;
    return patient?.name || "Paciente Desconhecido";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "paid":
        return <CheckCircle className="h-4 w-4" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = (transactionId: string, newStatus: string) => {
    updateTransactionMutation.mutate({
      id: transactionId,
      data: { status: newStatus }
    });
  };

  // Calculate totals with income/expense separation
  const totals = Array.isArray(transactions) ? transactions.reduce((acc: any, transaction: any) => {
    const amount = Number(transaction.amount);
    const isIncome = transaction.transactionTypeId?.category === 'income';
    
    // Total geral (receitas - despesas)
    if (isIncome) {
      acc.totalIncome += amount;
    } else {
      acc.totalExpense += amount;
    }
    acc.netTotal = acc.totalIncome - acc.totalExpense;
    
    // Por status
    if (transaction.status === 'pending') acc.pending += amount;
    if (transaction.status === 'paid') acc.paid += amount;
    if (transaction.status === 'overdue') acc.overdue += amount;
    
    // Total de transações (quantidade)
    acc.totalTransactions += 1;
    
    return acc;
  }, { 
    totalIncome: 0, 
    totalExpense: 0, 
    netTotal: 0,
    totalTransactions: 0,
    pending: 0, 
    paid: 0, 
    overdue: 0 
  }) : { 
    totalIncome: 0, 
    totalExpense: 0, 
    netTotal: 0,
    totalTransactions: 0,
    pending: 0, 
    paid: 0, 
    overdue: 0 
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="Gestão Financeira" 
          subtitle="Acompanhe pagamentos, transações e receitas"
        />

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {/* Total Líquido */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Saldo Líquido</p>
                  <p className={`text-xl font-bold ${
                    totals.netTotal >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {totals.netTotal >= 0 ? '+' : ''}{totals.netTotal.toFixed(2)} AOA
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  totals.netTotal >= 0 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {totals.netTotal >= 0 
                    ? <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    : <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total de Receitas */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Receitas</p>
                  <p className="text-xl font-bold text-green-600">+{totals.totalIncome.toFixed(2)} AOA</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total de Despesas */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Despesas</p>
                  <p className="text-xl font-bold text-red-600">-{totals.totalExpense.toFixed(2)} AOA</p>
                </div>
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pago */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Pago</p>
                  <p className="text-xl font-bold text-green-600">{totals.paid.toFixed(2)} AOA</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pendente */}
           <Card>
             <CardContent className="p-4">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-xs font-medium text-muted-foreground">Pendente</p>
                   <p className="text-xl font-bold text-yellow-600">{totals.pending.toFixed(2)} AOA</p>
                 </div>
                 <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                   <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                 </div>
               </div>
             </CardContent>
           </Card>

           {/* Em Atraso */}
           <Card>
             <CardContent className="p-4">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-xs font-medium text-muted-foreground">Em Atraso</p>
                   <p className="text-xl font-bold text-red-600">{totals.overdue.toFixed(2)} AOA</p>
                 </div>
                 <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                   <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Transações</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Nova Transação</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Registrar Nova Transação</DialogTitle>
                      <DialogDescription>
                        Preencha os dados abaixo para registrar uma nova transação financeira.
                      </DialogDescription>
                    </DialogHeader>
                    <TransactionForm onSuccess={() => setIsTransactionDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Transações</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Em Atraso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : !Array.isArray(transactions) || transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma transação encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(transactions) && transactions.map((transaction: any) => {
                  const isIncome = transaction.transactionTypeId?.category === 'income';
                  const categoryColor = isIncome ? 'border-l-green-500 bg-green-50/50' : 'border-l-red-500 bg-red-50/50';
                  const categoryIcon = isIncome ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />;
                  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
                  const amountPrefix = isIncome ? '+' : '-';
                  
                  return (
                    <div
                      key={transaction._id || transaction.id}
                      className={`flex items-center justify-between p-4 rounded-lg border border-l-4 ${categoryColor}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          {getStatusIcon(transaction.status)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-semibold">{transaction.description}</p>
                            <div className="flex items-center space-x-1">
                              {categoryIcon}
                              <Badge variant={isIncome ? "default" : "destructive"} className="capitalize">
                                {isIncome ? 'Receita' : 'Despesa'}
                              </Badge>
                            </div>
                            {transaction.transactionTypeId?.name && (
                              <Badge variant="outline" className="capitalize">
                                {transaction.transactionTypeId.name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{getPatientName(transaction.patientId)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{format(new Date(transaction.transactionDate), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${amountColor}`}>
                            {amountPrefix}{Number(transaction.amount).toFixed(2)} AOA
                          </p>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          {transaction.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(transaction._id || transaction.id, "paid")}
                                disabled={updateTransactionMutation.isPending}
                              >
                                Marcar como Pago
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusUpdate(transaction._id || transaction.id, "overdue")}
                                disabled={updateTransactionMutation.isPending}
                              >
                                Marcar como Em Atraso
                              </Button>
                            </>
                          )}
                          {transaction.status === "overdue" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(transaction._id || transaction.id, "paid")}
                              disabled={updateTransactionMutation.isPending}
                            >
                              Marcar como Pago
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
