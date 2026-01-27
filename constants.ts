import { Expense, ExpenseCategory, OSPriority, OSStatus, OSType, PaymentMethod, ServiceOrder, Unit, User, PersonalTask, Notification } from './types';

export const USERS: User[] = [
  {
    id: 'u1',
    name: 'Juliana',
    email: 'juliana@menubrands.com.br',
    role: 'Gerente de Suprimentos',
    initials: 'JU',
    color: 'bg-purple-600',
    password: '123',
    isAdmin: true
  },
  {
    id: 'u2',
    name: 'Vitor',
    email: 'vitor@menubrands.com.br',
    role: 'Assistente Administrativo',
    initials: 'VI',
    color: 'bg-blue-600',
    password: '123',
    isAdmin: true
  },
  {
    id: 'u4',
    name: 'Ana',
    email: 'ana@menubrands.com.br',
    role: 'Auxiliar Administrativo',
    initials: 'AN',
    color: 'bg-rose-500',
    password: '123',
    isAdmin: false
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
    {
        id: 'n1',
        title: 'Nova OS Crítica',
        message: 'Vitor abriu OS-26009 na Parquelândia.',
        type: 'new_os',
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        read: false,
        linkId: 'OS-26009',
        userInitials: 'VI'
    },
    {
        id: 'n2',
        title: 'Manutenção Concluída',
        message: 'Juliana finalizou a OS-26001 (Ar Condicionado).',
        type: 'completed_os',
        date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        read: true,
        linkId: 'OS-26001',
        userInitials: 'JU'
    },
    {
        id: 'n3',
        title: 'Aprovação Financeira',
        message: 'Gasto de R$ 1.500,00 registrado em Fábrica.',
        type: 'finance',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        read: false,
        linkId: 'FIN-009'
    }
];

export const INITIAL_TASKS: PersonalTask[] = [
    {
        id: 't1',
        userId: 'u2', // Vitor
        title: 'Ligar para o Sr. Raimundo da Panela',
        description: 'Cobrar o conserto da panela de pressão. Ele pediu para lembrar na quarta-feira. Pagamento em espécie.',
        dueDate: '2026-05-27T09:00:00.000Z', // A Wednesday in the future context
        completed: false,
        priority: 'high',
        linkedOSId: 'OS-26010' // Example linkage
    },
    {
        id: 't2',
        userId: 'u2',
        title: 'Cotar preços de lâmpadas LED',
        description: 'Verificar fornecedores no centro para a OS de Eusébio.',
        completed: true,
        priority: 'medium',
        // linkedOSId removed because OS-26011 was deleted (belonged to Carlos)
    },
    {
        id: 't3',
        userId: 'u1', // Juliana
        title: 'Aprovar orçamento do Compressor',
        description: 'Verificar e-mail com a proposta da ClimaFrio.',
        dueDate: '2026-05-25T14:00:00.000Z',
        completed: false,
        priority: 'high'
    }
];

export const INITIAL_ORDERS: ServiceOrder[] = [
  // --- JANEIRO 2026 (ARQUIVADAS / RELATÓRIOS) ---
  {
    id: 'OS-26001',
    title: 'Manutenção Preventiva Ar Condicionado',
    unit: Unit.ALDEOTA,
    description: 'Limpeza geral e verificação de gás nos 4 aparelhos do salão.',
    status: OSStatus.CONCLUIDA,
    type: OSType.PREVENTIVA,
    priority: OSPriority.MEDIA,
    ownerId: 'u1',
    dateOpened: '2026-01-05T08:00:00.000Z',
    dateClosed: '2026-01-07T16:00:00.000Z', // 2 dias (PMA)
    archived: true,
    history: [],
  },
  {
    id: 'OS-26002',
    title: 'Vazamento Pia Cozinha',
    unit: Unit.PARQUELANDIA,
    description: 'Sifão estourado molhando o chão. Troca urgente.',
    status: OSStatus.CONCLUIDA,
    type: OSType.CORRETIVA,
    priority: OSPriority.ALTA,
    ownerId: 'u2',
    dateOpened: '2026-01-10T09:30:00.000Z',
    dateClosed: '2026-01-10T14:00:00.000Z', // 0 dias (mesmo dia)
    archived: true,
    history: [],
  },

  // --- FEVEREIRO 2026 (ARQUIVADAS / RELATÓRIOS) ---
  {
    id: 'OS-26004',
    title: 'Queda de Energia Parcial',
    unit: Unit.CAMBEBA,
    description: 'Disjuntor geral desarmando. Eletricista necessário.',
    status: OSStatus.CONCLUIDA,
    type: OSType.CORRETIVA,
    priority: OSPriority.ALTA,
    ownerId: 'u1',
    dateOpened: '2026-02-02T07:00:00.000Z',
    dateClosed: '2026-02-03T18:00:00.000Z', // 1 dia
    archived: true,
    history: [],
  },
  {
    id: 'OS-26005',
    title: 'Pintura Fachada',
    unit: Unit.EUSEBIO,
    description: 'Retoque na pintura externa desgastada pela chuva.',
    status: OSStatus.CANCELADA,
    type: OSType.PREVENTIVA,
    priority: OSPriority.MEDIA,
    ownerId: 'u2',
    dateOpened: '2026-02-10T08:00:00.000Z',
    dateClosed: '2026-02-15T09:00:00.000Z', // 5 dias até cancelar
    archived: true,
    history: [{ id: '1', date: '2026-02-15T09:00:00.000Z', message: 'Cancelado por chuva intensa na semana.' }],
  },

  // --- MARÇO 2026 (ARQUIVADAS / RELATÓRIOS) ---
  {
    id: 'OS-26006',
    title: 'Troca Motor Geladeira',
    unit: Unit.POKE,
    description: 'Geladeira de bebidas não está gelando.',
    status: OSStatus.CONCLUIDA,
    type: OSType.CORRETIVA,
    priority: OSPriority.ALTA,
    ownerId: 'u4',
    dateOpened: '2026-03-05T11:00:00.000Z',
    dateClosed: '2026-03-12T10:00:00.000Z', // 7 dias (Peça demorou)
    archived: true,
    history: [],
  },

  // --- ABRIL 2026 (MISTO) ---
  {
    id: 'OS-26008',
    title: 'Manutenção Sistema de Gás',
    unit: Unit.FABRICA,
    description: 'Vistoria técnica anual e laudo de estanqueidade.',
    status: OSStatus.CONCLUIDA,
    type: OSType.PREVENTIVA,
    priority: OSPriority.ALTA,
    ownerId: 'u1',
    dateOpened: '2026-04-01T08:00:00.000Z',
    dateClosed: '2026-04-05T17:00:00.000Z', // 4 dias
    archived: true,
    history: [],
  },
  
  // --- MAIO/JUNHO 2026 (ATIVAS / KANBAN) ---
  {
    id: 'OS-26009',
    title: 'Computador PDV Travando',
    unit: Unit.PARQUELANDIA,
    description: 'Caixa 02 lento e reiniciando sozinho.',
    status: OSStatus.ABERTA,
    type: OSType.CORRETIVA,
    priority: OSPriority.ALTA,
    ownerId: 'u2',
    dateOpened: '2026-05-18T10:00:00.000Z',
    history: [{ id: '1', date: '2026-05-18T10:00:00.000Z', message: 'Chamado aberto' }],
  },
  {
    id: 'OS-26010',
    title: 'Compra de Utensílios',
    unit: Unit.ADMINISTRATIVO,
    description: 'Aquisição de panelas novas para a fábrica.',
    status: OSStatus.AGUARDANDO, // Sob Análise
    type: OSType.OUTROS,
    priority: OSPriority.BAIXA,
    ownerId: 'u1',
    dateOpened: '2026-05-20T14:00:00.000Z',
    history: [
        { id: '1', date: '2026-05-20T14:00:00.000Z', message: 'Cotação solicitada' },
        { id: '2', date: '2026-05-21T09:00:00.000Z', message: 'Aguardando aprovação diretoria' }
    ],
  },
  {
    id: 'OS-26012',
    title: 'Vazamento Infiltracão Parede',
    unit: Unit.CAMBEBA,
    description: 'Parede lateral com umidade excessiva.',
    status: OSStatus.ABERTA,
    type: OSType.CORRETIVA,
    priority: OSPriority.MEDIA,
    ownerId: 'u4',
    dateOpened: '2026-05-23T08:30:00.000Z',
    history: [],
  },
  {
    id: 'OS-26013',
    title: 'Manutenção Câmara Fria',
    unit: Unit.ESTOQUE,
    description: 'Preventiva mensal obrigatória.',
    status: OSStatus.EM_ANDAMENTO,
    type: OSType.PREVENTIVA,
    priority: OSPriority.ALTA,
    ownerId: 'u1',
    dateOpened: '2026-05-24T07:00:00.000Z',
    history: [{ id: '1', date: '2026-05-24T07:00:00.000Z', message: 'Prestador iniciou serviço' }],
  },
  {
    id: 'OS-26014',
    title: 'Instalação TV Menu Board',
    unit: Unit.POKE,
    description: 'Instalar TV nova acima do balcão.',
    status: OSStatus.CONCLUIDA,
    type: OSType.INSTALACAO,
    priority: OSPriority.BAIXA,
    ownerId: 'u2',
    dateOpened: '2026-05-15T09:00:00.000Z',
    dateClosed: '2026-05-16T15:00:00.000Z',
    archived: false, // Ainda no Kanban (Encerradas), não arquivada
    history: [{ id: '1', date: '2026-05-16T15:00:00.000Z', message: 'Instalação finalizada' }],
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  // --- JANEIRO 2026 ---
  {
    id: 'FIN-001',
    item: 'Recarga de Gás R410A',
    value: 450.00,
    date: '2026-01-06T10:00:00.000Z',
    supplier: 'ClimaFrio Ltda',
    warrantyPartsMonths: 0,
    warrantyServiceMonths: 3,
    linkedOSId: 'OS-26001',
    category: ExpenseCategory.MAO_DE_OBRA,
    paymentMethod: PaymentMethod.PIX,
    unit: Unit.ALDEOTA,
  },
  {
    id: 'FIN-002',
    item: 'Sifão Metal Cromado',
    value: 89.90,
    date: '2026-01-10T11:00:00.000Z',
    supplier: 'Leroy Merlin',
    warrantyPartsMonths: 12,
    warrantyServiceMonths: 0,
    linkedOSId: 'OS-26002',
    category: ExpenseCategory.PECAS,
    paymentMethod: PaymentMethod.CARTAO_CREDITO,
    unit: Unit.PARQUELANDIA,
  },

  // --- FEVEREIRO 2026 ---
  {
    id: 'FIN-004',
    item: 'Visita Técnica Elétrica',
    value: 250.00,
    date: '2026-02-02T14:00:00.000Z',
    supplier: 'SOS Elétrica',
    warrantyPartsMonths: 0,
    warrantyServiceMonths: 0,
    linkedOSId: 'OS-26004',
    category: ExpenseCategory.MAO_DE_OBRA,
    paymentMethod: PaymentMethod.PIX,
    unit: Unit.CAMBEBA,
  },
  {
    id: 'FIN-005',
    item: 'Disjuntor Bipolar 63A',
    value: 120.00,
    date: '2026-02-03T09:00:00.000Z',
    supplier: 'Casa do Eletricista',
    warrantyPartsMonths: 12,
    warrantyServiceMonths: 0,
    linkedOSId: 'OS-26004',
    category: ExpenseCategory.PECAS,
    paymentMethod: PaymentMethod.A_VISTA,
    unit: Unit.CAMBEBA,
  },

  // --- MARÇO 2026 ---
  {
    id: 'FIN-006',
    item: 'Motor Compressor 1/3HP',
    value: 850.00,
    date: '2026-03-08T10:00:00.000Z',
    supplier: 'Refrigeração Silva',
    warrantyPartsMonths: 12,
    warrantyServiceMonths: 0,
    linkedOSId: 'OS-26006',
    category: ExpenseCategory.PECAS,
    paymentMethod: PaymentMethod.BOLETO,
    unit: Unit.POKE,
  },
  {
    id: 'FIN-007',
    item: 'Mão de Obra Troca Motor',
    value: 300.00,
    date: '2026-03-12T09:00:00.000Z',
    supplier: 'Refrigeração Silva',
    warrantyPartsMonths: 0,
    warrantyServiceMonths: 3,
    linkedOSId: 'OS-26006',
    category: ExpenseCategory.MAO_DE_OBRA,
    paymentMethod: PaymentMethod.PIX,
    unit: Unit.POKE,
  },

  // --- ABRIL 2026 ---
  {
    id: 'FIN-009',
    item: 'Laudo Técnico ART Gás',
    value: 1500.00,
    date: '2026-04-05T10:00:00.000Z',
    supplier: 'Engenharia Gás Total',
    warrantyPartsMonths: 0,
    warrantyServiceMonths: 12,
    linkedOSId: 'OS-26008',
    category: ExpenseCategory.OUTROS,
    paymentMethod: PaymentMethod.BOLETO,
    unit: Unit.FABRICA,
  },

  // --- MAIO 2026 ---
  {
    id: 'FIN-011',
    item: 'Manutenção Mensal Contrato',
    value: 600.00,
    date: '2026-05-24T08:00:00.000Z',
    supplier: 'FrioMax',
    warrantyPartsMonths: 0,
    warrantyServiceMonths: 0,
    linkedOSId: 'OS-26013',
    category: ExpenseCategory.MAO_DE_OBRA,
    paymentMethod: PaymentMethod.BOLETO,
    unit: Unit.ESTOQUE,
  },
  {
    id: 'FIN-012',
    item: 'Suporte Articulado TV',
    value: 180.00,
    date: '2026-05-15T10:00:00.000Z',
    supplier: 'Magalu',
    warrantyPartsMonths: 12,
    warrantyServiceMonths: 0,
    linkedOSId: 'OS-26014',
    category: ExpenseCategory.PECAS,
    paymentMethod: PaymentMethod.PIX,
    unit: Unit.POKE,
  }
];