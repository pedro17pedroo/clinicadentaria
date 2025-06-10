import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Torus, 
  BarChart3, 
  Calendar, 
  Users, 
  Activity, 
  DollarSign, 
  UserCog, 
  Settings 
} from "lucide-react";
import { NAVIGATION_ITEMS, ADMIN_NAVIGATION_ITEMS, USER_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap = {
  BarChart3,
  Calendar,
  Users,
  Activity,
  DollarSign,
  UserCog,
  Settings,
};

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const hasAccess = (roles: string[]) => {
    return user?.userType && roles.includes(user.userType);
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <aside className="w-64 bg-sidebar-background border-r border-sidebar-border fixed left-0 top-0 h-full z-10 dark:bg-sidebar-background">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Torus className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">DentalCare Pro</h1>
            <p className="text-sm text-sidebar-foreground/70">Management System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {NAVIGATION_ITEMS.map((item) => {
            if (!hasAccess(item.roles)) return null;
            
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const active = isActive(item.href);
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start space-x-3 h-12",
                    active 
                      ? "bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/20" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Button>
              </Link>
            );
          })}

          {/* Admin Section */}
          {user?.userType === USER_TYPES.ADMIN && (
            <>
              <Separator className="my-4" />
              <div className="pt-4">
                <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wide mb-2 px-3">
                  Administration
                </p>
                {ADMIN_NAVIGATION_ITEMS.map((item) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap];
                  const active = isActive(item.href);
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start space-x-3 h-12",
                          active 
                            ? "bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-primary/20" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}
