#!/bin/bash

# Configurações
BACKUP_DIR="/root/backups"
CONTAINER_NAME="hk_db"
DB_USER="hk_user"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="hk_backup_$TIMESTAMP.sql.gz"

# Criar pasta de backups se não existir
mkdir -p "$BACKUP_DIR"

echo "--- Iniciando Backup: $TIMESTAMP ---"

# Executa o dump dentro do container e compacta direto para o disco da VPS
# pg_dumpall -c garante que pegamos todos os bancos e limpamos antes de restaurar
if docker exec "$CONTAINER_NAME" pg_dumpall -c -U "$DB_USER" | gzip > "$BACKUP_DIR/$FILENAME"; then
    echo "✅ Sucesso! Arquivo salvo em: $BACKUP_DIR/$FILENAME"
    
    # Tamanho do arquivo
    SIZE=$(du -h "$BACKUP_DIR/$FILENAME" | cut -f1)
    echo "📦 Tamanho: $SIZE"

    # MANTER APENAS OS ÚLTIMOS 7 DIAS
    # Isso evita encher o disco. Ajuste '+7' para mais dias se quiser.
    echo "🧹 Limpando backups antigos (mais de 7 dias)..."
    find "$BACKUP_DIR" -name "hk_backup_*.sql.gz" -mtime +7 -delete
    
else
    echo "❌ Erro ao criar backup!"
    exit 1
fi

echo "--- Fim do Backup ---"
