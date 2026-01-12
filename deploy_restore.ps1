$VPS_IP = "209.145.56.53"
$REMOTE_DIR = "HK" # Assuming folder name in /root/ is HK

Write-Host "=== Iniciando Deploy de Restauração via Git ==="
Write-Host "O código local já foi enviado para o GitHub (Force Push)."
Write-Host "Conectando ao VPS ($VPS_IP) para atualizar e reiniciar..."

# Command to run on VPS:
# 1. Update code from git
# 2. Rebuild containers
# 3. Push schema changes
$CMD = "cd $REMOTE_DIR && git fetch --all && git reset --hard origin/main && docker compose up -d --build && docker compose exec server npx prisma db push"

# Execute SSH with StrictHostKeyChecking=no to avoid "yes/no" prompt
# The user will only need to type the password.
ssh -o StrictHostKeyChecking=no root@$VPS_IP $CMD

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deploy finalizado com SUCESSO!"
}
else {
    Write-Host "Erro durante o comando SSH. Verifique a senha ou a conexão."
}
Pause
