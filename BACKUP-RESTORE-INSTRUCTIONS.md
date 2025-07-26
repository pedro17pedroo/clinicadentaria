# 📋 Instruções de Backup e Restauro da Base de Dados

## Sistema de Gestão Financeira - Clínica Dentária

---

## 🎯 Visão Geral

Este documento fornece instruções completas para fazer backup e restaurar a base de dados MongoDB do sistema de gestão financeira da clínica dentária.

### 📊 Informações da Base de Dados
- **Tipo**: MongoDB
- **Nome da Base de Dados**: `clinica_dentaria`
- **Servidor Padrão**: `localhost:27017`
- **Coleções Principais**:
  - `users` - Utilizadores do sistema
  - `patients` - Pacientes
  - `appointments` - Consultas
  - `procedures` - Procedimentos
  - `transactions` - Transações financeiras
  - `consultationtypes` - Tipos de consulta
  - `proceduretypes` - Tipos de procedimento
  - `transactiontypes` - Tipos de transação

---

## 💾 Como Fazer Backup

### 📋 Pré-requisitos
1. **MongoDB Tools** instalados no sistema
2. **MongoDB** em execução
3. **Acesso** à base de dados
4. **Espaço em disco** suficiente para o backup

### 🔧 Instalação do MongoDB Tools (se necessário)

#### macOS (usando Homebrew)
```bash
brew install mongodb/brew/mongodb-database-tools
```

#### Ubuntu/Debian
```bash
sudo apt-get install mongodb-database-tools
```

#### Windows
Baixe e instale a partir de: https://www.mongodb.com/try/download/database-tools

### 🚀 Executar Backup

#### Método 1: Usando o Script Automático (Recomendado)

1. **Dar permissões de execução ao script**:
   ```bash
   chmod +x backup-database.sh
   ```

2. **Executar o backup**:
   ```bash
   ./backup-database.sh
   ```

3. **O script irá**:
   - ✅ Verificar a conexão com MongoDB
   - ✅ Confirmar que a base de dados existe
   - ✅ Criar o backup usando `mongodump`
   - ✅ Comprimir o backup em formato `.tar.gz`
   - ✅ Mostrar informações do backup criado

#### Método 2: Comando Manual

```bash
# Criar diretório de backup
mkdir -p ./backups

# Executar backup
mongodump --host localhost:27017 --db clinica_dentaria --out ./backups/backup_$(date +%Y%m%d_%H%M%S)

# Comprimir backup
cd backups
tar -czf backup_clinica_dentaria_$(date +%Y%m%d_%H%M%S).tar.gz backup_$(date +%Y%m%d_%H%M%S)
```

### 📁 Localização dos Backups

Os backups são guardados na pasta `./backups/` com o formato:
```
backup_clinica_dentaria_YYYYMMDD_HHMMSS.tar.gz
```

**Exemplo**: `backup_clinica_dentaria_20241215_143022.tar.gz`

---

## 🔄 Como Restaurar noutro Servidor

### 📋 Pré-requisitos no Servidor Destino
1. **MongoDB** instalado e em execução
2. **MongoDB Tools** instalados
3. **Ficheiro de backup** (.tar.gz) transferido para o servidor
4. **Acesso** para criar/modificar bases de dados

### 🚀 Processo de Restauro

#### Método 1: Usando o Script Automático (Recomendado)

1. **Transferir ficheiros necessários**:
   ```bash
   # Copiar o script de restauro
   scp restore-database.sh usuario@servidor-destino:/caminho/destino/
   
   # Copiar o ficheiro de backup
   scp backup_clinica_dentaria_20241215_143022.tar.gz usuario@servidor-destino:/caminho/destino/
   ```

2. **No servidor destino, dar permissões**:
   ```bash
   chmod +x restore-database.sh
   ```

3. **Executar o restauro**:
   ```bash
   # Restauro básico
   ./restore-database.sh backup_clinica_dentaria_20241215_143022.tar.gz
   
   # Restauro com eliminação da base existente
   ./restore-database.sh backup_clinica_dentaria_20241215_143022.tar.gz --drop
   
   # Restauro com configurações personalizadas
   ./restore-database.sh backup_clinica_dentaria_20241215_143022.tar.gz --db-name nova_clinica --host 192.168.1.100 --port 27018
   ```

#### Método 2: Comando Manual

```bash
# Extrair backup
tar -xzf backup_clinica_dentaria_20241215_143022.tar.gz

# Restaurar base de dados
mongorestore --host localhost:27017 --db clinica_dentaria --drop ./backup_clinica_dentaria_20241215_143022/clinica_dentaria
```

### ⚙️ Opções do Script de Restauro

| Opção | Descrição | Exemplo |
|-------|-----------|----------|
| `--db-name` | Nome da base de dados destino | `--db-name nova_clinica` |
| `--host` | Host do MongoDB | `--host 192.168.1.100` |
| `--port` | Porta do MongoDB | `--port 27018` |
| `--drop` | Eliminar base existente antes do restauro | `--drop` |
| `--help` | Mostrar ajuda | `--help` |

---

## 🔧 Configuração do Novo Servidor

### 1. 📁 Configurar Ficheiro .env

Crie ou edite o ficheiro `.env` no servidor destino:

```env
# Configuração da Base de Dados MongoDB
DATABASE_URL=mongodb://localhost:27017/clinica_dentaria

# Ambiente de execução
NODE_ENV=production

# Configurações do Servidor
PORT=5000

# Configurações de CORS
CORS_ORIGIN=http://seu-dominio.com

# Chave secreta para sessões
SESSION_SECRET=sua_chave_secreta_muito_segura_aqui

# Configurações de Log
LOG_LEVEL=info
```

### 2. 📦 Instalar Dependências

```bash
# Instalar dependências do Node.js
npm install

# Ou usando yarn
yarn install
```

### 3. 🚀 Iniciar Aplicação

```bash
# Modo de desenvolvimento
npm run dev

# Modo de produção
npm run build
npm start
```

---

## 🔍 Verificação e Testes

### ✅ Verificar se o Restauro foi Bem-sucedido

1. **Conectar ao MongoDB**:
   ```bash
   mongosh mongodb://localhost:27017/clinica_dentaria
   ```

2. **Verificar coleções**:
   ```javascript
   // Listar todas as coleções
   show collections
   
   // Contar documentos em cada coleção
   db.users.countDocuments()
   db.patients.countDocuments()
   db.appointments.countDocuments()
   db.procedures.countDocuments()
   db.transactions.countDocuments()
   ```

3. **Testar login na aplicação**:
   - Aceder à aplicação web
   - Tentar fazer login com credenciais existentes
   - Verificar se os dados são carregados corretamente

### 🧪 Credenciais de Teste

Após o restauro, pode usar estas credenciais para testar:

- **Admin**: `admin@clinica.ao` / `admin123`
- **Dentista**: `joao.silva@clinica.ao` / `password123`
- **Funcionário**: `ana.funcionaria@clinica.ao` / `password123`

---

## 🚨 Resolução de Problemas

### ❌ Erro: "MongoDB não está a correr"
**Solução**:
```bash
# macOS (usando Homebrew)
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows
net start MongoDB
```

### ❌ Erro: "Base de dados não encontrada"
**Solução**:
- Verificar se o nome da base de dados está correto
- Confirmar que o backup contém dados válidos
- Verificar permissões de acesso

### ❌ Erro: "Ficheiro de backup corrompido"
**Solução**:
- Verificar integridade do ficheiro: `tar -tzf backup.tar.gz`
- Transferir novamente o ficheiro de backup
- Criar um novo backup a partir da fonte original

### ❌ Erro: "Sem espaço em disco"
**Solução**:
- Verificar espaço disponível: `df -h`
- Limpar ficheiros temporários
- Mover backup para localização com mais espaço

---

## 📅 Boas Práticas

### 🔄 Backups Regulares
- **Diário**: Para ambientes de produção
- **Semanal**: Para ambientes de desenvolvimento
- **Antes de atualizações**: Sempre fazer backup antes de mudanças importantes

### 🔐 Segurança
- Guardar backups em localizações seguras
- Encriptar backups sensíveis
- Testar restauros periodicamente
- Manter múltiplas cópias de backup

### 📊 Monitorização
- Verificar tamanho dos backups
- Monitorizar tempo de execução
- Alertas para falhas de backup
- Documentar procedimentos de recuperação

---

## 📞 Suporte

Em caso de problemas:
1. Verificar logs de erro
2. Consultar esta documentação
3. Verificar configurações de rede e firewall
4. Contactar administrador do sistema

---

**📝 Nota**: Esta documentação foi criada para o sistema de gestão financeira da clínica dentária. Adapte as instruções conforme necessário para o seu ambiente específico.