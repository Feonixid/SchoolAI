// tests/unit/school-scheduler.test.js
// Unit tests for Autonomous Principal, Timetable Scheduler & Risk Detector

describe('Autonomous Principal, Timetable Scheduler & Risk Detector', () => {
  beforeEach(() => {
    localStorage.clear();
    require('../../js/school-scheduler.js');
  });

  test('Generates conflict-free weekly timetable for all 5 school days', () => {
    expect(window.SchoolScheduler).toBeDefined();
    const timetable = window.SchoolScheduler.generateMasterTimetable(10);

    expect(timetable.grade).toBe(10);
    expect(Object.keys(timetable.schedule).length).toBe(5);
    expect(timetable.schedule['E Hënë'].length).toBe(6);
    expect(timetable.schedule['E Hënë'][0].subject).toBeDefined();
  });

  test('Generates structured autonomous substitute lesson plan', () => {
    const subPlan = window.SchoolScheduler.generateEmergencySubstitutePlan('Kimi', 10, 'Tabela Periodike');
    expect(subPlan.type).toBe('AUTONOMOUS_SUBSTITUTE_SESSION');
    expect(subPlan.phases.length).toBe(4);
    expect(subPlan.durationMin).toBe(45);
  });

  test('Calculates at-risk dropout warning index accurately', () => {
    const healthyStudent = window.SchoolScheduler.computeAtRiskIndex({
      attendancePct: 98,
      averageGrade: 9.5,
      missedAssignments: 0
    });
    expect(healthyStudent.level).toBe('green');

    const atRiskStudent = window.SchoolScheduler.computeAtRiskIndex({
      attendancePct: 65,
      averageGrade: 4.5,
      missedAssignments: 4,
      daysInactive: 7
    });
    expect(atRiskStudent.level).toBe('red');
    expect(atRiskStudent.recommendations.length).toBeGreaterThan(0);
  });
});
