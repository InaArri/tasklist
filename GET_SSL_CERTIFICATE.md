# Get Let's Encrypt SSL Certificate - Quick Guide

Follow these steps to get SSL certificates and make HTTPS work.

## Prerequisites

✅ Domain `ignaciodev.xyz` points to your server IP  
✅ DNS access to add TXT records  
✅ DNS records configured (may take a few hours to propagate)

## Method 1: DNS Challenge (Recommended - No HTTP Required)

This method doesn't require HTTP access or stopping nginx.

### Step 1: Create Certbot Directories

```bash
cd ~/taskflow
mkdir -p certbot/conf
```

### Step 2: Get Certificate with DNS Challenge

**Replace `your-email@example.com` with your actual email:**

```bash
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  certbot/certbot certonly \
  --manual \
  --preferred-challenges dns \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d ignaciodev.xyz \
  -d www.ignaciodev.xyz \
  -d api.ignaciodev.xyz
```

### Step 3: Add DNS TXT Records

Certbot will show you TXT records to add. For each domain, add:

- `_acme-challenge.ignaciodev.xyz` → `[value from certbot]`
- `_acme-challenge.www.ignaciodev.xyz` → `[value from certbot]`
- `_acme-challenge.api.ignaciodev.xyz` → `[value from certbot]`

**Wait 1-5 minutes for DNS propagation**, then press Enter in certbot.

### Step 4: Start Nginx

```bash
docker-compose up -d
```

## Method 2: HTTP Challenge (Alternative)

If you prefer HTTP challenge, see `GET_CERT_WITH_NGINX.md` for instructions.

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

