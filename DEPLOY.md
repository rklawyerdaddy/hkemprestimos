# Deployment Instructions for Contabo VPS (with Traefik)

This guide explains how to deploy your application to your Contabo VPS using Docker and Traefik.

## Prerequisites

1.  **Access to your VPS**: You should have the IP address and root password (or SSH key).
2.  **Docker & Docker Compose**: Installed on your VPS.

## Step 1: Install Docker on VPS (if not installed)

Connect to your VPS via SSH:
```bash
ssh root@YOUR_VPS_IP
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
scp -r c:/Users/Raul/Desktop/HK root@YOUR_VPS_IP:/root/
```

## Step 3: Configure Environment Variables

Create a `.env` file in the root of your project on the VPS:

```bash
nano .env
```

Add your production variables:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
JWT_SECRET="your_super_secure_secret"
```

## Step 4: Deploy

Run the application:
```bash
docker compose up -d --build
```

- `up`: Starts the containers.
- `-d`: Detached mode (runs in background).
- `--build`: Rebuilds images to ensure latest code is used.

## Step 5: Verify

- **App**: Visit `http://YOUR_VPS_IP`
- **Traefik Dashboard**: Visit `http://YOUR_VPS_IP:8080` (Insecure mode enabled for debugging)

## Troubleshooting

- **View Logs**: `docker compose logs -f`
- **Restart**: `docker compose restart`
- **Stop**: `docker compose down`
