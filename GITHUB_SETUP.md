# GitHub Setup Instructions

Follow these steps to push your TaskFlow project to GitHub and deploy it on Ubuntu.

## Step 1: Initial Git Setup (Already Done)

Git repository has been initialized. Now add all files and make your first commit:

```bash
# Add all files to git
git add .

# Make your first commit
git commit -m "Initial commit: TaskFlow task management application"
```

## Step 2: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository name: `TaskFlow` (or your preferred name)
4. Description: "A beautiful task management application with PostgreSQL backend"
5. Choose **Public** or **Private**
6. **DO NOT** check "Initialize this repository with a README" (we already have files)
7. Click **"Create repository"**

## Step 3: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add GitHub as remote (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**If you get authentication errors**, you may need to:
- Use a Personal Access Token instead of password
- Or set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

## Step 4: Verify on GitHub

1. Go to your repository on GitHub
2. Verify all files are present
3. Check that `.env` is NOT in the repository (it should be in .gitignore)

## Step 5: Deploy on Ubuntu Server

### On Your Ubuntu Server:

```bash
# Install prerequisites (if not already installed)
sudo apt update
sudo apt install -y git docker.io docker-compose

# Add your user to docker group
sudo usermod -aG docker $USER
# Log out and log back in for this to take effect

# Clone your repository
cd /opt  # or your preferred directory
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git taskflow
cd taskflow

# Create .env file from example
cp .env.example .env

# Edit .env with your settings
nano .env
# Update:
#   - DB_PASSWORD (use a strong password)
#   - JWT_SECRET (generate with: openssl rand -base64 32)

# Start the application
docker-compose up -d

# Check if it's running
docker-compose ps
docker-compose logs -f
```

### Access Your Application

- **Local**: http://localhost
- **From network**: http://YOUR_SERVER_IP
- **With domain**: http://yourdomain.com (after DNS setup)

## Step 6: Update Application (After Making Changes)

### On Your Development Machine:

```bash
# Make your changes
# ... edit files ...

# Commit changes
git add .
git commit -m "Description of your changes"
git push
```

### On Your Ubuntu Server:

```bash
cd /opt/taskflow
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

## Troubleshooting

### Git Authentication Issues

If you can't push to GitHub:
1. **Use Personal Access Token**:
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` scope
   - Use token as password when pushing

2. **Or use SSH**:
   ```bash
   # Generate SSH key
   ssh-keygen -t ed25519 -C "your_email@example.com"
   
   # Add to GitHub: Settings → SSH and GPG keys → New SSH key
   cat ~/.ssh/id_ed25519.pub
   
   # Change remote to SSH
   git remote set-url origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
   ```

### Docker Issues on Ubuntu

```bash
# Check Docker status
sudo systemctl status docker

# Start Docker if not running
sudo systemctl start docker
sudo systemctl enable docker

# Check if user is in docker group
groups
# If not, add user and relogin:
sudo usermod -aG docker $USER
```

### Port Already in Use

```bash
# Check what's using port 80
sudo lsof -i :80

# Stop nginx if running separately
sudo systemctl stop nginx
```

## Next Steps

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Ubuntu deployment instructions
- Set up SSL certificates for HTTPS (see DEPLOYMENT.md)
- Configure automatic backups
- Set up monitoring

## Quick Reference

```bash
# Local development
git add .
git commit -m "Your message"
git push

# On server
cd /opt/taskflow
git pull
docker-compose restart

# View logs
docker-compose logs -f

# Stop application
docker-compose down

# Start application
docker-compose up -d
```

