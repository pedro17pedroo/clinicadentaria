# 🌱 Instruções de Seed da Base de Dados

## 📋 Visão Geral

Este documento explica como usar os sistemas de seed para configurar a base de dados da clínica dentária em diferentes ambientes.

## 🎯 Tipos de Seed Disponíveis

### 1. Seed Básico (`seed.ts`)
- **Propósito**: Configuração inicial com dados de exemplo
- **Conteúdo**: Tipos básicos (consulta, procedimento, transação), configurações de utilizador e alguns pacientes de exemplo
- **Uso**: Ideal para desenvolvimento e testes iniciais

### 2. Seed com Dados Exportados (`seed-exported-[timestamp].ts`)
- **Propósito**: Replicar o estado atual da base de dados noutro servidor
- **Conteúdo**: Todos os dados reais da base de dados atual (utilizadores, pacientes, consultas, procedimentos, transações)
- **Uso**: Ideal para migração de dados ou configuração de ambiente de produção

## 🚀 Como Usar

### Executar Seed Básico
```bash
# Método 1: Usando npm script
npm run db:seed

# Método 2: Executando diretamente
npx tsx server/seed.ts
```

### Exportar Dados Atuais
```bash
# Gerar novo ficheiro de seed com dados atuais
npx tsx server/export-current-data.ts
```

### Executar Seed com Dados Exportados
```bash
# Executar o ficheiro de seed gerado
npx tsx server/seed-exported-[timestamp].ts

# Ou renomear e usar o script npm
mv server/seed-exported-[timestamp].ts server/seed.ts
npm run db:seed
```

## 📦 Configuração em Novo Servidor

### Pré-requisitos
1. **MongoDB** instalado e em execução
2. **Node.js** e **npm** instalados
3. **Dependências** do projeto instaladas (`npm install`)
4. **Variáveis de ambiente** configuradas (`.env`)

### Passos para Configuração

#### Opção A: Configuração Básica (Desenvolvimento)
```bash
# 1. Clonar o repositório
git clone [url-do-repositorio]
cd clinicadentaria

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com as configurações locais

# 4. Executar seed básico
npm run db:seed

# 5. Iniciar o servidor
npm run dev
```

#### Opção B: Migração de Dados (Produção)
```bash
# 1. No servidor original - exportar dados
npx tsx server/export-current-data.ts

# 2. Copiar ficheiro gerado para o novo servidor
scp server/seed-exported-[timestamp].ts user@novo-servidor:/path/to/project/server/

# 3. No novo servidor - executar seed
npx tsx server/seed-exported-[timestamp].ts

# 4. Verificar dados
npx tsx server/debugStorage.ts
```

## 🔧 Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|----------|
| Seed Básico | `npm run db:seed` | Popula BD com dados básicos |
| Reset BD | `npx tsx server/reset.ts` | Limpa toda a base de dados |
| Exportar Dados | `npx tsx server/export-current-data.ts` | Gera seed com dados atuais |
| Debug Storage | `npx tsx server/debugStorage.ts` | Mostra estatísticas da BD |

## 📊 Dados Incluídos no Seed Básico

### Tipos de Consulta (4)
- Consulta de Rotina (€80)
- Consulta de Urgência (€120)
- Consulta Especializada (€150)
- Avaliação Ortodôntica (€100)

### Tipos de Procedimento (8)
- Limpeza Dentária (€60)
- Restauração (€120)
- Extração Simples (€80)
- Extração Complexa (€200)
- Canal Radicular (€300)
- Clareamento Dental (€250)
- Aplicação de Flúor (€40)
- Prótese Parcial (€800)

### Tipos de Transação (9)
- **Receitas**: Pagamento de Consulta, Procedimento, Tratamento
- **Despesas**: Desconto, Estorno, Material, Equipamento, Aluguel, Salário

### Configurações de Utilizador (4)
- **Administrador**: Acesso total
- **Médico**: Consultas e procedimentos
- **Funcionário**: Agendamentos e pacientes
- **Rececionista**: Agendamentos limitados

### Pacientes de Exemplo (3)
- João Silva
- Maria Santos
- Pedro Oliveira

## ⚠️ Considerações Importantes

### Segurança
- **Nunca** execute seeds em produção sem backup
- **Sempre** verifique a `DATABASE_URL` antes de executar
- **Remova** dados sensíveis dos seeds exportados se necessário

### Performance
- Seeds grandes podem demorar alguns minutos
- Use `--max-old-space-size=4096` para seeds muito grandes
- Considere executar em horários de baixo tráfego

### Troubleshooting

#### Erro de Conexão MongoDB
```bash
# Verificar se MongoDB está em execução
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS

# Verificar variável DATABASE_URL
echo $DATABASE_URL
```

#### Erro de Permissões
```bash
# Dar permissões aos scripts
chmod +x server/*.ts
```

#### Erro de Dependências
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

## 📝 Logs e Monitorização

Todos os scripts de seed produzem logs detalhados:
- ✅ Operações bem-sucedidas
- ❌ Erros e falhas
- 📊 Estatísticas de dados inseridos
- ⏱️ Tempo de execução

## 🔄 Automatização

### Script de Backup e Seed Automático
```bash
#!/bin/bash
# backup-and-seed.sh

echo "🔄 Iniciando backup e seed automático..."

# Fazer backup
./backup-database.sh

# Exportar dados atuais
npx tsx server/export-current-data.ts

# Copiar para servidor de destino (exemplo)
# scp server/seed-exported-*.ts user@backup-server:/path/to/project/server/

echo "✅ Backup e seed concluídos!"
```

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs de erro
2. Consultar este documento
3. Verificar configurações de ambiente
4. Contactar a equipa de desenvolvimento

---

**Última atualização**: 26 de Julho de 2025
**Versão**: 1.0.0