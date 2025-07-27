import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Activity, Plus, Calendar, User, DollarSign, FileText, CheckCircle, CreditCard, Banknote, Smartphone, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Filter } from "lucide-react";
import { ProcedureForm } from "@/components/forms/procedure-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Procedures() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [procedureTypeFilter, setProcedureTypeFilter] = useState<string>("all");
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [procedurePrice, setProcedurePrice] = useState(0);
  const { toast } = useToast();
  const itemsPerPageOptions = [5, 10, 20, 50];

  const { data: procedureData, isLoading } = useQuery({
    queryKey: ["/api/procedures", selectedPatient, statusFilter, procedureTypeFilter, doctorFilter, searchTerm, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (selectedPatient !== "all") {
        params.append("patientId", selectedPatient);
      }
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (procedureTypeFilter !== "all") {
        params.append("procedureTypeId", procedureTypeFilter);
      }
      if (doctorFilter !== "all") {
        params.append("doctorId", doctorFilter);
      }
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      
      const url = `/api/procedures?${params.toString()}`;
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
  
  // A API agora retorna um objeto com paginação
  const procedures = procedureData?.procedures || [];
  const totalPages = procedureData?.totalPages || 1;
  const totalProcedures = procedureData?.total || 0;
  
  // Reset page when filters change
  const handleFilterChange = (filterType: string, value: string) => {
    setCurrentPage(1);
    switch (filterType) {
      case 'patient':
        setSelectedPatient(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'procedureType':
        setProcedureTypeFilter(value);
        break;
      case 'doctor':
        setDoctorFilter(value);
        break;
      case 'search':
        setSearchTerm(value);
        break;
    }
  };

  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: procedureTypes = [] } = useQuery({
    queryKey: ["/api/procedure-types"],
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ["/api/doctors"],
  });

  const { data: transactionTypes = [] } = useQuery({
    queryKey: ["/api/transaction-types"],
  });

  // Mutation para atualizar procedimento
  const updateProcedureMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/procedures/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procedures"] });
    },
  });

  // Mutation para criar transação
  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/transactions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });

  // Como os dados vêm populados do backend, podemos acessá-los diretamente
  const getPatientName = (patient: any) => {
    // Se patient é um objeto populado, usar diretamente
    if (typeof patient === 'object' && patient !== null) {
      return patient.name || "Paciente Desconhecido";
    }
    // Fallback: procurar no array de pacientes se for apenas um ID
    if (!Array.isArray(patients)) return "Paciente Desconhecido";
    const foundPatient = patients.find((p: any) => p.id === patient || p._id === patient);
    return foundPatient?.name || "Paciente Desconhecido";
  };

  const getProcedureTypeName = (procedureType: any) => {
    // Se procedureType é um objeto populado, usar diretamente
    if (typeof procedureType === 'object' && procedureType !== null) {
      return procedureType.name || "Procedimento Desconhecido";
    }
    // Fallback: procurar no array de tipos se for apenas um ID
    if (!Array.isArray(procedureTypes)) return "Procedimento Desconhecido";
    const foundType = procedureTypes.find((pt: any) => pt.id === procedureType || pt._id === procedureType);
    return foundType?.name || "Procedimento Desconhecido";
  };

  const getDoctorName = (doctor: any) => {
    // Se doctor é um objeto populado, usar diretamente
    if (typeof doctor === 'object' && doctor !== null) {
      return `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Médico Desconhecido';
    }
    // Fallback: procurar no array de médicos se for apenas um ID
    if (!Array.isArray(doctors)) return 'Médico Desconhecido';
    const foundDoctor = doctors.find((d: any) => d.id === doctor || d._id === doctor);
    return foundDoctor ? `${foundDoctor.firstName || ''} ${foundDoctor.lastName || ''}`.trim() : 'Médico Desconhecido';
  };

  // Função para processar pagamento do procedimento
  const handleProcessPayment = (procedure: any) => {
    setSelectedProcedure(procedure);
    setProcedurePrice(procedure.cost || 0);
    setAmountPaid('');
    setPaymentMethod('cash');
    setIsPaymentOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedProcedure) return;

    const paidAmount = parseFloat(amountPaid) || procedurePrice;
    const change = paymentMethod === 'cash' ? Math.max(0, paidAmount - procedurePrice) : 0;

    try {
      // Primeiro, marcar o procedimento como concluído
      const currentDate = new Date();
      const procedureRecord = `Procedimento concluído em ${currentDate.toLocaleDateString('pt-AO')} às ${currentDate.toLocaleTimeString('pt-AO')}. Tipo: ${getProcedureTypeName(selectedProcedure.procedureTypeId)}. Médico: Dr. ${getDoctorName(selectedProcedure.doctorId)}. Pagamento: ${paymentMethod === 'cash' ? 'Dinheiro' : paymentMethod === 'card' ? 'Cartão' : 'Transferência'} - ${procedurePrice.toFixed(2)} AOA${change > 0 ? ` (Troco: ${change.toFixed(2)} AOA)` : ''}.`;
      
      await updateProcedureMutation.mutateAsync({
        id: selectedProcedure.id || selectedProcedure._id,
        data: { 
          status: "completed",
          notes: selectedProcedure.notes ? `${selectedProcedure.notes}\n\n${procedureRecord}` : procedureRecord
        }
      });

      // Buscar o tipo de transação "Pagamento de Procedimento"
      const procedureTransactionType = Array.isArray(transactionTypes) ? transactionTypes.find((tt: any) => 
        tt.name === 'Pagamento de Procedimento' || 
        tt.name.toLowerCase().includes('procedimento') ||
        (tt.category === 'income' && tt.name.toLowerCase().includes('procedure'))
      ) : null;

      if (!procedureTransactionType) {
        throw new Error('Tipo de transação não encontrado');
      }

      // Criar a transação financeira
      const transactionStatus = paymentMethod === 'cash' ? 'paid' : 'pending';
      const currentDateISO = new Date().toISOString();
      const transactionData = {
        transactionTypeId: procedureTransactionType._id || procedureTransactionType.id,
        amount: procedurePrice,
        description: `Pagamento de procedimento - ${getPatientName(selectedProcedure.patientId)}`,
        status: transactionStatus,
        transactionDate: currentDateISO,
        ...(paymentMethod === 'cash' && { paidDate: currentDateISO }),
        patientId: typeof selectedProcedure.patientId === 'object' 
          ? selectedProcedure.patientId._id || selectedProcedure.patientId.id
          : selectedProcedure.patientId,
        procedureId: selectedProcedure.id || selectedProcedure._id,
        ...(paymentMethod === 'cash' && paidAmount > procedurePrice && {
          description: `Pagamento de procedimento - ${getPatientName(selectedProcedure.patientId)} (Valor pago: ${paidAmount.toFixed(2)} AOA, Troco: ${change.toFixed(2)} AOA)`
        })
      };

      await createTransactionMutation.mutateAsync(transactionData);

      // Atualizar dados
      await queryClient.invalidateQueries({ queryKey: ["/api/procedures"] });
      
      setIsPaymentOpen(false);
      toast({
        title: "Sucesso",
        description: `Procedimento concluído e pagamento registado${change > 0 ? `. Troco: ${change.toFixed(2)} AOA` : ''}`,
      });
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento do procedimento",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="Procedimentos" 
          subtitle="Acompanhe e gira os procedimentos realizados"
        />

        {/* Filtros e Controles */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros e Pesquisa</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
              {/* Pesquisa */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar procedimentos..."
                  value={searchTerm}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filtro por Paciente */}
              <Select value={selectedPatient} onValueChange={(value) => handleFilterChange('patient', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por paciente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Pacientes</SelectItem>
                  {Array.isArray(patients) && patients.map((patient: any) => (
                    patient.id ? (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.name}
                      </SelectItem>
                    ) : null
                  )) || []}
                </SelectContent>
              </Select>
              
              {/* Filtro por Status */}
              <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Em Curso</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Filtro por Tipo de Procedimento */}
              <Select value={procedureTypeFilter} onValueChange={(value) => handleFilterChange('procedureType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de procedimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  {Array.isArray(procedureTypes) && procedureTypes.map((type: any) => (
                    <SelectItem key={type._id || type.id} value={(type._id || type.id).toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Filtro por Médico */}
              <Select value={doctorFilter} onValueChange={(value) => handleFilterChange('doctor', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por médico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Médicos</SelectItem>
                  {Array.isArray(doctors) && doctors.map((doctor: any) => (
                    <SelectItem key={doctor._id || doctor.id} value={(doctor._id || doctor.id).toString()}>
                      Dr. {doctor.firstName} {doctor.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Itens por página */}
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itemsPerPageOptions.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option} por página
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Informações de resultados */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalProcedures > 0 && (
                  <>Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalProcedures)} de {totalProcedures} procedimentos</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-between items-center mb-6">
          <div />
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Registar Procedimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registar Novo Procedimento</DialogTitle>
                <DialogDescription>
                  Registe um novo procedimento médico realizado para um paciente.
                </DialogDescription>
              </DialogHeader>
              <ProcedureForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>

          {/* Dialog para Editar Procedimento */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Procedimento</DialogTitle>
                <DialogDescription>
                  Edite as informações do procedimento selecionado.
                </DialogDescription>
              </DialogHeader>
              {selectedProcedure && (
                <ProcedureForm 
                  initialData={selectedProcedure}
                  onSuccess={() => {
                    setIsEditOpen(false);
                    setSelectedProcedure(null);
                  }} 
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog para Ver Detalhes do Procedimento */}
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detalhes do Procedimento</DialogTitle>
                <DialogDescription>
                  Informações completas sobre o procedimento realizado.
                </DialogDescription>
              </DialogHeader>
              {selectedProcedure && (
                <div className="space-y-6">
                  {/* Informações Principais */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Procedimento</label>
                      <p className="text-lg font-semibold">{getProcedureTypeName(selectedProcedure.procedureTypeId)}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Custo</label>
                      <p className="text-lg font-semibold text-green-600">
                        {Number(selectedProcedure.cost).toFixed(2)} AOA
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Paciente</label>
                      <p className="font-medium">{getPatientName(selectedProcedure.patientId)}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Médico</label>
                      <p className="font-medium">Dr. {getDoctorName(selectedProcedure.doctorId)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Data do Procedimento</label>
                    <p className="font-medium">{format(new Date(selectedProcedure.date), 'dd/MM/yyyy')}</p>
                  </div>

                  {selectedProcedure.notes && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Observações</label>
                      <div className="p-3 bg-muted/50 rounded-md">
                        <p className="text-sm">{selectedProcedure.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Informações de Sistema */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Informações do Sistema</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">ID do Procedimento:</span>
                        <p className="font-mono text-xs">{selectedProcedure._id || selectedProcedure.id}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Criado em:</span>
                        <p>{selectedProcedure.createdAt ? format(new Date(selectedProcedure.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDetailsOpen(false)}
                    >
                      Fechar
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsDetailsOpen(false);
                        setIsEditOpen(true);
                      }}
                    >
                      Editar Procedimento
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (!Array.isArray(procedures) || procedures.length === 0) ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum procedimento registado ainda</p>
            </div>
          ) : (
            Array.isArray(procedures) && procedures.map((procedure: any) => (
              <Card key={procedure.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Activity className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">
                            {getProcedureTypeName(procedure.procedureTypeId)}
                          </h3>
                          <Badge variant="outline">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {Number(procedure.cost).toFixed(2)} AOA
                          </Badge>
                          <Badge 
                            variant={procedure.status === 'completed' ? 'default' : 'secondary'}
                            className={procedure.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}
                          >
                            {procedure.status === 'completed' ? 'Concluído' : 'Em Curso'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{getPatientName(procedure.patientId)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(procedure.date), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>Dr. {getDoctorName(procedure.doctorId)}</span>
                          </div>
                        </div>
                        {procedure.notes && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-md">
                            <div className="flex items-start space-x-2">
                              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <p className="text-sm text-muted-foreground">
                                {procedure.notes}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {procedure.status !== 'completed' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedProcedure(procedure);
                              setIsEditOpen(true);
                            }}
                          >
                            Editar
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleProcessPayment(procedure)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Concluir
                          </Button>
                        </>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedProcedure(procedure);
                          setIsDetailsOpen(true);
                        }}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {/* Paginação */}
        {totalProcedures > 0 && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setCurrentPage(1)}
                     disabled={currentPage === 1}
                   >
                     <ChevronsLeft className="h-4 w-4" />
                   </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setCurrentPage(totalPages)}
                     disabled={currentPage === totalPages}
                   >
                     <ChevronsRight className="h-4 w-4" />
                   </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Ir para:</span>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                      }
                    }}
                    className="w-16 h-8"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Dialog de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Procedimento</DialogTitle>
            <DialogDescription>
              Edite os detalhes do procedimento selecionado.
            </DialogDescription>
          </DialogHeader>
          {selectedProcedure && (
            <ProcedureForm
              onSuccess={() => {
                setIsEditOpen(false);
                setSelectedProcedure(null);
              }}
              appointmentId={selectedProcedure.appointmentId}
              patientId={selectedProcedure.patientId}
              initialData={selectedProcedure}
            />
          )}
        </DialogContent>
      </Dialog>



      {/* Modal de Pagamento */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Processar Pagamento</DialogTitle>
            <DialogDescription>
              Confirme os detalhes do pagamento para concluir o procedimento.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProcedure && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Detalhes do Procedimento</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Paciente:</strong> {getPatientName(selectedProcedure.patientId)}</p>
                  <p><strong>Tipo:</strong> {getProcedureTypeName(selectedProcedure.procedureTypeId)}</p>
                  <p><strong>Médico:</strong> Dr. {getDoctorName(selectedProcedure.doctorId)}</p>
                  <p><strong>Valor:</strong> {procedurePrice.toFixed(2)} AOA</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="payment-method">Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={(value: 'cash' | 'card' | 'transfer') => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center">
                        <Banknote className="h-4 w-4 mr-2" />
                        Dinheiro
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Cartão
                      </div>
                    </SelectItem>
                    <SelectItem value="transfer">
                      <div className="flex items-center">
                        <Smartphone className="h-4 w-4 mr-2" />
                        Transferência
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'cash' && (
                <div className="space-y-2">
                  <Label htmlFor="amount-paid">Valor Recebido (AOA)</Label>
                  <Input
                    id="amount-paid"
                    type="number"
                    step="0.01"
                    min={procedurePrice}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder={procedurePrice.toFixed(2)}
                  />
                  {amountPaid && parseFloat(amountPaid) > procedurePrice && (
                    <p className="text-sm text-green-600">
                      Troco: {(parseFloat(amountPaid) - procedurePrice).toFixed(2)} AOA
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmPayment}>
                  Confirmar Pagamento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
