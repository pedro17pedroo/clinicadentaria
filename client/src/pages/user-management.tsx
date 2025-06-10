import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Users, Shield, Mail, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { USER_TYPES } from "@/lib/constants";

export default function UserManagement() {
  const { toast } = useToast();

  // For now, we'll use a mock list of users since we don't have a users endpoint yet
  // In a real implementation, this would fetch from /api/users
  const mockUsers = [
    {
      id: "user-1",
      email: "admin@clinic.com",
      firstName: "John",
      lastName: "Admin",
      userType: "admin",
      createdAt: "2024-01-01T00:00:00Z",
      isActive: true,
    },
    {
      id: "user-2", 
      email: "receptionist@clinic.com",
      firstName: "Jane",
      lastName: "Smith",
      userType: "employee",
      createdAt: "2024-01-15T00:00:00Z",
      isActive: true,
    },
    {
      id: "user-3",
      email: "dr.johnson@clinic.com", 
      firstName: "Sarah",
      lastName: "Johnson",
      userType: "doctor",
      createdAt: "2024-02-01T00:00:00Z",
      isActive: true,
    },
  ];

  const updateUserTypeMutation = useMutation({
    mutationFn: async ({ userId, userType }: { userId: string; userType: string }) => {
      await apiRequest("PUT", `/api/users/${userId}/type`, { userType });
    },
    onSuccess: () => {
      // In a real app, we'd invalidate the users query here
      // queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User type updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUserTypeChange = (userId: string, newUserType: string) => {
    updateUserTypeMutation.mutate({ userId, userType: newUserType });
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "doctor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "employee":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case "admin":
        return <Shield className="h-3 w-3 mr-1" />;
      case "doctor":
        return <UserCog className="h-3 w-3 mr-1" />;
      case "employee":
        return <Users className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const getUserInitials = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.slice(0, 2).toUpperCase() || "U";
  };

  const getUserDisplayName = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-6">
        <Header 
          title="User Management" 
          subtitle="Manage user accounts and permissions"
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{mockUsers.length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">
                    {mockUsers.filter(u => u.isActive).length}
                  </p>
                </div>
                <UserCog className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Administrators</p>
                  <p className="text-2xl font-bold">
                    {mockUsers.filter(u => u.userType === 'admin').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>System Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.profileImageUrl} alt={getUserDisplayName(user)} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold text-foreground">
                          {getUserDisplayName(user)}
                        </p>
                        <Badge className={getUserTypeColor(user.userType)}>
                          {getUserTypeIcon(user.userType)}
                          {getUserRoleDisplay(user.userType)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {format(new Date(user.createdAt), 'MMM yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Role:</span>
                      <Select
                        value={user.userType}
                        onValueChange={(value) => handleUserTypeChange(user.id, value)}
                        disabled={updateUserTypeMutation.isPending}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={USER_TYPES.ADMIN}>Administrator</SelectItem>
                          <SelectItem value={USER_TYPES.EMPLOYEE}>Employee</SelectItem>
                          <SelectItem value={USER_TYPES.DOCTOR}>Doctor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className={user.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
