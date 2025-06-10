import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Plus, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { PatientForm } from "@/components/forms/patient-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";

export default function Patients() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: patients, isLoading } = useQuery({
    queryKey: ["/api/patients", { search: searchQuery }],
  });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="Patients" 
          subtitle="Manage your clinic's patient records and information"
        />

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients by name or CPF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
              </DialogHeader>
              <PatientForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : patients?.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No patients found</p>
              {searchQuery && (
                <p className="text-sm">Try adjusting your search terms</p>
              )}
            </div>
          ) : (
            patients?.map((patient: any) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{patient.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">CPF: {patient.cpf}</p>
                    </div>
                    <Badge variant="secondary">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(patient.createdAt), 'MMM yyyy')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{patient.address}</span>
                    </div>
                  )}
                  {patient.notes && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-md">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {patient.notes}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button size="sm" variant="outline">
                      View History
                    </Button>
                    <Button size="sm">
                      Edit
                    </Button>
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
