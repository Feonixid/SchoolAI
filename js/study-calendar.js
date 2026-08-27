(function () {
  'use strict';

  const WEEKDAYS_SQ = ['Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht', 'Die'];
  const MONTHS_SQ = [
    'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
  ];

  // Sample events (relative to current month)
  function getDefaultEvents() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return [
      { date: new Date(y, m, Math.min(now.getDate() + 1, 28)), title: 'Detyrë Shtëpie: Matematikë', type: 'homework', time: '23:59', desc: 'Ushtrimet 1-15, faqe 42-44' },
      { date: new Date(y, m, Math.min(now.getDate() + 3, 28)), title: 'Provim: Fizikë — Ligji i Ohm-it', type: 'exam', time: '10:00', desc: 'Kapitulli 5-7, qarqet elektrike' },
      { date: new Date(y, m, Math.min(now.getDate() + 5, 28)), title: 'Laborator: Kimi — Reaksionet', type: 'class', time: '11:30', desc: 'Barazimi i ekuacioneve kimike, eksperiment' },
      { date: new Date(y, m, Math.min(now.getDate() + 7, 28)), title: 'Ese: Histori e Shqipërisë', type: 'homework', time: '23:59', desc: 'Rilindja Kombëtare, 800 fjalë minimum' },
      { date: new Date(y, m, Math.min(now.getDate() + 10, 28)), title: 'Olimpiadë: Matematikë Rajonale', type: 'event', time: '09:00', desc: 'Gara rajonale e matematikës, faza II' },
      { date: new Date(y, m, Math.min(now.getDate() + 14, 28)), title: 'Provim Final: Biologji', type: 'exam', time: '10:00', desc: 'Gjenetika, qeliza, evolucioni' },
      { date: new Date(y, m, now.getDate()), title: 'Orë: Shkenca Kompjuterike', type: 'class', time: '13:00', desc: 'Algoritmet e renditjes — Quick Sort' }
    ];
  }

  let events = [];
  let currentYear, currentMonth, selectedDay;

  function init() {
    if (document.getElementById('calendarOverlay')) return;

    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    selectedDay = now.getDate();
    events = getDefaultEvents();

    const overlay = document.createElement('div');
    overlay.id = 'calendarOverlay';
    overlay.className = 'calendar-overlay';
    overlay.innerHTML = `
      <div class="calendar-window" role="dialog" aria-modal="true">
        <div class="calendar-header">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">📅</span>
            <div>
              <h2 style="margin:0;font-size:18px;font-weight:700">Kalendari i Studimit & Orari</h2>
              <div style="font-size:12px;color:var(--text-muted)">Provimet, detyrat, orët dhe ngjarjet shkollore</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <button id="calAddEventBtn" class="os-btn-primary" style="padding:6px 14px;font-size:12.5px">+ Shto Ngjarje</button>
            <button id="closeCalendarBtn" class="school-os-close-btn" title="Mbyll Kalendarin">×</button>
          </div>
        </div>

        <div class="calendar-body">
          <div class="calendar-grid-pane">
            <div class="cal-month-header">
              <button class="cal-nav-btn" id="calPrevMonth">‹</button>
              <h3 id="calMonthTitle" style="margin:0;font-size:16px;font-weight:700"></h3>
              <button class="cal-nav-btn" id="calNextMonth">›</button>
            </div>

            <div class="cal-weekday-row">
              ${WEEKDAYS_SQ.map(d => `<div class="cal-weekday-cell">${d}</div>`).join('')}
            </div>

            <div class="cal-days-grid" id="calDaysGrid"></div>

            <!-- Quick Timetable -->
            <div style="margin-top:20px">
              <div style="font-size:12.5px;font-weight:700;color:var(--text-muted);margin-bottom:8px">📋 ORARI I DITËS SË SOTME:</div>
              <div id="calTodaySchedule" style="display:flex;flex-direction:column;gap:6px"></div>
            </div>
          </div>

          <div class="calendar-events-pane">
            <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:12px" id="calSelectedDateTitle">Ngjarjet e Ditës</div>
            <div id="calEventsList" style="display:flex;flex-direction:column;gap:8px"></div>

            <div style="margin-top:20px;padding:14px;border-radius:12px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15)">
              <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px">📌 NGJARJET E ARDHSHME:</div>
              <div id="calUpcomingList" style="display:flex;flex-direction:column;gap:6px"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    wireEvents();
    renderCalendar();
  }

  function wireEvents() {
    const overlay = document.getElementById('calendarOverlay');
    document.getElementById('closeCalendarBtn')?.addEventListener('click', close);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.getElementById('calPrevMonth')?.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderCalendar();
    });

    document.getElementById('calNextMonth')?.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderCalendar();
    });

    document.getElementById('calAddEventBtn')?.addEventListener('click', addQuickEvent);
  }

  function renderCalendar() {
    const titleEl = document.getElementById('calMonthTitle');
    if (titleEl) titleEl.textContent = `${MONTHS_SQ[currentMonth]} ${currentYear}`;

    renderDaysGrid();
    renderSelectedDayEvents();
    renderUpcoming();
    renderTodaySchedule();
  }

  function renderDaysGrid() {
    const grid = document.getElementById('calDaysGrid');
    if (!grid) return;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
    const totalDays = lastDay.getDate();

    const today = new Date();
    const isThisMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

    let cells = '';

    // Previous month padding
    const prevMonthLast = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      cells += `<div class="cal-day-cell other-month">${prevMonthLast - i}</div>`;
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const isToday = isThisMonth && d === today.getDate();
      const isSelected = d === selectedDay && isThisMonth;
      const hasEvent = events.some(ev =>
        ev.date.getFullYear() === currentYear &&
        ev.date.getMonth() === currentMonth &&
        ev.date.getDate() === d
      );
      const classes = [
        'cal-day-cell',
        isToday ? 'today' : '',
        isSelected ? 'selected' : '',
        hasEvent ? 'has-event' : ''
      ].filter(Boolean).join(' ');

      cells += `<div class="${classes}" data-day="${d}">${d}</div>`;
    }

    // Next month padding
    const totalCells = startDow + totalDays;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      cells += `<div class="cal-day-cell other-month">${i}</div>`;
    }

    grid.innerHTML = cells;

    grid.querySelectorAll('.cal-day-cell:not(.other-month)').forEach(cell => {
      cell.addEventListener('click', () => {
        selectedDay = parseInt(cell.dataset.day, 10);
        renderCalendar();
      });
    });
  }

  function renderSelectedDayEvents() {
    const titleEl = document.getElementById('calSelectedDateTitle');
    const listEl = document.getElementById('calEventsList');
    if (!titleEl || !listEl) return;

    titleEl.textContent = `📅 ${selectedDay} ${MONTHS_SQ[currentMonth]} ${currentYear}`;

    const dayEvents = events.filter(ev =>
      ev.date.getFullYear() === currentYear &&
      ev.date.getMonth() === currentMonth &&
      ev.date.getDate() === selectedDay
    );

    if (dayEvents.length === 0) {
      listEl.innerHTML = '<div style="font-size:13px;color:var(--text-muted);text-align:center;padding:20px">Asnjë ngjarje për këtë ditë</div>';
      return;
    }

    listEl.innerHTML = dayEvents.map(ev => `
      <div class="cal-event-card ${ev.type}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="font-weight:700;font-size:13.5px;color:var(--text)">${ev.title}</div>
          <span style="font-size:11.5px;color:var(--text-muted)">${ev.time}</span>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${ev.desc}</div>
        <div style="margin-top:6px">
          <span style="font-size:11px;padding:2px 6px;border-radius:4px;font-weight:700;background:${
            ev.type === 'exam' ? '#ef444420' : ev.type === 'homework' ? '#f59e0b20' : ev.type === 'class' ? '#10b98120' : '#8b5cf620'
          };color:${
            ev.type === 'exam' ? '#ef4444' : ev.type === 'homework' ? '#f59e0b' : ev.type === 'class' ? '#10b981' : '#8b5cf6'
          }">
            ${ev.type === 'exam' ? '📝 Provim' : ev.type === 'homework' ? '📚 Detyrë' : ev.type === 'class' ? '🏫 Orë' : '🎉 Ngjarje'}
          </span>
        </div>
      </div>
    `).join('');
  }

  function renderUpcoming() {
    const listEl = document.getElementById('calUpcomingList');
    if (!listEl) return;

    const now = new Date();
    const upcoming = events
      .filter(ev => ev.date >= now)
      .sort((a, b) => a.date - b.date)
      .slice(0, 5);

    if (upcoming.length === 0) {
      listEl.innerHTML = '<div style="font-size:12px;color:var(--text-muted)">Asnjë ngjarje e ardhshme</div>';
      return;
    }

    listEl.innerHTML = upcoming.map(ev => `
      <div style="display:flex;gap:8px;align-items:flex-start">
        <span style="font-size:14px">${ev.type === 'exam' ? '📝' : ev.type === 'homework' ? '📚' : ev.type === 'class' ? '🏫' : '🎉'}</span>
        <div>
          <div style="font-size:12.5px;font-weight:600;color:var(--text)">${ev.title}</div>
          <div style="font-size:11px;color:var(--text-muted)">${ev.date.getDate()} ${MONTHS_SQ[ev.date.getMonth()]} — ${ev.time}</div>
        </div>
      </div>
    `).join('');
  }

  function renderTodaySchedule() {
    const el = document.getElementById('calTodaySchedule');
    if (!el) return;

    const now = new Date();
    const todayEvents = events
      .filter(ev => ev.date.toDateString() === now.toDateString())
      .sort((a, b) => a.time.localeCompare(b.time));

    if (todayEvents.length === 0) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text-muted)">Asnjë orë ose ngjarje sot</div>';
      return;
    }

    el.innerHTML = todayEvents.map(ev => `
      <div style="display:flex;gap:10px;align-items:center;padding:8px 12px;border-radius:8px;background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.1)">
        <span style="font-size:13px;font-weight:800;color:#6366f1;min-width:40px">${ev.time}</span>
        <span style="font-size:13px;font-weight:600;color:var(--text)">${ev.title}</span>
      </div>
    `).join('');
  }

  function addQuickEvent() {
    const title = prompt('Emri i ngjarjes:');
    if (!title) return;

    const type = prompt('Lloji (exam / homework / class / event):', 'homework') || 'homework';
    const time = prompt('Ora (p.sh. 10:00):', '12:00') || '12:00';
    const desc = prompt('Përshkrimi (opsional):', '') || '';

    events.push({
      date: new Date(currentYear, currentMonth, selectedDay),
      title, type, time, desc
    });

    renderCalendar();
    if (window.Toast?.success) window.Toast.success(`📅 Ngjarje e re u shtua: ${title}`);
  }

  function open() {
    init();
    const overlay = document.getElementById('calendarOverlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function close() {
    const overlay = document.getElementById('calendarOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  window.StudyCalendar = { open, close };

  document.addEventListener('DOMContentLoaded', init);
})();
