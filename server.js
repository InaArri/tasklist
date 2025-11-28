const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// CORS configuration for production domains
const allowedOrigins = [
    'https://ignaciodev.xyz',
    'https://www.ignaciodev.xyz',
    'https://api.ignaciodev.xyz',
    'http://localhost:3000',
    'http://localhost:80',
    'http://localhost'
];

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(express.static('.')); // Serve static files (HTML, CSS, JS)

// ===== Socket.IO setup =====
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('authenticate', (data) => {
        const token = data && data.token;
        if (!token) {
            socket.emit('unauthorized');
            return;
        }

        jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this', (err, user) => {
            if (err) {
                socket.emit('unauthorized');
                return;
            }
            const userId = user.userId;
            socket.join(`user:${userId}`);
            socket.userId = userId;
            socket.emit('authenticated');
            console.log(`Socket ${socket.id} authenticated for user ${userId}`);
        });
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', socket.id, reason);
    });
});

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'taskflow',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        console.log('💡 Make sure PostgreSQL is running and credentials are correct');
    } else {
        console.log('✅ Database connected successfully at', res.rows[0].now);
    }
});

// ===== Authentication Middleware =====

// Verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user; // { userId, email }
        next();
    });
};

// ===== Authentication Routes =====

// POST /api/auth/register - Register a new user
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, created_at) VALUES ($1, $2, $3, $4) RETURNING id, name, email, created_at',
            [name, email.toLowerCase(), passwordHash, new Date()]
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// POST /api/auth/login - Login user
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Find user
        const result = await pool.query(
            'SELECT id, name, email, password_hash FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// GET /api/auth/me - Get current user info
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, created_at FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user info' });
    }
});

// ===== Task Routes (Protected) =====

// GET /api/tasks - Fetch all tasks for authenticated user
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// POST /api/tasks - Create a new task for authenticated user
app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { text } = req.body;

    if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Task text is required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO tasks (user_id, text, completed, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.userId, text.trim(), false, new Date()]
        );
        const newTask = result.rows[0];
        // Emit to sockets subscribed to this user
        try {
            io.to(`user:${req.user.userId}`).emit('taskCreated', newTask);
        } catch (e) {
            console.warn('Failed to emit socket event for taskCreated', e);
        }
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PUT /api/tasks/:id - Update task (toggle completion) for authenticated user
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'Completed status must be a boolean' });
    }

    try {
        const result = await pool.query(
            'UPDATE tasks SET completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [completed, id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const updatedTask = result.rows[0];
        try {
            io.to(`user:${req.user.userId}`).emit('taskUpdated', updatedTask);
        } catch (e) {
            console.warn('Failed to emit socket event for taskUpdated', e);
        }
        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// DELETE /api/tasks/:id - Delete a task for authenticated user
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const deleted = result.rows[0];
        try {
            io.to(`user:${req.user.userId}`).emit('taskDeleted', { id: deleted.id });
        } catch (e) {
            console.warn('Failed to emit socket event for taskDeleted', e);
        }
        res.json({ message: 'Task deleted successfully', task: deleted });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Health check endpoint (public)
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'healthy', database: 'connected' });
    } catch (error) {
        res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api/tasks`);
    console.log(`🔐 Auth endpoints: /api/auth/register, /api/auth/login`);
    console.log(`💻 Frontend available at http://localhost:${PORT}/index.html`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    pool.end(() => {
        console.log('Database pool closed');
    });
});
