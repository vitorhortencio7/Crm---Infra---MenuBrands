
export enum Unit {
  ALDEOTA = 'Aldeota',
  PARQUELANDIA = 'Parquelândia',
  CAMBEBA = 'Cambeba',
  EUSEBIO = 'Eusébio',
  POKE = 'Poke (Santos Dumont)',
  ESTOQUE = 'Estoque',
  FABRICA = 'Fábrica',
  ADMINISTRATIVO = 'Administrativo',
}

export enum OSStatus {
  ABERTA = 'Aberta',
  EM_ANDAMENTO = 'Em Andamento',
  AGUARDANDO = 'Aguardando', // Orçamento/Peça/Prestador
  CONCLUIDA = 'Concluída',
  CANCELADA = 'Cancelada',
}

export enum OSPriority {
  ALTA = 'Alta',
  MEDIA = 'Média',
  BAIXA = 'Baixa',
}

export enum OSType {
  CORRETIVA = 'Corretiva',
  PREVENTIVA = 'Preventiva',
  INSTALACAO = 'Instalação',
  OUTROS = 'Outros',
}

export interface User {
  id: string;
  name: string;
  email: string; // Added email
  role: string;
  initials: string;
  color: string; // Tailwind class for background
  password?: string; // Simple mock password
  isAdmin?: boolean;
  avatarUrl?: string; // Added avatar URL (base64 or link)
  isGuest?: boolean; // Flag for anonymous/executive access
}

export interface HistoryLog {
  id: string;
  date: string; // ISO String
  message: string;
  userId?: string; // ID of the user who sent the message
}

export interface ServiceOrder {
  id: string; // e.g., OS-001
  title: string;
  unit: Unit;
  description: string;
  status: OSStatus;
  type: OSType;
  priority: OSPriority;
  ownerId: string; // ID of the User responsible
  dateOpened: string;
  dateForecast?: string;
  dateClosed?: string;
  history: HistoryLog[];
  archived?: boolean; // New property to track documented/archived status
}

export enum ExpenseCategory {
  PECAS = 'Peças',
  MAO_DE_OBRA = 'Mão de Obra',
  OUTROS = 'Outros',
}

export enum PaymentMethod {
  A_VISTA = 'À vista',
  BOLETO = 'Boleto',
  PIX = 'Pix',
  CARTAO_CREDITO = 'Cartão de Crédito',
  OUTROS = 'Outros',
}

export interface Expense {
  id: string; // e.g., FIN-001
  item: string;
  value: number;
  date: string;
  supplier: string;
  warrantyPartsMonths: number;   // Split warranty
  warrantyServiceMonths: number; // Split warranty
  linkedOSId?: string; // Optional link to OS
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  unit: Unit;
}

export interface PersonalTask {
  id: string;
  userId: string; // Each user has their own tasks
  title: string;
  description?: string;
  dueDate?: string; // ISO Date
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  linkedOSId?: string; // Optional link to an OS context
}

export type NotificationType = 'new_os' | 'completed_os' | 'finance' | 'alert' | 'system';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  date: string;
  read: boolean;
  linkId?: string; // ID to link (OS-XXX or FIN-XXX)
  userInitials?: string; // Initials of who triggered
}