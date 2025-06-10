import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Plus, Edit, Trash2, Stethoscope, Activity, Users, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const consultationTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.string().min(1, "Price is required"),
  description: z.string().optional(),
});

const procedureTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.string().min(1, "Price is required"),
  category: z.string().optional(),
  description: z.string().optional(),
});

const transactionTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["income", "expense"], { required_error: "Category is required" }),
  description: z.string().optional(),
});

type ConsultationTypeFormData = z.infer<typeof consultationTypeSchema>;
type ProcedureTypeFormData = z.infer<typeof procedureTypeSchema>;
type TransactionTypeFormData = z.infer<typeof transactionTypeSchema>;

export default function SystemConfig() {
  const [activeTab, setActiveTab] = useState("consultations");
  const [isConsultationDialogOpen, setIsConsultationDialogOpen] = useState(false);
  const [isProcedureDialogOpen, setIsProcedureDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: consultationTypes } = useQuery({
    queryKey: ["/api/consultation-types"],
  });

  const { data: procedureTypes } = useQuery({
    queryKey: ["/api/procedure-types"],
  });

  const consultationForm = useForm<ConsultationTypeFormData>({
    resolver: zodResolver(consultationTypeSchema),
    defaultValues: {
      name: "",
      price: "",
      description: "",
    },
  });

  const procedureForm = useForm<ProcedureTypeFormData>({
    resolver: zodResolver(procedureTypeSchema),
    defaultValues: {
      name: "",
      price: "",
      category: "",
      description: "",
    },
  });

  const createConsultationTypeMutation = useMutation({
    mutationFn: async (data: ConsultationTypeFormData) => {
      await apiRequest("POST", "/api/consultation-types", {
        ...data,
        price: parseFloat(data.price),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultation-types"] });
      toast({
        title: "Success",
        description: "Consultation type created successfully",
      });
      consultationForm.reset();
      setIsConsultationDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createProcedureTypeMutation = useMutation({
    mutationFn: async (data: ProcedureTypeFormData) => {
      await apiRequest("POST", "/api/procedure-types", {
        ...data,
        price: parseFloat(data.price),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procedure-types"] });
      toast({
        title: "Success",
        description: "Procedure type created successfully",
      });
      procedureForm.reset();
      setIsProcedureDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitConsultationType = (data: ConsultationTypeFormData) => {
    createConsultationTypeMutation.mutate(data);
  };

  const onSubmitProcedureType = (data: ProcedureTypeFormData) => {
    createProcedureTypeMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="System Configuration" 
          subtitle="Configure consultation types, procedures, and system settings"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consultations" className="flex items-center space-x-2">
              <Stethoscope className="h-4 w-4" />
              <span>Consultations</span>
            </TabsTrigger>
            <TabsTrigger value="procedures" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Procedures</span>
            </TabsTrigger>
            <TabsTrigger value="user-types" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>User Types</span>
            </TabsTrigger>
          </TabsList>

          {/* Consultation Types Tab */}
          <TabsContent value="consultations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Stethoscope className="h-5 w-5" />
                    <span>Consultation Types</span>
                  </CardTitle>
                  <Dialog open={isConsultationDialogOpen} onOpenChange={setIsConsultationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Consultation Type
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Consultation Type</DialogTitle>
                      </DialogHeader>
                      <Form {...consultationForm}>
                        <form onSubmit={consultationForm.handleSubmit(onSubmitConsultationType)} className="space-y-4">
                          <FormField
                            control={consultationForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Consultation Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Teeth Cleaning, Root Canal" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={consultationForm.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price ($)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={consultationForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Consultation description..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsConsultationDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createConsultationTypeMutation.isPending}>
                              Add Consultation Type
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {consultationTypes?.map((type: any) => (
                    <Card key={type.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{type.name}</h3>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Badge variant="secondary" className="flex items-center w-fit">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ${Number(type.price).toFixed(2)}
                          </Badge>
                          {type.description && (
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Procedure Types Tab */}
          <TabsContent value="procedures">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Procedure Types</span>
                  </CardTitle>
                  <Dialog open={isProcedureDialogOpen} onOpenChange={setIsProcedureDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Procedure Type
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Procedure Type</DialogTitle>
                      </DialogHeader>
                      <Form {...procedureForm}>
                        <form onSubmit={procedureForm.handleSubmit(onSubmitProcedureType)} className="space-y-4">
                          <FormField
                            control={procedureForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Procedure Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Filling, Extraction" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={procedureForm.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price ($)</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={procedureForm.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Restorative, Surgical" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={procedureForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Procedure description..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsProcedureDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createProcedureTypeMutation.isPending}>
                              Add Procedure Type
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {procedureTypes?.map((type: any) => (
                    <Card key={type.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{type.name}</h3>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              ${Number(type.price).toFixed(2)}
                            </Badge>
                            {type.category && (
                              <Badge variant="outline">{type.category}</Badge>
                            )}
                          </div>
                          {type.description && (
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Types Tab */}
          <TabsContent value="user-types">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>User Type Configurations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                            <Settings className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">Administrator</h3>
                            <p className="text-xs text-muted-foreground">Full system access</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>User management</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>System configuration</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Financial reports</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>All appointments & procedures</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">Employee</h3>
                            <p className="text-xs text-muted-foreground">Reception & administration</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Schedule appointments</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Manage patients</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Process payments</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Record procedures</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">Doctor</h3>
                            <p className="text-xs text-muted-foreground">Clinical access</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>View schedules</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Patient clinical records</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Update patient notes</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-muted-foreground">Limited financial access</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
