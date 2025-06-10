import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  cpf: z.string().min(11, "CPF must be at least 11 characters").max(14, "CPF must be at most 14 characters"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  onSuccess?: () => void;
  initialData?: Partial<PatientFormData>;
  isEditing?: boolean;
}

export function PatientForm({ onSuccess, initialData, isEditing = false }: PatientFormProps) {
  const { toast } = useToast();

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: initialData?.name || "",
      cpf: initialData?.cpf || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
      notes: initialData?.notes || "",
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      await apiRequest("POST", "/api/patients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Patient created successfully",
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

  const onSubmit = (data: PatientFormData) => {
    // Clean up empty strings
    const cleanedData = {
      ...data,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      notes: data.notes || undefined,
    };
    
    createPatientMutation.mutate(cleanedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter patient's full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF/ID *</FormLabel>
                <FormControl>
                  <Input placeholder="000.000.000-00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="patient@example.com" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Street, City, State, ZIP" {...field} />
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
              <FormLabel>Medical Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any medical considerations, allergies, or special notes..."
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
          <Button type="submit" disabled={createPatientMutation.isPending}>
            {createPatientMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? "Update Patient" : "Add Patient"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
