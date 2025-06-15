import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Interfaces para tipagem
interface TransactionType {
  _id: string;
  name: string;
  category: 'income' | 'expense';
  description?: string;
}

interface Patient {
  _id: string;
  name: string;
  email?: string;
}

// Schema de validação para transação
const transactionSchema = z.object({
  transactionTypeId: z.string().min(1, "Tipo de transação é obrigatório"),
  amount: z.string().min(1, "Valor é obrigatório").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Valor deve ser um número positivo"
  ),
  description: z.string().min(1, "Descrição é obrigatória"),
  transactionDate: z.date({
    required_error: "Data da transação é obrigatória",
  }),
  dueDate: z.date().optional(),
  status: z.enum(["pending", "paid", "overdue"]).default("pending"),
  patientId: z.string().optional().or(z.undefined()),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSuccess?: () => void;
  initialData?: Partial<TransactionFormData>;
  patientId?: string;
}

export function TransactionForm({ onSuccess, initialData, patientId }: TransactionFormProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<any>(null);

  // Buscar tipos de transação
  const { data: transactionTypes = [] } = useQuery<TransactionType[]>({
    queryKey: ["/api/transaction-types"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/transaction-types");
      return response.json();
    },
  });

  // Buscar pacientes para seleção opcional
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/patients");
      return response.json();
    },
  });

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transactionTypeId: initialData?.transactionTypeId || "",
      amount: initialData?.amount || "",
      description: initialData?.description || "",
      transactionDate: initialData?.transactionDate || new Date(),
      dueDate: initialData?.dueDate,
      status: initialData?.status || "pending",
      patientId: patientId || initialData?.patientId || undefined,
    },
  });

  // Mutação para criar transação
  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        patientId: data.patientId || undefined,
      };
      await apiRequest("POST", "/api/transactions", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Sucesso",
        description: "Transação registrada com sucesso",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar transação",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    createTransactionMutation.mutate(data);
  };

  // Encontrar o tipo de transação selecionado
  const watchedTypeId = form.watch("transactionTypeId");
  const currentType: TransactionType | undefined = Array.isArray(transactionTypes) 
    ? transactionTypes.find((type: TransactionType) => type._id === watchedTypeId)
    : undefined;

  return (
    <Card className="max-h-[90vh] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5" />
          <span>Registrar Nova Transação</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <Form {...form}>
          <form id="transaction-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de Transação */}
            <FormField
              control={form.control}
              name="transactionTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Transação</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de transação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(transactionTypes) && transactionTypes.map((type: TransactionType) => (
                        <SelectItem key={type._id} value={type._id}>
                          <div className="flex items-center space-x-2">
                            {type.category === "income" ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span>{type.name}</span>
                            <Badge 
                              variant={type.category === "income" ? "default" : "destructive"}
                              className="ml-2"
                            >
                              {type.category === "income" ? "Receita" : "Despesa"}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (AOA)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a transação..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Paciente (opcional) */}
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um paciente (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(patients) && patients.map((patient: Patient) => (
                        <SelectItem key={patient._id} value={patient._id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data da Transação */}
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Transação</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data de Vencimento (opcional) */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Vencimento (Opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data (opcional)</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="overdue">Em Atraso</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview da Transação */}
            {currentType && (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h4 className="font-medium mb-2">Preview da Transação</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {currentType.category === "income" ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{currentType.name}</span>
                    <Badge 
                      variant={currentType.category === "income" ? "default" : "destructive"}
                    >
                      {currentType.category === "income" ? "Receita" : "Despesa"}
                    </Badge>
                  </div>
                  <span className={cn(
                    "font-bold",
                    currentType.category === "income" ? "text-green-600" : "text-red-600"
                  )}>
                    {currentType.category === "income" ? "+" : "-"}
                    {form.watch("amount") ? Number(form.watch("amount")).toFixed(2) : "0.00"} AOA
                  </span>
                </div>
              </div>
            )}

          </form>
        </Form>
      </CardContent>
      
      {/* Botões fixos na parte inferior */}
      <div className="flex-shrink-0 p-6 pt-0">
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Limpar
          </Button>
          <Button
            type="submit"
            form="transaction-form"
            disabled={createTransactionMutation.isPending}
          >
            {createTransactionMutation.isPending ? "Registrando..." : "Registrar Transação"}
          </Button>
        </div>
      </div>
    </Card>
  );
}