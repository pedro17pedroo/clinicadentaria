import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ClipboardList, CreditCard, BarChart3, ChevronRight } from "lucide-react";
import { PatientForm } from "@/components/forms/patient-form";
import { ProcedureForm } from "@/components/forms/procedure-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";

export function QuickActions() {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const quickActions = [
    {
      id: "new-patient",
      title: "Add New Patient",
      icon: UserPlus,
      color: "text-primary",
      bgColor: "bg-primary/10",
      hoverColor: "group-hover:bg-primary/20",
      action: () => setActiveDialog("patient"),
    },
    {
      id: "record-procedure",
      title: "Record Procedure",
      icon: ClipboardList,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      hoverColor: "group-hover:bg-green-200 dark:group-hover:bg-green-900/50",
      action: () => setActiveDialog("procedure"),
    },
    {
      id: "process-payment",
      title: "Process Payment",
      icon: CreditCard,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      hoverColor: "group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50",
      href: "/finances",
    },
    {
      id: "generate-report",
      title: "Generate Report",
      icon: BarChart3,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      hoverColor: "group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50",
      href: "/reports",
    },
  ];

  const recentActivities = [
    {
      type: "payment",
      message: "Payment received from John Smith",
      time: "2 min ago",
      color: "bg-green-500",
    },
    {
      type: "appointment",
      message: "New appointment scheduled for Lisa Brown",
      time: "15 min ago",
      color: "bg-primary",
    },
    {
      type: "procedure",
      message: "Procedure completed for Mike Davis",
      time: "1 hour ago",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const content = (
              <Button
                variant="ghost"
                className="w-full justify-between p-3 h-auto group"
                onClick={action.action}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${action.bgColor} ${action.hoverColor} rounded-lg flex items-center justify-center transition-colors`}>
                    <Icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <span className="font-medium text-foreground">{action.title}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            );

            if (action.href) {
              return (
                <Link key={action.id} href={action.href}>
                  {content}
                </Link>
              );
            }

            return (
              <div key={action.id}>
                {content}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 text-sm">
              <div className={`w-2 h-2 ${activity.color} rounded-full`} />
              <span className="text-muted-foreground flex-1">
                {activity.message.split(' ').map((word, i) => {
                  // Make names bold
                  if (word === 'John' || word === 'Smith' || word === 'Lisa' || word === 'Brown' || word === 'Mike' || word === 'Davis') {
                    return <span key={i} className="font-medium text-foreground">{word} </span>;
                  }
                  return word + ' ';
                })}
              </span>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={activeDialog === "patient"} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
          </DialogHeader>
          <PatientForm onSuccess={() => setActiveDialog(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === "procedure"} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record New Procedure</DialogTitle>
          </DialogHeader>
          <ProcedureForm onSuccess={() => setActiveDialog(null)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
