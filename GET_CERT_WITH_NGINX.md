# Get SSL Certificate - Step by Step

The issue is that Let's Encrypt needs nginx running to serve the challenge files, but we need a temporary HTTP-only config.

## Solution: Use Temporary HTTP Config

```bash
cd ~/taskflow

# 1. Create certbot directories
mkdir -p certbot/conf certbot/www

# 2. Backup current config
cp nginx/nginx.conf nginx/nginx.conf.production

# 3. Use temporary HTTP-only config for certbot
cp nginx/nginx.conf.temp nginx/nginx.conf

# 4. Start nginx with temporary config
docker-compose up -d nginx

# 5. Wait a few seconds for nginx to start
sleep 5

# 6. Get SSL certificate (REPLACE your-email@example.com with your real email!)
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

# 7. If successful, switch to production HTTPS config
cp nginx/nginx.conf.production nginx/nginx.conf

# 8. Restart nginx with HTTPS config
docker-compose restart nginx

# 9. Verify it works
docker-compose logs nginx
curl -I https://ignaciodev.xyz
```

## Alternative: Use Standalone Mode (No Nginx Needed)

If the above doesn't work, use standalone mode (stops nginx automatically):

```bash
cd ~/taskflow

# 1. Create certbot directories
mkdir -p certbot/conf certbot/www

# 2. Stop nginx
docker-compose stop nginx

# 3. Get certificate using standalone mode
docker run -it --rm \
  -p 80:80 \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  certbot/certbot certonly \
  --standalone \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d ignaciodev.xyz \
  -d www.ignaciodev.xyz \
  -d api.ignaciodev.xyz

# 4. Switch to production HTTPS config
cp nginx/nginx.conf.production nginx/nginx.conf

# 5. Start nginx
docker-compose up -d
```

## Why This Happens

Let's Encrypt needs to verify you own the domain by accessing:
- `http://ignaciodev.xyz/.well-known/acme-challenge/...`

But if nginx is stopped, nothing is listening on port 80, so the connection is refused.

The solution is to either:
1. Keep nginx running with HTTP config (first method above)
2. Use standalone mode which runs its own web server (second method above)

## After Getting Certificates

Once you have certificates, your production config (`nginx/nginx.conf`) will:
- Redirect HTTP → HTTPS
- Serve your app over HTTPS
- Work perfectly!


