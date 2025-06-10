import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, User, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Finances() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions", statusFilter !== "all" ? { status: statusFilter } : {}],
  });

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PUT", `/api/transactions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Transaction status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getPatientName = (patientId: number) => {
    const patient = patients?.find((p: any) => p.id === patientId);
    return patient?.name || "Unknown Patient";
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

  const handleStatusUpdate = (transactionId: number, newStatus: string) => {
    updateTransactionMutation.mutate({
      id: transactionId,
      data: { status: newStatus }
    });
  };

  // Calculate totals
  const totals = transactions?.reduce((acc: any, transaction: any) => {
    const amount = Number(transaction.amount);
    acc.total += amount;
    if (transaction.status === 'pending') acc.pending += amount;
    if (transaction.status === 'paid') acc.paid += amount;
    if (transaction.status === 'overdue') acc.overdue += amount;
    return acc;
  }, { total: 0, pending: 0, paid: 0, overdue: 0 }) || { total: 0, pending: 0, paid: 0, overdue: 0 };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="Financial Management" 
          subtitle="Track payments, transactions, and revenue"
        />

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${totals.total.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold text-green-600">${totals.paid.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">${totals.pending.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">${totals.overdue.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
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
                <span>Transactions</span>
              </CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : transactions?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions?.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-semibold">{transaction.description}</p>
                          <Badge variant="outline" className="capitalize">
                            {transaction.type}
                          </Badge>
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
                        <p className="text-lg font-bold">${Number(transaction.amount).toFixed(2)}</p>
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
                              onClick={() => handleStatusUpdate(transaction.id, "paid")}
                              disabled={updateTransactionMutation.isPending}
                            >
                              Mark Paid
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(transaction.id, "overdue")}
                              disabled={updateTransactionMutation.isPending}
                            >
                              Mark Overdue
                            </Button>
                          </>
                        )}
                        {transaction.status === "overdue" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(transaction.id, "paid")}
                            disabled={updateTransactionMutation.isPending}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
