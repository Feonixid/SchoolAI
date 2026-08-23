// js/parent-portal.js
// ===================================================================
// PARENT PORTAL — Read-only view of student progress
// Accessed via a unique parent code linked to a student
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) return;

  // ----------------------------------------------------------------
  // PARENT CODE GENERATION
  // ----------------------------------------------------------------
  function generateParentCode(studentId) {
    // Simple deterministic code from student ID
    const base = 'PRNT' + (studentId * 7919 + 1234).toString(36).toUpperCase().slice(0, 6);
    return base;
  }

  // ----------------------------------------------------------------
  // OPEN PARENT VIEW
  // ----------------------------------------------------------------
  function openParentPortal(studentId) {
    const student = state.students?.list?.find(s => s.id === studentId);
    if (!student) {
      alert('Student not found.');
      return;
    }

    const td = window.getTeacherData?.() || {};
    const assignments = td.assignments || [];
    const submissions = (td.submissions || []).filter(s => s.studentId === studentId);

    // Calculate stats
    const totalAssignments = assignments.filter(a => a.gradeLevel === student.gradeLevel).length;
    const submitted = submissions.length;
    const graded = submissions.filter(s => s.status === 'graded');
    const avgGrade = graded.length > 0
      ? Math.round(graded.reduce((sum, s) => sum + (s.grade || 0), 0) / graded.length)
      : null;

    // Attendance
    const attendance = student.semesters?.sem1?.attendance || { present: 0, absent: 0, late: 0 };
    const totalDays = attendance.present + attendance.absent + attendance.late;
    const attendanceRate = totalDays > 0 ? Math.round((attendance.present / totalDays) * 100) : 100;

    // Behavior
    const behavior = student.semesters?.sem1?.behavior || [];

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'display:flex;z-index:7000;';

    overlay.innerHTML = `
      <div class="modal" style="width:800px;max-width:95vw;max-height:92vh;overflow-y:auto;padding:0;border-radius:16px">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:24px;color:white">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <h2 style="margin:0;font-size:22px">👨‍👩‍👧 Parent Portal</h2>
              <p style="margin:4px 0 0;font-size:14px;opacity:0.9">${student.name} — Grade ${student.gradeLevel || '?'}</p>
            </div>
            <button id="closeParent" style="background:rgba(255,255,255,0.2);border:none;color:white;width:36px;height:36px;border-radius:10px;cursor:pointer;font-size:20px">×</button>
          </div>
        </div>

        <div style="padding:24px">
          <!-- Quick Stats -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px">
            <div style="padding:16px;background:#d1fae5;border-radius:12px;text-align:center">
              <div style="font-size:32px;font-weight:800;color:#065f46">${attendanceRate}%</div>
              <div style="font-size:11px;color:#065f46;margin-top:2px">Attendance</div>
            </div>
            <div style="padding:16px;background:#dbeafe;border-radius:12px;text-align:center">
              <div style="font-size:32px;font-weight:800;color:#1e40af">${submitted}/${totalAssignments}</div>
              <div style="font-size:11px;color:#1e40af;margin-top:2px">Assignments Done</div>
            </div>
            <div style="padding:16px;background:#ede9fe;border-radius:12px;text-align:center">
              <div style="font-size:32px;font-weight:800;color:#5b21b6">${avgGrade !== null ? avgGrade : '—'}</div>
              <div style="font-size:11px;color:#5b21b6;margin-top:2px">Avg Grade</div>
            </div>
            <div style="padding:16px;background:#fef3c7;border-radius:12px;text-align:center">
              <div style="font-size:32px;font-weight:800;color:#92400e">${behavior.length}</div>
              <div style="font-size:11px;color:#92400e;margin-top:2px">Behavior Notes</div>
            </div>
          </div>

          <!-- Attendance Breakdown -->
          <div style="margin-bottom:24px">
            <h3 style="margin:0 0 10px;font-size:15px">📅 Attendance</h3>
            <div style="display:flex;gap:12px;align-items:center">
              <div style="flex:1;height:12px;background:#f1f5f9;border-radius:10px;overflow:hidden">
                <div style="display:flex;height:100%">
                  <div style="width:${attendanceRate}%;background:#10b981;transition:width 0.5s"></div>
                  <div style="width:${totalDays > 0 ? Math.round((attendance.late / totalDays) * 100) : 0}%;background:#f59e0b"></div>
                  <div style="width:${totalDays > 0 ? Math.round((attendance.absent / totalDays) * 100) : 0}%;background:#ef4444"></div>
                </div>
              </div>
              <div style="font-size:12px;color:var(--muted);min-width:200px;display:flex;gap:8px">
                <span>✅ ${attendance.present}</span>
                <span>⏰ ${attendance.late}</span>
                <span>❌ ${attendance.absent}</span>
              </div>
            </div>
          </div>

          <!-- Assignments -->
          <div style="margin-bottom:24px">
            <h3 style="margin:0 0 10px;font-size:15px">📝 Assignments</h3>
            ${graded.length > 0 ? `
              <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">
                <div style="display:grid;grid-template-columns:2fr 1fr 1fr;padding:8px 12px;background:#f8fafc;font-size:11px;font-weight:700;color:var(--muted)">
                  <span>Assignment</span><span>Grade</span><span>Status</span>
                </div>
                ${graded.map(sub => {
                  const assignment = assignments.find(a => a.id === sub.assignmentId);
                  const pct = assignment?.maxPoints > 0 ? Math.round((sub.grade / assignment.maxPoints) * 100) : 0;
                  const color = pct >= 80 ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626';
                  return `
                    <div style="display:grid;grid-template-columns:2fr 1fr 1fr;padding:10px 12px;border-top:1px solid var(--border);font-size:13px;align-items:center">
                      <span style="font-weight:600">${assignment?.title || 'Assignment'}</span>
                      <span style="font-weight:700;color:${color}">${sub.grade}/${assignment?.maxPoints || '?'} (${pct}%)</span>
                      <span style="font-size:11px;color:#059669">✅ Graded</span>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : '<p style="color:var(--muted);font-size:13px">No graded assignments yet.</p>'}
          </div>

          <!-- Behavior Notes -->
          ${behavior.length > 0 ? `
            <div style="margin-bottom:24px">
              <h3 style="margin:0 0 10px;font-size:15px">📋 Behavior Notes</h3>
              ${behavior.map(b => {
                const isPositive = b.type === 'positive';
                return `
                  <div style="padding:10px;background:${isPositive ? '#d1fae5' : '#fef3c7'};border-radius:8px;margin-bottom:6px;font-size:13px">
                    <span>${isPositive ? '🌟' : '📈'}</span> ${b.description}
                    <span style="float:right;font-size:11px;color:var(--muted)">${b.date ? new Date(b.date).toLocaleDateString() : ''}</span>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}

          <!-- Teacher's Notes -->
          ${student.teacherNotes ? `
            <div style="padding:14px;background:#f1f5f9;border-radius:10px;margin-bottom:24px">
              <h4 style="margin:0 0 6px;font-size:13px;color:var(--muted)">📝 Teacher's Notes</h4>
              <p style="margin:0;font-size:13px">${student.teacherNotes}</p>
            </div>
          ` : ''}

          <!-- Parent Code -->
          <div style="text-align:center;padding:16px;background:#ede9fe;border-radius:12px">
            <div style="font-size:11px;color:#5b21b6;margin-bottom:4px">Parent Access Code</div>
            <div style="font-size:20px;font-weight:800;letter-spacing:3px;color:#5b21b6;font-family:monospace">${generateParentCode(studentId)}</div>
            <div style="font-size:10px;color:var(--muted);margin-top:4px">Share this code with the parent for read-only access</div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector('#closeParent')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  // ----------------------------------------------------------------
  // PARENT LOGIN (by code)
  // ----------------------------------------------------------------
  function parentLogin() {
    const code = prompt('Enter your Parent Access Code:');
    if (!code) return;

    const students = state.students?.list || [];
    const match = students.find(s => generateParentCode(s.id) === code.toUpperCase().trim());

    if (match) {
      openParentPortal(match.id);
    } else {
      alert('❌ Invalid parent code. Please check with your child\'s teacher.');
    }
  }

  // ----------------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------------
  window.ParentPortal = {
    openParentPortal,
    parentLogin,
    generateParentCode
  };

  console.log('✅ Parent Portal module loaded');
})();
