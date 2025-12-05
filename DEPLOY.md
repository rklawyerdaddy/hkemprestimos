# Deployment Instructions for Contabo VPS

This guide explains how to deploy your application to your Contabo VPS using Docker, Nginx, and a local PostgreSQL database.

## Prerequisites

1.  **Access to your VPS**: You should have the IP address (`209.145.56.53`) and root password (or SSH key).
2.  **Docker & Docker Compose**: Installed on your VPS.

## Step 1: Install Docker on VPS (if not installed)

Connect to your VPS via SSH:
```bash
ssh root@209.145.56.53
```

Run the following commands to install Docker:
```bash
# Update package index
apt-get update

# Install prerequisites
apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## Step 2: Prepare Project Files

You need to transfer your project files to the VPS. You can use `scp` (secure copy) or Git.

### Option A: Using Git (Recommended)
1.  Push your code to a Git repository (GitHub, GitLab, etc.).
2.  Clone the repository on your VPS:
    ```bash
    git clone YOUR_REPO_URL
    cd HK
    ```

### Option B: Using SCP
From your local machine:
```bash
scp -r c:/Users/Raul/Desktop/HK root@209.145.56.53:/root/
```

## Step 3: Configure Environment Variables

Create a `.env` file in the root of your project on the VPS:

```bash
nano .env
```

Add your production variables. **You define the database credentials here:**

```env
# Database Credentials
# IMPORTANTE: Se você já rodou o projeto antes, use as MESMAS credenciais que usou antes,
# ou apague o volume do banco de dados com 'docker compose down -v' para recriar.
DB_USER=raulkiyoshi
DB_PASSWORD=Ghb260829cb132!
DB_NAME=raulkiyoshi

# Security
JWT_SECRET=Theojunji1!
```

The `docker-compose.yml` will automatically use these to set up the database and connect the server to it.

## Step 4: Deploy

Run the application:
```bash
docker compose up -d --build
```

- `up`: Starts the containers.
- `-d`: Detached mode (runs in background).
- `--build`: Rebuilds images to ensure latest code is used.

The system now includes healthchecks, so the server will wait for the database to be fully ready before starting.

## Step 5: Initialize Database

Since this is a new database (or if you have schema changes), you need to push the schema:

```bash
# Run prisma db push inside the server container
docker compose exec server npx prisma db push
```

## Step 6: Verify

- **App**: Visit `http://hkemprestimos.site` (ou `http://209.145.56.53`)

## Troubleshooting

- **View Logs**: `docker compose logs -f`
- **Restart**: `docker compose restart`
- **Stop**: `docker compose down`
- **Rebuild**: `docker compose up -d --build`

## Security Best Practices (CRITICAL)
Before going live, you MUST secure your VPS.

### 1. Firewall (UFW)
Enable the firewall to only allow necessary ports.

```bash
# Allow SSH (Port 22 - or your custom port)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable Firewall
ufw enable
```

**Verify:** `ufw status` should show only 22, 80, and 443 allowed.

### 2. Secure SSH
- **Disable Root Login**: Create a new user with sudo privileges and disable root login in `/etc/ssh/sshd_config` (`PermitRootLogin no`).
- **Use SSH Keys**: Disable password authentication (`PasswordAuthentication no`) and use SSH keys only.

### 3. Environment Variables
Ensure your `.env` file has strong secrets.

```env
# Database Credentials
DB_USER=raulkiyoshi
DB_PASSWORD=YOUR_STRONG_DB_PASSWORD
DB_NAME=raulkiyoshi

# Security
JWT_SECRET=YOUR_VERY_LONG_RANDOM_STRING_HERE
CORS_ORIGIN=http://hkemprestimos.site
```

### 4. SSL/TLS (HTTPS)
Do not run a commercial site on HTTP. Enable SSL using the provided Nginx config and Certbot.

1.  Uncomment the SSL `server` block in `nginx/default.conf`.
2.  Run Certbot (you can add a certbot service to docker-compose or run it on the host).
    *   *Simpler approach*: Install certbot on the host (`apt install certbot`) and generate certs, then mount `/etc/letsencrypt` into the Nginx container.

### 5. Updates
Regularly update your VPS packages:
```bash
apt update && apt upgrade -y
```

## SSL Configuration (Future Step)

Currently, SSL is disabled. To enable it later:
1. Uncomment the SSL section in `nginx/default.conf`.
2. Run Certbot to generate certificates.

