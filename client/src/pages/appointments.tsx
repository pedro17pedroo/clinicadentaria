import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Plus, Edit, CheckCircle, Activity, X, FileText } from "lucide-react";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { ProcedureForm } from "@/components/forms/procedure-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Banknote, Smartphone } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Appointments() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProcedureOpen, setIsProcedureOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [consultationPrice, setConsultationPrice] = useState(0);
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["/api/appointments", { date: selectedDate }],
  });

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: consultationTypes } = useQuery({
    queryKey: ["/api/consultation-types"],
  });

  const { data: doctors } = useQuery({
    queryKey: ["/api/users", { userType: "doctor" }],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users?userType=doctor");
      return response;
    },
  });

  const { data: transactionTypes } = useQuery({
    queryKey: ["/api/transaction-types"],
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PUT", `/api/appointments/${id}`, data);
    },
    onSuccess: () => {
      // Invalidar todas as queries de appointments
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      // Forçar refetch da query atual
      queryClient.refetchQueries({ queryKey: ["/api/appointments", { date: selectedDate }] });
      // Forçar refetch sem filtros também
      queryClient.refetchQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Sucesso",
        description: "Consulta atualizada com sucesso",
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

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      await apiRequest("POST", "/api/transactions", transactionData);
    },
    onSuccess: () => {
      // Invalidar queries de transações e appointments
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      // Forçar refetch da query atual de appointments
      queryClient.refetchQueries({ queryKey: ["/api/appointments", { date: selectedDate }] });
      toast({
        title: "Sucesso",
        description: "Transação criada com sucesso",
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

  const handleCompleteAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    // Buscar o preço do tipo de consulta
    const consultationType = typeof appointment.consultationTypeId === 'object' 
      ? appointment.consultationTypeId 
      : Array.isArray(consultationTypes) ? consultationTypes.find((ct: any) => 
          ct.id === appointment.consultationTypeId || 
          ct._id === appointment.consultationTypeId || 
          ct._id?.toString() === appointment.consultationTypeId?.toString()
        ) : null;
    setConsultationPrice(consultationType?.price || 0);
    setAmountPaid('');
    setPaymentMethod('cash');
    setIsPaymentOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedAppointment) return;

    const paidAmount = parseFloat(amountPaid) || consultationPrice;
    const change = paymentMethod === 'cash' ? Math.max(0, paidAmount - consultationPrice) : 0;

    try {
      // Primeiro, completar o agendamento e registrar no histórico médico
      const currentDate = new Date();
      const consultationRecord = `Consulta realizada em ${currentDate.toLocaleDateString('pt-AO')} às ${currentDate.toLocaleTimeString('pt-AO')}. Tipo: ${getConsultationTypeName(selectedAppointment.consultationTypeId)}. Médico: ${getDoctorName(selectedAppointment.doctorId)}. Pagamento: ${paymentMethod === 'cash' ? 'Dinheiro' : paymentMethod === 'card' ? 'Cartão' : 'Transferência'} - ${consultationPrice.toFixed(2)} Kz${change > 0 ? ` (Troco: ${change.toFixed(2)} Kz)` : ''}.`;
      
      const updatedAppointment = await updateAppointmentMutation.mutateAsync({
        id: selectedAppointment.id || selectedAppointment._id,
        data: { 
          status: "completed",
          notes: selectedAppointment.notes ? `${selectedAppointment.notes}\n\n${consultationRecord}` : consultationRecord
        }
      });
      
      console.log('Appointment updated successfully:', updatedAppointment);

      // Buscar o tipo de transação "Pagamento de Consulta"
      const consultationTransactionType = Array.isArray(transactionTypes) ? transactionTypes.find((tt: any) => 
        tt.name === 'Pagamento de Consulta' || tt.category === 'income'
      ) : null;

      if (!consultationTransactionType) {
        throw new Error('Tipo de transação não encontrado');
      }

      // Depois, criar a transação financeira
      // Status: 'paid' para dinheiro, 'pending' para cartão e transferência
      const transactionStatus = paymentMethod === 'cash' ? 'paid' : 'pending';
      const currentDateISO = new Date().toISOString();
      const transactionData = {
        transactionTypeId: consultationTransactionType._id || consultationTransactionType.id,
        amount: consultationPrice,
        description: `Pagamento de consulta - ${getPatientName(selectedAppointment.patientId)}`,
        status: transactionStatus,
        transactionDate: currentDateISO,
        // paidDate apenas para pagamentos em dinheiro (já pagos)
        ...(paymentMethod === 'cash' && { paidDate: currentDateISO }),
        patientId: typeof selectedAppointment.patientId === 'object' 
          ? selectedAppointment.patientId._id || selectedAppointment.patientId.id
          : selectedAppointment.patientId,
        appointmentId: selectedAppointment.id || selectedAppointment._id,
        ...(paymentMethod === 'cash' && paidAmount > consultationPrice && {
          description: `Pagamento de consulta - ${getPatientName(selectedAppointment.patientId)} (Valor pago: ${paidAmount.toFixed(2)} Kz, Troco: ${change.toFixed(2)} Kz)`
        })
      };

      await createTransactionMutation.mutateAsync(transactionData);

      // Forçar atualização imediata dos dados
      await queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/appointments", { date: selectedDate }] });
      
      setIsPaymentOpen(false);
      toast({
        title: "Sucesso",
        description: `Consulta concluída e pagamento registrado${change > 0 ? `. Troco: ${change.toFixed(2)} Kz` : ''}`,
      });
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    }
  };

  const handleRecordProcedures = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsProcedureOpen(true);
  };

  const handleCancelAppointment = async (appointment: any) => {
    try {
      await updateAppointmentMutation.mutateAsync({
        id: appointment.id || appointment._id,
        data: { status: "cancelled" }
      });
      toast({
        title: "Sucesso",
        description: "Consulta cancelada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao cancelar consulta:', error);
    }
  };

  const handleEditAppointment = (appointment: any) => {
    console.log('handleEditAppointment called with:', appointment);
    setSelectedAppointment(appointment);
    setIsEditOpen(true);
  };

  const handleViewMedicalNotes = (appointment: any) => {
    // Implementar visualização de notas médicas
    toast({
      title: "Notas Médicas",
      description: appointment.notes || "Nenhuma nota médica disponível",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getPatientName = (patientId: any) => {
    if (!patientId) return "Paciente Desconhecido";
    
    // Se patientId já é um objeto populado (vem do populate do MongoDB)
    if (typeof patientId === 'object' && patientId.name) {
      return patientId.name;
    }
    
    // Se patientId é um ID, buscar nos dados dos pacientes
    if (!Array.isArray(patients)) return "Paciente Desconhecido";
    
    const patient = patients.find((p: any) => {
      return p.id === patientId || p._id === patientId || p._id?.toString() === patientId?.toString();
    });
    
    if (!patient) return "Paciente Desconhecido";
    return patient.name || "Paciente Desconhecido";
  };

  const getConsultationTypeName = (consultationTypeId: any) => {
    if (!consultationTypeId) return "Tipo Desconhecido";
    
    // Se consultationTypeId já é um objeto populado
    if (typeof consultationTypeId === 'object' && consultationTypeId.name) {
      return consultationTypeId.name;
    }
    
    // Se consultationTypeId é um ID, buscar nos dados dos tipos de consulta
    if (!Array.isArray(consultationTypes)) return "Tipo Desconhecido";
    
    const consultationType = consultationTypes.find((ct: any) => {
      return ct.id === consultationTypeId || ct._id === consultationTypeId || ct._id?.toString() === consultationTypeId?.toString();
    });
    
    if (!consultationType) return "Tipo Desconhecido";
    return consultationType.name || "Tipo Desconhecido";
  };

  const getDoctorName = (doctorId: any) => {
    if (!doctorId) return "Médico Desconhecido";
    
    // Se doctorId já é um objeto populado
    if (typeof doctorId === 'object' && (doctorId.firstName || doctorId.name)) {
      return doctorId.firstName ? `${doctorId.firstName} ${doctorId.lastName || ''}`.trim() : doctorId.name;
    }
    
    // Se doctorId é um ID, buscar nos dados dos médicos
    if (!Array.isArray(doctors)) return "Médico Desconhecido";
    
    const doctor = doctors.find((d: any) => {
      return d.id === doctorId || d._id === doctorId || d._id?.toString() === doctorId?.toString();
    });
    
    if (!doctor) return "Médico Desconhecido";
     return doctor.firstName ? `${doctor.firstName} ${doctor.lastName || ''}`.trim() : doctor.name || "Médico Desconhecido";
   };

  const getConsultationType = (consultationTypeId: any) => {
    if (!consultationTypeId) return "Tipo Desconhecido";
    
    // Se consultationTypeId já é um objeto populado (vem do populate do MongoDB)
    if (typeof consultationTypeId === 'object' && consultationTypeId.name) {
      return consultationTypeId.name;
    }
    
    // Se consultationTypeId é um ID, buscar nos dados dos tipos de consulta
    if (!Array.isArray(consultationTypes)) return "Tipo Desconhecido";
    
    const consultationType = consultationTypes.find((ct: any) => {
      return ct.id === consultationTypeId || ct._id === consultationTypeId || ct._id?.toString() === consultationTypeId?.toString();
    });
    
    return consultationType?.name || "Tipo Desconhecido";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="Consultas" 
          subtitle="Gerencie a agenda de consultas da sua clínica"
        />

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
              />
            </div>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Consulta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agendar Nova Consulta</DialogTitle>
                <DialogDescription>
                  Preencha os dados abaixo para agendar uma nova consulta.
                </DialogDescription>
              </DialogHeader>
              <AppointmentForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Consultas para {format(new Date(selectedDate), 'MMMM d, yyyy')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={`loading-skeleton-${i}`} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : Array.isArray(appointments) && appointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma consulta agendada para esta data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(appointments as any[] || []).map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">
                          {format(new Date(`2000-01-01T${appointment.time}`), 'h:mm')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(`2000-01-01T${appointment.time}`), 'a')}
                        </p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <p className="font-semibold">{getPatientName(appointment.patientId)}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {getConsultationType(appointment.consultationTypeId)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getDoctorName(appointment.doctorId)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(appointment.status)}>
                        {getStatusText(appointment.status)}
                      </Badge>
                      <div className="flex space-x-2">
                        {/* Botões para consultas agendadas */}
                        {appointment.status === "scheduled" && (
                          <>
                            <Button
                              key={`complete-${appointment.id}`}
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteAppointment(appointment)}
                              disabled={updateAppointmentMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Concluir
                            </Button>
                            <Button
                              key={`edit-${appointment.id}`}
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditAppointment(appointment)}
                              disabled={updateAppointmentMutation.isPending}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              key={`cancel-${appointment.id}`}
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelAppointment(appointment)}
                              disabled={updateAppointmentMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </>
                        )}
                        
                        {/* Botões para consultas concluídas */}
                        {appointment.status === "completed" && (
                          <>
                            <Button
                              key={`notes-${appointment.id}`}
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewMedicalNotes(appointment)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Notas Médicas
                            </Button>
                            <Button
                              key={`procedures-${appointment.id}`}
                              size="sm"
                              variant="outline"
                              onClick={() => handleRecordProcedures(appointment)}
                            >
                              <Activity className="h-4 w-4 mr-1" />
                              Registar Procedimentos
                            </Button>
                          </>
                        )}
                        
                        {/* Consultas canceladas não têm botões */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Procedure Recording Dialog */}
        <Dialog open={isProcedureOpen} onOpenChange={setIsProcedureOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Registar Procedimentos da Consulta</DialogTitle>
              <DialogDescription>
                Registe os procedimentos realizados durante esta consulta.
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <ProcedureForm 
                appointmentId={selectedAppointment.id || selectedAppointment._id}
                patientId={(() => {
                  const patientId = selectedAppointment.patientId;
                  // Se é um objeto populado, extrair o _id
                  if (typeof patientId === 'object' && patientId !== null) {
                    return patientId._id?.toString() || patientId.id?.toString() || '';
                  }
                  // Se é uma string, retornar diretamente
                  return patientId?.toString() || '';
                })()}
                onSuccess={() => setIsProcedureOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Processar Pagamento</DialogTitle>
              <DialogDescription>
                Confirme o pagamento da consulta para concluir o atendimento.
              </DialogDescription>
            </DialogHeader>
            
            {selectedAppointment && (
              <div className="space-y-6">
                {/* Informações da Consulta */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Detalhes da Consulta</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Paciente:</span> {getPatientName(selectedAppointment.patientId)}</p>
                    <p><span className="font-medium">Tipo:</span> {getConsultationType(selectedAppointment.consultationTypeId)}</p>
                    <p><span className="font-medium">Médico:</span> {getDoctorName(selectedAppointment.doctorId)}</p>
                    <p><span className="font-medium">Valor:</span> {consultationPrice.toFixed(2)} Kz</p>
                  </div>
                </div>

                {/* Método de Pagamento */}
                <div className="space-y-3">
                  <Label htmlFor="payment-method">Método de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={(value: 'cash' | 'card' | 'transfer') => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        <div className="flex items-center space-x-2">
                          <Banknote className="h-4 w-4" />
                          <span>Dinheiro</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="card">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Cartão</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="transfer">
                        <div className="flex items-center space-x-2">
                          <Smartphone className="h-4 w-4" />
                          <span>Transferência</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Valor Pago (apenas para dinheiro) */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-3">
                    <Label htmlFor="amount-paid">Valor Recebido (Kz)</Label>
                    <Input
                      id="amount-paid"
                      type="number"
                      step="0.01"
                      min={consultationPrice}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder={consultationPrice.toFixed(2)}
                    />
                    {parseFloat(amountPaid) > consultationPrice && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Troco: {(parseFloat(amountPaid) - consultationPrice).toFixed(2)} Kz
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Botões */}
                <div className="flex space-x-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPaymentOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleProcessPayment}
                    disabled={createTransactionMutation.isPending || updateAppointmentMutation.isPending}
                    className="flex-1"
                  >
                    {createTransactionMutation.isPending || updateAppointmentMutation.isPending ? 'Processando...' : 'Confirmar Pagamento'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Appointment Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Consulta</DialogTitle>
              <DialogDescription>
                Modifique os detalhes da consulta agendada.
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <AppointmentForm
                appointment={selectedAppointment}
                onSuccess={() => {
                  setIsEditOpen(false);
                  setSelectedAppointment(null);
                }}
                onCancel={() => {
                  setIsEditOpen(false);
                  setSelectedAppointment(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
