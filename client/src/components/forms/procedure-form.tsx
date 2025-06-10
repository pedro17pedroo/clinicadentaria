import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, DollarSign } from "lucide-react";

const procedureItemSchema = z.object({
  procedureTypeId: z.number().min(1, "Please select a procedure type"),
  doctorId: z.string().min(1, "Please select a doctor"),
  notes: z.string().optional(),
});

const procedureFormSchema = z.object({
  procedures: z.array(procedureItemSchema).min(1, "At least one procedure is required"),
  date: z.string().min(1, "Please select a date"),
});

type ProcedureFormData = z.infer<typeof procedureFormSchema>;

interface ProcedureFormProps {
  onSuccess?: () => void;
  appointmentId?: number;
  patientId?: number;
}

export function ProcedureForm({ onSuccess, appointmentId, patientId }: ProcedureFormProps) {
  const { toast } = useToast();
  const [totalCost, setTotalCost] = useState(0);

  const form = useForm<ProcedureFormData>({
    resolver: zodResolver(procedureFormSchema),
    defaultValues: {
      procedures: [{ procedureTypeId: 0, doctorId: "", notes: "" }],
      date: new Date().toISOString().split('T')[0],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "procedures",
  });

  const { data: procedureTypes } = useQuery({
    queryKey: ["/api/procedure-types"],
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // For now, just use current user as doctor - in a real app this would fetch all doctors
  const doctors = currentUser ? [{ 
    id: currentUser.id, 
    firstName: currentUser.firstName || 'Dr.', 
    lastName: currentUser.lastName || 'Unknown' 
  }] : [];

  const createProceduresMutation = useMutation({
    mutationFn: async (data: ProcedureFormData) => {
      // Create procedures individually
      const promises = data.procedures.map(procedure => {
        const procedureType = procedureTypes?.find((pt: any) => pt.id === procedure.procedureTypeId);
        return apiRequest("POST", "/api/procedures", {
          patientId: patientId,
          appointmentId: appointmentId,
          procedureTypeId: procedure.procedureTypeId,
          doctorId: procedure.doctorId,
          date: data.date,
          cost: procedureType?.price || 0,
          notes: procedure.notes || undefined,
        });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procedures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Procedures recorded successfully",
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
    createProceduresMutation.mutate(data);
  };

  // Calculate total cost when procedures change
  useEffect(() => {
    const watchedProcedures = form.watch("procedures");
    const total = watchedProcedures.reduce((sum, procedure) => {
      const procedureType = procedureTypes?.find((pt: any) => pt.id === procedure.procedureTypeId);
      return sum + (procedureType ? Number(procedureType.price) : 0);
    }, 0);
    setTotalCost(total);
  }, [form.watch("procedures"), procedureTypes]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Date Field */}
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

        {/* Procedures List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Procedures</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ procedureTypeId: 0, doctorId: "", notes: "" })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Procedure
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex justify-between items-center">
                  Procedure {index + 1}
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`procedures.${index}.procedureTypeId`}
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

                  <FormField
                    control={form.control}
                    name={`procedures.${index}.doctorId`}
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
                            {doctors.map((doctor: any) => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                {doctor.firstName} {doctor.lastName}
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
                  name={`procedures.${index}.notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procedure Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter procedure details, observations, or special notes..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show cost for selected procedure */}
                {(() => {
                  const selectedType = procedureTypes?.find((pt: any) => 
                    pt.id === form.watch(`procedures.${index}.procedureTypeId`)
                  );
                  return selectedType && (
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{selectedType.name}</span>
                        <Badge variant="secondary" className="text-sm">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {Number(selectedType.price).toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Total Cost Summary */}
        {totalCost > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Cost</span>
                <span className="text-2xl font-bold text-primary">
                  ${totalCost.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button type="submit" disabled={createProceduresMutation.isPending}>
            {createProceduresMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Record Procedures
          </Button>
        </div>
      </form>
    </Form>
  );
}
