// ===== Configuration =====
// Use relative API paths - works for both local and production
const API_BASE_URL = '/api';

// ===== State Management =====
let tasks = [];
let currentFilter = 'all';
let isLoading = false;
let currentUser = null;

// ===== DOM Elements =====
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');
const userNameEl = document.getElementById('user-name');
const userEmailEl = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

// ===== Initialize App =====
async function init() {
    // Check authentication
    if (!requireAuth()) {
        return;
    }

    // Load user info
    currentUser = getUser();
    if (currentUser) {
        userNameEl.textContent = currentUser.name;
        userEmailEl.textContent = currentUser.email;
    }

    await loadTasksFromAPI();
    renderTasks();
    updateStats();
    attachEventListeners();
}

// ===== Event Listeners =====
function attachEventListeners() {
    addTaskBtn.addEventListener('click', handleAddTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddTask();
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilterChange);
    });

    clearCompletedBtn.addEventListener('click', handleClearCompleted);

    logoutBtn.addEventListener('click', () => {
        logout();
    });
}

// ===== API Functions =====
async function loadTasksFromAPI() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/tasks`);
        if (!response.ok) {
            throw new Error('Failed to fetch tasks');
        }
        tasks = await response.json();
        // Convert created_at to createdAt for consistency
        tasks = tasks.map(task => ({
            ...task,
            createdAt: task.created_at
        }));
    } catch (error) {
        console.error('Error loading tasks from API:', error);
        showError('Failed to load tasks.');
    }
}

async function createTaskAPI(taskText) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            body: JSON.stringify({ text: taskText }),
        });

        if (!response.ok) {
            throw new Error('Failed to create task');
        }

        const newTask = await response.json();
        return {
            ...newTask,
            createdAt: newTask.created_at
        };
    } catch (error) {
        console.error('Error creating task:', error);
        showError('Failed to create task.');
        return null;
    }
}

async function updateTaskAPI(taskId, completed) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ completed }),
        });

        if (!response.ok) {
            throw new Error('Failed to update task');
        }

        const updatedTask = await response.json();
        return {
            ...updatedTask,
            createdAt: updatedTask.created_at
        };
    } catch (error) {
        console.error('Error updating task:', error);
        showError('Failed to update task.');
        return null;
    }
}

async function deleteTaskAPI(taskId) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete task');
        }

        return true;
    } catch (error) {
        console.error('Error deleting task:', error);
        showError('Failed to delete task.');
        return false;
    }
}

// ===== Task Management =====
async function handleAddTask() {
    const taskText = taskInput.value.trim();

    if (taskText === '') {
        // Add a subtle shake animation to the input
        taskInput.style.animation = 'shake 0.3s';
        setTimeout(() => {
            taskInput.style.animation = '';
        }, 300);
        return;
    }

    if (isLoading) return;
    isLoading = true;
    addTaskBtn.disabled = true;

    const newTask = await createTaskAPI(taskText);
    if (newTask) {
        tasks.unshift(newTask);
        taskInput.value = '';
        renderTasks();
        updateStats();
    }

    isLoading = false;
    addTaskBtn.disabled = false;

    // Focus back on input for quick task entry
    taskInput.focus();
}

async function handleToggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompletedState = !task.completed;
    task.completed = newCompletedState; // Optimistic update

    renderTasks();
    updateStats();

    const updatedTask = await updateTaskAPI(taskId, newCompletedState);

    if (updatedTask) {
        // Update with server response
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex] = updatedTask;
        }
    }
}

async function handleDeleteTask(taskId) {
    // Optimistic update
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    const deletedTask = tasks[taskIndex];
    tasks = tasks.filter(t => t.id !== taskId);

    renderTasks();
    updateStats();

    const success = await deleteTaskAPI(taskId);

    if (!success) {
        // Rollback on failure
        tasks.splice(taskIndex, 0, deletedTask);
        renderTasks();
        updateStats();
    }
}

function handleFilterChange(e) {
    filterBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    renderTasks();
}

async function handleClearCompleted() {
    const completedTasks = tasks.filter(t => t.completed);

    if (completedTasks.length === 0) {
        return;
    }

    // Optimistic update
    tasks = tasks.filter(t => !t.completed);
    renderTasks();
    updateStats();

    // Delete from server
    for (const task of completedTasks) {
        await deleteTaskAPI(task.id);
    }
}

// ===== Rendering =====
function renderTasks() {
    const filteredTasks = getFilteredTasks();

    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
        taskList.style.display = 'none';

        // Update empty state message based on filter
        const emptyStateTitle = emptyState.querySelector('h2');
        const emptyStateText = emptyState.querySelector('p');

        if (currentFilter === 'completed' && tasks.length > 0) {
            emptyStateTitle.textContent = 'No completed tasks';
            emptyStateText.textContent = 'Complete some tasks to see them here!';
        } else if (currentFilter === 'active' && tasks.length > 0) {
            emptyStateTitle.textContent = 'No active tasks';
            emptyStateText.textContent = 'All tasks are completed! 🎉';
        } else {
            emptyStateTitle.textContent = 'No tasks yet';
            emptyStateText.textContent = 'Add your first task to get started!';
        }

        return;
    }

    emptyState.style.display = 'none';
    taskList.style.display = 'flex';

    taskList.innerHTML = filteredTasks.map(task => createTaskHTML(task)).join('');

    // Attach event listeners to task elements
    filteredTasks.forEach(task => {
        const taskEl = document.querySelector(`[data-task-id="${task.id}"]`);
        const checkbox = taskEl.querySelector('.task-checkbox');
        const deleteBtn = taskEl.querySelector('.delete-btn');

        checkbox.addEventListener('click', () => handleToggleTask(task.id));
        deleteBtn.addEventListener('click', () => handleDeleteTask(task.id));
    });
}

function createTaskHTML(task) {
    const timeAgo = getTimeAgo(task.createdAt);
    const completedClass = task.completed ? 'completed' : '';

    return `
        <li class="task-item ${completedClass}" data-task-id="${task.id}">
            <div class="task-checkbox"></div>
            <span class="task-text">${escapeHTML(task.text)}</span>
            <span class="task-time">${timeAgo}</span>
            <button class="delete-btn">Delete</button>
        </li>
    `;
}

function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        default:
            return tasks;
    }
}

// ===== Statistics =====
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    animateValue(totalTasksEl, parseInt(totalTasksEl.textContent) || 0, total, 300);
    animateValue(completedTasksEl, parseInt(completedTasksEl.textContent) || 0, completed, 300);
    animateValue(pendingTasksEl, parseInt(pendingTasksEl.textContent) || 0, pending, 300);
}

function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

// ===== Utility Functions =====
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
}

function showError(message) {
    console.error(message);
    // You could add a toast notification here
}

// ===== Add shake animation to CSS dynamically =====
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// ===== Initialize on DOM Load =====
document.addEventListener('DOMContentLoaded', () => {
    init();
});