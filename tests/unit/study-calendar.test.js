// tests/unit/study-calendar.test.js
// Unit tests for Study Calendar, Timetable & Exam Planner

describe('Study Calendar, Timetable & Exam Planner', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div id="openCalendarSidebarBtn"></div>
    `;
    require('../../js/study-calendar.js');
  });

  test('StudyCalendar attaches to window and opens/closes correctly', () => {
    expect(window.StudyCalendar).toBeDefined();
    expect(typeof window.StudyCalendar.open).toBe('function');
    expect(typeof window.StudyCalendar.close).toBe('function');

    window.StudyCalendar.open();
    const overlay = document.getElementById('calendarOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay.style.display).toBe('flex');

    const daysGrid = document.getElementById('calDaysGrid');
    expect(daysGrid.children.length).toBeGreaterThan(20);

    window.StudyCalendar.close();
    expect(overlay.style.display).toBe('none');
  });

  test('Month navigation updates displayed month', () => {
    window.StudyCalendar.open();
    const nextBtn = document.getElementById('calNextMonth');
    expect(nextBtn).not.toBeNull();
    nextBtn.click();

    const titleEl = document.getElementById('calMonthTitle');
    expect(titleEl.textContent.length).toBeGreaterThan(0);
    window.StudyCalendar.close();
  });
});
