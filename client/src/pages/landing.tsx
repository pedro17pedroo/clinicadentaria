import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { Moon, Sun, Torus, Users, Calendar, DollarSign, BarChart3, Shield } from "lucide-react";

export default function Landing() {
  const { theme, setTheme } = useTheme();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Torus className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">DentalCare Pro</h1>
              <p className="text-sm text-muted-foreground">Management System</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Complete Dental Clinic
            <span className="text-primary block">Management Solution</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your dental practice with our comprehensive management system. 
            Handle appointments, patient records, procedures, and finances all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleLogin} className="text-lg px-8">
              Sign In to Get Started
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need to Manage Your Practice
            </h3>
            <p className="text-lg text-muted-foreground">
              Comprehensive tools designed specifically for dental clinics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smart Scheduling</CardTitle>
                <CardDescription>
                  Intelligent appointment scheduling with availability validation and conflict prevention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Doctor availability tracking</li>
                  <li>• Consultation type matching</li>
                  <li>• Automatic conflict detection</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Patient Management</CardTitle>
                <CardDescription>
                  Complete patient profiles with clinical history and treatment records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Comprehensive patient records</li>
                  <li>• Clinical history tracking</li>
                  <li>• Treatment documentation</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Financial Tracking</CardTitle>
                <CardDescription>
                  Comprehensive financial management with automated transaction generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Automatic billing creation</li>
                  <li>• Payment status tracking</li>
                  <li>• Revenue reporting</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Interactive Reports</CardTitle>
                <CardDescription>
                  Detailed analytics and reporting with visual charts and export capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Revenue analytics</li>
                  <li>• Patient statistics</li>
                  <li>• Export to PDF/CSV</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Role-Based Access</CardTitle>
                <CardDescription>
                  Secure user management with role-based permissions and access control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Admin, Employee, Doctor roles</li>
                  <li>• Granular permissions</li>
                  <li>• Secure authentication</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Torus className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Procedure Tracking</CardTitle>
                <CardDescription>
                  Detailed procedure documentation linked to consultations and patients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Procedure categorization</li>
                  <li>• Cost tracking</li>
                  <li>• Treatment history</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-foreground mb-6">
            Ready to Streamline Your Practice?
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            Join dental professionals who trust DentalCare Pro to manage their clinics efficiently.
          </p>
          <Button size="lg" onClick={handleLogin} className="text-lg px-8">
            Start Managing Your Clinic Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Torus className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">DentalCare Pro</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 DentalCare Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
