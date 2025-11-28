# TaskFlow - Task Management Application

A beautiful, modern task list application with PostgreSQL database backend.

## Features

- ✅ Create, read, update, and delete tasks
- 📊 Real-time statistics dashboard
- 🔍 Filter tasks (All, Active, Completed)
- 💾 PostgreSQL database persistence
- 🎨 Modern dark theme with glassmorphism
- ✨ Smooth animations and transitions
- 📱 Fully responsive design
- 🔄 Offline fallback with localStorage

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Deployment**: Docker & Docker Compose

## Getting Started

### GitHub Setup

1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub Repository**:
   - Go to [GitHub](https://github.com) and create a new repository
   - Don't initialize it with a README, .gitignore, or license

3. **Connect and Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

4. **Clone on Your Ubuntu Server**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

### Ubuntu Server Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

Quick start:
```bash
# On your Ubuntu server
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git taskflow
cd taskflow
cp .env.example .env
# Edit .env with your configuration
nano .env
docker-compose up -d
```

## Setup Instructions

### Option 1: Using Docker (Recommended)

1. **Prerequisites**: Install [Docker](https://www.docker.com/get-started) and Docker Compose

2. **Start the application**:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api/tasks

4. **Stop the application**:
   ```bash
   docker-compose down
   ```

### Option 2: Manual Setup

1. **Prerequisites**:
   - Node.js (v18 or higher)
   - PostgreSQL (v15 or higher)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**:
   ```bash
   # Create database
   createdb taskflow
   
   # Run initialization script
   psql -d taskflow -f database/init.sql
   ```

4. **Configure environment variables**:
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env with your database credentials
   ```

5. **Start the server**:
   ```bash
   npm start
   ```

6. **Access the application**:
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api/tasks

## API Documentation

### Endpoints

#### GET /api/tasks
Fetch all tasks, ordered by creation date (newest first).

**Response**:
```json
[
  {
    "id": 1,
    "text": "Sample task",
    "completed": false,
    "created_at": "2025-11-28T15:30:00.000Z"
  }
]
```

#### POST /api/tasks
Create a new task.

**Request Body**:
```json
{
  "text": "New task description"
}
```

**Response**: Created task object (201)

#### PUT /api/tasks/:id
Update a task's completion status.

**Request Body**:
```json
{
  "completed": true
}
```

**Response**: Updated task object

#### DELETE /api/tasks/:id
Delete a task.

**Response**: Success message with deleted task

#### GET /api/health
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskflow
DB_USER=postgres
DB_PASSWORD=postgres

# Server Configuration
PORT=3000
```

## Database Schema

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    text VARCHAR(500) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Development

### Run in development mode with auto-reload:
```bash
npm run dev
```

### Access PostgreSQL database:
```bash
# Using Docker
docker exec -it taskflow-db psql -U postgres -d taskflow

# Local installation
psql -U postgres -d taskflow
```

## Project Structure

```
TaskList/
├── index.html          # Frontend HTML
├── styles.css          # Styling with modern design
├── script.js           # Frontend JavaScript with API integration
├── server.js           # Express backend server
├── package.json        # Node.js dependencies
├── Dockerfile          # Docker container configuration
├── docker-compose.yml  # Multi-container setup
├── .env.example        # Environment variables template
├── database/
│   └── init.sql       # Database schema and initialization
└── README.md          # This file
```

## License

MIT
