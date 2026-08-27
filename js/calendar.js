// js/calendar.js
// ===================================================================
// CALENDAR & EVENTS SYSTEM
// Manage important dates, deadlines, and events
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) {
    console.error('❌ AppState not loaded!');
    return;
  }

  // Initialize calendar in state
  if (!state.calendar) {
    state.calendar = {
      events: [] // { id, title, date, type, description, gradeLevel, color }
    };
  }

  // API Base URL for backend sync
  const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3001'
    ? (window.location.protocol + '//' + window.location.hostname + ':3001')
    : window.location.origin;

  // Get auth headers for API calls
  function getAuthHeaders() {
    const token = sessionStorage.getItem('EduAI_session_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Sync calendar with backend
  async function syncCalendarWithBackend() {
    if (!window.Accounts?.isLoggedIn()) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/calendar`, {
        headers: { ...getAuthHeaders() }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          state.calendar.events = data.events;
          console.log('✅ Calendar synced from backend');
        }
      }
    } catch (e) {
      console.warn('Could not sync calendar with backend:', e.message);
    }
  }

  // Save event to backend
  async function saveEventToBackend(title, date, type, description, gradeLevel) {
    if (!window.Accounts?.isLoggedIn()) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ title, date, type, description, gradeLevel })
      });
      
      if (res.ok) {
        console.log('✅ Event saved to backend');
      }
    } catch (e) {
      console.warn('Could not save event to backend:', e.message);
    }
  }

  // Delete event from backend
  async function deleteEventFromBackend(eventId) {
    if (!window.Accounts?.isLoggedIn()) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/calendar/${eventId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      
      if (res.ok) {
        console.log('✅ Event deleted from backend');
      }
    } catch (e) {
      console.warn('Could not delete event from backend:', e.message);
    }
  }

  // Event types
  const EVENT_TYPES = {
    test: { label: 'Test', color: '#dc2626', icon: '📝' },
    assignment: { label: 'Detyrë', color: '#f59e0b', icon: '📋' },
    project: { label: 'Projekt', color: '#8b5cf6', icon: '🎯' },
    holiday: { label: 'Pushim', color: '#16a34a', icon: '🏖️' },
    meeting: { label: 'Mbledhje', color: '#3b82f6', icon: '👥' },
    event: { label: 'Ngjarje', color: '#06b6d4', icon: '🎉' }
  };

  // Add event
  async function addEvent(title, date, type, description = '', gradeLevel = null) {
    const event = {
      id: Date.now(),
      title,
      date,
      type,
      description,
      gradeLevel,
      color: EVENT_TYPES[type]?.color || '#6b7280',
      timestamp: Date.now()
    };

    state.calendar.events.push(event);
    
    // Sync with backend
    await saveEventToBackend(title, date, type, description, gradeLevel);
    
    console.log('✅ Event added:', event);
    return event;
  }

  // Get events for date range
  function getEvents(startDate = null, endDate = null, gradeLevel = null) {
    let events = [...state.calendar.events];

    if (startDate) {
      events = events.filter(e => e.date >= startDate);
    }
    if (endDate) {
      events = events.filter(e => e.date <= endDate);
    }
    if (gradeLevel) {
      events = events.filter(e => !e.gradeLevel || e.gradeLevel === gradeLevel);
    }

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }

  // Get upcoming events
  function getUpcomingEvents(days = 7, gradeLevel = null) {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const endDate = futureDate.toISOString().split('T')[0];
    return getEvents(today, endDate, gradeLevel);
  }

  // Delete event
  async function deleteEvent(eventId) {
    const index = state.calendar.events.findIndex(e => e.id === eventId);
    if (index !== -1) {
      state.calendar.events.splice(index, 1);
      await deleteEventFromBackend(eventId);
      console.log('✅ Event deleted:', eventId);
      return true;
    }
    return false;
  }

  // Open calendar view
  function openCalendar() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '200';
    modal.style.display = 'flex';

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    modal.innerHTML = `
      <div class="modal" style="width:750px;max-width:95vw;max-height:90vh;overflow-y:auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;color:var(--accent)">📅 Kalendari</h3>
          <button class="icon-btn close-calendar" style="width:32px;height:32px;font-size:18px">×</button>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:16px">
          <button id="addEventBtn" class="btn-primary" style="flex:1">
            ➕ Shto Ngjarje
          </button>
          <button id="viewUpcomingBtn" class="btn-secondary" style="flex:1">
            👁️ Ngjarjet e Ardhshme
          </button>
        </div>

        <div id="calendarContent"></div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close
    modal.querySelector('.close-calendar').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Add event
    modal.querySelector('#addEventBtn').addEventListener('click', () => {
      openEventForm();
    });

    // View upcoming
    modal.querySelector('#viewUpcomingBtn').addEventListener('click', () => {
      renderUpcomingEvents(modal.querySelector('#calendarContent'));
    });

    // Render calendar
    renderMonthView(currentYear, currentMonth, modal.querySelector('#calendarContent'));
  }

  // Render month view
  function renderMonthView(year, month, container) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    const monthNames = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
      'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];

    let html = `
      <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
        <button id="prevMonth" class="btn-secondary" style="padding:6px 12px">‹ Prapa</button>
        <h4 style="margin:0;color:var(--accent)">${monthNames[month]} ${year}</h4>
        <button id="nextMonth" class="btn-secondary" style="padding:6px 12px">Para ›</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px">
        ${['Dje', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'].map(day =>
      `<div style="padding:8px;text-align:center;font-weight:600;font-size:12px;color:var(--muted)">${day}</div>`
    ).join('')}
      </div>

      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">
    `;

    // Empty cells before month starts
    for (let i = 0; i < startDay; i++) {
      html += `<div style="padding:12px;background:#f9fafb;border-radius:6px"></div>`;
    }

    // Days of month
    const today = new Date().toISOString().split('T')[0];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = state.calendar.events.filter(e => e.date === date);
      const isToday = date === today;

      html += `
        <div style="padding:8px;background:${isToday ? '#dbeafe' : '#fff'};border-radius:6px;
             border:${isToday ? '2px solid var(--accent)' : '1px solid rgba(15,33,56,0.10)'};
             min-height:70px;cursor:pointer" 
             class="calendar-day" data-date="${date}">
          <div style="font-weight:${isToday ? '700' : '500'};font-size:14px;margin-bottom:4px;
               color:${isToday ? 'var(--accent)' : 'var(--text)'}">
            ${day}
          </div>
          ${dayEvents.slice(0, 2).map(e => {
        const typeInfo = EVENT_TYPES[e.type] || {};
        return `
              <div style="font-size:10px;padding:2px 4px;background:${e.color};color:#fff;
                   border-radius:3px;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;
                   white-space:nowrap" title="${e.title}">
                ${typeInfo.icon || '•'} ${e.title.substring(0, 8)}
              </div>
            `;
      }).join('')}
          ${dayEvents.length > 2 ?
          `<div style="font-size:10px;color:var(--muted)">+${dayEvents.length - 2} më shumë</div>`
          : ''}
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    // Navigation
    container.querySelector('#prevMonth').addEventListener('click', () => {
      const newMonth = month - 1;
      const newYear = newMonth < 0 ? year - 1 : year;
      const adjustedMonth = newMonth < 0 ? 11 : newMonth;
      renderMonthView(newYear, adjustedMonth, container);
    });

    container.querySelector('#nextMonth').addEventListener('click', () => {
      const newMonth = month + 1;
      const newYear = newMonth > 11 ? year + 1 : year;
      const adjustedMonth = newMonth > 11 ? 0 : newMonth;
      renderMonthView(newYear, adjustedMonth, container);
    });

    // Click on day
    container.querySelectorAll('.calendar-day').forEach(day => {
      day.addEventListener('click', () => {
        const date = day.dataset.date;
        showDayEvents(date);
      });
    });
  }

  // Show events for a specific day
  function showDayEvents(date) {
    const events = state.calendar.events.filter(e => e.date === date);
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '300';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="modal" style="width:500px;max-width:95vw">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;color:var(--accent)">
            📅 ${new Date(date).toLocaleDateString('sq-AL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h3>
          <button class="icon-btn close-day" style="width:32px;height:32px;font-size:18px">×</button>
        </div>

        <div id="dayEventsList"></div>

        <button id="addEventThisDay" class="btn-primary" style="width:100%;margin-top:12px">
          ➕ Shto Ngjarje për këtë Ditë
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close-day').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelector('#addEventThisDay').addEventListener('click', () => {
      modal.remove();
      openEventForm(date);
    });

    // Render events
    const listContainer = modal.querySelector('#dayEventsList');
    let html = '';

    // Attendance Section (New)
    if (window.Attendance && state.academic.activeGrade) {
      const attendance = window.Attendance.getClassAttendance(state.academic.activeGrade, date);
      const present = attendance.filter(a => a.status === 'present').length;
      const absent = attendance.filter(a => a.status === 'absent').length;
      const late = attendance.filter(a => a.status === 'late').length;
      const total = attendance.length;
      const isTaken = present + absent + late > 0;

      html += `
        <div style="margin-bottom:16px;padding:12px;background:#f0f9ff;border-radius:8px;border:1px solid #bae6fd">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <h4 style="margin:0;color:var(--accent);font-size:14px">📅 Prezenca (Kl. ${state.academic.activeGrade})</h4>
            <button id="manageAttendanceBtn" style="padding:4px 8px;font-size:11px;border-radius:4px;
                    background:var(--accent);color:white;border:none;cursor:pointer">
              ${isTaken ? '✏️ Ndrysho' : '📝 Shëno'}
            </button>
          </div>
          ${isTaken ? `
            <div style="display:flex;gap:12px;font-size:13px">
              <span style="color:#16a34a">✅ ${present}</span>
              <span style="color:#dc2626">❌ ${absent}</span>
              <span style="color:#d97706">⏰ ${late}</span>
              <span style="color:#6b7280;margin-left:auto">Total: ${total}</span>
            </div>
          ` : `
            <div style="font-size:13px;color:var(--muted);font-style:italic">
              Nuk është marrë prezenca për këtë datë.
            </div>
          `}
        </div>
      `;
    }

    if (events.length === 0) {
      html += `
        <div style="padding:20px;text-align:center;color:var(--muted);background:#f9fafb;border-radius:8px">
          Nuk ka ngjarje për këtë ditë.
        </div>
      `;
    } else {
      html += '<div style="display:flex;flex-direction:column;gap:8px">';
      events.forEach(event => {
        const typeInfo = EVENT_TYPES[event.type] || {};
        html += `
          <div style="padding:12px;background:#fff;border-radius:8px;border-left:4px solid ${event.color}">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px">
              <div style="font-weight:600;color:${event.color}">
                ${typeInfo.icon || '•'} ${event.title}
              </div>
              <button class="delete-event" data-id="${event.id}" 
                      style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:16px">×</button>
            </div>
            ${event.description ? `
              <div style="font-size:13px;color:var(--text);margin-bottom:6px">${event.description}</div>
            ` : ''}
            <div style="font-size:11px;color:var(--muted)">
              ${typeInfo.label}${event.gradeLevel ? ` • Klasa ${event.gradeLevel}` : ''}
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    listContainer.innerHTML = html;

    // Wire Attendance Button
    const manageAuthBtn = listContainer.querySelector('#manageAttendanceBtn');
    if (manageAuthBtn) {
      manageAuthBtn.addEventListener('click', () => {
        modal.remove();
        if (window.Attendance && window.Attendance.openAttendanceTracker) {
          // We need to modify openAttendanceTracker to accept a date, or set the input value
          // Since openAttendanceTracker uses current date by default, we might need to verify if it accepts date arg
          // Looking at attendance.js: openAttendanceTracker() takes no args but sets value=${today}
          // We should update attendance.js to accept a date, OR valid hack:
          window.Attendance.openAttendanceTracker();
          // Small timeout to let modal render, then set date
          setTimeout(() => {
            const dateInput = document.getElementById('attendanceDate');
            const loadBtn = document.getElementById('loadAttendance');
            if (dateInput && loadBtn) {
              dateInput.value = date;
              loadBtn.click();
            }
          }, 100);
        }
      });
    }

    // Delete handlers
    listContainer.querySelectorAll('.delete-event').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Dëshironi të fshini këtë ngjarje?')) {
          deleteEvent(parseInt(btn.dataset.id));
          // Refresh view
          showDayEvents(date);
        }
      });
    });
  }

  // Open event form
  function openEventForm(prefilledDate = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '300';
    modal.style.display = 'flex';
    const today = prefilledDate || new Date().toISOString().split('T')[0];

    modal.innerHTML = `
      <div class="modal" style="width:500px;max-width:95vw">
        <h3 style="margin:0 0 16px;color:var(--accent)">➕ Shto Ngjarje të Re</h3>

        <div style="margin-bottom:12px">
          <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Titulli</label>
          <input type="text" id="eventTitle" placeholder="p.sh. Test i Gjuhës Shqipe"
                 style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(15,33,56,0.20);
                 background:#fff;font-size:14px" />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div>
            <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Data</label>
            <input type="date" id="eventDate" value="${today}"
                   style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(15,33,56,0.20);
                   background:#fff;font-size:14px" />
          </div>
          <div>
            <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Lloji</label>
            <select id="eventType" style="width:100%;padding:10px;border-radius:8px;
                    border:1px solid rgba(15,33,56,0.20);background:#fff;font-size:14px">
              ${Object.entries(EVENT_TYPES).map(([key, val]) =>
      `<option value="${key}">${val.icon} ${val.label}</option>`
    ).join('')}
            </select>
          </div>
        </div>

        <div style="margin-bottom:12px">
          <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">
            Klasa (opsionale)
          </label>
          <select id="eventGrade" style="width:100%;padding:10px;border-radius:8px;
                  border:1px solid rgba(15,33,56,0.20);background:#fff;font-size:14px">
            <option value="">Të gjitha klasat</option>
            ${Array.from({ length: 12 }, (_, i) => i + 1).map(g =>
      `<option value="${g}">Klasa ${g}</option>`
    ).join('')}
          </select>
        </div>

        <div style="margin-bottom:16px">
          <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">
            Përshkrimi (opsional)
          </label>
          <textarea id="eventDescription" rows="3" placeholder="Detaje shtesë..."
                    style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(15,33,56,0.20);
                    background:#fff;font-size:14px;resize:vertical"></textarea>
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn-secondary close-event-form">Anulo</button>
          <button id="saveEvent" class="btn-primary">💾 Ruaj Ngjarjen</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close-event-form').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelector('#saveEvent').addEventListener('click', () => {
      const title = modal.querySelector('#eventTitle').value.trim();
      const date = modal.querySelector('#eventDate').value;
      const type = modal.querySelector('#eventType').value;
      const gradeValue = modal.querySelector('#eventGrade').value;
      const description = modal.querySelector('#eventDescription').value.trim();

      if (!title || !date) {
        alert('⚠️ Ju lutem plotësoni të gjitha fushat e kërkuara.');
        return;
      }

      const gradeLevel = gradeValue ? parseInt(gradeValue) : null;
      addEvent(title, date, type, description, gradeLevel);
      alert('✅ Ngjarjaja u shtua me sukses!');
      modal.remove();
    });
  }

  // Render upcoming events
  function renderUpcomingEvents(container) {
    const gradeLevel = state.academic.activeGrade;
    const events = getUpcomingEvents(30, gradeLevel);

    if (events.length === 0) {
      container.innerHTML = `
        <div style="padding:20px;text-align:center;color:var(--muted);background:#f9fafb;border-radius:8px">
          Nuk ka ngjarje të ardhshme.
        </div>
      `;
      return;
    }

    let html = '<div style="display:flex;flex-direction:column;gap:8px">';
    const today = new Date().toISOString().split('T')[0];

    events.forEach(event => {
      const typeInfo = EVENT_TYPES[event.type] || {};
      const daysUntil = Math.ceil((new Date(event.date) - new Date(today)) / (1000 * 60 * 60 * 24));
      const urgency = daysUntil <= 2 ? '#dc2626' : daysUntil <= 7 ? '#f59e0b' : '#6b7280';

      html += `
        <div style="padding:12px;background:#fff;border-radius:8px;border-left:4px solid ${event.color}">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div style="flex:1">
              <div style="font-weight:600;color:${event.color};margin-bottom:4px">
                ${typeInfo.icon || '•'} ${event.title}
              </div>
              ${event.description ? `
                <div style="font-size:13px;color:var(--text);margin-bottom:6px">${event.description}</div>
              ` : ''}
              <div style="font-size:11px;color:var(--muted)">
                ${new Date(event.date).toLocaleDateString('sq-AL')}${event.gradeLevel ? ` • Klasa ${event.gradeLevel}` : ''}
              </div>
            </div>
            <div style="font-size:12px;font-weight:600;color:${urgency};text-align:right;margin-left:12px">
              ${daysUntil === 0 ? 'Sot!' : daysUntil === 1 ? 'Nesër' : `${daysUntil} ditë`}
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  // Add calendar button to teacher panel
  function initializeCalendarUI() {
    const teacherSection = document.getElementById('teacherToolsSection');
    if (!teacherSection) return;
    if (document.getElementById('calendarBtn')) return;

    const quizControls = teacherSection.querySelector('.quizControls');
    if (!quizControls) return;

    const btn = document.createElement('button');
    btn.id = 'calendarBtn';
    btn.className = 'quizBtn';
    btn.textContent = '📅 Kalendari';

    btn.addEventListener('click', openCalendar);

    quizControls.appendChild(btn);
  }

  // Initialize
  window.addEventListener('DOMContentLoaded', () => {
    const originalApplyModeUI = window.applyModeUI;
    if (originalApplyModeUI) {
      window.applyModeUI = function () {
        originalApplyModeUI();
        if (state.ui.teacherMode && state.ui.teacherModeUnlocked) {
          setTimeout(initializeCalendarUI, 100);
        }
      };
    }
  });

  // Export
  window.Calendar = {
    addEvent,
    getEvents,
    getUpcomingEvents,
    deleteEvent,
    openCalendar
  };

  console.log('✅ Calendar module initialized');
})();