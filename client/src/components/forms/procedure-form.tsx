import React, { useState, useEffect, useMemo } from "react";
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
  procedureTypeId: z.string().min(1, "Por favor selecione um tipo de procedimento"),
  doctorId: z.string().min(1, "Por favor selecione um médico"),
  notes: z.string().optional(),
});

const procedureFormSchema = z.object({
  procedures: z.array(procedureItemSchema).min(1, "Pelo menos um procedimento é obrigatório"),
  date: z.string().min(1, "Por favor selecione uma data"),
  patientId: z.string().min(1, "Por favor selecione um paciente"),
});

type ProcedureFormData = z.infer<typeof procedureFormSchema>;

interface ProcedureFormProps {
  onSuccess?: () => void;
  appointmentId?: number;
  patientId?: number;
  initialData?: any; // Dados iniciais para edição
}

export function ProcedureForm({ onSuccess, appointmentId, patientId, initialData }: ProcedureFormProps) {
  const { toast } = useToast();
  const [totalCost, setTotalCost] = useState(0);
  const [isEditing] = useState(!!initialData);

  // Preparar dados iniciais para edição
  const getInitialValues = () => {
    if (initialData) {
      return {
        procedures: [{
          procedureTypeId: initialData.procedureTypeId?._id || initialData.procedureTypeId || "",
          doctorId: initialData.doctorId?._id || initialData.doctorId || "",
          notes: initialData.notes || "",
        }],
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        patientId: initialData.patientId?._id || initialData.patientId?.toString() || patientId?.toString() || "",
      };
    }
    return {
      procedures: [{ procedureTypeId: "", doctorId: "", notes: "" }],
      date: new Date().toISOString().split('T')[0],
      patientId: patientId?.toString() || "",
    };
  };

  const form = useForm<ProcedureFormData>({
    resolver: zodResolver(procedureFormSchema),
    defaultValues: getInitialValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "procedures",
  });

  const { data: procedureTypes = [] } = useQuery({
    queryKey: ["/api/procedure-types"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/procedure-types");
      return response.json();
    },
  });

  const { data: allDoctors = [] } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/doctors");
      return response.json();
    },
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/patients");
      return response.json();
    },
    enabled: !patientId, // Só carrega se não tiver patientId
  });

  // Função para filtrar médicos baseado na especialidade do procedimento selecionado
  const getFilteredDoctors = (procedureTypeId: string) => {
    if (!procedureTypeId || !procedureTypes || !allDoctors) {
      return allDoctors;
    }
    
    const selectedProcedureType = procedureTypes.find((pt: any) => pt._id?.toString() === procedureTypeId);
    
    if (!selectedProcedureType?.specialty) {
      return allDoctors;
    }
    
    return allDoctors.filter((doctor: any) => 
      doctor.specialties && doctor.specialties.includes(selectedProcedureType.specialty)
    );
  };

  const createProceduresMutation = useMutation({
    mutationFn: async (data: ProcedureFormData) => {
      if (isEditing && initialData) {
        // Editar procedimento existente
        const procedure = data.procedures[0]; // Para edição, assumimos apenas um procedimento
        const procedureType = procedureTypes?.find?.((pt: any) => pt?._id?.toString?.() === procedure.procedureTypeId);
        
        return apiRequest("PUT", `/api/procedures/${initialData._id || initialData.id}`, {
          patientId: data.patientId,
          appointmentId: appointmentId,
          procedureTypeId: procedure.procedureTypeId,
          doctorId: procedure.doctorId,
          date: data.date,
          cost: procedureType?.price || initialData.cost || 0,
          status: initialData.status || 'in_progress', // Manter status atual ou definir padrão
          notes: procedure.notes || undefined,
        });
      } else {
        // Criar novos procedimentos
        const promises = data.procedures.map(procedure => {
          const procedureType = procedureTypes?.find?.((pt: any) => pt?.id?.toString?.() === procedure.procedureTypeId);
          return apiRequest("POST", "/api/procedures", {
            patientId: data.patientId,
            appointmentId: appointmentId,
            procedureTypeId: procedure.procedureTypeId,
            doctorId: procedure.doctorId,
            date: data.date,
            cost: procedureType?.price || 0,
            status: 'in_progress', // Status padrão para novos procedimentos
            notes: procedure.notes || undefined,
          });
        });
        await Promise.all(promises);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procedures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Sucesso",
        description: isEditing ? "Procedimento atualizado com sucesso" : "Procedimentos registados com sucesso",
      });
      if (!isEditing) {
        form.reset();
      }
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

  const onSubmit = (data: ProcedureFormData) => {
    createProceduresMutation.mutate(data);
  };

  // Watch procedures for changes
  const watchedProcedures = form.watch("procedures");
  
  // Calculate total cost using useMemo for better performance and reliability
  const calculatedTotal = useMemo(() => {
    if (!procedureTypes || procedureTypes.length === 0 || !watchedProcedures) {
      return 0;
    }

    return watchedProcedures.reduce((sum, procedure) => {
      if (!procedure?.procedureTypeId) {
        return sum;
      }
      
      const procedureType = procedureTypes.find((pt: any) => 
        pt?._id?.toString() === procedure.procedureTypeId
      );
      
      if (procedureType?.price && typeof procedureType.price === 'number') {
        return sum + procedureType.price;
      }
      
      return sum;
    }, 0);
  }, [watchedProcedures, procedureTypes]);
  
  // Update totalCost when calculatedTotal changes
  useEffect(() => {
    setTotalCost(calculatedTotal);
  }, [calculatedTotal]);

  if (!procedureTypes || !allDoctors) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  return (
    <Form {...form}>
      <div className="h-[80vh] flex flex-col">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
          {/* Conteúdo principal com scroll */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {/* Patient Selection - only show if patientId not provided */}
        {!patientId && (
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um paciente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients?.map?.((patient: any) => (
                      patient && patient._id ? (
                        <SelectItem key={patient._id} value={patient._id.toString()}>
                          {patient.name}
                        </SelectItem>
                      ) : null
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Date Field */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Procedimento *</FormLabel>
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
            <h3 className="text-lg font-semibold">Procedimentos</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ procedureTypeId: "", doctorId: "", notes: "" })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Procedimento
            </Button>
          </div>

          {/* Lista de procedimentos */}
          <div className="space-y-4">
            {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex justify-between items-center">
                  Procedimento {index + 1}
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
                        <FormLabel>Tipo de Procedimento *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Limpar seleção de médico quando mudar tipo de procedimento
                            form.setValue(`procedures.${index}.doctorId`, "");
                          }}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de procedimento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {procedureTypes?.map?.((type: any) => (
                              type && type._id ? (
                                <SelectItem key={type._id} value={type._id.toString()}>
                                  <div className="flex flex-col items-start w-full">
                                    <div className="flex justify-between items-center w-full">
                                      <span>{type.name || 'Procedimento sem nome'}</span>
                                      <span className="text-muted-foreground ml-2">
                                        {type.price ? Number(type.price).toFixed(2) : '0.00'} AOA
                                      </span>
                                    </div>
                                    {type.specialty && (
                                      <span className="text-xs text-muted-foreground mt-1">
                                        Especialidade: {type.specialty}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ) : null
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
                    render={({ field }) => {
                      const selectedProcedureTypeId = form.watch(`procedures.${index}.procedureTypeId`);
                      const filteredDoctors = getFilteredDoctors(selectedProcedureTypeId);
                      
                      return (
                        <FormItem>
                          <FormLabel>Médico *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                            }}
                            value={field.value || ""}
                            disabled={!selectedProcedureTypeId}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue 
                                  placeholder={
                                    !selectedProcedureTypeId 
                                      ? "Primeiro selecione um tipo de procedimento" 
                                      : filteredDoctors.length === 0
                                      ? "Nenhum médico habilitado para este procedimento"
                                      : "Selecione um médico"
                                  } 
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredDoctors?.map?.((doctor: any) => (
                                doctor && doctor._id ? (
                                  <SelectItem key={doctor._id} value={doctor._id.toString()}>
                                    <div className="flex flex-col">
                                      <span>Dr. {doctor.firstName || 'Nome'} {doctor.lastName || 'Desconhecido'}</span>
                                      {doctor.specialties && doctor.specialties.length > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                          {doctor.specialties.join(', ')}
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                ) : null
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`procedures.${index}.notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas do Procedimento</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Insira detalhes do procedimento, observações ou notas especiais..."
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
                  const selectedType = procedureTypes?.find?.((pt: any) => 
                    pt?._id?.toString?.() === form.watch(`procedures.${index}.procedureTypeId`)
                  );
                  return selectedType && (
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{selectedType.name || 'Procedimento'}</span>
                        <Badge variant="secondary" className="text-sm">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {selectedType.price ? Number(selectedType.price).toFixed(2) : '0.00'} AOA
                        </Badge>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            ))}
          </div>
        </div>

        {/* Custo Total */}
        {fields.length > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-semibold">Custo Total</span>
                  <p className="text-sm text-muted-foreground">
                    {fields.length} procedimento{fields.length > 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-2xl font-bold text-primary">
                  {totalCost.toFixed(2)} AOA
                </span>
              </div>
            </CardContent>
          </Card>
        )}
          </div>

          {/* Rodapé fixo com botões de ação */}
          <div className="border-t pt-4 mt-4 bg-background">
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createProceduresMutation.isPending}>
                {createProceduresMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Registar Procedimentos
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Form>
  );
}
