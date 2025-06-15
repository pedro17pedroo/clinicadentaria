import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Calendar, DollarSign, Users, ArrowUp } from "lucide-react";

interface MetricsProps {
  metrics?: {
    todayAppointments: number;
    pendingPayments: number;
    monthlyRevenue: number;
    activePatients: number;
  };
}

export function DashboardMetrics({ metrics }: MetricsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
    }).format(amount);
  };

  const metricCards = [
    {
      title: "Consultas de Hoje",
      value: metrics?.todayAppointments || 0,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
      change: "+8%",
      changeText: "vs ontem",
      trend: "up"
    },
    {
      title: "Pagamentos Pendentes",
      value: formatCurrency(metrics?.pendingPayments || 0),
      icon: TrendingUp,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      change: "5 faturas",
      changeText: "pendentes",
      trend: "neutral"
    },
    {
      title: "Receita Mensal",
      value: formatCurrency(metrics?.monthlyRevenue || 0),
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      change: "+15%",
      changeText: "vs mês passado",
      trend: "up"
    },
    {
      title: "Pacientes Ativos",
      value: metrics?.activePatients || 0,
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      change: "+12",
      changeText: "novos esta semana",
      trend: "up"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metricCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                {card.trend === "up" && (
                  <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                )}
                <span className={card.trend === "up" ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}>
                  {card.change}
                </span>
                <span className="text-muted-foreground ml-1">{card.changeText}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
