import React, { useState } from 'react';
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { UserCog, Users, Shield, Mail, Calendar, Plus, Clock, Stethoscope, Settings } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Tipos para os dados do médico
interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialties: string[];
  contactInfo?: string;
  isActive: boolean;
  workingDays?: string[];
  workingHours?: {
    start: string;
    end: string;
  };
  consultationTypes?: string[];
  procedureTypes?: string[];
  createdAt: string;
}

interface DoctorSchedule {
  doctorId: string;
  workingDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  dailySchedules: {
    [key: string]: {
      start: string;
      end: string;
      isActive: boolean;
    };
  };
  consultationTypes: string[];
  procedureTypes: string[];
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
];

export default function DoctorManagement() {
  const { toast } = useToast();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSpecialtiesModalOpen, setIsSpecialtiesModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [scheduleData, setScheduleData] = useState<DoctorSchedule>({
    doctorId: '',
    workingDays: [],
    workingHours: { start: '08:00', end: '18:00' },
    dailySchedules: {
      monday: { start: '08:00', end: '18:00', isActive: false },
      tuesday: { start: '08:00', end: '18:00', isActive: false },
      wednesday: { start: '08:00', end: '18:00', isActive: false },
      thursday: { start: '08:00', end: '18:00', isActive: false },
      friday: { start: '08:00', end: '18:00', isActive: false },
      saturday: { start: '08:00', end: '18:00', isActive: false },
      sunday: { start: '08:00', end: '18:00', isActive: false }
    },
    consultationTypes: [],
    procedureTypes: []
  });
  const [newSpecialty, setNewSpecialty] = useState('');

  // Buscar todos os médicos
  const { data: doctors = [], isLoading, error } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users?userType=doctor');
      return response.json();
    },
  });

  // Buscar tipos de consulta
  const { data: consultationTypes = [] } = useQuery({
    queryKey: ['consultation-types'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/consultation-types');
      return response.json();
    },
  });

  // Buscar tipos de procedimento
  const { data: procedureTypes = [] } = useQuery({
    queryKey: ['procedure-types'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/procedure-types');
      return response.json();
    },
  });

  // Mutação para atualizar horários do médico
  const updateScheduleMutation = useMutation({
    mutationFn: async (data: DoctorSchedule) => {
      const response = await apiRequest('PUT', `/api/doctors/${data.doctorId}/schedule`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar horários');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setIsScheduleModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Horários do médico atualizados com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar especialidades
  const updateSpecialtiesMutation = useMutation({
    mutationFn: async ({ doctorId, specialties }: { doctorId: string; specialties: string[] }) => {
      const response = await apiRequest('PUT', `/api/doctors/${doctorId}/specialties`, { specialties });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar especialidades');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setIsSpecialtiesModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Especialidades atualizadas com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para ativar/desativar médico
  const toggleDoctorStatusMutation = useMutation({
    mutationFn: async ({ doctorId, isActive }: { doctorId: string; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/users/${doctorId}/status`, { isActive });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao alterar status do médico');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast({
        title: "Sucesso",
        description: "Status do médico alterado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função para ativar/desativar médico
  const toggleDoctorStatus = (doctorId: string, isActive: boolean) => {
    toggleDoctorStatusMutation.mutate({ doctorId, isActive });
  };

  const handleScheduleDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    
    // Inicializar horários diários baseados nos dados existentes
    const dailySchedules: { [key: string]: { start: string; end: string; isActive: boolean } } = {};
    DAYS_OF_WEEK.forEach(day => {
      const isActive = doctor.workingDays?.includes(day.value) || false;
      dailySchedules[day.value] = {
        start: doctor.workingHours?.start || '08:00',
        end: doctor.workingHours?.end || '18:00',
        isActive
      };
    });
    
    setScheduleData({
      doctorId: doctor._id,
      workingDays: doctor.workingDays || [],
      workingHours: doctor.workingHours || { start: '08:00', end: '18:00' },
      dailySchedules,
      consultationTypes: doctor.consultationTypes || [],
      procedureTypes: doctor.procedureTypes || []
    });
    setIsScheduleModalOpen(true);
  };

  const handleSpecialtiesDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsSpecialtiesModalOpen(true);
  };

  const handleWorkingDayChange = (day: string, checked: boolean) => {
    setScheduleData(prev => ({
      ...prev,
      workingDays: checked 
        ? [...prev.workingDays, day]
        : prev.workingDays.filter(d => d !== day),
      dailySchedules: {
        ...prev.dailySchedules,
        [day]: {
          ...prev.dailySchedules[day],
          isActive: checked
        }
      }
    }));
  };

  const handleDailyScheduleChange = (day: string, field: 'start' | 'end', value: string) => {
    setScheduleData(prev => ({
      ...prev,
      dailySchedules: {
        ...prev.dailySchedules,
        [day]: {
          ...prev.dailySchedules[day],
          [field]: value
        }
      }
    }));
  };

  const handleConsultationTypeChange = (typeId: string, checked: boolean) => {
    setScheduleData(prev => ({
      ...prev,
      consultationTypes: checked 
        ? [...prev.consultationTypes, typeId]
        : prev.consultationTypes.filter(t => t !== typeId)
    }));
  };

  const handleProcedureTypeChange = (typeId: string, checked: boolean) => {
    setScheduleData(prev => ({
      ...prev,
      procedureTypes: checked 
        ? [...prev.procedureTypes, typeId]
        : prev.procedureTypes.filter(t => t !== typeId)
    }));
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && selectedDoctor) {
      const updatedSpecialties = [...(selectedDoctor.specialties || []), newSpecialty.trim()];
      updateSpecialtiesMutation.mutate({
        doctorId: selectedDoctor._id,
        specialties: updatedSpecialties
      });
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (specialtyToRemove: string) => {
    if (selectedDoctor) {
      const updatedSpecialties = selectedDoctor.specialties.filter(s => s !== specialtyToRemove);
      updateSpecialtiesMutation.mutate({
        doctorId: selectedDoctor._id,
        specialties: updatedSpecialties
      });
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName && firstName.length > 0 ? firstName.charAt(0) : '';
    const last = lastName && lastName.length > 0 ? lastName.charAt(0) : '';
    return `${first}${last}`.toUpperCase() || 'NN'; // 'NN' como fallback se ambos estiverem vazios
  };

  const activeDoctors = doctors.filter((doctor: Doctor) => doctor.isActive);
  const inactiveDoctors = doctors.filter((doctor: Doctor) => !doctor.isActive);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          <Header 
            title="Gestão de Médicos" 
            subtitle="Gerir horários, especialidades e disponibilidade dos médicos"
          />
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Carregando médicos...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          <Header 
            title="Gestão de Médicos" 
            subtitle="Gerir horários, especialidades e disponibilidade dos médicos"
          />
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-600">Erro ao carregar médicos</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="Gestão de Médicos" 
          subtitle="Gerir horários, especialidades e disponibilidade dos médicos"
        />

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{doctors.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <UserCog className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ativos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeDoctors.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inativos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{inactiveDoctors.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Médicos */}
        <div className="space-y-4 sm:space-y-6">
          {doctors.map((doctor: Doctor) => (
            <Card key={doctor._id} className="overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  {/* Informações do Médico */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                      <AvatarImage src={`/api/placeholder/64/64`} />
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold">
                        {getInitials(doctor.firstName, doctor.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {doctor.firstName} {doctor.lastName}
                        </h3>
                        <Badge 
                          variant={doctor.isActive ? "default" : "secondary"}
                          className={`w-fit mt-1 sm:mt-0 ${
                            doctor.isActive 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {doctor.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{doctor.email}</span>
                        </div>
                        {doctor.specialties && doctor.specialties.length > 0 && (
                          <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                            <Stethoscope className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {doctor.specialties.map((specialty, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {doctor.workingDays && doctor.workingDays.length > 0 && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">
                              {doctor.workingDays.join(", ")} 
                              {doctor.workingHours && (
                                <span className="ml-1">
                                  ({doctor.workingHours.start} - {doctor.workingHours.end})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:flex-col xl:flex-row">
                    <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleScheduleDoctor(doctor)}
                       className="w-full sm:w-auto lg:w-full xl:w-auto"
                     >
                       <Clock className="h-4 w-4 sm:mr-2" />
                       <span className="hidden sm:inline">Horários</span>
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => {
                         setSelectedDoctor(doctor);
                         setIsSpecialtiesModalOpen(true);
                       }}
                       className="w-full sm:w-auto lg:w-full xl:w-auto"
                     >
                       <Stethoscope className="h-4 w-4 sm:mr-2" />
                       <span className="hidden sm:inline">Especialidades</span>
                     </Button>
                     <Button
                       variant={doctor.isActive ? "destructive" : "default"}
                       size="sm"
                       onClick={() => toggleDoctorStatus(doctor._id, !doctor.isActive)}
                       className="w-full sm:w-auto lg:w-full xl:w-auto"
                     >
                       <Settings className="h-4 w-4 sm:mr-2" />
                       <span className="hidden sm:inline">
                         {doctor.isActive ? "Desativar" : "Ativar"}
                       </span>
                     </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Modal de Horários */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Configurar Horários - Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}
            </DialogTitle>
            <DialogDescription>
              Configure os dias de trabalho, horários e tipos de consulta/procedimento disponíveis para este médico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Dias de Trabalho */}
            <div>
              <Label className="text-base font-medium mb-3 block">Dias de Trabalho</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.value}
                      checked={scheduleData.workingDays.includes(day.value)}
                      onCheckedChange={(checked) => 
                        handleWorkingDayChange(day.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={day.value} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Horários por Dia da Semana */}
            <div>
              <Label className="text-base font-medium mb-3 block">Horários por Dia da Semana</Label>
              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day) => {
                  const isActive = scheduleData.dailySchedules[day.value]?.isActive;
                  return (
                    <div key={day.value} className={`p-4 border rounded-lg ${
                      isActive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="font-medium">{day.label}</Label>
                        <div className="text-sm text-gray-500">
                          {isActive ? 'Ativo' : 'Inativo'}
                        </div>
                      </div>
                      {isActive && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`start-${day.value}`} className="text-sm">Hora de Início</Label>
                            <Input
                              id={`start-${day.value}`}
                              type="time"
                              value={scheduleData.dailySchedules[day.value]?.start || '08:00'}
                              onChange={(e) => handleDailyScheduleChange(day.value, 'start', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`end-${day.value}`} className="text-sm">Hora de Fim</Label>
                            <Input
                              id={`end-${day.value}`}
                              type="time"
                              value={scheduleData.dailySchedules[day.value]?.end || '18:00'}
                              onChange={(e) => handleDailyScheduleChange(day.value, 'end', e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tipos de Consulta */}
            <div>
              <Label className="text-base font-medium mb-3 block">Tipos de Consulta</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                {consultationTypes.map((type: any) => (
                  <div key={type._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`consultation-${type._id}`}
                      checked={scheduleData.consultationTypes.includes(type._id)}
                      onCheckedChange={(checked) => 
                        handleConsultationTypeChange(type._id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`consultation-${type._id}`} className="text-sm">
                      {type.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Tipos de Procedimento */}
            <div>
              <Label className="text-base font-medium mb-3 block">Tipos de Procedimento</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                {procedureTypes.map((type: any) => (
                  <div key={type._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`procedure-${type._id}`}
                      checked={scheduleData.procedureTypes.includes(type._id)}
                      onCheckedChange={(checked) => 
                        handleProcedureTypeChange(type._id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`procedure-${type._id}`} className="text-sm">
                      {type.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => updateScheduleMutation.mutate(scheduleData)}
                disabled={updateScheduleMutation.isPending}
                className="w-full sm:w-auto"
              >
                {updateScheduleMutation.isPending ? "Salvando..." : "Salvar Horários"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Especialidades */}
      <Dialog open={isSpecialtiesModalOpen} onOpenChange={setIsSpecialtiesModalOpen}>
        <DialogContent className="max-w-2xl mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Especialidades - Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}
            </DialogTitle>
            <DialogDescription>
              Gerir as especialidades médicas associadas a este profissional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Lista de Especialidades Atuais */}
            <div>
              <Label className="text-base font-medium mb-3 block">Especialidades Atuais</Label>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedDoctor?.specialties?.map((specialty, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-2 text-sm">
                    <span className="truncate max-w-[150px] sm:max-w-none">{specialty}</span>
                    <button
                      onClick={() => handleRemoveSpecialty(specialty)}
                      className="ml-1 text-red-500 hover:text-red-700 flex-shrink-0"
                    >
                      ×
                    </button>
                  </Badge>
                )) || <p className="text-gray-500">Nenhuma especialidade definida</p>}
              </div>
            </div>

            {/* Adicionar Nova Especialidade */}
            <div>
              <Label htmlFor="newSpecialty">Adicionar Nova Especialidade</Label>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Input
                  id="newSpecialty"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  placeholder="Ex: Ortodontia, Endodontia, Implantologia..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSpecialty();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAddSpecialty} 
                  disabled={!newSpecialty.trim()}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Adicionar</span>
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsSpecialtiesModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}