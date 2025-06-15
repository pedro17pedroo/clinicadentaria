import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Plus, Edit, Trash2, Stethoscope, Activity, Users, DollarSign, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Componente para lista de permissões com expansão
interface PermissionsListProps {
  permissions: string[];
}

const PermissionsList: React.FC<PermissionsListProps> = ({ permissions }) => {
  const [showAll, setShowAll] = useState(false);
  const maxVisible = 5;
  
  const permissionLabels: Record<string, string> = {
    'admin.access': 'Acesso de Administrador',
    'users.read': 'Visualizar Utilizadores',
    'users.write': 'Criar/Editar Utilizadores',
    'users.delete': 'Eliminar Utilizadores',
    'patients.read': 'Visualizar Pacientes',
    'patients.write': 'Criar/Editar Pacientes',
    'patients.delete': 'Eliminar Pacientes',
    'appointments.read': 'Visualizar Consultas',
    'appointments.write': 'Criar/Editar Consultas',
    'appointments.delete': 'Eliminar Consultas',
    'procedures.read': 'Visualizar Procedimentos',
    'procedures.write': 'Criar/Editar Procedimentos',
    'procedures.delete': 'Eliminar Procedimentos',
    'transactions.read': 'Visualizar Transações',
    'transactions.write': 'Criar/Editar Transações',
    'transactions.delete': 'Eliminar Transações',
    'reports.read': 'Visualizar Relatórios',
    'settings.read': 'Visualizar Configurações',
    'settings.write': 'Editar Configurações',
  };

  if (!Array.isArray(permissions) || permissions.length === 0) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-muted-foreground">Nenhuma permissão configurada</span>
        </div>
      </div>
    );
  }

  const visiblePermissions = showAll ? permissions : permissions.slice(0, maxVisible);
  const hasMore = permissions.length > maxVisible;

  return (
    <div className="space-y-2 text-sm">
      {visiblePermissions.map((permission: string, index: number) => (
        <div key={index} className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>{permissionLabels[permission] || permission}</span>
        </div>
      ))}
      
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="h-auto p-1 text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-3 w-3" />
              <span>Ver menos</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              <span>Ver mais ({permissions.length - maxVisible})</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
};

const consultationTypeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  price: z.string().min(1, "Preço é obrigatório"),
  description: z.string().optional(),
});

const procedureTypeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  price: z.string().min(1, "Preço é obrigatório"),
  category: z.string().optional(),
  description: z.string().optional(),
});

const transactionTypeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.enum(["income", "expense"], { required_error: "Categoria é obrigatória" }),
  description: z.string().optional(),
});

const userTypeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  userType: z.enum(['admin', 'employee', 'doctor']).default('employee'),
  permissions: z.array(z.string()).default([]),
});

type ConsultationTypeFormData = z.infer<typeof consultationTypeSchema>;
type ProcedureTypeFormData = z.infer<typeof procedureTypeSchema>;
type TransactionTypeFormData = z.infer<typeof transactionTypeSchema>;
type UserTypeFormData = z.infer<typeof userTypeSchema>;

export default function SystemConfig() {
  const [activeTab, setActiveTab] = useState("consultations");
  const [isConsultationDialogOpen, setIsConsultationDialogOpen] = useState(false);
  const [isProcedureDialogOpen, setIsProcedureDialogOpen] = useState(false);
  const [isTransactionTypeDialogOpen, setIsTransactionTypeDialogOpen] = useState(false);
  const [isUserTypeDialogOpen, setIsUserTypeDialogOpen] = useState(false);
  const [editingConsultationType, setEditingConsultationType] = useState<any>(null);
  const [editingProcedureType, setEditingProcedureType] = useState<any>(null);
  const [editingTransactionType, setEditingTransactionType] = useState<any>(null);
  const [editingUserType, setEditingUserType] = useState<any>(null);
  const { toast } = useToast();

  const { data: consultationTypes } = useQuery({
    queryKey: ["/api/consultation-types"],
  });

  const { data: procedureTypes } = useQuery({
    queryKey: ["/api/procedure-types"],
  });

  const { data: transactionTypes } = useQuery({
    queryKey: ["/api/transaction-types"],
  });

  const { data: userTypeConfigs = [], refetch: refetchUserTypes } = useQuery({
    queryKey: ["/api/user-type-configs"],
    queryFn: async () => {
      const response = await fetch('/api/user-type-configs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Falha ao buscar configurações de tipos de utilizador');
      return response.json();
    }
  });

  const consultationForm = useForm<ConsultationTypeFormData>({
    resolver: zodResolver(consultationTypeSchema),
    defaultValues: {
      name: "",
      price: "",
      description: "",
    },
  });

  const procedureForm = useForm<ProcedureTypeFormData>({
    resolver: zodResolver(procedureTypeSchema),
    defaultValues: {
      name: "",
      price: "",
      description: "",
    },
  });

  const transactionTypeForm = useForm<TransactionTypeFormData>({
    resolver: zodResolver(transactionTypeSchema),
    defaultValues: {
      name: "",
      category: "income" as const,
      description: "",
    },
  });

  const userTypeForm = useForm<UserTypeFormData>({
    resolver: zodResolver(userTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      userType: "employee" as const,
      permissions: [],
    },
  });

  const createConsultationTypeMutation = useMutation({
    mutationFn: async (data: ConsultationTypeFormData) => {
      await apiRequest("POST", "/api/consultation-types", {
        ...data,
        price: parseFloat(data.price),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultation-types"] });
      toast({
        title: "Sucesso",
        description: "Tipo de consulta criado com sucesso",
      });
      consultationForm.reset();
      setIsConsultationDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateConsultationTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ConsultationTypeFormData }) => {
      await apiRequest("PUT", `/api/consultation-types/${id}`, {
        ...data,
        price: parseFloat(data.price),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultation-types"] });
      toast({
        title: "Sucesso",
        description: "Tipo de consulta atualizado com sucesso",
      });
      consultationForm.reset();
      setEditingConsultationType(null);
      setIsConsultationDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteConsultationTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/consultation-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultation-types"] });
      toast({
        title: "Sucesso",
        description: "Tipo de consulta eliminado com sucesso",
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

  const createProcedureTypeMutation = useMutation({
    mutationFn: async (data: ProcedureTypeFormData) => {
      await apiRequest("POST", "/api/procedure-types", {
        ...data,
        price: parseFloat(data.price),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procedure-types"] });
      toast({
        title: "Sucesso",
        description: "Tipo de procedimento criado com sucesso",
      });
      procedureForm.reset();
      setIsProcedureDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProcedureTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProcedureTypeFormData }) => {
      await apiRequest("PUT", `/api/procedure-types/${id}`, {
        ...data,
        price: parseFloat(data.price),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procedure-types"] });
      toast({
        title: "Sucesso",
        description: "Tipo de procedimento atualizado com sucesso",
      });
      procedureForm.reset();
      setEditingProcedureType(null);
      setIsProcedureDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProcedureTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/procedure-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procedure-types"] });
      toast({
        title: "Sucesso",
        description: "Tipo de procedimento eliminado com sucesso",
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

  // Transaction Type Mutations
  const createTransactionTypeMutation = useMutation({
    mutationFn: async (data: TransactionTypeFormData) => {
      await apiRequest("POST", "/api/transaction-types", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transaction-types"] });
      toast({
        title: "Sucesso",
        description: "Tipo de transação criado com sucesso",
      });
      transactionTypeForm.reset();
      setIsTransactionTypeDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTransactionTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TransactionTypeFormData }) => {
      await apiRequest("PUT", `/api/transaction-types/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transaction-types"] });
      toast({
        title: "Sucesso",
        description: "Tipo de transação atualizado com sucesso",
      });
      transactionTypeForm.reset();
      setEditingTransactionType(null);
      setIsTransactionTypeDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTransactionTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/transaction-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transaction-types"] });
      toast({
        title: "Sucesso",
        description: "Tipo de transação eliminado com sucesso",
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

  // User Type Mutations
  const createUserTypeMutation = useMutation({
    mutationFn: async (data: UserTypeFormData) => {
      const response = await fetch('/api/user-type-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Falha ao criar tipo de utilizador');
      return response.json();
    },
    onSuccess: () => {
      refetchUserTypes();
      handleUserTypeDialogChange(false);
      toast({
        title: "Sucesso",
        description: "Tipo de utilizador criado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar tipo de utilizador",
        variant: "destructive",
      });
    },
  });

  const updateUserTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UserTypeFormData }) => {
      const response = await fetch(`/api/user-type-configs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Falha ao atualizar tipo de utilizador');
      return response.json();
    },
    onSuccess: () => {
      refetchUserTypes();
      handleUserTypeDialogChange(false);
      toast({
        title: "Sucesso",
        description: "Tipo de utilizador atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar tipo de utilizador",
        variant: "destructive",
      });
    },
  });

  const deleteUserTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/user-type-configs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Falha ao eliminar tipo de utilizador');
    },
    onSuccess: () => {
      refetchUserTypes();
      toast({
        title: "Sucesso",
        description: "Tipo de utilizador eliminado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao eliminar tipo de utilizador",
        variant: "destructive",
      });
    },
  });

  const onSubmitConsultationType = (data: ConsultationTypeFormData) => {
    if (editingConsultationType) {
      updateConsultationTypeMutation.mutate({ id: editingConsultationType._id, data });
    } else {
      createConsultationTypeMutation.mutate(data);
    }
  };

  const handleEditConsultationType = (consultationType: any) => {
    setEditingConsultationType(consultationType);
    consultationForm.setValue("name", consultationType.name);
    consultationForm.setValue("price", consultationType.price.toString());
    consultationForm.setValue("description", consultationType.description || "");
    setIsConsultationDialogOpen(true);
  };

  const handleDeleteConsultationType = (id: string) => {
    if (window.confirm("Tem a certeza que deseja eliminar este tipo de consulta?")) {
      deleteConsultationTypeMutation.mutate(id);
    }
  };

  const handleCloseConsultationDialog = () => {
    setIsConsultationDialogOpen(false);
    setEditingConsultationType(null);
    consultationForm.reset();
  };

  const handleConsultationDialogChange = (open: boolean) => {
    setIsConsultationDialogOpen(open);
    if (!open) {
      setEditingConsultationType(null);
      consultationForm.reset();
    }
  };

  const onSubmitProcedureType = (data: ProcedureTypeFormData) => {
    if (editingProcedureType) {
      updateProcedureTypeMutation.mutate({ id: editingProcedureType._id, data });
    } else {
      createProcedureTypeMutation.mutate(data);
    }
  };

  const onSubmitTransactionType = (data: TransactionTypeFormData) => {
    if (editingTransactionType) {
      updateTransactionTypeMutation.mutate({ id: editingTransactionType._id, data });
    } else {
      createTransactionTypeMutation.mutate(data);
    }
  };

  const handleEditTransactionType = (transactionType: any) => {
    setEditingTransactionType(transactionType);
    transactionTypeForm.setValue("name", transactionType.name);
    transactionTypeForm.setValue("category", transactionType.category);
    transactionTypeForm.setValue("description", transactionType.description || "");
    setIsTransactionTypeDialogOpen(true);
  };

  const handleDeleteTransactionType = (id: string) => {
    if (window.confirm("Tem a certeza que deseja eliminar este tipo de transação?")) {
      deleteTransactionTypeMutation.mutate(id);
    }
  };

  const handleTransactionTypeDialogChange = (open: boolean) => {
    setIsTransactionTypeDialogOpen(open);
    if (!open) {
      setEditingTransactionType(null);
      transactionTypeForm.reset();
    }
  };

  const onSubmitUserType = (data: UserTypeFormData) => {
    if (editingUserType) {
      updateUserTypeMutation.mutate({ id: editingUserType._id, data });
    } else {
      createUserTypeMutation.mutate(data);
    }
  };

  const handleEditUserType = (userType: any) => {
    setEditingUserType(userType);
    userTypeForm.reset({
      name: userType.name,
      description: userType.description || '',
      userType: userType.userType || 'employee',
      permissions: Array.isArray(userType.permissions) ? userType.permissions : []
    });
    setIsUserTypeDialogOpen(true);
  };

  const handleUserTypeDialogChange = (open: boolean) => {
    setIsUserTypeDialogOpen(open);
    if (!open) {
      setEditingUserType(null);
      userTypeForm.reset({
        name: "",
        description: "",
        userType: "employee" as const,
        permissions: [],
      });
    }
  };

  const handleDeleteUserType = (id: string) => {
    if (confirm('Tem certeza que deseja eliminar este tipo de utilizador?')) {
      deleteUserTypeMutation.mutate(id);
    }
  };

  const handleEditProcedureType = (procedureType: any) => {
    setEditingProcedureType(procedureType);
    procedureForm.setValue("name", procedureType.name);
    procedureForm.setValue("price", procedureType.price.toString());
    procedureForm.setValue("category", procedureType.category || "");
    procedureForm.setValue("description", procedureType.description || "");
    setIsProcedureDialogOpen(true);
  };

  const handleDeleteProcedureType = (id: string) => {
    if (window.confirm("Tem a certeza que deseja eliminar este tipo de procedimento?")) {
      deleteProcedureTypeMutation.mutate(id);
    }
  };

  const handleProcedureDialogChange = (open: boolean) => {
    setIsProcedureDialogOpen(open);
    if (!open) {
      setEditingProcedureType(null);
      procedureForm.reset();
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="Configuração do Sistema" 
          subtitle="Configure tipos de consulta, procedimentos e definições do sistema"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="consultations" className="flex items-center space-x-2">
              <Stethoscope className="h-4 w-4" />
              <span>Consultas</span>
            </TabsTrigger>
            <TabsTrigger value="procedures" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Procedimentos</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Transações</span>
            </TabsTrigger>
            <TabsTrigger value="user-types" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Tipos de Utilizador</span>
            </TabsTrigger>
          </TabsList>

          {/* Consultation Types Tab */}
          <TabsContent value="consultations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Stethoscope className="h-5 w-5" />
                    <span>Tipos de Consulta</span>
                  </CardTitle>
                  <Dialog open={isConsultationDialogOpen} onOpenChange={handleConsultationDialogChange}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Tipo de Consulta
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingConsultationType ? "Editar Tipo de Consulta" : "Adicionar Novo Tipo de Consulta"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingConsultationType ? "Modifique os detalhes do tipo de consulta abaixo." : "Crie um novo tipo de consulta preenchendo o formulário abaixo."}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...consultationForm}>
                        <form onSubmit={consultationForm.handleSubmit(onSubmitConsultationType)} className="space-y-4">
                          <FormField
                            control={consultationForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome da Consulta</FormLabel>
                                <FormControl>
                                  <Input placeholder="ex: Limpeza Dentária, Canal Radicular" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={consultationForm.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preço (AOA)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0,00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={consultationForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Descrição da consulta..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={handleCloseConsultationDialog}>
                              Cancelar
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createConsultationTypeMutation.isPending || updateConsultationTypeMutation.isPending}
                            >
                              {editingConsultationType ? "Atualizar Tipo de Consulta" : "Adicionar Tipo de Consulta"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {consultationTypes?.map((type: any) => (
                    <Card key={type._id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{type.name}</h3>
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditConsultationType(type)}
                              title="Editar tipo de consulta"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteConsultationType(type._id)}
                              title="Eliminar tipo de consulta"
                              disabled={deleteConsultationTypeMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Badge variant="secondary" className="flex items-center w-fit">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ${Number(type.price).toFixed(2)}
                          </Badge>
                          {type.description && (
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Procedure Types Tab */}
          <TabsContent value="procedures">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Tipos de Procedimento</span>
                  </CardTitle>
                  <Dialog open={isProcedureDialogOpen} onOpenChange={handleProcedureDialogChange}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Tipo Procedimento
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingProcedureType ? "Editar Tipo de Procedimento" : "Adicionar Novo Tipo de Procedimento"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingProcedureType 
                            ? "Atualize as informações do tipo de procedimento abaixo." 
                            : "Preencha os detalhes para criar um novo tipo de procedimento."}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...procedureForm}>
                        <form onSubmit={procedureForm.handleSubmit(onSubmitProcedureType)} className="space-y-4">
                          <FormField
                            control={procedureForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome do Procedimento</FormLabel>
                                <FormControl>
                                  <Input placeholder="ex: Obturação, Extração" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={procedureForm.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Preço (AOA)</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="0.01" placeholder="0,00" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={procedureForm.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Categoria</FormLabel>
                                  <FormControl>
                                    <Input placeholder="ex: Restaurativo, Cirúrgico" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={procedureForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Descrição do procedimento..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsProcedureDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={createProcedureTypeMutation.isPending || updateProcedureTypeMutation.isPending}>
                              {editingProcedureType ? "Atualizar Tipo de Procedimento" : "Adicionar Tipo de Procedimento"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {procedureTypes?.map((type: any) => (
                    <Card key={type._id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{type.name}</h3>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline" onClick={() => handleEditProcedureType(type)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteProcedureType(type._id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {Number(type.price).toFixed(2)} AOA
                            </Badge>
                            {type.category && (
                              <Badge variant="outline">{type.category}</Badge>
                            )}
                          </div>
                          {type.description && (
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transaction Types Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Tipos de Transação</span>
                  </CardTitle>
                  <Dialog open={isTransactionTypeDialogOpen} onOpenChange={handleTransactionTypeDialogChange}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Tipo de Transação
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingTransactionType ? "Editar Tipo de Transação" : "Adicionar Novo Tipo de Transação"}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...transactionTypeForm}>
                        <form onSubmit={transactionTypeForm.handleSubmit(onSubmitTransactionType)} className="space-y-4">
                          <FormField
                            control={transactionTypeForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nome do tipo de transação..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={transactionTypeForm.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione a categoria" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="income">
                                      <div className="flex items-center space-x-2">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        <span>Receita</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="expense">
                                      <div className="flex items-center space-x-2">
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                        <span>Despesa</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={transactionTypeForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Descrição do tipo de transação..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => handleTransactionTypeDialogChange(false)}>
                              Cancelar
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createTransactionTypeMutation.isPending || updateTransactionTypeMutation.isPending}
                            >
                              {editingTransactionType ? "Atualizar Tipo de Transação" : "Adicionar Tipo de Transação"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {transactionTypes?.map((type: any) => (
                    <Card key={type._id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {type.category === "income" ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <h3 className="font-semibold text-foreground">{type.name}</h3>
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditTransactionType(type)}
                              title="Editar tipo de transação"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteTransactionType(type._id)}
                              title="Eliminar tipo de transação"
                              disabled={deleteTransactionTypeMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Badge 
                            variant={type.category === "income" ? "default" : "destructive"}
                            className="flex items-center w-fit"
                          >
                            {type.category === "income" ? "Receita" : "Despesa"}
                          </Badge>
                          {type.description && (
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Types Tab */}
          <TabsContent value="user-types">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Configurações de Tipos de Utilizador</span>
                  </CardTitle>
                  <Dialog open={isUserTypeDialogOpen} onOpenChange={handleUserTypeDialogChange}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingUserType(null);
                        userTypeForm.reset({
                          name: "",
                          description: "",
                          userType: "employee" as const,
                          permissions: [],
                        });
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Tipo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>
                          {editingUserType ? 'Editar Tipo de Utilizador' : 'Criar Novo Tipo de Utilizador'}
                        </DialogTitle>
                        <DialogDescription>
                          Configure as permissões e detalhes do tipo de utilizador.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...userTypeForm}>
                        <form onSubmit={userTypeForm.handleSubmit(onSubmitUserType)} className="space-y-4">
                          <FormField
                            control={userTypeForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome do Tipo</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Recepcionista" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={userTypeForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Descrição do tipo de utilizador" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={userTypeForm.control}
                            name="userType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipo de Utilizador</FormLabel>
                                <FormControl>
                                  <select {...field} className="w-full p-2 border border-gray-300 rounded-md">
                                    <option value="employee">Funcionário</option>
                                    <option value="doctor">Médico</option>
                                    <option value="admin">Administrador</option>
                                  </select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Permissões</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {Object.entries({
                                'admin.access': 'Acesso de Administrador',
                                'users.read': 'Visualizar Utilizadores',
                                'users.write': 'Criar/Editar Utilizadores',
                                'users.delete': 'Eliminar Utilizadores',
                                'patients.read': 'Visualizar Pacientes',
                                'patients.write': 'Criar/Editar Pacientes',
                                'patients.delete': 'Eliminar Pacientes',
                                'appointments.read': 'Visualizar Consultas',
                                'appointments.write': 'Criar/Editar Consultas',
                                'appointments.delete': 'Eliminar Consultas',
                                'procedures.read': 'Visualizar Procedimentos',
                                'procedures.write': 'Criar/Editar Procedimentos',
                                'procedures.delete': 'Eliminar Procedimentos',
                                'transactions.read': 'Visualizar Transações',
                                'transactions.write': 'Criar/Editar Transações',
                                'transactions.delete': 'Eliminar Transações',
                                'reports.read': 'Visualizar Relatórios',
                                'settings.read': 'Visualizar Configurações',
                                'settings.write': 'Editar Configurações',
                              }).map(([permissionKey, permissionLabel]) => {
                                const watchedPermissions = userTypeForm.watch('permissions') || [];
                                const isChecked = Array.isArray(watchedPermissions) 
                                  ? watchedPermissions.includes(permissionKey)
                                  : false;
                                
                                return (
                                  <div key={permissionKey} className="flex flex-row items-center space-x-3 space-y-0">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const currentPermissions = userTypeForm.getValues('permissions') || [];
                                        const updatedPermissions = Array.isArray(currentPermissions) 
                                          ? [...currentPermissions] 
                                          : [];
                                        
                                        if (e.target.checked) {
                                          if (!updatedPermissions.includes(permissionKey)) {
                                            updatedPermissions.push(permissionKey);
                                          }
                                        } else {
                                          const index = updatedPermissions.indexOf(permissionKey);
                                          if (index > -1) {
                                            updatedPermissions.splice(index, 1);
                                          }
                                        }
                                        
                                        userTypeForm.setValue('permissions', updatedPermissions);
                                      }}
                                      className="h-4 w-4"
                                    />
                                    <label className="text-sm font-normal cursor-pointer">
                                      {permissionLabel}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsUserTypeDialogOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button type="submit">
                              {editingUserType ? 'Atualizar' : 'Criar'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userTypeConfigs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum tipo de utilizador configurado
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userTypeConfigs.map((userType: any) => (
                        <Card key={userType._id} className="border-2">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-foreground">{userType.name}</h3>
                                  <p className="text-xs text-muted-foreground">
                                    {userType.description || 'Sem descrição'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUserType(userType)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUserType(userType._id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <PermissionsList permissions={Array.isArray(userType.permissions) ? userType.permissions : []} />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
