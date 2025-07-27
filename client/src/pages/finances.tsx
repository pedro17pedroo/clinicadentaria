import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, User, Calendar, Plus, ChevronLeft, ChevronRight, X, Eye, FileText, CreditCard } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { TransactionForm } from "@/components/forms/transaction-form";

export default function Finances() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const itemsPerPageOptions = [5, 10, 20, 50];
  const { toast } = useToast();

  // Query para transações paginadas
  const { data: transactionData, isLoading } = useQuery({
    queryKey: ["/api/transactions", statusFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      const url = `/api/transactions?${params.toString()}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
  
  // Query separada para todas as transações (para cálculo dos totais dos cards)
  const { data: allTransactionsData } = useQuery({
    queryKey: ["/api/transactions", "all"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/transactions?limit=10000"); // Buscar todas as transações
      return response.json();
    },
  });
  
  const transactions = transactionData?.transactions || [];
  const totalPages = transactionData?.totalPages || 1;
  const totalTransactions = transactionData?.total || 0;
  const allTransactions = allTransactionsData?.transactions || [];
  
  // Reset page when filter changes
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients"],
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PUT", `/api/transactions/${id}`, data);
    },
    onSuccess: () => {
      // Invalidar todas as queries de transações para atualizar tanto a lista paginada quanto os totais
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

  // Mutation para anular transação paga
  const cancelTransactionMutation = useMutation({
    mutationFn: async ({ id, cancellationReason }: { id: string; cancellationReason: string }) => {
      const response = await apiRequest("PATCH", `/api/transactions/${id}/cancel`, {
        cancellationReason
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", "all"] });
      setIsCancelDialogOpen(false);
      setTransactionToCancel(null);
      setCancellationReason("");
      toast({
        title: "Sucesso",
        description: "Transação anulada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao anular transação",
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
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "paid":
        return "Pago";
      case "overdue":
        return "Em Atraso";
      case "cancelled":
        return "Anulado";
      default:
        return status;
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
      case "cancelled":
        return <X className="h-4 w-4" />;
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

  const handleCancelTransaction = (transactionId: string) => {
    setTransactionToCancel(transactionId);
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancellation = () => {
    if (!transactionToCancel || !cancellationReason.trim()) {
      toast({
        title: "Erro",
        description: "Motivo do anulamento é obrigatório",
        variant: "destructive",
      });
      return;
    }

    cancelTransactionMutation.mutate({
      id: transactionToCancel,
      cancellationReason: cancellationReason.trim()
    });
  };

  const handleCloseCancelDialog = () => {
    setIsCancelDialogOpen(false);
    setTransactionToCancel(null);
    setCancellationReason("");
  };

  const handleViewDetails = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setIsDetailsDialogOpen(false);
    setSelectedTransaction(null);
  };

  // Calculate totals with income/expense separation usando TODAS as transações
  const totals = Array.isArray(allTransactions) ? allTransactions.reduce((acc: any, transaction: any) => {
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
    if (transaction.status === 'cancelled') acc.cancelled += amount;
    
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
    overdue: 0,
    cancelled: 0 
  }) : { 
    totalIncome: 0, 
    totalExpense: 0, 
    netTotal: 0,
    totalTransactions: 0,
    pending: 0, 
    paid: 0, 
    overdue: 0,
    cancelled: 0 
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
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

          {/* Anulado */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Anulado</p>
                  <p className="text-xl font-bold text-gray-600">{totals.cancelled.toFixed(2)} AOA</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex items-center justify-center">
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
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
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Transações</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Em Atraso</SelectItem>
                    <SelectItem value="cancelled">Anulado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {totalTransactions > 0 && (
                  <>Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalTransactions)} de {totalTransactions} transações</>
                )}
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Itens por página:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {itemsPerPageOptions.map((option) => (
                      <SelectItem key={option} value={option.toString()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
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
              <>
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
                            {getStatusText(transaction.status)}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(transaction)}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Ver Detalhes</span>
                          </Button>
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
                          {transaction.status === "paid" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelTransaction(transaction._id || transaction.id)}
                              disabled={cancelTransactionMutation.isPending}
                            >
                              Anular Transação
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
                
                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="flex items-center space-x-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Anterior</span>
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Página {currentPage} de {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="flex items-center space-x-1"
                        >
                          <span>Próxima</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex justify-center">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                            
                            {/* Mostrar páginas com ellipsis para muitas páginas */}
                            {totalPages <= 7 ? (
                              // Mostrar todas as páginas se forem 7 ou menos
                              Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(page)}
                                    isActive={currentPage === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              ))
                            ) : (
                              // Mostrar páginas com ellipsis
                              <>
                                {/* Primeira página */}
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(1)}
                                    isActive={currentPage === 1}
                                    className="cursor-pointer"
                                  >
                                    1
                                  </PaginationLink>
                                </PaginationItem>
                                
                                {/* Ellipsis esquerda */}
                                {currentPage > 3 && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                
                                {/* Páginas ao redor da atual */}
                                {Array.from({ length: 3 }, (_, i) => currentPage - 1 + i)
                                  .filter(page => page > 1 && page < totalPages)
                                  .map((page) => (
                                    <PaginationItem key={page}>
                                      <PaginationLink
                                        onClick={() => setCurrentPage(page)}
                                        isActive={currentPage === page}
                                        className="cursor-pointer"
                                      >
                                        {page}
                                      </PaginationLink>
                                    </PaginationItem>
                                  ))
                                }
                                
                                {/* Ellipsis direita */}
                                {currentPage < totalPages - 2 && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                
                                {/* Última página */}
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(totalPages)}
                                    isActive={currentPage === totalPages}
                                    className="cursor-pointer"
                                  >
                                    {totalPages}
                                  </PaginationLink>
                                </PaginationItem>
                              </>
                            )}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal de Anulação */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Anular Transação</DialogTitle>
            <DialogDescription>
              Por favor, informe o motivo para anular esta transação. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cancellation-reason">Motivo do Cancelamento *</Label>
              <Textarea
                id="cancellation-reason"
                placeholder="Descreva o motivo para anular esta transação..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseCancelDialog}
              disabled={cancelTransactionMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmCancellation}
              disabled={cancelTransactionMutation.isPending || !cancellationReason.trim()}
            >
              {cancelTransactionMutation.isPending ? "Anulando..." : "Anular Transação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Transação */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Detalhes da Transação</span>
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre esta transação financeira.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="grid gap-6 py-4">
              {/* Informações Básicas */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Informações Básicas</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                    <p className="text-sm font-medium">{selectedTransaction.description}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Valor</Label>
                    <p className={`text-sm font-bold ${
                      selectedTransaction.transactionTypeId?.category === 'income' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {selectedTransaction.transactionTypeId?.category === 'income' ? '+' : '-'}
                      {Number(selectedTransaction.amount).toFixed(2)} AOA
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge className={getStatusColor(selectedTransaction.status)}>
                      {getStatusText(selectedTransaction.status)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Categoria</Label>
                    <Badge variant={selectedTransaction.transactionTypeId?.category === 'income' ? "default" : "destructive"}>
                      {selectedTransaction.transactionTypeId?.category === 'income' ? 'Receita' : 'Despesa'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Informações do Paciente */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Paciente</span>
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                    <p className="text-sm font-medium">{getPatientName(selectedTransaction.patientId)}</p>
                  </div>
                </div>
              </div>

              {/* Informações de Data */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Datas</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data da Transação</Label>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedTransaction.transactionDate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  {selectedTransaction.dueDate && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Data de Vencimento</Label>
                      <p className="text-sm font-medium">
                        {format(new Date(selectedTransaction.dueDate), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.paidDate && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Data de Pagamento</Label>
                      <p className="text-sm font-medium">
                        {format(new Date(selectedTransaction.paidDate), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.cancelledDate && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Data de Cancelamento</Label>
                      <p className="text-sm font-medium">
                        {format(new Date(selectedTransaction.cancelledDate), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tipo de Transação */}
              {selectedTransaction.transactionTypeId?.name && (
                <div className="grid gap-4">
                  <h3 className="text-lg font-semibold">Tipo de Transação</h3>
                  <div>
                    <Badge variant="outline" className="capitalize">
                      {selectedTransaction.transactionTypeId.name}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Motivo de Cancelamento */}
              {selectedTransaction.status === 'cancelled' && selectedTransaction.cancellationReason && (
                <div className="grid gap-4">
                  <h3 className="text-lg font-semibold text-red-600">Motivo do Cancelamento</h3>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{selectedTransaction.cancellationReason}</p>
                  </div>
                </div>
              )}

              {/* Observações */}
              {selectedTransaction.notes && (
                <div className="grid gap-4">
                  <h3 className="text-lg font-semibold">Observações</h3>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-sm text-gray-700">{selectedTransaction.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDetailsDialog}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
