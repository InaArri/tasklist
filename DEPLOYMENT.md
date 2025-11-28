# Ubuntu Server Deployment Guide

This guide will help you deploy TaskFlow on an Ubuntu server.

## Prerequisites

- Ubuntu 20.04 or later
- Root or sudo access
- Domain name (optional, for SSL)
- Basic knowledge of Linux commands

## Step 1: Server Setup

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Required Software
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker and Docker Compose
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Install Git
sudo apt install -y git

# Install PostgreSQL client (for manual database operations)
sudo apt install -y postgresql-client

# Install Nginx (if not using Docker)
sudo apt install -y nginx
```

**Note:** Log out and log back in for Docker group changes to take effect.

## Step 2: Clone Repository

```bash
# Navigate to your preferred directory
cd /opt  # or /home/your-user, /var/www, etc.

# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git taskflow
cd taskflow
```

## Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your settings
nano .env
```

Update the following values in `.env`:
```env
DB_HOST=postgres  # Use 'postgres' for Docker, 'localhost' for local PostgreSQL
DB_PORT=5432
DB_NAME=taskflow
DB_USER=postgres
DB_PASSWORD=your-secure-password-here
PORT=3000
JWT_SECRET=generate-a-random-secret-key-here
JWT_EXPIRES_IN=7d
```

**Generate a secure JWT secret:**
```bash
openssl rand -base64 32
```

## Step 4: Update Docker Compose for Production

Edit `docker-compose.yml` and update the JWT_SECRET in the backend service:
```yaml
JWT_SECRET: ${JWT_SECRET:-your-secret-key-change-this-in-production}
```

Make sure to set this in your `.env` file.

## Step 5: Deploy with Docker Compose

### Option A: Simple Deployment (No SSL)

```bash
# Start the services
docker-compose up -d

# Check logs
docker-compose logs -f

# Check if services are running
docker-compose ps
```

The application will be available at `http://your-server-ip:80`

### Option B: Production Deployment with SSL (Let's Encrypt)

#### 5.1. Create Certbot Directories
```bash
mkdir -p certbot/conf certbot/www
```

#### 5.2. Update Nginx Configuration
Edit `nginx/nginx.conf` and replace `ignaciodev.xyz` with your domain name.

#### 5.3. Get SSL Certificate
```bash
# Stop nginx temporarily
docker-compose stop nginx

# Run certbot to get certificate
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d api.yourdomain.com
```

#### 5.4. Start All Services
```bash
docker-compose up -d
```

#### 5.5. Set Up Auto-Renewal for SSL
```bash
# Add to crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * cd /opt/taskflow && docker-compose run --rm certbot renew && docker-compose restart nginx
```

## Step 6: Configure Firewall

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Step 7: Set Up Systemd Service (Optional - for auto-start)

Create a systemd service to auto-start Docker Compose:

```bash
sudo nano /etc/systemd/system/taskflow.service
```

Add the following:
```ini
[Unit]
Description=TaskFlow Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/taskflow
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable taskflow
sudo systemctl start taskflow
```

## Step 8: Verify Deployment

### Check Services
```bash
# Check Docker containers
docker-compose ps

# Check application health
curl http://localhost/api/health

# Check logs
docker-compose logs backend
docker-compose logs postgres
docker-compose logs nginx
```

### Test the Application
1. Open your browser and navigate to `http://your-domain` or `http://your-server-ip`
2. Register a new account
3. Create a task
4. Verify everything works

## Step 9: Database Backup (Important!)

Set up regular database backups:

```bash
# Create backup script
nano /opt/taskflow/backup.sh
```

Add the following:
```bash
#!/bin/bash
BACKUP_DIR="/opt/taskflow/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker-compose exec -T postgres pg_dump -U postgres taskflow > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Make it executable:
```bash
chmod +x /opt/taskflow/backup.sh
```

Add to crontab (daily at 3 AM):
```bash
crontab -e
# Add: 0 3 * * * /opt/taskflow/backup.sh
```

## Step 10: Monitoring and Maintenance

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f nginx
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Update Application
```bash
cd /opt/taskflow
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d taskflow

# Run SQL commands
docker-compose exec postgres psql -U postgres -d taskflow -c "SELECT COUNT(*) FROM users;"
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 80
sudo lsof -i :80

# Stop nginx if running separately
sudo systemctl stop nginx
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -d taskflow -c "SELECT 1;"
```

### SSL Certificate Issues
```bash
# Check certificate expiration
docker-compose exec certbot certbot certificates

# Manually renew
docker-compose run --rm certbot renew
docker-compose restart nginx
```

### Application Not Starting
```bash
# Check backend logs
docker-compose logs backend

# Check if environment variables are set
docker-compose exec backend env | grep DB_

# Restart services
docker-compose restart
```

## Security Recommendations

1. **Change default passwords** - Update PostgreSQL password in `.env`
2. **Use strong JWT secret** - Generate a random 32+ character string
3. **Keep system updated** - Run `sudo apt update && sudo apt upgrade` regularly
4. **Enable firewall** - Use UFW to restrict access
5. **Regular backups** - Set up automated database backups
6. **Monitor logs** - Check logs regularly for suspicious activity
7. **Use HTTPS** - Always use SSL in production
8. **Limit SSH access** - Use key-based authentication for SSH

## Performance Optimization

1. **Enable Nginx caching** - Already configured in nginx.conf
2. **Database indexes** - Already created in init.sql
3. **Connection pooling** - Already configured in server.js
4. **Resource limits** - Add to docker-compose.yml if needed:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

## Support

For issues or questions:
- Check application logs: `docker-compose logs -f`
- Check system resources: `htop` or `docker stats`
- Review this guide for common solutions

