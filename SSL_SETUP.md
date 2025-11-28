# SSL Certificate Setup Guide

This guide will help you set up SSL certificates for your TaskFlow application.

## Current Status

Your nginx configuration is currently set to use **HTTP only** (`nginx/nginx.conf`). This allows the application to run without SSL certificates.

## Option 1: Run Without SSL (For Testing/Development)

The current `nginx.conf` is configured to work without SSL. Your application should be accessible at:
- `http://your-server-ip`
- `http://your-domain` (if DNS is configured)

**To use this configuration:**
```bash
# Already set up - just restart nginx
docker-compose restart nginx
```

## Option 2: Set Up SSL with Let's Encrypt (Production)

### Prerequisites
- Domain name pointing to your server IP
- Ports 80 and 443 open in firewall
- DNS records configured:
  - `ignaciodev.xyz` → your server IP
  - `www.ignaciodev.xyz` → your server IP
  - `api.ignaciodev.xyz` → your server IP

### Step 1: Create Certbot Directories

```bash
cd ~/taskflow
mkdir -p certbot/conf certbot/www
```

### Step 2: Stop Nginx Temporarily

```bash
docker-compose stop nginx
```

### Step 3: Get SSL Certificate

```bash
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d ignaciodev.xyz \
  -d www.ignaciodev.xyz \
  -d api.ignaciodev.xyz
```

**Replace `your-email@example.com` with your actual email address.**

### Step 4: Switch to HTTPS Configuration

```bash
# Backup current config
cp nginx/nginx.conf nginx/nginx.conf.http

# Use HTTPS config
cp nginx/nginx.conf.https nginx/nginx.conf
```

### Step 5: Start All Services

```bash
docker-compose up -d
```

### Step 6: Verify SSL

```bash
# Check nginx logs
docker-compose logs nginx

# Test HTTPS
curl -I https://ignaciodev.xyz
```

### Step 7: Set Up Auto-Renewal

Add to crontab:
```bash
crontab -e
```

Add this line (runs daily at 2 AM):
```
0 2 * * * cd ~/taskflow && docker-compose run --rm certbot renew && docker-compose restart nginx
```

## Troubleshooting

### Certificate Not Found Error

If you see errors about missing certificates:
1. **Use HTTP config first**: Make sure you're using `nginx.conf` (HTTP version) until certificates are obtained
2. **Check certificate path**: Certificates should be at `/etc/letsencrypt/live/ignaciodev.xyz/` inside the container
3. **Verify volume mount**: Check `docker-compose.yml` has the certbot volume mounted

### DNS Not Resolving

```bash
# Check DNS
dig ignaciodev.xyz
nslookup ignaciodev.xyz

# Make sure DNS points to your server IP
```

### Port 80 Blocked

```bash
# Check firewall
sudo ufw status

# Allow ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Certificate Generation Fails

Common issues:
- **DNS not propagated**: Wait 24-48 hours after DNS changes
- **Port 80 blocked**: Certbot needs port 80 open
- **Domain not pointing to server**: Verify with `dig` or `nslookup`

## Quick Reference

```bash
# Switch to HTTP (no SSL)
cp nginx/nginx.conf nginx/nginx.conf.https.backup
# nginx.conf is already HTTP version

# Switch to HTTPS (with SSL)
cp nginx/nginx.conf.https nginx/nginx.conf
docker-compose restart nginx

# Check certificate expiration
docker-compose exec certbot certbot certificates

# Manually renew certificate
docker-compose run --rm certbot renew
docker-compose restart nginx
```

## Current Configuration

- **HTTP Config**: `nginx/nginx.conf` (works without SSL)
- **HTTPS Config**: `nginx/nginx.conf.https` (requires SSL certificates)

Switch between them by copying the appropriate file to `nginx/nginx.conf` and restarting nginx.

