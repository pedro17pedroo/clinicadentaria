import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { Moon, Sun, Bell, ChevronDown, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.email) {
      return user.email;
    }
    return "User";
  };

  const getUserRoleDisplay = (userType: string) => {
    switch (userType) {
      case 'admin':
        return 'Administrator';
      case 'employee':
        return 'Employee';
      case 'doctor':
        return 'Doctor';
      default:
        return 'User';
    }
  };

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-muted-foreground">{subtitle}</p>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        
        {/* Notifications */}
        <div className="relative">
          <Button variant="outline" size="icon">
            <Bell className="h-[1.2rem] w-[1.2rem]" />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
              3
            </Badge>
          </Button>
        </div>
        
        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-3 h-auto p-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.profileImageUrl} alt={getUserDisplayName(user)} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium">{getUserDisplayName(user)}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.userType ? getUserRoleDisplay(user.userType) : 'User'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
