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
  name: z.string().min(1, "Nome é obrigatório"),
  di: z.string().optional(), // Documento de Identidade
  nif: z.string().optional(), // Número de Identificação Fiscal
  phone: z.string().optional(),
  email: z.string().email("Endereço de email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  onSuccess?: () => void;
  initialData?: Partial<PatientFormData>;
  isEditing?: boolean;
  patientId?: string;
}

export function PatientForm({ onSuccess, initialData, isEditing = false, patientId }: PatientFormProps) {
  const { toast } = useToast();

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: initialData?.name || "",
      di: initialData?.di || "",
      nif: initialData?.nif || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
      notes: initialData?.notes || "",
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      // Converter strings vazias em undefined para campos opcionais
      const cleanedData = {
        ...data,
        di: data.di?.trim() || undefined,
        nif: data.nif?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
        address: data.address?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      };
      await apiRequest("POST", "/api/patients", cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Sucesso",
        description: "Paciente criado com sucesso",
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

  const updatePatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      if (!patientId) throw new Error("ID do paciente é obrigatório para edição");
      // Converter strings vazias em undefined para campos opcionais
      const cleanedData = {
        ...data,
        di: data.di?.trim() || undefined,
        nif: data.nif?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
        address: data.address?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      };
      await apiRequest("PUT", `/api/patients/${patientId}`, cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Sucesso",
        description: "Paciente atualizado com sucesso",
      });
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

  const onSubmit = (data: PatientFormData) => {
    // Clean up empty strings
    const cleanedData = {
      ...data,
      di: data.di || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      notes: data.notes || undefined,
    };
    
    if (isEditing) {
      updatePatientMutation.mutate(cleanedData);
    } else {
      createPatientMutation.mutate(cleanedData);
    }
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
                <FormLabel>Nome Completo *</FormLabel>
                <FormControl>
                  <Input placeholder="Digite o nome completo do paciente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="di"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DI - Documento de Identidade</FormLabel>
                <FormControl>
                  <Input placeholder="Número do documento de identidade" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nif"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIF - Número de Identificação Fiscal</FormLabel>
                <FormControl>
                  <Input placeholder="Número de identificação fiscal" {...field} />
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
                <FormLabel>Número de Telefone</FormLabel>
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
                <FormLabel>Endereço de Email</FormLabel>
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
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Rua, Cidade, Estado, CEP" {...field} />
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
              <FormLabel>Notas Médicas</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Considerações médicas, alergias ou notas especiais..."
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
            Cancelar
          </Button>
          <Button type="submit" disabled={createPatientMutation.isPending || updatePatientMutation.isPending}>
            {(createPatientMutation.isPending || updatePatientMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? "Atualizar Paciente" : "Adicionar Paciente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
