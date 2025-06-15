import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  FileText, 
  Stethoscope,
  CreditCard,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiRequest } from '@/lib/queryClient';

interface Patient {
  _id: string;
  name: string;
  di?: string;
  nif?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

interface Appointment {
  _id: string;
  patientId: string;
  doctorId: {
    firstName: string;
    lastName: string;
  };
  consultationTypeId: {
    name: string;
    price: number;
  };
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface Procedure {
  _id: string;
  patientId: string;
  doctorId: {
    firstName: string;
    lastName: string;
  };
  procedureTypeId: {
    name: string;
    price: number;
    category?: string;
  };
  appointmentId?: string;
  cost: number;
  date: string;
  notes?: string;
}

interface Transaction {
  _id: string;
  patientId?: string;
  appointmentId?: string;
  procedureId?: string;
  transactionTypeId: {
    name: string;
    category: 'income' | 'expense';
  };
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  description?: string;
  transactionDate: string;
  dueDate?: string;
  paidDate?: string;
}

export default function PatientHistory() {
  const params = useParams();
  const [, navigate] = useLocation();
  const patientId = params.id;

  // Buscar dados do paciente
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  // Buscar consultas do paciente
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: [`/api/appointments?patientId=${patientId}`],
    enabled: !!patientId,
  });

  // Buscar procedimentos do paciente
  const { data: procedures, isLoading: proceduresLoading } = useQuery({
    queryKey: [`/api/procedures?patientId=${patientId}`],
    enabled: !!patientId,
  });

  // Buscar transações do paciente
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: [`/api/transactions?patientId=${patientId}`],
    enabled: !!patientId,
  });

  if (patientLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4 w-1/3" />
            <div className="h-4 bg-muted rounded mb-8 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded mb-4" />
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Paciente não encontrado</h2>
            <Button onClick={() => navigate('/patients')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Pacientes
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      // Status de consultas
      scheduled: { label: 'Agendado', variant: 'default' as const },
      completed: { label: 'Concluído', variant: 'default' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
      // Status de transações
      pending: { label: 'Pendente', variant: 'secondary' as const },
      paid: { label: 'Pago', variant: 'default' as const },
      overdue: { label: 'Em Atraso', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, variant: 'default' as const };
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/patients')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Pacientes
          </Button>
          
          <Header 
            title={`Histórico de ${patient.name}`}
            subtitle="Visualize o histórico completo do paciente"
          />
        </div>

        {/* Informações do Paciente */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informações do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p className="font-medium">{patient.name}</p>
              </div>
              {patient.di && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">DI</p>
                  <p className="font-medium">{patient.di}</p>
                </div>
              )}
              {patient.nif && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">NIF</p>
                  <p className="font-medium">{patient.nif}</p>
                </div>
              )}
              {patient.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.address}</span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registado em</p>
                <p className="font-medium">
                  {format(new Date(patient.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
            {patient.notes && (
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Observações</p>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm">{patient.notes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs com histórico */}
        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appointments" className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Consultas
            </TabsTrigger>
            <TabsTrigger value="procedures" className="flex items-center">
              <Stethoscope className="h-4 w-4 mr-2" />
              Procedimentos
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Transações
            </TabsTrigger>
          </TabsList>

          {/* Tab de Consultas */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Consultas</CardTitle>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded mb-2" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : appointments?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma consulta encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments?.map((appointment: Appointment) => (
                      <div key={appointment._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(appointment.date), 'dd/MM/yyyy', { locale: ptBR })} às {appointment.time}
                            </span>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Médico: {appointment.doctorId.firstName} {appointment.doctorId.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Tipo: {appointment.consultationTypeId.name} - {formatCurrency(appointment.consultationTypeId.price)}
                        </p>
                        {appointment.notes && (
                          <p className="text-sm">{appointment.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Procedimentos */}
          <TabsContent value="procedures">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Procedimentos</CardTitle>
              </CardHeader>
              <CardContent>
                {proceduresLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded mb-2" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : procedures?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum procedimento encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {procedures?.map((procedure: Procedure) => (
                      <div key={procedure._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">
                              {procedure.procedureTypeId.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(procedure.date), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                            {procedure.procedureTypeId.category && (
                              <p className="text-xs text-muted-foreground">
                                Categoria: {procedure.procedureTypeId.category}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatCurrency(procedure.cost)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Médico: {procedure.doctorId.firstName} {procedure.doctorId.lastName}
                        </p>
                        {procedure.notes && (
                          <p className="text-sm">{procedure.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Transações */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Histórico Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded mb-2" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : transactions?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma transação encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions?.map((transaction: Transaction) => (
                      <div key={transaction._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">
                              {transaction.description || transaction.transactionTypeId.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(transaction.transactionDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Categoria: {transaction.transactionTypeId.category === 'income' ? 'Receita' : 'Despesa'}
                            </p>
                            {transaction.dueDate && (
                              <p className="text-xs text-muted-foreground">
                                Vencimento: {format(new Date(transaction.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                            )}
                            {transaction.paidDate && (
                              <p className="text-xs text-green-600">
                                Pago em: {format(new Date(transaction.paidDate), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${
                              transaction.transactionTypeId.category === 'income' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {transaction.transactionTypeId.category === 'income' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </p>
                            <div className="space-y-1">
                              {getStatusBadge(transaction.status)}
                              <Badge variant={transaction.transactionTypeId.category === 'income' ? 'default' : 'secondary'}>
                                {transaction.transactionTypeId.category === 'income' ? 'Receita' : 'Despesa'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}