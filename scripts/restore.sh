#!/bin/bash
# Script para restaurar backup do banco de dados
# Uso: ./scripts/restore.sh nome_do_arquivo.sql.gz

# Ir para a raiz do projeto
cd "$(dirname "$0")/.."

BACKUP_FILE="$1"
BACKUP_DIR="/root/backups"
DB_CONTAINER="hk_db"
DB_USER="raulkiyoshi"

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Erro: Informe o nome do arquivo de backup."
    echo "Uso: ./scripts/restore.sh <nome_do_arquivo.sql.gz>"
    echo "Exemplo: ./scripts/restore.sh hk_backup_20260117_220049.sql.gz"
    exit 1
fi

FULL_PATH="$BACKUP_DIR/$BACKUP_FILE"

# Verifica se o arquivo existe
if [ ! -f "$FULL_PATH" ]; then
    # Tenta ver se o usuário passou um caminho completo ou relativo
    if [ -f "$BACKUP_FILE" ]; then
        FULL_PATH="$BACKUP_FILE"
    else
        echo "❌ Arquivo não encontrado: $FULL_PATH"
        echo "Verifique se o arquivo está na pasta $BACKUP_DIR"
        exit 1
    fi
fi

echo "⚠️  ATENÇÃO: Isso APAGARÁ o banco atual e restaurará o backup: $BACKUP_FILE"
echo "⏳ Você tem 5 segundos para cancelar (Ctrl+C)..."
sleep 5

echo "🛑 Parando servidor (Node.js) para liberar conexões..."
docker compose stop server

echo "♻️  Restaurando banco de dados..."
# Conectamos ao 'template1' para poder dropar/recriar o banco 'raulkiyoshi' se necessário
if gunzip -c "$FULL_PATH" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d template1; then
    echo "✅ Banco de dados restaurado com sucesso!"
else
    echo "❌ Erro durante a restauração."
fi

echo "🚀 Iniciando servidor..."
docker compose start server

echo "--- Concluído ---"
