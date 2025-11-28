# Quick Setup Guide

## Prerequisites
- Docker Desktop installed (recommended)
- OR PostgreSQL 15+ installed locally

## Setup Steps

### Option 1: Using Docker (Easiest)

1. **Start PostgreSQL and Backend**:
   ```bash
   docker-compose up -d
   ```

2. **Check if services are running**:
   ```bash
   docker-compose ps
   ```

3. **View logs** (if needed):
   ```bash
   docker-compose logs -f
   ```

4. **Access the application**:
   - Open browser: http://localhost:3000

5. **Stop services**:
   ```bash
   docker-compose down
   ```

### Option 2: Manual Setup (Without Docker)

1. **Install PostgreSQL** (if not already installed):
   - Download from: https://www.postgresql.org/download/

2. **Create database**:
   ```bash
   # Open PostgreSQL command line
   psql -U postgres

   # Create database
   CREATE DATABASE taskflow;
   \q
   ```

3. **Initialize database schema**:
   ```bash
   psql -U postgres -d taskflow -f database/init.sql
   ```

4. **Configure environment** (already done):
   - `.env` file is already created
   - Update credentials if needed

5. **Start the backend server**:
   ```bash
   npm start
   ```

6. **Access the application**:
   - Open browser: http://localhost:3000

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check credentials in `.env` file
- Ensure port 5432 is not in use

### Port Already in Use
If port 3000 is already in use, change it in `.env`:
```env
PORT=3001
```

### Docker Issues
- Ensure Docker Desktop is running
- Try: `docker-compose down -v` to reset volumes
- Rebuild: `docker-compose up --build`

## Testing the API

Test the health endpoint:
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{"status":"healthy","database":"connected"}
```

## Next Steps

1. Start the application using one of the methods above
2. Open http://localhost:3000 in your browser
3. Start adding tasks!

Your tasks will now be persisted in PostgreSQL instead of localStorage.
