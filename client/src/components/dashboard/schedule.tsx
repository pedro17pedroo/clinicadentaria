import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, CheckCircle, Edit, Clock } from "lucide-react";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function TodaysSchedule() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["/api/appointments", { date: today }],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/appointments?date=${today}`);
      return Array.isArray(response) ? response : [];
    },
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/patients");
      return Array.isArray(response) ? response : [];
    },
  });

  const { data: consultationTypes = [] } = useQuery({
    queryKey: ["/api/consultation-types"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/consultation-types");
      return Array.isArray(response) ? response : [];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return Array.isArray(response) ? response : [];
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PUT", `/api/appointments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Sucesso",
        description: "Consulta concluída com sucesso",
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

  const handleCompleteAppointment = (appointmentId: number) => {
    updateAppointmentMutation.mutate({
      id: appointmentId,
      data: { status: "completed" }
    });
  };

  const getPatientName = (patientId: number) => {
    const patient = patients?.find((p: any) => p.id === patientId);
    return patient?.name || "Paciente Desconhecido";
  };

  const getConsultationType = (consultationTypeId: number) => {
    const consultationType = consultationTypes?.find((ct: any) => ct.id === consultationTypeId);
    return consultationType?.name || "Tipo Desconhecido";
  };

  const getDoctorName = (doctorId: any) => {
    if (typeof doctorId === 'object' && doctorId?.firstName && doctorId?.lastName) {
      return `${doctorId.firstName} ${doctorId.lastName}`;
    }
    if (typeof doctorId === 'string') {
      const doctor = users?.find((u: any) => u.id === doctorId);
      return doctor ? `${doctor.firstName} ${doctor.lastName}` : "Médico Desconhecido";
    }
    return "Médico Desconhecido";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Agenda de Hoje</span>
          </CardTitle>
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
                  Agende uma nova consulta para um paciente.
                </DialogDescription>
              </DialogHeader>
              <AppointmentForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : appointments?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma consulta agendada para hoje</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments?.slice(0, 5).map((appointment: any) => (
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
                    <p className="font-semibold text-foreground">
                      {getPatientName(appointment.patientId)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getConsultationType(appointment.consultationTypeId)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dr. {getDoctorName(appointment.doctorId)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(appointment.status)}>
                  {appointment.status === "scheduled" && <Clock className="h-3 w-3 mr-1" />}
                  {appointment.status === 'scheduled' ? 'Agendado' : 
                   appointment.status === 'completed' ? 'Concluído' : 
                   appointment.status === 'cancelled' ? 'Cancelado' : appointment.status}
                </Badge>
                  <div className="flex space-x-2">
                    {appointment.status === "scheduled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompleteAppointment(appointment.id)}
                        disabled={updateAppointmentMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Concluir
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {appointments?.length > 0 && (
          <div className="mt-4 text-center">
            <Button variant="link" className="text-primary">
              Ver Agenda Completa
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
