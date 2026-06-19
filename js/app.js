/* ============================================================
   PERSONAL DASHBOARD — app.js
   Vanilla JS · LocalStorage · No frameworks
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────
   STORAGE HELPERS
────────────────────────────────────────── */
const storage = {
  get: (key, fallback = null) => {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

/* ──────────────────────────────────────────
   THEME
────────────────────────────────────────── */
const themeToggleBtn = document.getElementById('themeToggle');
let darkMode = storage.get('darkMode', false);

function applyTheme() {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  themeToggleBtn.textContent = darkMode ? '☀️' : '🌙';
  themeToggleBtn.title = darkMode ? 'Switch to light mode' : 'Switch to dark mode';
}

themeToggleBtn.addEventListener('click', () => {
  darkMode = !darkMode;
  storage.set('darkMode', darkMode);
  applyTheme();
});

applyTheme();

/* ──────────────────────────────────────────
   GREETING & DATETIME
────────────────────────────────────────── */
const datetimeEl = document.getElementById('datetime');
const greetingEl = document.getElementById('greeting');

function getGreeting(hour) {
  if (hour >= 5  && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

function updateClock() {
  const now   = new Date();
  const hour  = now.getHours();
  const name  = storage.get('userName', '');

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  datetimeEl.textContent = `${dateStr} · ${timeStr}`;
  greetingEl.textContent = `${getGreeting(hour)}${name ? ', ' + name : ''}! 👋`;
}

updateClock();
setInterval(updateClock, 1000);

/* ──────────────────────────────────────────
   SETTINGS MODAL (custom name)
────────────────────────────────────────── */
const settingsModal  = document.getElementById('settingsModal');
const openSettingsBtn = document.getElementById('openSettings');
const closeSettingsBtn = document.getElementById('closeSettings');
const saveNameBtn    = document.getElementById('saveName');
const customNameInput = document.getElementById('customName');

function openModal() {
  customNameInput.value = storage.get('userName', '');
  settingsModal.removeAttribute('hidden');
  customNameInput.focus();
}

function closeModal() {
  settingsModal.setAttribute('hidden', '');
}

openSettingsBtn.addEventListener('click', openModal);
closeSettingsBtn.addEventListener('click', closeModal);
settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) closeModal(); });

saveNameBtn.addEventListener('click', () => {
  const name = customNameInput.value.trim();
  storage.set('userName', name);
  closeModal();
  updateClock();
});

customNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveNameBtn.click(); });

/* ──────────────────────────────────────────
   POMODORO TIMER
────────────────────────────────────────── */
const timerDisplay   = document.getElementById('timerDisplay');
const startBtn       = document.getElementById('startBtn');
const stopBtn        = document.getElementById('stopBtn');
const resetBtn       = document.getElementById('resetBtn');
const pomodoroInput  = document.getElementById('pomodoroInput');
const applyTimerBtn  = document.getElementById('applyTimer');

let timerDuration = storage.get('pomodoroDuration', 25); // in minutes
let timeLeft      = timerDuration * 60;                  // in seconds
let timerInterval = null;
let isRunning     = false;

pomodoroInput.value = timerDuration;

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timeLeft);
  timerDisplay.classList.toggle('running', isRunning);
  timerDisplay.classList.remove('finished');
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  renderTimer();
  timerInterval = setInterval(() => {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      timerDisplay.textContent = '00:00';
      timerDisplay.classList.remove('running');
      timerDisplay.classList.add('finished');
      showNotification('⏰ Focus session complete! Take a break.');
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  renderTimer();
}

function resetTimer() {
  stopTimer();
  timeLeft = timerDuration * 60;
  timerDisplay.classList.remove('finished');
  renderTimer();
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);

applyTimerBtn.addEventListener('click', () => {
  const val = parseInt(pomodoroInput.value, 10);
  if (!val || val < 1 || val > 120) {
    pomodoroInput.focus();
    return;
  }
  timerDuration = val;
  storage.set('pomodoroDuration', timerDuration);
  resetTimer();
});

pomodoroInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyTimerBtn.click(); });

renderTimer();

/* ── Browser Notification ── */
function showNotification(msg) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(msg);
  } else {
    alert(msg);
  }
}

if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

/* ──────────────────────────────────────────
   TO-DO LIST
────────────────────────────────────────── */
const todoInput = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodo');
const todoList   = document.getElementById('todoList');

let todos = storage.get('todos', []); // [{id, text, done}]

function saveTodos() { storage.set('todos', todos); }

function createTodoItem(todo) {
  const li = document.createElement('li');
  li.className = `todo-item${todo.done ? ' done' : ''}`;
  li.dataset.id = todo.id;

  // Checkbox
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'todo-checkbox';
  cb.checked = todo.done;
  cb.setAttribute('aria-label', 'Mark task done');
  cb.addEventListener('change', () => toggleTodo(todo.id));

  // Text
  const span = document.createElement('span');
  span.className = 'todo-text';
  span.textContent = todo.text;

  // Actions
  const actions = document.createElement('div');
  actions.className = 'todo-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'todo-btn';
  editBtn.title = 'Edit task';
  editBtn.textContent = '✏️';
  editBtn.addEventListener('click', () => startEditTodo(todo.id, li, span));

  const delBtn = document.createElement('button');
  delBtn.className = 'todo-btn';
  delBtn.title = 'Delete task';
  delBtn.textContent = '🗑️';
  delBtn.setAttribute('aria-label', 'Delete task');
  delBtn.addEventListener('click', () => deleteTodo(todo.id));

  actions.append(editBtn, delBtn);
  li.append(cb, span, actions);
  return li;
}

function renderTodos() {
  todoList.innerHTML = '';
  todos.forEach(t => todoList.appendChild(createTodoItem(t)));
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) { todoInput.focus(); return; }
  todos.push({ id: Date.now(), text, done: false });
  saveTodos();
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
}

function toggleTodo(id) {
  todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

function startEditTodo(id, li, span) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const editInput = document.createElement('input');
  editInput.type  = 'text';
  editInput.className = 'todo-edit-input';
  editInput.value = todo.text;
  editInput.maxLength = 120;

  li.replaceChild(editInput, span);
  editInput.focus();
  editInput.select();

  function commitEdit() {
    const newText = editInput.value.trim();
    if (newText) {
      todos = todos.map(t => t.id === id ? { ...t, text: newText } : t);
      saveTodos();
    }
    renderTodos();
  }

  editInput.addEventListener('blur', commitEdit);
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { editInput.removeEventListener('blur', commitEdit); commitEdit(); }
    if (e.key === 'Escape') { editInput.removeEventListener('blur', commitEdit); renderTodos(); }
  });
}

addTodoBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });

renderTodos();

/* ──────────────────────────────────────────
   QUICK LINKS
────────────────────────────────────────── */
const linkNameInput = document.getElementById('linkName');
const linkUrlInput  = document.getElementById('linkUrl');
const addLinkBtn    = document.getElementById('addLink');
const linksGrid     = document.getElementById('linksGrid');

let links = storage.get('quickLinks', []); // [{id, name, url}]

function saveLinks() { storage.set('quickLinks', links); }

function getFavicon(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?sz=32&domain=${origin}`;
  } catch { return null; }
}

function renderLinks() {
  linksGrid.innerHTML = '';
  links.forEach(link => {
    const chip = document.createElement('a');
    chip.className = 'link-chip';
    chip.href = link.url;
    chip.target = '_blank';
    chip.rel = 'noopener noreferrer';
    chip.title = link.url;

    const favicon = getFavicon(link.url);
    if (favicon) {
      const img = document.createElement('img');
      img.src    = favicon;
      img.width  = 16;
      img.height = 16;
      img.alt    = '';
      img.style.flexShrink = '0';
      img.onerror = () => img.remove();
      chip.appendChild(img);
    }

    const nameSpan = document.createElement('span');
    nameSpan.textContent = link.name;
    chip.appendChild(nameSpan);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'link-remove';
    removeBtn.title = 'Remove link';
    removeBtn.textContent = '✕';
    removeBtn.setAttribute('aria-label', `Remove ${link.name}`);
    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeLink(link.id);
    });
    chip.appendChild(removeBtn);

    linksGrid.appendChild(chip);
  });
}

function addLink() {
  const name = linkNameInput.value.trim();
  let   url  = linkUrlInput.value.trim();
  if (!name || !url) { linkNameInput.focus(); return; }

  // Auto-prefix protocol
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  try { new URL(url); } catch { linkUrlInput.focus(); return; }

  links.push({ id: Date.now(), name, url });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
}

function removeLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

addLinkBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });
linkNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });

renderLinks();
