import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog, Users, Shield, Mail, Calendar, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
// Removida importação de USER_TYPES pois agora carregamos da base de dados

export default function UserManagement() {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userType: '',
    password: ''
  });
  const [editUserData, setEditUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userType: ''
  });

  // Fetch users from API
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return response.json();
    },
  });

  // Fetch user types from API
  const { data: userTypes = [] } = useQuery({
    queryKey: ['user-types'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user-type-configs');
      return response.json();
    },
  });

  const updateUserTypeMutation = useMutation({
    mutationFn: async ({ userId, userType }: { userId: string; userType: string }) => {
      await apiRequest("PUT", `/api/users/${userId}/type`, { userType });
    },
    onSuccess: () => {
      // Invalidate and refetch users query
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "User type updated successfully",
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

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserData) => {
      const response = await apiRequest('POST', '/api/users', userData);
      if (!response.ok) {
        const errorData = await response.json();
        
        // Tratamento específico para erro de email duplicado
        if (response.status === 409) {
          throw new Error('Email já está em uso');
        }
        
        throw new Error(errorData.message || 'Erro ao criar utilizador');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalOpen(false);
      setNewUserData({
        firstName: '',
        lastName: '',
        email: '',
        userType: '',
        password: ''
      });
      toast({
        title: "Sucesso",
        description: "Utilizador criado com sucesso",
      });
    },
    onError: (error: any) => {
      let errorMessage = "Erro ao criar utilizador";
      
      if (error.message) {
        // Verificar se é erro de email duplicado
        if (error.message.includes('Email já está em uso') || 
            error.message.includes('duplicate key') || 
            error.message.includes('email') && error.message.includes('409')) {
          errorMessage = "Este email já está registado no sistema. Por favor, utilize um email diferente.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleUserTypeChange = async (userId: string, userTypeName: string) => {
    const mappedUserType = mapUserTypeToBackend(userTypeName);
    updateUserTypeMutation.mutate({ userId, userType: mappedUserType });
  };

  // Mutação para ativar/desativar utilizador
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/users/${userId}/status`, { isActive });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao alterar status do utilizador');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Sucesso",
        description: "Status do utilizador alterado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar status do utilizador",
        variant: "destructive",
      });
    },
  });

  const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  // Mutação para editar utilizador
  const editUserMutation = useMutation({
    mutationFn: async (userData: { userId: string; data: typeof editUserData }) => {
      const response = await apiRequest('PUT', `/api/users/${userData.userId}`, userData.data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao editar utilizador');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditModalOpen(false);
      setEditingUser(null);
      setEditUserData({
        firstName: '',
        lastName: '',
        email: '',
        userType: ''
      });
      toast({
        title: "Sucesso",
        description: "Utilizador editado com sucesso",
      });
    },
    onError: (error: any) => {
      let errorMessage = "Erro ao editar utilizador";
      
      if (error.message) {
        if (error.message.includes('Email já está em uso') || 
            error.message.includes('duplicate key') || 
            error.message.includes('email') && error.message.includes('409')) {
          errorMessage = "Este email já está registado no sistema. Por favor, utilize um email diferente.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditUserData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      userType: user.userType || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editUserData.firstName || !editUserData.lastName || !editUserData.email || !editUserData.userType) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    editUserMutation.mutate({ 
      userId: editingUser._id || editingUser.id, 
      data: editUserData 
    });
  };

  // Mapeamento entre nomes dos tipos de utilizador e valores do backend
  const mapUserTypeToBackend = (userTypeName: string): string => {
    const mapping: Record<string, string> = {
      'Administrador': 'admin',
      'Médico': 'doctor',
      'Funcionário': 'employee',
      'Rececionista': 'employee'
    };
    return mapping[userTypeName] || 'employee';
  };

  const handleCreateUser = () => {
    if (!newUserData.firstName || !newUserData.lastName || !newUserData.email || !newUserData.password || !newUserData.userType) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    // Mapear o tipo de utilizador para o valor esperado pelo backend
    const mappedUserData = {
      ...newUserData,
      userType: mapUserTypeToBackend(newUserData.userType)
    };
    
    createUserMutation.mutate(mappedUserData);
  };

  const handleInputChange = (field: string, value: string) => {
    setNewUserData(prev => ({ ...prev, [field]: value }));
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "doctor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "employee":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case "admin":
        return <Shield className="h-3 w-3 mr-1" />;
      case "doctor":
        return <UserCog className="h-3 w-3 mr-1" />;
      case "employee":
        return <Users className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const getUserInitials = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.slice(0, 2).toUpperCase() || "U";
  };

  const getUserDisplayName = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  const getUserRoleDisplay = (userType: string) => {
    switch (userType) {
      case 'admin':
        return 'Administrador';
      case 'employee':
        return 'Funcionário';
      case 'doctor':
        return 'Médico';
      default:
        return 'Utilizador';
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="Gestão de Utilizadores" 
          subtitle="Gerir contas de utilizadores e permissões"
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Utilizadores</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Utilizadores Ativos</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.isActive).length}
                  </p>
                </div>
                <UserCog className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Administradores</p>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.userType === 'admin').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Utilizadores do Sistema</span>
              </CardTitle>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Novo Utilizador
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Utilizador</DialogTitle>
                    <DialogDescription>
                      Preencha as informações abaixo para criar um novo utilizador no sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="firstName" className="text-right">
                        Nome
                      </Label>
                      <Input
                        id="firstName"
                        value={newUserData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="col-span-3"
                        placeholder="Nome do utilizador"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="lastName" className="text-right">
                        Apelido
                      </Label>
                      <Input
                        id="lastName"
                        value={newUserData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="col-span-3"
                        placeholder="Apelido do utilizador"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUserData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="col-span-3"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUserData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="col-span-3"
                        placeholder="Password segura"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="userType" className="text-right">
                        Tipo
                      </Label>
                      <Select
                        value={newUserData.userType}
                        onValueChange={(value) => handleInputChange('userType', value)}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Selecionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {userTypes.map((userType: any) => (
                            <SelectItem key={userType._id} value={userType.name}>
                              {userType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateUser}
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? "Criando..." : "Criar Utilizador"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Modal de Edição de Utilizador */}
              <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Editar Utilizador</DialogTitle>
                    <DialogDescription>
                      Edite as informações do utilizador selecionado.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-firstName">Nome</Label>
                        <Input
                          id="edit-firstName"
                          value={editUserData.firstName}
                          onChange={(e) => setEditUserData({...editUserData, firstName: e.target.value})}
                          placeholder="Nome"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-lastName">Apelido</Label>
                        <Input
                          id="edit-lastName"
                          value={editUserData.lastName}
                          onChange={(e) => setEditUserData({...editUserData, lastName: e.target.value})}
                          placeholder="Apelido"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editUserData.email}
                        onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-userType">Tipo</Label>
                      <Select
                        value={editUserData.userType}
                        onValueChange={(value) => setEditUserData({...editUserData, userType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="doctor">Médico</SelectItem>
                          <SelectItem value="employee">Funcionário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleUpdateUser}
                      disabled={editUserMutation.isPending}
                    >
                      {editUserMutation.isPending ? "Atualizando..." : "Atualizar Utilizador"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <p>Carregando utilizadores...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <p>Erro ao carregar utilizadores: {error.message}</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <p>Nenhum utilizador encontrado.</p>
                </div>
              ) : (
                users.map((user) => (
                <div
                  key={user._id || user.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.profileImageUrl} alt={getUserDisplayName(user)} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold text-foreground">
                          {getUserDisplayName(user)}
                        </p>
                        <Badge className={getUserTypeColor(user.userType)}>
                          {getUserTypeIcon(user.userType)}
                          {getUserRoleDisplay(user.userType)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Registado em {format(new Date(user.createdAt), 'MMM yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Função:</span>
                      <Select
                        value={userTypes.find((ut: any) => {
                          // Mapear o userType do utilizador para o nome do tipo na base de dados
                          const mappedType = mapUserTypeToBackend(ut.name);
                          return mappedType === user.userType;
                        })?.name || ''}
                        onValueChange={(value) => {
                          handleUserTypeChange(user._id || user.id, value);
                        }}
                        disabled={updateUserTypeMutation.isPending}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {userTypes.map((userType: any) => (
                            <SelectItem key={userType._id} value={userType.name}>
                              {userType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditUser(user)}
                      >
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className={user.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                        onClick={() => handleToggleUserStatus(user._id || user.id, user.isActive)}
                        disabled={toggleUserStatusMutation.isPending}
                      >
                        {toggleUserStatusMutation.isPending ? "Processando..." : (user.isActive ? "Desativar" : "Ativar")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
