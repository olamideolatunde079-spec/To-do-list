// DOM Elements
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const dueDateInput = document.getElementById('dueDateInput');
const priorityInput = document.getElementById('priorityInput');
const searchInput = document.getElementById('searchInput');
const searchClearBtn = document.getElementById('searchClearBtn');
const sortSelect = document.getElementById('sortSelect');
const tasksList = document.getElementById('tasks');
const clearCompletedBtn = document.getElementById('clearCompleted');
const markAllCompletedBtn = document.getElementById('markAllCompletedBtn');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const themeToggle = document.getElementById('themeToggle');
const themeIconSun = document.getElementById('themeIconSun');
const themeIconMoon = document.getElementById('themeIconMoon');
const filterButtons = document.querySelectorAll('.filter-btn');
const totalCount = document.getElementById('totalCount');
const completedCount = document.getElementById('completedCount');
const remainingCount = document.getElementById('remainingCount');
const overdueCount = document.getElementById('overdueCount');
const filterCountAll = document.getElementById('filterCountAll');
const filterCountActive = document.getElementById('filterCountActive');
const filterCountCompleted = document.getElementById('filterCountCompleted');
const filterCountOverdue = document.getElementById('filterCountOverdue');
const taskListHeaderTitle = document.getElementById('taskListHeaderTitle');
const activeFilterLabel = document.getElementById('activeFilterLabel');
const currentDateDisplay = document.getElementById('currentDateDisplay');
const toastContainer = document.getElementById('toastContainer');

// State
let tasks = [];
try {
  const saved = localStorage.getItem('smartTodoTasks');
  if (saved) {
    tasks = JSON.parse(saved);
  }
} catch (e) {
  console.error('Error loading tasks from localStorage', e);
  tasks = [];
}

let activeFilter = 'all';
let searchTerm = '';
let currentSort = 'created-desc';
let lastDeletedTask = null;
let toastTimeout = null;
const themeKey = 'smartTodoTheme';

// Save to storage
const saveTasks = () => {
  try {
    localStorage.setItem('smartTodoTasks', JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving tasks to localStorage', e);
  }
};

// Toast notification helper
const showToast = (message, actionText = null, actionCallback = null) => {
  if (!toastContainer) return;
  toastContainer.innerHTML = '';
  if (toastTimeout) clearTimeout(toastTimeout);

  const toast = document.createElement('div');
  toast.className = 'toast';

  const msgSpan = document.createElement('span');
  msgSpan.textContent = message;
  toast.appendChild(msgSpan);

  if (actionText && actionCallback) {
    const btn = document.createElement('button');
    btn.className = 'toast-undo-btn';
    btn.textContent = actionText;
    btn.type = 'button';
    btn.addEventListener('click', () => {
      actionCallback();
      toast.remove();
    });
    toast.appendChild(btn);
  }

  toastContainer.appendChild(toast);

  toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 200);
  }, 4000);
};

// Date helpers
const updateCurrentDate = () => {
  if (!currentDateDisplay) return;
  const now = new Date();
  const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  currentDateDisplay.textContent = now.toLocaleDateString(undefined, options);
};

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isOverdue = (dueDate, completed) => {
  if (!dueDate || completed) return false;
  const today = getTodayString();
  return dueDate < today;
};

const formatDueMeta = (dueDate, completed) => {
  if (!dueDate) return '';
  const today = getTodayString();

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

  const [year, month, day] = dueDate.split('-');
  const dateObj = new Date(year, parseInt(month) - 1, day);
  const monthShort = dateObj.toLocaleString('en-US', { month: 'short' });

  if (dueDate < today && !completed) {
    return `<span class="due-tag overdue">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
      Overdue (${monthShort} ${day})
    </span>`;
  } else if (dueDate === today) {
    return `<span class="due-tag due-today">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
      Due Today
    </span>`;
  } else if (dueDate === tomorrow) {
    return `<span class="due-tag">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
      Due Tomorrow
    </span>`;
  } else {
    return `<span class="due-tag">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
      Due ${monthShort} ${day}
    </span>`;
  }
};

const formatAddedDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Theme Toggle
const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(themeKey, theme);
  } catch (e) {}

  if (themeIconSun && themeIconMoon) {
    if (theme === 'dark') {
      themeIconSun.style.display = 'block';
      themeIconMoon.style.display = 'none';
    } else {
      themeIconSun.style.display = 'none';
      themeIconMoon.style.display = 'block';
    }
  }
};

const loadTheme = () => {
  let theme = 'light';
  try {
    const stored = localStorage.getItem(themeKey);
    if (stored) {
      theme = stored;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    }
  } catch (e) {}
  setTheme(theme);
};

// Create Single Task DOM Element
const createTaskElement = (task) => {
  const li = document.createElement('li');
  li.className = `task-item ${task.completed ? 'completed' : ''}`;
  li.dataset.id = task.id;

  const priority = task.priority || 'medium';
  const dueMarkup = formatDueMeta(task.dueDate, task.completed);
  const createdDateStr = formatAddedDate(task.createdAt);

  li.innerHTML = `
    <label class="custom-checkbox-label" title="${task.completed ? 'Mark incomplete' : 'Mark complete'}">
      <input type="checkbox" class="checkbox-hidden" ${task.completed ? 'checked' : ''} aria-label="Toggle task status" />
      <span class="checkbox-custom">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>
    </label>

    <div class="task-content">
      <p class="task-title ${task.completed ? 'completed' : ''}">${escapeHtml(task.title)}</p>
      <div class="task-meta">
        <span class="priority-tag priority-${priority}">${priority}</span>
        ${dueMarkup ? `<span class="meta-separator" aria-hidden="true">•</span> ${dueMarkup}` : ''}
        ${createdDateStr ? `<span class="meta-separator" aria-hidden="true">•</span> <span>Added ${createdDateStr}</span>` : ''}
      </div>
    </div>

    <div class="task-actions">
      <button type="button" class="action-btn edit-btn" aria-label="Edit task" title="Edit task">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button type="button" class="action-btn delete-btn" aria-label="Delete task" title="Delete task">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;

  const checkbox = li.querySelector('.checkbox-hidden');
  const titleEl = li.querySelector('.task-title');
  const editBtn = li.querySelector('.edit-btn');
  const deleteBtn = li.querySelector('.delete-btn');

  checkbox.addEventListener('change', () => {
    task.completed = checkbox.checked;
    saveTasks();
    renderTasks();
  });

  editBtn.addEventListener('click', () => startEditTask(task.id, titleEl, li));
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  return li;
};

// Task Editing
const startEditTask = (taskId, titleElement, itemElement) => {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  const currentTitle = task.title;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentTitle;
  input.className = 'task-edit-input';
  input.setAttribute('aria-label', 'Edit task name');

  titleElement.replaceWith(input);
  input.focus();
  input.select();

  let isEditing = true;

  const commitEdit = () => {
    if (!isEditing) return;
    const newTitle = input.value.trim();
    if (!newTitle) {
      input.focus();
      return;
    }
    isEditing = false;
    task.title = newTitle;
    saveTasks();
    renderTasks();
    showToast('Task updated');
  };

  const cancelEdit = () => {
    if (!isEditing) return;
    isEditing = false;
    renderTasks();
  };

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    }
  });

  input.addEventListener('blur', commitEdit);
};

// Delete Task with Undo
const deleteTask = (taskId) => {
  const index = tasks.findIndex((item) => item.id === taskId);
  if (index === -1) return;

  const [removedTask] = tasks.splice(index, 1);
  lastDeletedTask = { task: removedTask, index };
  saveTasks();
  renderTasks();

  showToast(`Deleted "${removedTask.title}"`, 'Undo', () => {
    if (lastDeletedTask) {
      tasks.splice(lastDeletedTask.index, 0, lastDeletedTask.task);
      saveTasks();
      renderTasks();
      showToast('Task restored');
      lastDeletedTask = null;
    }
  });
};

// Add Task
const addTask = (title, dueDate, priority) => {
  const trimmed = title.trim();
  if (!trimmed) {
    if (taskInput) taskInput.focus();
    return;
  }

  const newTask = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title: trimmed,
    dueDate: dueDate || '',
    priority: priority || 'medium',
    completed: false,
    createdAt: Date.now(),
  };

  tasks.unshift(newTask);
  saveTasks();
  renderTasks();

  if (taskForm) taskForm.reset();
  if (taskInput) taskInput.focus();
  showToast('Task added');
};

// Sorting helper
const sortTasksList = (list) => {
  const priorityWeights = { high: 3, medium: 2, low: 1 };

  return [...list].sort((a, b) => {
    switch (currentSort) {
      case 'created-asc':
        return (a.createdAt || 0) - (b.createdAt || 0);
      case 'due-asc':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      case 'priority-desc':
        return (priorityWeights[b.priority || 'medium'] || 0) - (priorityWeights[a.priority || 'medium'] || 0);
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'created-desc':
      default:
        return (b.createdAt || 0) - (a.createdAt || 0);
    }
  });
};

// Render Loop
const renderTasks = () => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const remaining = total - completed;
  const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.completed)).length;

  // Update Counters
  if (totalCount) totalCount.textContent = total;
  if (completedCount) completedCount.textContent = completed;
  if (remainingCount) remainingCount.textContent = remaining;
  if (overdueCount) overdueCount.textContent = overdue;

  if (filterCountAll) filterCountAll.textContent = `(${total})`;
  if (filterCountActive) filterCountActive.textContent = `(${remaining})`;
  if (filterCountCompleted) filterCountCompleted.textContent = `(${completed})`;
  if (filterCountOverdue) filterCountOverdue.textContent = `(${overdue})`;

  // Progress Bar
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressPercent) progressPercent.textContent = `${pct}%`;

  if (clearCompletedBtn) {
    clearCompletedBtn.disabled = completed === 0;
  }

  // Filter Tasks
  const filtered = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesFilter = true;

    if (activeFilter === 'active') {
      matchesFilter = !task.completed;
    } else if (activeFilter === 'completed') {
      matchesFilter = task.completed;
    } else if (activeFilter === 'overdue') {
      matchesFilter = isOverdue(task.dueDate, task.completed);
    }

    return matchesSearch && matchesFilter;
  });

  const sorted = sortTasksList(filtered);

  if (activeFilterLabel) {
    const filterNames = { all: 'All Tasks', active: 'Active Tasks', completed: 'Completed Tasks', overdue: 'Overdue Tasks' };
    activeFilterLabel.textContent = `${filterNames[activeFilter] || 'Tasks'} (${sorted.length})`;
  }

  tasksList.innerHTML = '';

  if (sorted.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.className = 'empty-state';

    let message = 'No tasks found. Add a task above to get started!';
    if (searchTerm) {
      message = `No tasks matching "${escapeHtml(searchTerm)}".`;
    } else if (activeFilter === 'active') {
      message = 'No active tasks! You are all caught up.';
    } else if (activeFilter === 'completed') {
      message = 'No completed tasks yet.';
    } else if (activeFilter === 'overdue') {
      message = 'Great job! No overdue tasks.';
    }

    emptyLi.innerHTML = `
      <div class="empty-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3 class="empty-title">Nothing here</h3>
      <p class="empty-desc">${message}</p>
    `;
    tasksList.appendChild(emptyLi);
  } else {
    sorted.forEach((task) => tasksList.appendChild(createTaskElement(task)));
  }
};

// Event Listeners
if (taskForm) {
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(taskInput.value, dueDateInput.value, priorityInput ? priorityInput.value : 'medium');
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    if (searchClearBtn) {
      searchClearBtn.style.display = searchTerm ? 'block' : 'none';
    }
    renderTasks();
  });
}

if (searchClearBtn) {
  searchClearBtn.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      searchTerm = '';
      searchClearBtn.style.display = 'none';
      searchInput.focus();
      renderTasks();
    }
  });
}

if (sortSelect) {
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderTasks();
  });
}

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter || 'all';
    renderTasks();
  });
});

if (clearCompletedBtn) {
  clearCompletedBtn.addEventListener('click', () => {
    const completedTasks = tasks.filter((t) => t.completed);
    if (completedTasks.length === 0) return;

    tasks = tasks.filter((t) => !t.completed);
    saveTasks();
    renderTasks();
    showToast(`Cleared ${completedTasks.length} completed ${completedTasks.length === 1 ? 'task' : 'tasks'}`);
  });
}

if (markAllCompletedBtn) {
  markAllCompletedBtn.addEventListener('click', () => {
    const hasUncompleted = tasks.some((t) => !t.completed);
    tasks.forEach((t) => {
      t.completed = hasUncompleted;
    });
    saveTasks();
    renderTasks();
    showToast(hasUncompleted ? 'All tasks marked as completed' : 'All tasks marked as active');
  });
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.dataset.theme || 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });
}

// Global Keyboard Shortcut: '/' to focus search, 'Escape' to unfocus
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== taskInput && document.activeElement !== searchInput) {
    if (searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  }
});

// Seed default initial tasks if empty on first load
if (tasks.length === 0) {
  const todayStr = getTodayString();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

  tasks = [
    {
      id: 'demo_1',
      title: 'Welcome to Smart To-Do List! Review your tasks for today',
      dueDate: todayStr,
      priority: 'high',
      completed: false,
      createdAt: Date.now() - 3600000 * 2,
    },
    {
      id: 'demo_2',
      title: 'Explore filters, priority tags, and quick search',
      dueDate: tomorrowStr,
      priority: 'medium',
      completed: false,
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'demo_3',
      title: 'Click anywhere to edit or check off completed tasks',
      dueDate: '',
      priority: 'low',
      completed: true,
      createdAt: Date.now() - 7200000,
    },
  ];
  saveTasks();
}

// Initial Boot
updateCurrentDate();
loadTheme();
renderTasks();
