# Get SSL Certificate Using DNS Challenge

DNS challenge doesn't require HTTP access - it verifies domain ownership through DNS records.

## Step 1: Get Certificate with DNS Challenge

```bash
cd ~/taskflow

# Create certbot directories
mkdir -p certbot/conf

# Get certificate using DNS challenge
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

## Step 2: Add DNS TXT Records

Certbot will show you TXT records to add. For example:

```
Please deploy a DNS TXT record under the name
_acme-challenge.ignaciodev.xyz with the following value:

abc123xyz789...

Before continuing, verify the record is deployed.
```

**Add these TXT records in your DNS provider:**

1. Go to your DNS provider (where you manage ignaciodev.xyz)
2. Add TXT record: `_acme-challenge.ignaciodev.xyz` → `[value from certbot]`
3. Add TXT record: `_acme-challenge.www.ignaciodev.xyz` → `[value from certbot]`
4. Add TXT record: `_acme-challenge.api.ignaciodev.xyz` → `[value from certbot]`

**Wait for DNS propagation** (usually 1-5 minutes, can take up to 24 hours)

## Step 3: Verify and Continue

After adding DNS records, verify they're live:

```bash
# Check if DNS records are visible
dig _acme-challenge.ignaciodev.xyz TXT
dig _acme-challenge.www.ignaciodev.xyz TXT
dig _acme-challenge.api.ignaciodev.xyz TXT
```

Then press **Enter** in the certbot terminal to continue.

## Step 4: Start Nginx with HTTPS

After certificates are obtained:

```bash
# Start nginx with HTTPS config
docker-compose up -d

# Verify it works
docker-compose logs nginx
curl -I https://ignaciodev.xyz
```

## Automated DNS Challenge (Advanced)

If your DNS provider has an API, you can automate this. For example, with Cloudflare:

```bash
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -e CF_API_EMAIL=your-email@example.com \
  -e CF_API_KEY=your-api-key \
  certbot/dns-cloudflare certonly \
  --dns-cloudflare \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d ignaciodev.xyz \
  -d www.ignaciodev.xyz \
  -d api.ignaciodev.xyz
```

## Advantages of DNS Challenge

✅ No need for HTTP access  
✅ Works even if port 80 is blocked  
✅ No need to stop/start nginx  
✅ Can get certificates before setting up web server  

## Disadvantages

❌ Manual DNS record addition (unless automated)  
❌ Need to wait for DNS propagation  
❌ More steps than HTTP challenge  

But it's perfect when HTTP challenge doesn't work!


