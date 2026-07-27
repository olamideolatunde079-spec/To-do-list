const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const dueDateInput = document.getElementById('dueDateInput');
const searchInput = document.getElementById('searchInput');
const tasksList = document.getElementById('tasks');
const clearCompletedBtn = document.getElementById('clearCompleted');
const progressFill = document.getElementById('progressFill');
const themeToggle = document.getElementById('themeToggle');
const filterButtons = document.querySelectorAll('.filter-btn');
const totalCount = document.getElementById('totalCount');
const completedCount = document.getElementById('completedCount');
const remainingCount = document.getElementById('remainingCount');

let tasks = JSON.parse(localStorage.getItem('smartTodoTasks') || '[]');
let activeFilter = 'all';
let searchTerm = '';
const themeKey = 'smartTodoTheme';

const saveTasks = () => {
  localStorage.setItem('smartTodoTasks', JSON.stringify(tasks));
};

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(themeKey, theme);
};

const loadTheme = () => {
  const storedTheme = localStorage.getItem(themeKey);
  if (storedTheme) {
    document.documentElement.dataset.theme = storedTheme;
  }
};

const formatDate = (timestamp) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
};

const escapeHtml = (text) =>
  text.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);

const createTaskElement = (task) => {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.dataset.id = task.id;

  const titleClass = task.completed ? 'task-title completed' : 'task-title';
  const dueMeta = task.dueDate ? `<span>Due ${task.dueDate}</span>` : '';

  li.innerHTML = `
    <label class="task-left">
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task complete">
      <div class="task-main">
        <p class="${titleClass}">${escapeHtml(task.title)}</p>
        <div class="task-meta">
          <span>Added ${formatDate(task.createdAt)}</span>
          ${dueMeta}
        </div>
      </div>
    </label>
    <div class="task-actions">
      <button type="button" class="edit-btn" title="Edit task">🖋️</button>
      <button type="button" class="delete-btn" title="Delete task">🗑️</button>
    </div>
  `;

  const checkbox = li.querySelector('.task-checkbox');
  const editBtn = li.querySelector('.edit-btn');
  const deleteBtn = li.querySelector('.delete-btn');
  const titleElement = li.querySelector('.task-title');

  checkbox.addEventListener('change', () => {
    task.completed = checkbox.checked;
    titleElement.classList.toggle('completed', task.completed);
    saveTasks();
    renderTasks();
  });

  editBtn.addEventListener('click', () => startEditTask(task.id, titleElement, li));
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  return li;
};

const renderTasks = () => {
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'active' && !task.completed) ||
      (activeFilter === 'completed' && task.completed);
    return matchesSearch && matchesFilter;
  });

  tasksList.innerHTML = '';

  if (filteredTasks.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'task-item';
    empty.innerHTML = '<p style="margin:0; color:var(--muted)">No tasks found. Add one above.</p>';
    tasksList.appendChild(empty);
  } else {
    filteredTasks.forEach((task) => tasksList.appendChild(createTaskElement(task)));
  }

  const completedCountValue = tasks.filter((task) => task.completed).length;
  totalCount.textContent = tasks.length;
  completedCount.textContent = completedCountValue;
  remainingCount.textContent = tasks.length - completedCountValue;

  if (progressFill) {
    progressFill.style.width = tasks.length === 0 ? '0%' : `${Math.round((completedCountValue / tasks.length) * 100)}%`;
  }

  if (clearCompletedBtn) {
    clearCompletedBtn.disabled = completedCountValue === 0;
  }
};

const addTask = (title, dueDate) => {
  const trimmed = title.trim();
  if (!trimmed) {
    alert('Please enter a task description.');
    return;
  }

  tasks.unshift({
    id: Date.now().toString(),
    title: trimmed,
    createdAt: Date.now(),
    dueDate: dueDate || '',
    completed: false,
  });

  saveTasks();
  renderTasks();
  taskForm.reset();
  taskInput.focus();
};

const deleteTask = (taskId) => {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  if (!confirm(`Delete "${task.title}"?`)) return;

  tasks = tasks.filter((item) => item.id !== taskId);
  saveTasks();
  renderTasks();
};

const startEditTask = (taskId, titleElement) => {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = task.title;
  input.className = 'task-edit-input';
  input.setAttribute('aria-label', 'Edit task');

  titleElement.replaceWith(input);
  input.focus();

  let isEditing = true;

  const saveEdit = () => {
    if (!isEditing) return;
    const newTitle = input.value.trim();
    if (!newTitle) {
      alert('Task title cannot be empty.');
      input.focus();
      return;
    }
    isEditing = false;
    task.title = newTitle;
    saveTasks();
    renderTasks();
  };

  const cancelEdit = () => {
    if (!isEditing) return;
    isEditing = false;
    renderTasks();
  };

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') saveEdit();
    if (event.key === 'Escape') cancelEdit();
  });

  input.addEventListener('blur', saveEdit);
};

const changeFilter = (filter) => {
  activeFilter = filter;
  filterButtons.forEach((button) => button.classList.toggle('active', button.dataset.filter === filter));
  renderTasks();
};

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addTask(taskInput.value, dueDateInput.value);
});

searchInput.addEventListener('input', (event) => {
  searchTerm = event.target.value;
  renderTasks();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => changeFilter(button.dataset.filter));
});

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });
}

loadTheme();
renderTasks();
