import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Plus, Calendar, User, DollarSign, FileText } from "lucide-react";
import { ProcedureForm } from "@/components/forms/procedure-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";

export default function Procedures() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>("all");

  const { data: procedures, isLoading } = useQuery({
    queryKey: ["/api/procedures", selectedPatient !== "all" ? { patientId: selectedPatient } : {}],
  });

  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: procedureTypes } = useQuery({
    queryKey: ["/api/procedure-types"],
  });

  const getPatientName = (patientId: number) => {
    const patient = patients?.find((p: any) => p.id === patientId);
    return patient?.name || "Unknown Patient";
  };

  const getProcedureTypeName = (procedureTypeId: number) => {
    const procedureType = procedureTypes?.find((pt: any) => pt.id === procedureTypeId);
    return procedureType?.name || "Unknown Procedure";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="Procedures" 
          subtitle="Track and manage completed procedures"
        />

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by patient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                {patients?.map((patient: any) => (
                  <SelectItem key={patient.id} value={patient.id.toString()}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Procedure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record New Procedure</DialogTitle>
              </DialogHeader>
              <ProcedureForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : procedures?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No procedures recorded yet</p>
            </div>
          ) : (
            procedures?.map((procedure: any) => (
              <Card key={procedure.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Activity className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">
                            {getProcedureTypeName(procedure.procedureTypeId)}
                          </h3>
                          <Badge variant="outline">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ${Number(procedure.cost).toFixed(2)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{getPatientName(procedure.patientId)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(procedure.date), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>Dr. {procedure.doctorId}</span>
                          </div>
                        </div>
                        {procedure.notes && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-md">
                            <div className="flex items-start space-x-2">
                              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <p className="text-sm text-muted-foreground">
                                {procedure.notes}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
