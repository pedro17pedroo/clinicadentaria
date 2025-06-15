import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Appointments from "@/pages/appointments";
import Patients from "@/pages/patients";
import PatientHistory from "@/pages/patient-history";
import Procedures from "@/pages/procedures";
import Finances from "@/pages/finances";
import Reports from "@/pages/reports";
import UserManagement from "@/pages/user-management";
import DoctorManagement from "@/pages/doctor-management";
import SystemConfig from "@/pages/system-config";
import { ResetPasswordPage } from "@/pages/reset-password";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Rota pública para reset de senha */}
      <Route path="/reset-password" component={ResetPasswordPage} />
      
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/appointments" component={Appointments} />
          <Route path="/patients" component={Patients} />
          <Route path="/patients/:id/history" component={PatientHistory} />
          <Route path="/procedures" component={Procedures} />
          <Route path="/finances" component={Finances} />
          <Route path="/reports" component={Reports} />
          <Route path="/user-management" component={UserManagement} />
            <Route path="/doctor-management" component={DoctorManagement} />
            <Route path="/system-config" component={SystemConfig} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
