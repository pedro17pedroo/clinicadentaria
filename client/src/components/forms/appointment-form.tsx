import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const appointmentSchema = z.object({
  patientId: z.number().min(1, "Please select a patient"),
  consultationTypeId: z.number().min(1, "Please select a consultation type"),
  doctorId: z.string().min(1, "Please select a doctor"),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please select a time"),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  onSuccess?: () => void;
}

export function AppointmentForm({ onSuccess }: AppointmentFormProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: 0,
      consultationTypeId: 0,
      doctorId: "",
      date: "",
      time: "",
    },
  });

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: consultationTypes } = useQuery({
    queryKey: ["/api/consultation-types"],
  });

  // For now, we'll use a static list of doctors since we don't have a separate doctors endpoint
  const doctors = [
    { id: "dr-johnson", name: "Dr. Sarah Johnson" },
    { id: "dr-chen", name: "Dr. Michael Chen" },
    { id: "dr-williams", name: "Dr. Emily Williams" },
  ];

  const { data: availableTimes } = useQuery({
    queryKey: ["/api/doctors", selectedDoctor, "availability", { date: selectedDate }],
    enabled: !!(selectedDoctor && selectedDate),
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      await apiRequest("POST", "/api/appointments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Appointment scheduled successfully",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    createAppointmentMutation.mutate(data);
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
              <FormLabel>Patient</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {patients?.map((patient: any) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.name} - {patient.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consultationTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Consultation Type</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select consultation type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {consultationTypes?.map((type: any) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} - ${Number(type.price).toFixed(2)}
                    </SelectItem>
                  ))}
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
              <FormLabel>Doctor</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedDoctor(value);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
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
                <FormLabel>Date</FormLabel>
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
                <FormLabel>Time</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedDoctor || !selectedDate}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableTimes?.map((time: string) => (
                      <SelectItem key={time} value={time}>
                        {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button type="submit" disabled={createAppointmentMutation.isPending}>
            {createAppointmentMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Schedule Appointment
          </Button>
        </div>
      </form>
    </Form>
  );
}
