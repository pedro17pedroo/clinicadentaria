import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Plus, Edit, CheckCircle } from "lucide-react";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Appointments() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PUT", `/api/appointments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Appointment updated successfully",
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

  const handleCompleteAppointment = (appointmentId: number) => {
    updateAppointmentMutation.mutate({
      id: appointmentId,
      data: { status: "completed" }
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

  const getPatientName = (patientId: number) => {
    const patient = patients?.find((p: any) => p.id === patientId);
    return patient?.name || "Unknown Patient";
  };

  const getConsultationType = (consultationTypeId: number) => {
    const consultationType = consultationTypes?.find((ct: any) => ct.id === consultationTypeId);
    return consultationType?.name || "Unknown Type";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="Appointments" 
          subtitle="Manage your clinic's appointment schedule"
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
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
              </DialogHeader>
              <AppointmentForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Appointments for {format(new Date(selectedDate), 'MMMM d, yyyy')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : appointments?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No appointments scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments?.map((appointment: any) => (
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
                          Dr. {appointment.doctorId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
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
                            Complete
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
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
