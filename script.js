// ============================================
// ROUTINE CHECKER - JAVASCRIPT FUNCTIONALITY
// ============================================

// Constants
const STORAGE_KEY = 'routines_data';
const THEME_STORAGE_KEY = 'theme_preference';
const MODE_STORAGE_KEY = 'mode_preference';
const LOGS_STORAGE_KEY = 'app_logs';
const AUTH_SESSION_KEY = 'routineflow_session';

if (!localStorage.getItem(AUTH_SESSION_KEY)) {
    window.location.replace('login.html');
}

// DOM Elements
const routineInput = document.getElementById('routineInput');
const addBtn = document.getElementById('addBtn');
const routinesList = document.getElementById('routinesList');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const resetBtn = document.getElementById('resetBtn');
const themeToggle = document.getElementById('themeToggle');
const themeSelector = document.getElementById('themeSelector');
const filterButtons = document.querySelectorAll('.filter-btn');
const completedCount = document.getElementById('completedCount');
const totalCount = document.getElementById('totalCount');
const percentageCount = document.getElementById('percentageCount');
const scheduleBtn = document.getElementById('scheduleBtn');
const scheduleModal = document.getElementById('scheduleModal');
const closeScheduleModal = document.getElementById('closeScheduleModal');
const cancelScheduleBtn = document.getElementById('cancelScheduleBtn');
const saveScheduleBtn = document.getElementById('saveScheduleBtn');
const scheduledRoutineText = document.getElementById('scheduledRoutineText');
const periodSelect = document.getElementById('periodSelect');
const calendarContainer = document.getElementById('calendarContainer');
const logsBtn = document.getElementById('logsBtn');
const logsModal = document.getElementById('logsModal');
const closeLogsModal = document.getElementById('closeLogsModal');
const logsList = document.getElementById('logsList');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Clock and Calendar DOM Elements
const clockHoursHeader = document.getElementById('clockHoursHeader');
const clockMinutesHeader = document.getElementById('clockMinutesHeader');
const calendarBtn = document.getElementById('calendarBtn');
const calendarModal = document.getElementById('calendarModal');
const closeCalendarModal = document.getElementById('closeCalendarModal');
const calendarMonthYear = document.getElementById('calendarMonthYear');
const calendarDays = document.getElementById('calendarDays');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

// State
let routines = [];
let currentFilter = 'all';
let selectedDays = new Set();
let draggedRoutineId = null;
let currentDisplayMonth = new Date();
let previousTime = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadRoutines();
    loadThemePreferences();
    renderRoutines();
    updateStats();
    setupEventListeners();
    logAction('App initialized', 'Application loaded');
    
    // Initialize clock and calendar
    updateClock();
    renderCalendar();
    setInterval(updateClock, 1000);
});

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Add routine
    addBtn.addEventListener('click', addRoutine);
    routineInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addRoutine();
        }
    });

    // Clear and reset
    clearCompletedBtn.addEventListener('click', clearCompleted);
    resetBtn.addEventListener('click', resetToday);

    // Theme
    themeToggle.addEventListener('click', toggleMode);
    themeSelector.addEventListener('change', changeTheme);

    // Schedule
    scheduleBtn.addEventListener('click', openScheduleModal);
    closeScheduleModal.addEventListener('click', closeScheduleModalFunc);
    cancelScheduleBtn.addEventListener('click', closeScheduleModalFunc);
    saveScheduleBtn.addEventListener('click', saveScheduledRoutines);
    periodSelect.addEventListener('change', renderCalendar);

    // Close modal on backdrop click
    scheduleModal.addEventListener('click', (e) => {
        if (e.target === scheduleModal) {
            closeScheduleModalFunc();
        }
    });

    // Logs
    if (logsBtn) logsBtn.addEventListener('click', openLogsModal);
    if (closeLogsModal) closeLogsModal.addEventListener('click', closeLogsModalFunc);
    if (clearLogsBtn) clearLogsBtn.addEventListener('click', clearLogs);
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(AUTH_SESSION_KEY);
        window.location.href = 'login.html';
    });
    if (logsModal) {
        logsModal.addEventListener('click', (e) => {
            if (e.target === logsModal) {
                closeLogsModalFunc();
            }
        });
    }

    // Calendar modal
    if (calendarBtn) calendarBtn.addEventListener('click', openCalendarModal);
    if (closeCalendarModal) closeCalendarModal.addEventListener('click', closeCalendarModalFunc);
    if (calendarModal) {
        calendarModal.addEventListener('click', (e) => {
            if (e.target === calendarModal) {
                closeCalendarModalFunc();
            }
        });
    }

    // Calendar navigation
    if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => changeMonth(1));

    // Filter
    filterButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach((b) => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderRoutines();
        });
    });
}

// ============================================
// ROUTINE MANAGEMENT
// ============================================

function addRoutine() {
    const text = routineInput.value.trim();

    if (text.length === 0) {
        routineInput.focus();
        return;
    }

    const routine = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
    };

    routines.push(routine);
    saveRoutines();
    logAction('Added routine', `"${text}"`);
    renderRoutines();
    updateStats();
    routineInput.value = '';
    routineInput.focus();
}

function toggleRoutine(id) {
    const routine = routines.find((r) => r.id == id);
    if (routine) {
        routine.completed = !routine.completed;
        routine.completedAt = routine.completed ? new Date().toISOString() : null;
        saveRoutines();
        const action = routine.completed ? 'Completed routine' : 'Uncompleted routine';
        logAction(action, `"${routine.text}"`);
        renderRoutines();
        updateStats();
    }
}

function deleteRoutine(id) {
    const routine = routines.find((r) => r.id == id);
    const text = routine ? routine.text : 'Unknown routine';
    routines = routines.filter((r) => r.id != id);
    saveRoutines();
    logAction('Deleted routine', `"${text}"`);
    renderRoutines();
    updateStats();
}

function editRoutine(id) {
    const routine = routines.find((r) => r.id == id);
    if (routine) {
        const newText = prompt('Edit routine:', routine.text);
        if (newText && newText.trim().length > 0) {
            const oldText = routine.text;
            routine.text = newText.trim();
            saveRoutines();
            logAction('Edited routine', `"${oldText}" → "${routine.text}"`);
            renderRoutines();
        }
    }
}

function clearCompleted() {
    const completedRoutines = routines.filter((r) => r.completed);
    
    if (completedRoutines.length === 0) {
        alert('No completed routines to clear');
        return;
    }
    
    if (confirm('Are you sure you want to clear all completed routines?')) {
        const count = completedRoutines.length;
        routines = routines.filter((r) => !r.completed);
        saveRoutines();
        logAction('Cleared completed', `${count} routine(s) removed`);
        renderRoutines();
        updateStats();
    }
}

function resetToday() {
    const completedRoutines = routines.filter((r) => r.completed);
    
    if (completedRoutines.length === 0) {
        alert('No completed routines to reset');
        return;
    }
    
    if (confirm('Reset all routines for today?')) {
        routines.forEach((r) => {
            r.completed = false;
            r.completedAt = null;
        });
        saveRoutines();
        logAction('Reset today', 'All routines reset to pending');
        renderRoutines();
        updateStats();
    }
}

// ============================================
// RENDERING
// ============================================

function renderRoutines() {
    const filteredRoutines = getFilteredRoutines();

    if (filteredRoutines.length === 0) {
        routinesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✨</div>
                <p>${getEmptyMessage()}</p>
            </div>
        `;
        return;
    }

    routinesList.innerHTML = filteredRoutines
        .map((routine) => createRoutineElement(routine))
        .join('');

    // Attach event listeners to routine items
    document.querySelectorAll('.routine-item').forEach((item) => {
        const routineId = item.dataset.id;
        const checkbox = item.querySelector('.routine-checkbox');
        const editBtn = item.querySelector('.edit-btn');
        const deleteBtn = item.querySelector('.delete-btn');

        if (checkbox) checkbox.addEventListener('change', () => toggleRoutine(routineId));
        if (editBtn) editBtn.addEventListener('click', (e) => {
            e.preventDefault();
            editRoutine(routineId);
        });
        if (deleteBtn) deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            deleteRoutine(routineId);
        });

        // Drag and drop events
        item.addEventListener('dragstart', (e) => handleDragStart(e, routineId));
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', (e) => handleDrop(e, routineId));
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
    });
}

function createRoutineElement(routine) {
    const timeDisplay = getTimeDisplay(routine.createdAt);

    return `
        <div class="routine-item ${routine.completed ? 'completed' : ''}" data-id="${routine.id}" draggable="true">
            <div class="drag-handle" title="Drag to reorder">⋮</div>
            <input 
                type="checkbox" 
                class="routine-checkbox" 
                ${routine.completed ? 'checked' : ''}
            >
            <div class="routine-content">
                <div class="routine-text">${escapeHtml(routine.text)}</div>
                <div class="routine-time">Added ${timeDisplay}</div>
            </div>
            <div class="routine-actions">
                <button class="edit-btn" title="Edit">✏️</button>
                <button class="delete-btn" title="Delete">🗑️</button>
            </div>
        </div>
    `;
}

function getFilteredRoutines() {
    switch (currentFilter) {
        case 'pending':
            return routines.filter((r) => !r.completed);
        case 'completed':
            return routines.filter((r) => r.completed);
        case 'all':
        default:
            return routines;
    }
}

function getEmptyMessage() {
    switch (currentFilter) {
        case 'pending':
            return 'All routines completed! 🎉';
        case 'completed':
            return 'No completed routines yet.';
        case 'all':
        default:
            return 'No routines yet. Start building your routine!';
    }
}

function getTimeDisplay(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

// ============================================
// STATISTICS
// ============================================

function updateStats() {
    const total = routines.length;
    const completed = routines.filter((r) => r.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    completedCount.textContent = completed;
    totalCount.textContent = total;
    percentageCount.textContent = `${percentage}%`;
}

// ============================================
// STORAGE
// ============================================

function saveRoutines() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
}

function loadRoutines() {
    const stored = localStorage.getItem(STORAGE_KEY);
    routines = stored ? JSON.parse(stored) : [];
}

// ============================================
// LOGGING SYSTEM
// ============================================

function logAction(action, details = '') {
    const logs = getLogs();
    const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action: action,
        details: details,
    };
    logs.push(logEntry);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
}

function getLogs() {
    const stored = localStorage.getItem(LOGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function renderLogs() {
    const logs = getLogs();
    
    if (logs.length === 0) {
        logsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>No logs yet. Start using the app!</p>
            </div>
        `;
        return;
    }

    // Display logs in reverse order (newest first)
    logsList.innerHTML = logs.reverse().map((log) => createLogElement(log)).join('');
}

function createLogElement(log) {
    const timeDisplay = getTimeDisplay(log.timestamp);
    return `
        <div class="log-item">
            <div class="log-timestamp">${timeDisplay}</div>
            <div class="log-content">
                <div class="log-action">${escapeHtml(log.action)}</div>
                ${log.details ? `<div class="log-details">${escapeHtml(log.details)}</div>` : ''}
            </div>
        </div>
    `;
}

function openLogsModal() {
    logsModal.classList.add('active');
    renderLogs();
}

function closeLogsModalFunc() {
    logsModal.classList.remove('active');
}

function clearLogs() {
    if (confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify([]));
        logAction('Cleared logs', 'All logs removed');
        renderLogs();
    }
}

// ============================================
// CALENDAR MODAL FUNCTIONS
// ============================================

function openCalendarModal() {
    calendarModal.classList.add('active');
    renderCalendar();
}

function closeCalendarModalFunc() {
    calendarModal.classList.remove('active');
}

// ============================================
// THEME MANAGEMENT
// ============================================

function loadThemePreferences() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'monokaiPro';
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY) || 'dark';

    document.body.setAttribute('data-theme', savedTheme);
    themeSelector.value = savedTheme;

    if (savedMode === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('light-mode');
        themeToggle.textContent = '🌙';
    }
}

function toggleMode() {
    document.body.classList.toggle('light-mode');

    const isLightMode = document.body.classList.contains('light-mode');
    themeToggle.textContent = isLightMode ? '☀️' : '🌙';

    localStorage.setItem(MODE_STORAGE_KEY, isLightMode ? 'light' : 'dark');
    logAction('Changed mode', isLightMode ? 'Light mode' : 'Dark mode');
}

function changeTheme(e) {
    const theme = e.target.value;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    logAction('Changed theme', theme);
}

// ============================================
// UTILITIES
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// SCHEDULING
// ============================================

function openScheduleModal() {
    selectedDays.clear();
    scheduledRoutineText.value = '';
    periodSelect.value = 'weekly';
    scheduleModal.classList.add('active');
    renderCalendar();
}

function closeScheduleModalFunc() {
    scheduleModal.classList.remove('active');
    selectedDays.clear();
}

function renderCalendar() {
    const period = periodSelect.value;
    let daysCount = 7;
    let periodLabel = 'Week';

    if (period === 'monthly') {
        daysCount = 30;
        periodLabel = 'Month';
    } else if (period === 'yearly') {
        daysCount = 365;
        periodLabel = 'Year';
    }

    let calendarHTML = `<h3>Select Days (${periodLabel})</h3><div class="calendar-grid">`;

    for (let i = 1; i <= daysCount; i++) {
        const isSelected = selectedDays.has(i);
        const selectedClass = isSelected ? 'selected' : '';
        calendarHTML += `<button class="calendar-day ${selectedClass}" data-day="${i}">${i}</button>`;
    }

    calendarHTML += '</div>';
    calendarContainer.innerHTML = calendarHTML;

    // Add event listeners after rendering
    document.querySelectorAll('.calendar-day').forEach((dayBtn) => {
        dayBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const day = parseInt(e.target.dataset.day);
            toggleDaySelection(day);
        });
    });
}

function toggleDaySelection(day) {
    if (selectedDays.has(day)) {
        selectedDays.delete(day);
    } else {
        selectedDays.add(day);
    }
    renderCalendar();
}

function saveScheduledRoutines() {
    const text = scheduledRoutineText.value.trim();
    const period = periodSelect.value;

    if (text.length === 0) {
        alert('Please enter a routine name');
        return;
    }

    if (selectedDays.size === 0) {
        alert('Please select at least one day');
        return;
    }

    // Add a routine for each selected day
    const daysArray = Array.from(selectedDays);
    daysArray.forEach((day) => {
        const routine = {
            id: Date.now() + Math.random(),
            text: `${text} (Day ${day})`,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            scheduledDay: day,
            period: period,
        };
        routines.push(routine);
    });

    saveRoutines();
    logAction('Scheduled routine', `"${text}" for ${selectedDays.size} day(s) (${period})`);
    renderRoutines();
    updateStats();
    closeScheduleModalFunc();
    scheduledRoutineText.value = '';
}

// ============================================
// DRAG AND DROP
// ============================================

function handleDragStart(e, routineId) {
    draggedRoutineId = routineId;
    const draggedItem = e.currentTarget;
    draggedItem.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', draggedItem);
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    const item = e.currentTarget;
    if (item.classList.contains('routine-item') && item.dataset.id !== draggedRoutineId) {
        item.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (e.currentTarget.classList.contains('routine-item')) {
        e.currentTarget.classList.remove('drag-over');
    }
}

function handleDrop(e, targetId) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedRoutineId && draggedRoutineId !== targetId) {
        reorderRoutines(draggedRoutineId, targetId);
    }

    return false;
}

function handleDragEnd(e) {
    if (e.currentTarget.classList.contains('routine-item')) {
        e.currentTarget.classList.remove('dragging');
    }
    document.querySelectorAll('.routine-item').forEach((item) => {
        item.classList.remove('drag-over');
    });
    draggedRoutineId = null;
}

function reorderRoutines(draggedId, targetId) {
    const draggedIndex = routines.findIndex((r) => r.id == draggedId);
    const targetIndex = routines.findIndex((r) => r.id == targetId);

    if (draggedIndex > -1 && targetIndex > -1) {
        const [draggedRoutine] = routines.splice(draggedIndex, 1);
        routines.splice(targetIndex, 0, draggedRoutine);
        saveRoutines();
        renderRoutines();
    }
}

// ============================================
// CLOCK FUNCTIONALITY
// ============================================

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // Update header clock
    clockHoursHeader.textContent = hours;
    clockMinutesHeader.textContent = minutes;
}

// ============================================
// CALENDAR FUNCTIONALITY
// ============================================

function renderCalendar() {
    const year = currentDisplayMonth.getFullYear();
    const month = currentDisplayMonth.getMonth();
    const today = new Date();
    
    // Set header
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    calendarMonthYear.textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    let daysHTML = '';

    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
        daysHTML += `<div class="calendar-day other-month">${daysInPrevMonth - i}</div>`;
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const className = `calendar-day ${isToday ? 'today' : ''}`;
        daysHTML += `<div class="${className}">${day}</div>`;
    }

    // Next month's days
    const totalCells = daysHTML.split('</div>').length - 1;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        daysHTML += `<div class="calendar-day other-month">${day}</div>`;
    }

    calendarDays.innerHTML = daysHTML;
}

function changeMonth(offset) {
    currentDisplayMonth.setMonth(currentDisplayMonth.getMonth() + offset);
    renderCalendar();
}

// ============================================
// SERVICE WORKER REGISTRATION (Optional)
// ============================================

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
        // Service worker registration failed, app still works offline via local storage
    });
}
