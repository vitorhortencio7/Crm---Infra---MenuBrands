
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

export interface Supplier {
  id: string;
  name: string; // Nome da Empresa
  category: string; // Ex: Elétrica, Hidráulica, Geral
  contactInfo?: string; // Telefone ou Email (Renamed from contact/contactName to match backend)
  active?: boolean;
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

export enum ExpenseStatus {
  PENDENTE = 'Pendente', // Aguardando Pagamento
  PROGRAMADO = 'Programado', // Incluído na remessa da semana
  PAGO = 'Pago',
}

export interface PaymentDetails {
  beneficiaryName: string;
  beneficiaryType: 'PF' | 'PJ';
  docNumber: string; // CPF or CNPJ
  pixKey?: string;
  bankInfo?: {
    bank: string;
    agency: string;
    account: string;
  };
}

export interface ExpenseAttachment {
  id: string;
  name: string;
  url: string; // Base64 or Blob URL
  type: 'image' | 'pdf' | 'other';
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
  attachments?: ExpenseAttachment[]; // New field for files
  status?: ExpenseStatus; // Status do fluxo financeiro
  paymentData?: PaymentDetails; // Dados bancários confirmados para pagamento
}

export interface PersonalTask {
  id: string;
  userId: string; // Each user has their own tasks
  title: string;
  description?: string;
  dueDate?: string; // ISO Date
  status: 'todo' | 'doing' | 'done'; // Changed from completed boolean
  priority: 'high' | 'medium' | 'low';
  linkedOSId?: string; // Optional link to an OS context
  createdAt?: string;
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

// --- NOVOS TIPOS PARA PATRIMÔNIO (BENS) ---

export enum AssetStatus {
  ATIVO = 'Ativo',
  INATIVO = 'Inativo',
  EM_MANUTENCAO = 'Em Manutenção',
  BAIXADO = 'Baixado',
}

export enum AssetCategory {
  TI = 'TI / Informática',
  COZINHA = 'Equip. Cozinha',
  REFRIGERACAO = 'Refrigeração',
  MOVEIS = 'Mobiliário',
  ESTRUTURA = 'Estrutura / Predial',
  OUTROS = 'Outros',
}

export interface AssetWarranty {
  hasWarranty: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface AssetInvoiceInfo {
  supplierName?: string; // Texto livre, sem vínculo obrigatório com entidade Supplier
  cnpj?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceUrl?: string; // PDF link/base64
}

export interface Asset {
  id: string;
  assetTag: string; // Etiqueta física (Patrimônio)
  name: string;
  unit: Unit;
  category: AssetCategory;
  status: AssetStatus;
  brand?: string;
  model?: string;
  description?: string;
  value?: number;
  photoUrl?: string;
  registrationDate: string;
  warranty: AssetWarranty;
  invoiceInfo: AssetInvoiceInfo;
  // Histórico simples de OS que esse equipamento passou
  linkedOSIds?: string[];
}

// --- CONTROLE DE MANUTENÇÃO EXTERNA ---
export interface MaintenanceRecord {
  id: string;
  assetId: string;
  providerName: string; // Quem está com o bem (Tec Services, Zé da Elétrica, etc)
  contactInfo?: string; // Telefone ou Whatsapp
  dateOut: string; // Quando saiu
  dateReturnForecast?: string; // Previsão de volta
  dateReturned?: string; // Quando voltou (se preenchido, está concluído)
  description: string; // O que foi fazer? (Troca de cabo, orçamento...)
  active: boolean; // Se true, o bem está fora. Se false, já voltou.
}
