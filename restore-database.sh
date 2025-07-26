#!/bin/bash

# Script de Restauro da Base de Dados MongoDB
# Clínica Dentária - Sistema de Gestão Financeira
# Data: $(date '+%Y-%m-%d %H:%M:%S')

set -e  # Parar execução em caso de erro

# Configurações padrão
DB_NAME="clinica_dentaria"
MONGO_HOST="localhost"
MONGO_PORT="27017"
BACKUP_DIR="./backups"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para mostrar ajuda
show_help() {
    echo -e "${BLUE}📖 Como usar este script:${NC}"
    echo -e "${YELLOW}./restore-database.sh <ficheiro_backup.tar.gz> [opcoes]${NC}"
    echo ""
    echo -e "${BLUE}Opções:${NC}"
    echo -e "  ${YELLOW}--db-name${NC}     Nome da base de dados (padrão: clinica_dentaria)"
    echo -e "  ${YELLOW}--host${NC}        Host do MongoDB (padrão: localhost)"
    echo -e "  ${YELLOW}--port${NC}        Porta do MongoDB (padrão: 27017)"
    echo -e "  ${YELLOW}--drop${NC}        Eliminar base de dados existente antes do restauro"
    echo -e "  ${YELLOW}--help${NC}        Mostrar esta ajuda"
    echo ""
    echo -e "${BLUE}Exemplos:${NC}"
    echo -e "  ${YELLOW}./restore-database.sh backup_clinica_dentaria_20241215_143022.tar.gz${NC}"
    echo -e "  ${YELLOW}./restore-database.sh backup.tar.gz --db-name nova_clinica --drop${NC}"
    echo -e "  ${YELLOW}./restore-database.sh backup.tar.gz --host 192.168.1.100 --port 27018${NC}"
}

# Verificar se foi fornecido um ficheiro de backup
if [ $# -eq 0 ] || [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

BACKUP_FILE="$1"
DROP_EXISTING=false

# Processar argumentos
shift
while [[ $# -gt 0 ]]; do
    case $1 in
        --db-name)
            DB_NAME="$2"
            shift 2
            ;;
        --host)
            MONGO_HOST="$2"
            shift 2
            ;;
        --port)
            MONGO_PORT="$2"
            shift 2
            ;;
        --drop)
            DROP_EXISTING=true
            shift
            ;;
        *)
            echo -e "${RED}❌ Opção desconhecida: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🔄 Iniciando restauro da base de dados MongoDB${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "Ficheiro de backup: ${YELLOW}${BACKUP_FILE}${NC}"
echo -e "Base de dados: ${YELLOW}${DB_NAME}${NC}"
echo -e "Servidor: ${YELLOW}${MONGO_HOST}:${MONGO_PORT}${NC}"
echo -e "Eliminar existente: ${YELLOW}${DROP_EXISTING}${NC}"
echo ""

# Verificar se o ficheiro de backup existe
echo -e "${BLUE}🔍 Verificando ficheiro de backup...${NC}"
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}❌ Erro: Ficheiro de backup '${BACKUP_FILE}' não encontrado${NC}"
    echo -e "${YELLOW}💡 Certifique-se de que o caminho está correto${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Ficheiro de backup encontrado${NC}"

# Verificar se o MongoDB está a correr
echo -e "${BLUE}🔍 Verificando conexão com MongoDB...${NC}"
if ! mongosh --host ${MONGO_HOST}:${MONGO_PORT} --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
    echo -e "${RED}❌ Erro: Não foi possível conectar ao MongoDB em ${MONGO_HOST}:${MONGO_PORT}${NC}"
    echo -e "${YELLOW}💡 Certifique-se de que o MongoDB está a correr${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Conexão com MongoDB estabelecida${NC}"

# Verificar se a base de dados já existe
echo -e "${BLUE}🔍 Verificando se a base de dados já existe...${NC}"
DB_EXISTS=$(mongosh --host ${MONGO_HOST}:${MONGO_PORT} --eval "db.getMongo().getDBNames().includes('${DB_NAME}')" --quiet)
if [[ "$DB_EXISTS" = "true" ]]; then
    if [ "$DROP_EXISTING" = true ]; then
        echo -e "${YELLOW}⚠️  Base de dados '${DB_NAME}' já existe e será eliminada${NC}"
        echo -e "${RED}🚨 ATENÇÃO: Todos os dados existentes serão perdidos!${NC}"
        echo -e "${YELLOW}⏳ Aguardando 5 segundos para cancelar (Ctrl+C)...${NC}"
        sleep 5
        
        echo -e "${BLUE}🗑️  Eliminando base de dados existente...${NC}"
        mongosh --host ${MONGO_HOST}:${MONGO_PORT} --eval "db.getSiblingDB('${DB_NAME}').dropDatabase()" --quiet
        echo -e "${GREEN}✅ Base de dados eliminada${NC}"
    else
        echo -e "${YELLOW}⚠️  Base de dados '${DB_NAME}' já existe${NC}"
        echo -e "${YELLOW}💡 Use --drop para eliminar a base de dados existente${NC}"
        echo -e "${YELLOW}💡 Ou escolha um nome diferente com --db-name${NC}"
        read -p "Deseja continuar e fazer merge dos dados? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}🚫 Operação cancelada pelo utilizador${NC}"
            exit 0
        fi
    fi
else
    echo -e "${GREEN}✅ Base de dados '${DB_NAME}' não existe (será criada)${NC}"
fi

# Criar diretório temporário
TEMP_DIR="./temp_restore_$(date +%s)"
echo -e "${BLUE}📁 Criando diretório temporário...${NC}"
mkdir -p "${TEMP_DIR}"

# Extrair backup
echo -e "${BLUE}📦 Extraindo ficheiro de backup...${NC}"
if tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"; then
    echo -e "${GREEN}✅ Backup extraído com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao extrair backup${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# Encontrar a pasta do backup
BACKUP_FOLDER=$(find "${TEMP_DIR}" -name "${DB_NAME}" -type d | head -1)
if [ -z "${BACKUP_FOLDER}" ]; then
    # Procurar qualquer pasta que contenha ficheiros BSON
    BACKUP_FOLDER=$(find "${TEMP_DIR}" -name "*.bson" -type f -exec dirname {} \; | head -1)
fi

if [ -z "${BACKUP_FOLDER}" ]; then
    echo -e "${RED}❌ Erro: Não foi possível encontrar dados de backup válidos${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

echo -e "${GREEN}✅ Dados de backup encontrados em: ${BACKUP_FOLDER}${NC}"

# Executar restauro usando mongorestore
echo -e "${BLUE}🔄 Executando restauro...${NC}"
echo -e "${YELLOW}⏳ Isto pode demorar alguns minutos dependendo do tamanho da base de dados${NC}"

RESTORE_CMD="mongorestore --host ${MONGO_HOST}:${MONGO_PORT} --db ${DB_NAME}"
if [ "$DROP_EXISTING" = true ]; then
    RESTORE_CMD="$RESTORE_CMD --drop"
fi
RESTORE_CMD="$RESTORE_CMD ${BACKUP_FOLDER}"

if eval $RESTORE_CMD; then
    echo -e "${GREEN}✅ Restauro concluído com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro durante o restauro${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# Limpar ficheiros temporários
echo -e "${BLUE}🧹 Limpando ficheiros temporários...${NC}"
rm -rf "${TEMP_DIR}"
echo -e "${GREEN}✅ Limpeza concluída${NC}"

# Verificar o restauro
echo -e "${BLUE}🔍 Verificando restauro...${NC}"
COLLECTIONS=$(mongosh --host ${MONGO_HOST}:${MONGO_PORT} --db ${DB_NAME} --eval "db.getCollectionNames().length" --quiet)
echo -e "${GREEN}✅ Restauro verificado: ${COLLECTIONS} coleções encontradas${NC}"

echo ""
echo -e "${GREEN}🎉 RESTAURO CONCLUÍDO COM SUCESSO!${NC}"
echo -e "${GREEN}===================================${NC}"
echo -e "📊 Base de dados: ${YELLOW}${DB_NAME}${NC}"
echo -e "🌐 Servidor: ${YELLOW}${MONGO_HOST}:${MONGO_PORT}${NC}"
echo -e "📁 Coleções: ${YELLOW}${COLLECTIONS}${NC}"
echo -e "🕐 Data/Hora: ${YELLOW}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""
echo -e "${BLUE}💡 Próximos passos:${NC}"
echo -e "${YELLOW}1. Verifique se o ficheiro .env está configurado corretamente${NC}"
echo -e "${YELLOW}2. Instale as dependências: npm install${NC}"
echo -e "${YELLOW}3. Inicie a aplicação: npm run dev${NC}"
echo ""
echo -e "${GREEN}✨ Base de dados restaurada com sucesso!${NC}"