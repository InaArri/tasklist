-- Migration script to add authentication to existing TaskFlow database
-- Run this if you already have a tasks table without user_id

-- Add users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add user_id column to tasks table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'user_id'
    ) THEN
        -- Add the column
        ALTER TABLE tasks ADD COLUMN user_id INTEGER;
        
        -- Create a default user for existing tasks
        INSERT INTO users (email, password_hash, name, created_at)
        VALUES ('admin@taskflow.local', '$2a$10$dummy.hash.for.migration', 'Admin', CURRENT_TIMESTAMP)
        ON CONFLICT (email) DO NOTHING;
        
        -- Assign existing tasks to the default user
        UPDATE tasks SET user_id = (SELECT id FROM users WHERE email = 'admin@taskflow.local' LIMIT 1)
        WHERE user_id IS NULL;
        
        -- Make user_id NOT NULL and add foreign key
        ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
        ALTER TABLE tasks ADD CONSTRAINT fk_tasks_user_id 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Verify migration
SELECT 'Migration completed successfully!' AS status;
SELECT COUNT(*) AS user_count FROM users;
SELECT COUNT(*) AS task_count FROM tasks;
