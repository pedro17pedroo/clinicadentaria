export const USER_TYPES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  DOCTOR: 'doctor',
} as const;

export const APPOINTMENT_STATUSES = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const TRANSACTION_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
} as const;

export const TRANSACTION_TYPES = {
  CONSULTATION: 'consultation',
  PROCEDURE: 'procedure',
} as const;

export const NAVIGATION_ITEMS = [
  {
    title: 'Dashboard',
    href: '/',
    icon: 'BarChart3',
    roles: [USER_TYPES.ADMIN, USER_TYPES.EMPLOYEE, USER_TYPES.DOCTOR],
  },
  {
    title: 'Consultas',
    href: '/appointments',
    icon: 'Calendar',
    roles: [USER_TYPES.ADMIN, USER_TYPES.EMPLOYEE, USER_TYPES.DOCTOR],
  },
  {
    title: 'Pacientes',
    href: '/patients',
    icon: 'Users',
    roles: [USER_TYPES.ADMIN, USER_TYPES.EMPLOYEE, USER_TYPES.DOCTOR],
  },
  {
    title: 'Procedimentos',
    href: '/procedures',
    icon: 'Activity',
    roles: [USER_TYPES.ADMIN, USER_TYPES.EMPLOYEE, USER_TYPES.DOCTOR],
  },
  {
    title: 'Finanças',
    href: '/finances',
    icon: 'DollarSign',
    roles: [USER_TYPES.ADMIN, USER_TYPES.EMPLOYEE],
  },
  {
    title: 'Relatórios',
    href: '/reports',
    icon: 'BarChart3',
    roles: [USER_TYPES.ADMIN, USER_TYPES.EMPLOYEE],
  },
];

export const ADMIN_NAVIGATION_ITEMS = [
  {
    title: 'Gestão de Usuários',
    href: '/user-management',
    icon: 'UserCog',
    roles: [USER_TYPES.ADMIN],
  },
  {
    title: 'Gestão de Médicos',
    href: '/doctor-management',
    icon: 'Stethoscope',
    roles: [USER_TYPES.ADMIN],
  },
  {
    title: 'Configurações do Sistema',
    href: '/system-config',
    icon: 'Settings',
    roles: [USER_TYPES.ADMIN],
  },
];
