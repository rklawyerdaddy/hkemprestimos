# Configuração Local

Este projeto foi ajustado para rodar localmente no Windows.

## Opção 1: Rodar tudo com Docker (Recomendado para testar o sistema completo)

1. Certifique-se de ter o Docker Desktop instalado e rodando.
2. Na raiz do projeto, execute:
   ```bash
   docker-compose up --build
   ```
3. Acesse o sistema em: `http://localhost`

## Opção 2: Rodar em modo de desenvolvimento (Hot Reload)

### 1. Banco de Dados
Você precisa de um banco Postgres rodando. Você pode usar o do Docker:
```bash
docker-compose up db -d
```
Isso vai rodar o banco na porta 5432.

### 2. Servidor (Backend)
Abra um terminal na pasta `server`:
```bash
cd server
npm install
npx prisma migrate dev
npm run dev
```
O servidor rodará em `http://localhost:3333`.

### 3. Cliente (Frontend)
Abra outro terminal na pasta `client`:
```bash
cd client
npm install
npm run dev
```
O cliente rodará em `http://localhost:5173`.
As requisições para `/api` serão automaticamente redirecionadas para o servidor na porta 3333.

## Voltar para VPS
Quando for subir para a VPS novamente, lembre-se de:
1. Reverter as alterações no `nginx/default.conf` (server_name e SSL).
2. Reverter as alterações no `docker-compose.yml` (adicionar certbot e volumes de SSL).
