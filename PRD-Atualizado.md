# Product Requirements Document (PRD) - Sistema de Gestão Financeira para Clínica Dentária
## Versão Atualizada - Junho 2025
---

## 1. Introdução

Este PRD define os requisitos atualizados do sistema de gestão financeira e operacional para clínicas dentárias, baseado na implementação atual do MVP. O sistema visa otimizar o agendamento de consultas, gestão de procedimentos, registos de pacientes, controlo financeiro e relatórios, com controlo robusto de acesso de utilizadores.

### 1.1 Objetivo

Fornecer uma plataforma que permite às clínicas dentárias:

- Agendar e gerir consultas com verificações lógicas de disponibilidade
- Registar procedimentos ligados a consultas e manter históricos clínicos de pacientes
- Acompanhar transações financeiras (receitas de consultas/procedimentos)
- Gerar relatórios financeiros interativos
- Gerir utilizadores com permissões baseadas em funções e acesso seguro

### 1.2 Âmbito

O MVP foca-se em funcionalidades essenciais para operações de clínica única, incluindo gestão de utilizadores, agendamento de consultas, registo de procedimentos, histórico de pacientes, transações financeiras e relatórios básicos.

---

## 2. Stack Tecnológica Atual

### 2.1 Frontend
- **Framework**: React 18.3.1 com TypeScript
- **Build Tool**: Vite 5.4.14
- **UI Framework**: Tailwind CSS 3.4.17
- **Componentes UI**: Radix UI (componentes acessíveis)
- **Gestão de Estado**: TanStack Query 5.60.5
- **Formulários**: React Hook Form 7.55.0 com Zod validation
- **Routing**: Wouter 3.3.5
- **Ícones**: Lucide React 0.453.0
- **Animações**: Framer Motion 11.13.1
- **Temas**: Next Themes 0.4.6 (suporte para tema escuro/claro)

### 2.2 Backend
- **Runtime**: Node.js com TypeScript
- **Framework**: Express.js 4.21.2
- **Base de Dados**: MongoDB com Mongoose 8.15.1
- **Autenticação**: Passport.js com estratégia local
- **Sessões**: Express Session com Connect-Mongo
- **Validação**: Zod 3.24.2
- **Encriptação**: bcrypt 6.0.0
- **JWT**: jsonwebtoken 9.0.2

### 2.3 Ferramentas de Desenvolvimento
- **Bundler**: esbuild 0.25.0
- **TypeScript**: 5.6.3
- **Linting**: Configuração personalizada
- **Package Manager**: npm

---

## 3. Arquitetura do Projeto

### 3.1 Estrutura de Diretórios

```
clinicadentaria/
├── client/                 # Frontend React
│   └── src/
│       ├── components/     # Componentes reutilizáveis
│       │   ├── auth/       # Componentes de autenticação
│       │   ├── dashboard/  # Componentes do dashboard
│       │   ├── forms/      # Formulários
│       │   ├── layout/     # Layout da aplicação
│       │   └── ui/         # Componentes UI base
│       ├── hooks/          # Custom hooks
│       ├── lib/            # Utilitários e configurações
│       └── pages/          # Páginas da aplicação
├── server/                 # Backend Express
│   ├── routes.ts           # Rotas da API
│   ├── authRoutes.ts       # Rotas de autenticação
│   ├── db.ts              # Configuração MongoDB
│   └── index.ts           # Servidor principal
├── shared/                 # Código partilhado
│   └── schema.ts          # Schemas e interfaces
└── package.json           # Dependências e scripts
```

### 3.2 Padrões Arquiteturais
- **Monorepo**: Frontend e backend no mesmo repositório
- **Shared Types**: Interfaces TypeScript partilhadas
- **API RESTful**: Endpoints organizados por recurso
- **Component-Based**: Arquitetura de componentes React
- **Hook Pattern**: Custom hooks para lógica reutilizável

---

## 4. Modelo de Dados Atual

### 4.1 Entidades Principais

#### Utilizador (IUser)
```typescript
{
  email: string (único)
  firstName?: string
  lastName?: string
  userType: 'admin' | 'employee' | 'doctor'
  specialties?: string[]
  contactInfo?: string
  isActive: boolean
  password?: string
  mustChangePassword?: boolean
  // Campos específicos para médicos
  workingDays?: string[]
  workingHours?: { start: string; end: string }
  consultationTypes?: string[]
  procedureTypes?: string[]
}
```

#### Paciente (IPatient)
```typescript
{
  name: string
  di?: string              # Documento de Identidade
  nif?: string             # NIF (único, opcional)
  phone?: string
  email?: string
  address?: string
  notes?: string
}
```

#### Consulta (IAppointment)
```typescript
{
  patientId: ObjectId
  doctorId: ObjectId
  consultationTypeId: ObjectId
  date: Date
  time: string
  status: 'scheduled' | 'cancelled' | 'completed'
  notes?: string
}
```

#### Procedimento (IProcedure)
```typescript
{
  appointmentId?: ObjectId
  patientId: ObjectId
  doctorId: ObjectId
  procedureTypeId: ObjectId
  date: Date
  cost: number
  notes?: string
}
```

#### Transação Financeira (ITransaction)
```typescript
{
  patientId?: ObjectId
  appointmentId?: ObjectId
  procedureId?: ObjectId
  transactionTypeId: ObjectId
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  description?: string
  transactionDate: Date
  dueDate?: Date
  paidDate?: Date
}
```

### 4.2 Tipos de Configuração
- **Tipos de Consulta** (IConsultationType): nome, preço, descrição
- **Tipos de Procedimento** (IProcedureType): nome, preço, categoria
- **Tipos de Transação** (ITransactionType): nome, categoria (receita/despesa)
- **Configuração de Tipos de Utilizador** (IUserTypeConfig): permissões personalizáveis

---

## 5. Funcionalidades Implementadas

### 5.1 Gestão de Utilizadores
- ✅ Registo de utilizadores por administradores
- ✅ Tipos de utilizador: Admin, Employee, Doctor
- ✅ Permissões baseadas em funções
- ✅ Gestão de perfis de utilizador
- ✅ Sistema de especialidades para médicos

### 5.2 Autenticação e Segurança
- ✅ Login com email e password
- ✅ Encriptação de passwords com bcrypt
- ✅ Sessões seguras com Express Session
- ✅ Obrigatoriedade de mudança de password no primeiro login
- ✅ Sistema de reset de password
- ✅ Controlo de acesso baseado em funções

### 5.3 Gestão de Pacientes
- ✅ Registo completo de pacientes
- ✅ Campos: nome, DI, NIF, contactos, morada
- ✅ Pesquisa por nome ou documentos
- ✅ Histórico clínico completo
- ✅ Notas médicas adicionais

### 5.4 Agendamento de Consultas
- ✅ Criação de consultas com validação de disponibilidade
- ✅ Seleção de paciente, tipo de consulta e médico
- ✅ Validação de conflitos de horário
- ✅ Estados: Agendada, Cancelada, Concluída
- ✅ Interface intuitiva de agendamento

### 5.5 Gestão de Procedimentos
- ✅ Registo de procedimentos após consultas
- ✅ Múltiplos procedimentos por consulta
- ✅ Cálculo automático de custos
- ✅ Ligação a consultas originais
- ✅ Histórico de procedimentos por paciente

### 5.6 Sistema Financeiro
- ✅ Geração automática de transações
- ✅ Estados: Pendente, Pago, Em Atraso
- ✅ Acompanhamento de receitas e despesas
- ✅ Relatórios financeiros básicos
- ✅ Formatação monetária em AOA/KZ

### 5.7 Dashboard e Relatórios
- ✅ Dashboard com métricas principais
- ✅ Visão geral financeira
- ✅ Agenda de consultas
- ✅ Ações rápidas
- ✅ Relatórios por período

### 5.8 Interface de Utilizador
- ✅ Design responsivo (desktop/tablet/mobile)
- ✅ Tema escuro e claro
- ✅ Componentes acessíveis (Radix UI)
- ✅ Navegação intuitiva
- ✅ Feedback visual com toasts

---

## 6. Páginas e Funcionalidades Detalhadas

### 6.1 Páginas Implementadas

1. **Dashboard** (`/dashboard`)
   - Métricas financeiras
   - Agenda do dia
   - Ações rápidas
   - Visão geral do sistema

2. **Consultas** (`/appointments`)
   - Lista de consultas
   - Agendamento de novas consultas
   - Gestão de estados
   - Filtros e pesquisa

3. **Pacientes** (`/patients`)
   - Lista de pacientes
   - Registo de novos pacientes
   - Edição de informações
   - Histórico clínico

4. **Procedimentos** (`/procedures`)
   - Lista de procedimentos
   - Registo de novos procedimentos
   - Filtros por paciente
   - Cálculo de custos

5. **Finanças** (`/finances`)
   - Transações financeiras
   - Gestão de pagamentos
   - Relatórios financeiros
   - Análise de receitas

6. **Relatórios** (`/reports`)
   - Relatórios personalizáveis
   - Exportação de dados
   - Análises estatísticas
   - Gráficos interativos

7. **Gestão de Utilizadores** (`/user-management`)
   - Lista de utilizadores
   - Criação de contas
   - Gestão de permissões
   - Configuração de perfis

8. **Gestão de Médicos** (`/doctor-management`)
   - Perfis de médicos
   - Especialidades
   - Horários de trabalho
   - Tipos de consulta

9. **Configurações do Sistema** (`/system-config`)
   - Tipos de consulta
   - Tipos de procedimento
   - Configurações gerais
   - Parâmetros do sistema

### 6.2 Componentes de Formulário

- **AppointmentForm**: Agendamento de consultas
- **PatientForm**: Registo/edição de pacientes
- **ProcedureForm**: Registo de procedimentos
- **Formulários de Autenticação**: Login, reset password, mudança de password

---

## 7. Requisitos Não-Funcionais

### 7.1 Performance
- ✅ Tempos de carregamento < 2 segundos
- ✅ Suporte para até 50 utilizadores simultâneos
- ✅ Otimização com TanStack Query (cache)
- ✅ Lazy loading de componentes

### 7.2 Segurança
- ✅ Encriptação de dados sensíveis
- ✅ Controlo de acesso ao nível da API
- ✅ Armazenamento seguro de passwords
- ✅ Validação de dados com Zod
- ✅ Proteção contra ataques comuns

### 7.3 Usabilidade
- ✅ Interface intuitiva e moderna
- ✅ Design responsivo
- ✅ Suporte para temas escuro/claro
- ✅ Feedback visual consistente
- ✅ Acessibilidade (WCAG)

### 7.4 Confiabilidade
- ✅ Gestão de erros robusta
- ✅ Validação de dados em tempo real
- ✅ Recuperação automática de sessões
- ✅ Backup automático (MongoDB)

---

## 8. Fluxos de Utilizador Implementados

### 8.1 Fluxo de Autenticação
1. Login com email/password
2. Verificação de credenciais
3. Redirecionamento para dashboard
4. Gestão de sessão ativa

### 8.2 Fluxo de Agendamento
1. Acesso à página de consultas
2. Seleção/registo de paciente
3. Escolha do tipo de consulta
4. Seleção de médico disponível
5. Escolha de data/hora
6. Confirmação e gravação

### 8.3 Fluxo de Procedimentos
1. Conclusão de consulta
2. Acesso ao registo de procedimentos
3. Seleção de procedimentos realizados
4. Atribuição de médicos
5. Adição de notas clínicas
6. Geração automática de transação financeira

### 8.4 Fluxo Financeiro
1. Geração automática de transação (consulta/procedimento)
2. Estado inicial: Pendente
3. Atualização manual para Pago/Em Atraso
4. Registo de data de pagamento
5. Atualização de relatórios financeiros

---

## 9. Configurações e Personalizações

### 9.1 Tipos de Consulta
- Nome, preço, descrição
- Estado ativo/inativo
- Associação a médicos específicos

### 9.2 Tipos de Procedimento
- Nome, preço, categoria
- Descrição detalhada
- Estado ativo/inativo

### 9.3 Tipos de Utilizador
- Permissões personalizáveis
- Acesso granular a funcionalidades
- Configuração flexível de funções

### 9.4 Configurações de Sistema
- Moeda padrão (AOA/KZ)
- Formatos de data/hora
- Configurações de notificação
- Parâmetros de segurança

---

## 10. Melhorias e Funcionalidades Futuras

### 10.1 Curto Prazo (1-3 meses)
- [ ] Integração com gateway de pagamento
- [ ] Notificações por email/SMS
- [ ] Relatórios avançados com gráficos
- [ ] Exportação de dados (PDF/CSV)
- [ ] Sistema de backup automático

### 10.2 Médio Prazo (3-6 meses)
- [ ] Aplicação móvel para médicos
- [ ] Sistema de lembretes automáticos
- [ ] Integração com calendários externos
- [ ] API pública para integrações
- [ ] Sistema de auditoria completo

### 10.3 Longo Prazo (6+ meses)
- [ ] Suporte multi-clínica
- [ ] Análises preditivas
- [ ] Inteligência artificial para agendamento
- [ ] Sistema de telemedicina
- [ ] Integração com sistemas de saúde nacionais

---

## 11. Considerações Técnicas

### 11.1 Escalabilidade
- Arquitetura preparada para crescimento
- Base de dados MongoDB escalável
- Frontend otimizado com code splitting
- API RESTful bem estruturada

### 11.2 Manutenibilidade
- Código TypeScript bem tipado
- Componentes reutilizáveis
- Testes automatizados (a implementar)
- Documentação técnica atualizada

### 11.3 Deployment
- Configuração para ambientes múltiplos
- Scripts de build otimizados
- Variáveis de ambiente configuráveis
- Processo de CI/CD (a implementar)

---

## 12. Conclusão

O sistema atual representa uma implementação sólida e funcional dos requisitos originais do PRD, com melhorias significativas na experiência do utilizador, segurança e funcionalidades. A stack tecnológica moderna garante performance, escalabilidade e manutenibilidade a longo prazo.

O projeto está bem posicionado para futuras expansões e melhorias, mantendo uma base sólida que suporta as operações diárias de uma clínica dentária moderna.

---

**Documento atualizado em**: Dezembro 2024  
**Versão**: 2.0  
**Próxima revisão**: Março 2025