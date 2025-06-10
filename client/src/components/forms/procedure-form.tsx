import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const procedureSchema = z.object({
  patientId: z.number().min(1, "Please select a patient"),
  procedureTypeId: z.number().min(1, "Please select a procedure type"),
  doctorId: z.string().min(1, "Please select a doctor"),
  date: z.string().min(1, "Please select a date"),
  notes: z.string().optional(),
  appointmentId: z.number().optional(),
});

type ProcedureFormData = z.infer<typeof procedureSchema>;

interface ProcedureFormProps {
  onSuccess?: () => void;
  appointmentId?: number;
}

export function ProcedureForm({ onSuccess, appointmentId }: ProcedureFormProps) {
  const { toast } = useToast();

  const form = useForm<ProcedureFormData>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      patientId: 0,
      procedureTypeId: 0,
      doctorId: "",
      date: new Date().toISOString().split('T')[0],
      notes: "",
      appointmentId: appointmentId,
    },
  });

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: procedureTypes } = useQuery({
    queryKey: ["/api/procedure-types"],
  });

  // Static list of doctors - in a real app, this would come from an API
  const doctors = [
    { id: "dr-johnson", name: "Dr. Sarah Johnson" },
    { id: "dr-chen", name: "Dr. Michael Chen" },
    { id: "dr-williams", name: "Dr. Emily Williams" },
  ];

  const createProcedureMutation = useMutation({
    mutationFn: async (data: ProcedureFormData) => {
      await apiRequest("POST", "/api/procedures", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procedures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Procedure recorded successfully",
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

  const onSubmit = (data: ProcedureFormData) => {
    // Clean up the data
    const cleanedData = {
      ...data,
      notes: data.notes || undefined,
      appointmentId: data.appointmentId || undefined,
    };
    
    createProcedureMutation.mutate(cleanedData);
  };

  const selectedProcedureType = procedureTypes?.find(
    (pt: any) => pt.id === form.watch("procedureTypeId")
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient *</FormLabel>
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
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doctor *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
        </div>

        <FormField
          control={form.control}
          name="procedureTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Procedure Type *</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select procedure type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {procedureTypes?.map((type: any) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      <div className="flex justify-between items-center w-full">
                        <span>{type.name}</span>
                        <span className="text-muted-foreground ml-2">
                          ${Number(type.price).toFixed(2)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedProcedureType && (
          <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{selectedProcedureType.name}</p>
                {selectedProcedureType.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedProcedureType.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">
                  ${Number(selectedProcedureType.price).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Procedure Cost</p>
              </div>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Procedure Date *</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  max={new Date().toISOString().split('T')[0]}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Procedure Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter procedure details, observations, or special notes..."
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button type="submit" disabled={createProcedureMutation.isPending}>
            {createProcedureMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Record Procedure
          </Button>
        </div>
      </form>
    </Form>
  );
}
