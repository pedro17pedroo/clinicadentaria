import { Moon, Sun, Bell, ChevronDown, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useTraditionalAuth } from "@/hooks/useTraditionalAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const auth = useTraditionalAuth();
  const { theme, setTheme } = useTheme();
  const user = auth.user;
  
  // Funções auxiliares para manipulação de dados do usuário
  const getUserInitials = (user: any) => {
    // Acessar dados do Mongoose através de _doc se disponível
    const userData = user?._doc || user;
    
    if (userData?.firstName && userData?.lastName) {
      return `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase();
    }
    if (userData?.name) {
      // Usar o campo name se disponível
      const nameParts = userData.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return userData.name.slice(0, 2).toUpperCase();
    }
    if (userData?.email) {
      return userData.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = (user: any) => {
    if (!user) return "User";
    
    // Acessar dados do Mongoose através de _doc se disponível
    const userData = user._doc || user;
    
    if (userData.firstName && userData.lastName) {
      return `${userData.firstName} ${userData.lastName}`;
    }
    if (userData.name) {
      return userData.name;
    }
    if (userData.email) {
      return userData.email;
    }
    return "User";
  };

  const getUserRoleDisplay = (user: any) => {
    if (!user) return 'User';
    
    // Acessar dados do Mongoose através de _doc se disponível
    const userData = user._doc || user;
    const userType = userData.userType;
    
    if (!userType) return 'User';
    
    // Converter para string se não for
    const typeStr = String(userType).toLowerCase();
    
    switch (typeStr) {
      case 'admin':
        return 'Administrador';
      case 'employee':
        return 'Funcionário';
      case 'doctor':
        return 'Médico';
      default:
        return 'User';
    }
  };
  
  const handleLogout = async () => {
    try {
      // Chama a API de logout no servidor
      await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Erro ao fazer logout no servidor:', error);
    } finally {
      // Remove os dados locais e redireciona
      auth.logout();
      window.location.href = '/';
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
                  {getUserRoleDisplay(user)}
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
