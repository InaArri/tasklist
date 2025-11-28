# How to Generate a JWT_SECRET

A JWT_SECRET is a secret key used to sign and verify JSON Web Tokens (JWTs) in your application. It should be:
- **Random and unpredictable**
- **At least 32 characters long**
- **Kept secret** (never commit it to Git)

## Method 1: Using Node.js (Works on Windows, Mac, Linux)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Example output:**
```
baL9oUE5vS2dM9uCfQSftuEahqDSWg02ahiw7a3rDh0=
```

## Method 2: Using OpenSSL (Linux/Mac)

```bash
openssl rand -base64 32
```

## Method 3: Using PowerShell (Windows)

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## Method 4: Using Online Generator (Not Recommended for Production)

You can use online tools, but **be cautious** - only use trusted sources:
- https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")
- Generate locally when possible for better security

## Method 5: Using Python

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## How to Use It

1. **Generate your secret** using one of the methods above
2. **Copy the generated string**
3. **Add it to your `.env` file**:

```env
JWT_SECRET=your-generated-secret-here
```

**Example:**
```env
JWT_SECRET=baL9oUE5vS2dM9uCfQSftuEahqDSWg02ahiw7a3rDh0=
```

## Important Security Notes

⚠️ **Never commit your `.env` file to Git!**
- The `.env` file is already in `.gitignore`
- Always use `.env.example` as a template
- Each environment (development, production) should have a **different** JWT_SECRET

⚠️ **For Production:**
- Use a **strong, randomly generated** secret (at least 32 characters)
- Store it securely (environment variables, secret management tools)
- Don't share it or log it anywhere
- Rotate it periodically if compromised

## Quick Generate Script

You can create a simple script to generate it:

**Windows (PowerShell):**
```powershell
# Save as generate-jwt-secret.ps1
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
```

**Linux/Mac:**
```bash
# Save as generate-jwt-secret.sh
#!/bin/bash
echo "JWT_SECRET=$(openssl rand -base64 32)"
```

Then run:
```bash
# Windows
.\generate-jwt-secret.ps1

# Linux/Mac
chmod +x generate-jwt-secret.sh
./generate-jwt-secret.sh
```

## For Your Current Project

1. Run this command to generate a secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. Copy the output

3. Open your `.env` file and set:
   ```env
   JWT_SECRET=paste-your-generated-secret-here
   ```

4. Make sure `.env` is in `.gitignore` (it already is!)

That's it! Your JWT_SECRET is ready to use.

