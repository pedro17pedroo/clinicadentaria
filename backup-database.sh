#!/bin/bash

# Script de Backup da Base de Dados MongoDB
# Clínica Dentária - Sistema de Gestão Financeira
# Data: $(date '+%Y-%m-%d %H:%M:%S')

set -e  # Parar execução em caso de erro

# Configurações
DB_NAME="clinica_dentaria"
BACKUP_DIR="./backups"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="backup_${DB_NAME}_${TIMESTAMP}"
MONGO_HOST="localhost"
MONGO_PORT="27017"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  Iniciando backup da base de dados MongoDB${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "Base de dados: ${YELLOW}${DB_NAME}${NC}"
echo -e "Servidor: ${YELLOW}${MONGO_HOST}:${MONGO_PORT}${NC}"
echo -e "Timestamp: ${YELLOW}${TIMESTAMP}${NC}"
echo ""

# Verificar se o MongoDB está a correr
echo -e "${BLUE}🔍 Verificando conexão com MongoDB...${NC}"
if ! mongosh --host ${MONGO_HOST}:${MONGO_PORT} --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
    echo -e "${RED}❌ Erro: Não foi possível conectar ao MongoDB em ${MONGO_HOST}:${MONGO_PORT}${NC}"
    echo -e "${YELLOW}💡 Certifique-se de que o MongoDB está a correr${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Conexão com MongoDB estabelecida${NC}"

# Verificar se a base de dados existe
echo -e "${BLUE}🔍 Verificando se a base de dados existe...${NC}"
DB_EXISTS=$(mongosh --host ${MONGO_HOST}:${MONGO_PORT} --eval "db.getMongo().getDBNames().includes('${DB_NAME}')" --quiet)
if [[ "$DB_EXISTS" != "true" ]]; then
    echo -e "${RED}❌ Erro: Base de dados '${DB_NAME}' não encontrada${NC}"
    echo -e "${YELLOW}💡 Verifique se o nome da base de dados está correto${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Base de dados '${DB_NAME}' encontrada${NC}"

# Criar diretório de backup se não existir
echo -e "${BLUE}📁 Criando diretório de backup...${NC}"
mkdir -p "${BACKUP_DIR}"
echo -e "${GREEN}✅ Diretório criado: ${BACKUP_DIR}${NC}"

# Executar backup usando mongodump
echo -e "${BLUE}💾 Executando backup...${NC}"
echo -e "${YELLOW}⏳ Isto pode demorar alguns minutos dependendo do tamanho da base de dados${NC}"

if mongodump --host ${MONGO_HOST}:${MONGO_PORT} --db ${DB_NAME} --out "${BACKUP_DIR}/${BACKUP_FILE}" --quiet; then
    echo -e "${GREEN}✅ Backup concluído com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro durante o backup${NC}"
    exit 1
fi

# Comprimir o backup
echo -e "${BLUE}🗜️  Comprimindo backup...${NC}"
cd "${BACKUP_DIR}"
if tar -czf "${BACKUP_FILE}.tar.gz" "${BACKUP_FILE}"; then
    echo -e "${GREEN}✅ Backup comprimido: ${BACKUP_FILE}.tar.gz${NC}"
    # Remover pasta não comprimida
    rm -rf "${BACKUP_FILE}"
else
    echo -e "${RED}❌ Erro ao comprimir backup${NC}"
    exit 1
fi

# Informações do backup
BACKUP_SIZE=$(du -h "${BACKUP_FILE}.tar.gz" | cut -f1)
echo ""
echo -e "${GREEN}🎉 BACKUP CONCLUÍDO COM SUCESSO!${NC}"
echo -e "${GREEN}=================================${NC}"
echo -e "📁 Localização: ${YELLOW}${BACKUP_DIR}/${BACKUP_FILE}.tar.gz${NC}"
echo -e "📊 Tamanho: ${YELLOW}${BACKUP_SIZE}${NC}"
echo -e "🕐 Data/Hora: ${YELLOW}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""
echo -e "${BLUE}📋 Para restaurar este backup noutro servidor:${NC}"
echo -e "${YELLOW}1. Copie o ficheiro ${BACKUP_FILE}.tar.gz para o servidor destino${NC}"
echo -e "${YELLOW}2. Execute o script de restauro (restore-database.sh)${NC}"
echo ""
echo -e "${GREEN}✨ Backup guardado com sucesso!${NC}"