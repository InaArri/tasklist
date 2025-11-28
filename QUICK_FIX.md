# Quick Fix for Nginx SSL Certificate Error

## Problem
Nginx is crashing because it's trying to load SSL certificates that don't exist yet.

## Solution

The nginx configuration has been updated to work **without SSL certificates** initially. 

### On Your Ubuntu Server:

```bash
cd ~/taskflow

# Pull the latest changes from GitHub
git pull

# Restart nginx with the new configuration
docker-compose restart nginx

# Check if it's working
docker-compose logs nginx
docker-compose ps
```

### Verify It's Working

```bash
# Check nginx status
docker-compose ps nginx

# Test the application
curl http://localhost/api/health

# Or visit in browser
# http://your-server-ip
```

## What Changed

1. **New HTTP-only config**: `nginx/nginx.conf` now works without SSL certificates
2. **HTTPS config available**: `nginx/nginx.conf.https` for when you have SSL certificates
3. **Fixed deprecated warnings**: Updated `http2` directive syntax

## Next Steps

### Option 1: Use HTTP (For Now)
The application will work on HTTP. You can access it at:
- `http://your-server-ip`
- `http://your-domain` (if DNS is set up)

### Option 2: Set Up SSL Later
When you're ready for HTTPS, follow the guide in `SSL_SETUP.md`:
1. Get SSL certificates with Let's Encrypt
2. Switch to HTTPS config: `cp nginx/nginx.conf.https nginx/nginx.conf`
3. Restart: `docker-compose restart nginx`

## Files Changed

- `nginx/nginx.conf` - HTTP-only configuration (works immediately)
- `nginx/nginx.conf.https` - HTTPS configuration (requires SSL certificates)
- `SSL_SETUP.md` - Guide for setting up SSL certificates

Your application should now start successfully!

