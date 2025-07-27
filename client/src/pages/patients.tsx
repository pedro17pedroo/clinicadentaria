import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Plus, Phone, Mail, MapPin, Calendar, Trash2 } from "lucide-react";
import { PatientForm } from "@/components/forms/patient-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useLocation } from "wouter";

export default function Patients() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: patients, isLoading } = useQuery({
    queryKey: ["/api/patients", { search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      const url = `/api/patients${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest("GET", url);
      return await response.json();
    },
  });

  // Verificar se o utilizador tem permissão para eliminar pacientes
  const canDeletePatients = (user as any)?.userType === 'admin' || 
    ((user as any)?.permissions && (user as any).permissions.includes('patients.delete'));

  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      await apiRequest("DELETE", `/api/patients/${patientId}`);
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas com pacientes
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Sucesso",
        description: "Paciente eliminado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao eliminar paciente",
        variant: "destructive",
      });
    },
  });

  const handleDeletePatient = (patient: any) => {
    if (window.confirm(`Tem certeza que deseja eliminar o paciente ${patient.name}?\n\nEsta ação não pode ser desfeita.`)) {
      deletePatientMutation.mutate(patient._id);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="Pacientes" 
          subtitle="Gerencie os registos e informações dos pacientes da sua clínica"
        />

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar pacientes por nome ou DI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Paciente</DialogTitle>
                <DialogDescription>
                  Adicione um novo paciente ao sistema preenchendo as informações abaixo.
                </DialogDescription>
              </DialogHeader>
              <PatientForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : patients?.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum paciente encontrado</p>
              {searchQuery && (
                <p className="text-sm">Tente ajustar os termos de pesquisa</p>
              )}
            </div>
          ) : (
            patients?.map((patient: any) => (
              <Card key={patient._id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{patient.name}</CardTitle>
                      {patient.di && <p className="text-sm text-muted-foreground">DI: {patient.di}</p>}
                    </div>
                    <Badge variant="secondary">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(patient.createdAt), 'MMM yyyy')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{patient.address}</span>
                    </div>
                  )}
                  {patient.notes && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-md">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {patient.notes}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/patients/${patient._id}/history`)}
                    >
                      Ver Histórico
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setEditingPatient(patient);
                        setIsEditOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    {canDeletePatients && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeletePatient(patient)}
                        disabled={deletePatientMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Paciente</DialogTitle>
              <DialogDescription>
                Atualize as informações do paciente abaixo.
              </DialogDescription>
            </DialogHeader>
            {editingPatient && (
              <PatientForm 
                onSuccess={() => {
                  setIsEditOpen(false);
                  setEditingPatient(null);
                }}
                initialData={{
                  name: editingPatient.name,
                  di: editingPatient.di,
                  nif: editingPatient.nif,
                  phone: editingPatient.phone,
                  email: editingPatient.email,
                  address: editingPatient.address,
                  notes: editingPatient.notes,
                }}
                isEditing={true}
                patientId={editingPatient._id}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}