# Get Let's Encrypt SSL Certificate - Quick Guide

Follow these steps to get SSL certificates and make HTTPS work.

## Prerequisites

✅ Domain `ignaciodev.xyz` points to your server IP  
✅ Ports 80 and 443 are open  
✅ DNS records configured (may take a few hours to propagate)

## Step 1: Create Certbot Directories

```bash
cd ~/taskflow
mkdir -p certbot/conf certbot/www
```

## Step 2: Stop Nginx (Temporarily)

```bash
docker-compose stop nginx
```

## Step 3: Get SSL Certificate

**Replace `your-email@example.com` with your actual email:**

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

**Important:** Use your real email address - Let's Encrypt will send renewal reminders.

## Step 4: Start Nginx with HTTPS Config

```bash
docker-compose up -d
```

## Step 5: Verify It Works

```bash
# Check nginx logs
docker-compose logs nginx

# Test HTTPS
curl -I https://ignaciodev.xyz

# Or visit in browser
# https://ignaciodev.xyz
```

## Step 6: Set Up Auto-Renewal

Add to crontab to auto-renew certificates:

```bash
crontab -e
```

Add this line (runs daily at 2 AM):
```
0 2 * * * cd ~/taskflow && docker-compose run --rm certbot renew && docker-compose restart nginx
```

## Troubleshooting

### "Domain not pointing to server"
```bash
# Check DNS
dig ignaciodev.xyz
nslookup ignaciodev.xyz

# Should show your server IP
```

### "Port 80 blocked"
```bash
# Check firewall
sudo ufw status

# Allow ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### "Certificate generation fails"
- Wait 24-48 hours after DNS changes for propagation
- Make sure port 80 is accessible from the internet
- Verify domain points to your server IP

### Check Certificate Expiration
```bash
docker-compose exec certbot certbot certificates
```

### Manually Renew Certificate
```bash
docker-compose run --rm certbot renew
docker-compose restart nginx
```

## That's It!

Once certificates are obtained, your site will work at:
- ✅ https://ignaciodev.xyz
- ✅ https://www.ignaciodev.xyz
- ✅ https://api.ignaciodev.xyz

HTTP will automatically redirect to HTTPS.

