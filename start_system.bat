@echo off
echo ==========================================
echo   INICIANDO SISTEMA DE CONTROLE HK
echo ==========================================

WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale o Node.js rodando o seguinte comando no PowerShell:
    echo winget install -e --id OpenJS.NodeJS
    echo.
    echo Depois de instalar, reinicie o computador e tente novamente.
    pause
    exit
)

echo [1/3] Iniciando Servidor (Backend)...
start "HK Server" cmd /k "cd server && npm install && npx prisma generate && npx prisma db push && npm run dev"

echo [2/3] Aguardando servidor iniciar...
timeout /t 5 /nobreak >nul

echo [3/3] Iniciando Interface do Usuario...
start "HK Client" cmd /k "cd client && npm install && npm run dev"

echo.
echo ==========================================
echo   SISTEMA INICIADO!
echo   Acesse no navegador: http://localhost:5173
echo ==========================================
echo   Nao feche as janelas pretas que abriram.
echo ==========================================
pause
