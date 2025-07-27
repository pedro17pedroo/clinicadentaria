import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, UserPlus } from "lucide-react";
import { PatientForm } from "@/components/forms/patient-form";

const appointmentSchema = z.object({
  patientId: z.string().min(1, "Paciente é obrigatório"),
  consultationTypeId: z.string().min(1, "Tipo de consulta é obrigatório"),
  doctorId: z.string().min(1, "Médico é obrigatório"),
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().min(1, "Horário é obrigatório"),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  appointment?: any; // Para edição
}

export function AppointmentForm({ onSuccess, onCancel, appointment }: AppointmentFormProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedConsultationType, setSelectedConsultationType] = useState<string | null>(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [searchPatient, setSearchPatient] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: appointment?.patient?._id || "",
      consultationTypeId: appointment?.consultationType?._id || "",
      doctorId: appointment?.doctor?._id || "",
      date: appointment?.date ? new Date(appointment.date).toISOString().split('T')[0] : "",
      time: appointment?.time || "",
    },
  });

  // Inicializar estados e formulário quando estiver editando
  React.useEffect(() => {
    if (appointment) {
      console.log('Appointment data:', appointment);
      
      const formData = {
        patientId: appointment.patientId?._id || appointment.patient?._id || "",
        consultationTypeId: appointment.consultationTypeId?._id || appointment.consultationType?._id || "",
        doctorId: appointment.doctorId?._id || appointment.doctor?._id || "",
        date: appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : "",
        time: appointment.time || "",
      };
      
      console.log('Form data to reset:', formData);
      
      // Resetar o formulário com os novos valores
      form.reset(formData);
      
      // Atualizar os estados
      setSelectedDoctor(appointment.doctorId?._id || appointment.doctor?._id || "");
      setSelectedDate(appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : "");
      setSelectedConsultationType(appointment.consultationTypeId?._id || appointment.consultationType?._id || "");
      
      console.log('States updated:', {
        selectedDoctor: appointment.doctorId?._id || appointment.doctor?._id,
        selectedDate: appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : "",
        selectedConsultationType: appointment.consultationTypeId?._id || appointment.consultationType?._id
      });
    }
  }, [appointment, form]);

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: consultationTypes } = useQuery({
    queryKey: ["/api/consultation-types"],
  });

  // Buscar médicos (usuários com userType = 'doctor')
  const { data: allDoctors } = useQuery({
    queryKey: ["/api/users"],
  });

  // Filtrar médicos por tipo de consulta selecionado
  const availableDoctors = React.useMemo(() => {
    if (!allDoctors || !Array.isArray(allDoctors) || !selectedConsultationType) return [];
    
    const selectedType = consultationTypes && Array.isArray(consultationTypes) 
      ? consultationTypes.find((ct: any) => ct._id === selectedConsultationType)
      : null;
    if (!selectedType) return [];
    
    return allDoctors
      .filter((user: any) => user.userType === 'doctor' && user.isActive)
      .filter((doctor: any) => {
        // Se o médico não tem tipos de consulta definidos, pode atender todos
        if (!doctor.consultationTypes || doctor.consultationTypes.length === 0) return true;
        // Verificar se o médico atende este tipo de consulta
        return doctor.consultationTypes.includes(selectedType.name) || 
               doctor.consultationTypes.includes(selectedType._id?.toString());
      })
      .map((doctor: any) => ({
        id: doctor._id,
        name: doctor.firstName && doctor.lastName 
          ? `Dr. ${doctor.firstName} ${doctor.lastName}`
          : doctor.name 
            ? `Dr. ${doctor.name}`
            : `Dr. ${doctor.email?.split('@')[0] || 'Médico'}`,
        workingDays: doctor.workingDays || [],
        workingHours: doctor.workingHours || { start: '09:00', end: '17:00' },
        dailySchedules: doctor.dailySchedules || {}
      }));
  }, [allDoctors, selectedConsultationType, consultationTypes]);

  // Buscar horários disponíveis do médico na data selecionada
  const { data: availableTimesFromAPI } = useQuery({
    queryKey: ["/api/doctors", selectedDoctor, "availability", selectedDate],
    queryFn: async () => {
      if (!selectedDoctor || !selectedDate) return [];
      const response = await apiRequest("GET", `/api/doctors/${selectedDoctor}/availability?date=${selectedDate}`);
      return await response.json();
    },
    enabled: !!(selectedDoctor && selectedDate),
  });

  // Usar horários disponíveis retornados pela API
  const availableTimes = React.useMemo(() => {
    if (!selectedDoctor || !selectedDate) return [];
    
    // Se a API retornou horários disponíveis, usar esses dados diretamente
    if (availableTimesFromAPI && Array.isArray(availableTimesFromAPI)) {
      return availableTimesFromAPI;
    }
    
    return [];
  }, [selectedDoctor, selectedDate, availableTimesFromAPI]);

  const appointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      if (appointment) {
        // Editar consulta existente
        await apiRequest("PUT", `/api/appointments/${appointment._id}`, data);
      } else {
        // Criar nova consulta
        await apiRequest("POST", "/api/appointments", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Sucesso",
        description: appointment ? "Consulta atualizada com sucesso" : "Consulta agendada com sucesso",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    appointmentMutation.mutate(data);
  };

  const watchedValues = form.watch();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="patientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paciente</FormLabel>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <div className="mb-2">
                    <Input
                      placeholder="Pesquisar paciente por nome ou DI..."
                      value={searchPatient}
                      onChange={(e) => setSearchPatient(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um paciente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients && Array.isArray(patients) ? 
                        patients
                          .filter((patient: any) => {
                            if (!searchPatient) return true;
                            const searchLower = searchPatient.toLowerCase();
                            return patient.name?.toLowerCase().includes(searchLower) ||
                                   patient.di?.toLowerCase().includes(searchLower);
                          })
                          .map((patient: any) => (
                            patient._id ? (
                              <SelectItem key={patient._id} value={patient._id}>
                                {patient.name}{patient.di ? ` - ${patient.di}` : ''}
                              </SelectItem>
                            ) : null
                          )).filter(Boolean) : (
                        <SelectItem value="no-patients" disabled>
                          Nenhum paciente disponível
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="icon">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Paciente</DialogTitle>
                      <DialogDescription>
                        Adicione um novo paciente para poder agendar a consulta.
                      </DialogDescription>
                    </DialogHeader>
                    <PatientForm 
                      onSuccess={() => {
                        setIsAddPatientOpen(false);
                        // Invalidar cache de pacientes para recarregar a lista
                        queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
                        toast({
                          title: "Sucesso",
                          description: "Paciente adicionado! Agora você pode selecioná-lo na lista.",
                        });
                      }} 
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consultationTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Consulta</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedConsultationType(value);
                  // Reset médico e horário quando tipo de consulta muda
                  form.setValue("doctorId", "");
                  form.setValue("time", "");
                  setSelectedDoctor("");
                }}
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de consulta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {consultationTypes && Array.isArray(consultationTypes) ? consultationTypes.map((type: any) => (
                    type._id ? (
                      <SelectItem key={type._id} value={type._id}>
                        {type.name} - {Number(type.price).toFixed(2)} Kz
                      </SelectItem>
                    ) : null
                  )) : (
                    <SelectItem value="no-consultation-types" disabled>
                      Nenhum tipo de consulta disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="doctorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Médico</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedDoctor(value);
                  // Reset horário quando médico muda
                  form.setValue("time", "");
                }}
                value={field.value}
                disabled={!selectedConsultationType}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedConsultationType 
                        ? "Selecione primeiro o tipo de consulta" 
                        : availableDoctors.length === 0 
                        ? "Nenhum médico disponível para este tipo de consulta"
                        : "Selecione um médico"
                    } />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableDoctors.length > 0 ? availableDoctors.map((doctor: any) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      <div className="flex flex-col">
                        <span>{doctor.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Dias: {doctor.workingDays.length > 0 ? doctor.workingDays.join(', ') : 'Todos os dias'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Horário: {doctor.workingHours.start} - {doctor.workingHours.end}
                        </span>
                      </div>
                    </SelectItem>
                  )) : (
                    <SelectItem value="no-doctors" disabled>
                      {!selectedConsultationType 
                        ? "Selecione primeiro o tipo de consulta"
                        : "Nenhum médico disponível para este tipo de consulta"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      setSelectedDate(e.target.value);
                      form.setValue("time", ""); // Reset time when date changes
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedDoctor || !selectedDate}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedDoctor ? "Selecione primeiro o médico" :
                        !selectedDate ? "Selecione primeiro a data" :
                        "Selecione o horário"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableTimes && availableTimes.length > 0 ? availableTimes.map((time: string) => (
                      <SelectItem key={time} value={time}>
                        {new Date(`2000-01-01T${time}`).toLocaleTimeString('pt-PT', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </SelectItem>
                    )) : (
                      <SelectItem value="no-times" disabled>
                        {!selectedDoctor ? 'Selecione médico primeiro' : 
                         !selectedDate ? 'Selecione data primeiro' :
                         availableTimesFromAPI === undefined ? 'Carregando horários...' :
                         availableTimes?.length === 0 ? 'Médico não trabalha neste dia ou todos os horários estão ocupados' :
                         'Nenhum horário disponível'}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
                {selectedDoctor && selectedDate && availableTimes?.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    💡 Dica: Tente selecionar outra data ou verifique os dias de trabalho do médico.
                  </p>
                )}
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              if (appointment && onCancel) {
                onCancel();
              } else {
                form.reset();
              }
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={appointmentMutation.isPending}>
            {appointmentMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {appointment ? 'Atualizar Consulta' : 'Agendar Consulta'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
