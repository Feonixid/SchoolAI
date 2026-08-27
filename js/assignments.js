// js/assignments.js
// ===================================================================
// ASSIGNMENT SUBMISSION & GRADING SYSTEM
// Teachers create assignments, students submit work
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) {
    console.error('❌ AppState not loaded!');
    return;
  }

  // Initialize assignments in state
  if (!state.assignments) {
    state.assignments = {
      list: [],
      submissions: []
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

  // Sync assignments with backend
  async function syncAssignmentsWithBackend() {
    if (!window.Accounts?.isLoggedIn()) return;

    try {
      const [assignRes, subRes] = await Promise.all([
        fetch(`${API_BASE}/api/assignments`, { headers: { ...getAuthHeaders() } }),
        fetch(`${API_BASE}/api/submissions`, { headers: { ...getAuthHeaders() } })
      ]);

      if (assignRes.ok) {
        const data = await assignRes.json();
        if (data.assignments) {
          state.assignments.list = data.assignments;
          console.log('✅ Assignments synced from backend');
        }
      }

      if (subRes.ok) {
        const data = await subRes.json();
        if (data.submissions) {
          state.assignments.submissions = data.submissions;
          console.log('✅ Submissions synced from backend');
        }
      }
    } catch (e) {
      console.warn('Could not sync assignments with backend:', e.message);
    }
  }

  // Save assignment to backend
  async function saveAssignmentToBackend(assignment) {
    if (!window.Accounts?.isLoggedIn()) return;

    try {
      const res = await fetch(`${API_BASE}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(assignment)
      });

      if (res.ok) {
        console.log('✅ Assignment saved to backend');
      }
    } catch (e) {
      console.warn('Could not save assignment to backend:', e.message);
    }
  }

  // Save submission to backend
  async function saveSubmissionToBackend(submission) {
    if (!window.Accounts?.isLoggedIn()) return;

    try {
      const res = await fetch(`${API_BASE}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(submission)
      });

      if (res.ok) {
        console.log('✅ Submission saved to backend');
      }
    } catch (e) {
      console.warn('Could not save submission to backend:', e.message);
    }
  }

  // Grade submission on backend
  async function gradeSubmissionOnBackend(submissionId, grade, feedback) {
    if (!window.Accounts?.isLoggedIn()) return;

    try {
      const res = await fetch(`${API_BASE}/api/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ grade, feedback })
      });

      if (res.ok) {
        console.log('✅ Submission graded on backend');
      }
    } catch (e) {
      console.warn('Could not grade submission on backend:', e.message);
    }
  }

  // Assignment structure
  class Assignment {
    constructor(data) {
      this.id = data.id || Date.now();
      this.title = data.title || '';
      this.description = data.description || '';
      this.gradeLevel = data.gradeLevel || null;
      this.chapter = data.chapter || null;
      this.dueDate = data.dueDate || null;
      this.maxPoints = data.maxPoints || 10;
      this.gradingSystem = data.gradingSystem || 'points'; // 'points', 'percentage', 'albanian', 'letter'
      this.questions = data.questions || []; // array of { text: string }
      this.createdAt = data.createdAt || Date.now();
      this.type = data.type || 'written'; // written, quiz, project
      this.rubric = data.rubric || null;
      this.hardLock = data.hardLock || false; // teacher locks workspace until submit
    }
  }

  // Submission structure
  class Submission {
    constructor(data) {
      this.id = data.id || Date.now();
      this.assignmentId = data.assignmentId;
      this.studentId = data.studentId;
      this.content = data.content || '';
      this.answers = data.answers || {}; // index -> answer text
      this.submittedAt = data.submittedAt || Date.now();
      this.grade = data.grade || null;
      this.feedback = data.feedback || '';
      this.status = data.status || 'pending'; // pending, graded, returned
    }
  }

  // Create assignment
  async function createAssignment(data) {
    const assignment = new Assignment(data);
    state.assignments.list.push(assignment);
    await saveAssignmentToBackend(assignment);
    console.log('✅ Assignment created:', assignment);
    return assignment;
  }

  // Submit assignment
  async function submitAssignment(assignmentId, studentId, content, answers = {}) {
    const submission = new Submission({
      assignmentId,
      studentId,
      content,
      answers
    });
    state.assignments.submissions.push(submission);
    await saveSubmissionToBackend(submission);
    console.log('✅ Assignment submitted:', submission);
    return submission;
  }

  // Grade submission
  async function gradeSubmission(submissionId, grade, feedback) {
    const submission = state.assignments.submissions.find(s => s.id === submissionId);
    if (!submission) return null;

    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = 'graded';
    await gradeSubmissionOnBackend(submissionId, grade, feedback);
    console.log('✅ Submission graded:', submission);

    return submission;
  }

  // Render assignment creation modal
  function openAssignmentCreator() {
    const modal = createAssignmentModal();
    document.body.appendChild(modal);
    modal.style.display = 'flex';
  }

  // Create assignment modal
  function createAssignmentModal() {
    const overlay = document.createElement('div');
    overlay.id = 'assignmentModalOverlay';
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '200';

    let questionsList = []; // stores `{text: ''}` for interactive tests

    overlay.innerHTML = `
      <div class="modal" id="assignmentModal" style="width:600px;max-width:95vw;max-height:90vh;overflow-y:auto">
        <h3 style="margin:0 0 16px;color:var(--accent)">📝 Krijo Detyrë të Re</h3>
        
        <div style="margin-bottom:12px">
          <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Titulli</label>
          <input type="text" id="assignmentTitle" placeholder="p.sh. Analizë e Fjalisë së Përbërë" 
                 style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(15,33,56,0.20);
                 background:#fff;font-size:14px" />
        </div>

        <div style="margin-bottom:12px">
          <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Përshkrimi</label>
          <textarea id="assignmentDescription" rows="4" 
                    placeholder="Udhëzimet dhe detajet e detyrës..."
                    style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(15,33,56,0.20);
                    background:#fff;font-size:14px;resize:vertical"></textarea>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div>
            <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Klasa</label>
            <select id="assignmentGrade" style="width:100%;padding:10px;border-radius:8px;
                    border:1px solid rgba(15,33,56,0.20);background:#fff;font-size:14px">
              <option value="">Zgjidhni klasën</option>
              ${Array.from({ length: 12 }, (_, i) => i + 1).map(g =>
      `<option value="${g}" ${state.academic.activeGrade === g ? 'selected' : ''}>Klasa ${g}</option>`
    ).join('')}
            </select>
          </div>

          <div>
            <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Data e Dorëzimit</label>
            <input type="date" id="assignmentDueDate" 
                   style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(15,33,56,0.20);
                   background:#fff;font-size:14px" />
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
          <div>
            <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Lloji</label>
            <select id="assignmentType" style="width:100%;padding:10px;border-radius:8px;
                    border:1px solid rgba(15,33,56,0.20);background:#fff;font-size:14px">
              <option value="written">Detyrë me Shkrim</option>
              <option value="quiz">Kuiz/Test Interaktiv</option>
              <option value="project">Projekt</option>
            </select>
          </div>

          <div>
            <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Sistemi i Vlerësimit</label>
            <select id="assignmentGradingSystem" style="width:100%;padding:10px;border-radius:8px;
                    border:1px solid rgba(15,33,56,0.20);background:#fff;font-size:14px">
              <option value="points">Pikë Maksimale (Custom)</option>
              <option value="albanian">Sistemi Shqiptar (4-10)</option>
              <option value="percentage">Përqindje (0-100%)</option>
              <option value="letter">Shkronja (A, B, C, D, F)</option>
            </select>
          </div>
        </div>
        
        <div id="maxPointsContainer" style="margin-bottom:12px">
          <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Pikët Maksimale</label>
          <input type="number" id="assignmentMaxPoints" value="10" min="1" max="1000" 
                 style="width:50%;padding:10px;border-radius:8px;border:1px solid rgba(15,33,56,0.20);
                 background:#fff;font-size:14px" />
        </div>

        <!-- Dynamic Test Builder (Hidden by default) -->
        <div id="testBuilderContainer" style="display:none;margin-top:16px;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
           <h4 style="margin:0 0 10px;color:var(--accent);font-size:14px">Test Builder</h4>
           <div id="questionsListDOM" style="margin-bottom:10px;"></div>
           <button id="addQuestionBtn" class="btn-secondary" style="font-size:12px;padding:6px 10px">+ Add Question</button>
        </div>

        <!-- Lockdown Mode Toggle -->
        <div style="margin-top:16px;padding:14px;background:#fef2f2;border-radius:10px;border:1px solid #fecaca">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13px">
            <input type="checkbox" id="assignmentHardLock" style="width:18px;height:18px;accent-color:#ef4444" />
            <div>
              <strong style="color:#991b1b">🔒 Lock Workspace</strong>
              <div style="font-size:11px;color:#6b7280;margin-top:2px">Students cannot close the workspace until they submit or save a draft. Prevents wandering off.</div>
            </div>
          </label>
        </div>

        <div style="margin-top:20px;display:flex;gap:8px;justify-content:flex-end">
          <button id="cancelAssignment" class="btn-secondary">Anulo</button>
          <button id="saveAssignment" class="btn-primary">Krijo Detyrën</button>
        </div>
      </div>
    `;

    // Dynamic UI Updates
    const assignmentTypeSelect = overlay.querySelector('#assignmentType');
    const gradingSystemSelect = overlay.querySelector('#assignmentGradingSystem');
    const maxPointsContainer = overlay.querySelector('#maxPointsContainer');
    const maxPointsInput = overlay.querySelector('#assignmentMaxPoints');
    const testBuilderContainer = overlay.querySelector('#testBuilderContainer');
    const questionsListDOM = overlay.querySelector('#questionsListDOM');

    assignmentTypeSelect.addEventListener('change', (e) => {
      if (e.target.value === 'quiz') {
        testBuilderContainer.style.display = 'block';
      } else {
        testBuilderContainer.style.display = 'none';
      }
    });

    gradingSystemSelect.addEventListener('change', (e) => {
      if (e.target.value === 'points') {
        maxPointsContainer.style.display = 'block';
      } else {
        maxPointsContainer.style.display = 'none';
      }
      // If albanian, max points is technically 10, percentage is 100
      if (e.target.value === 'albanian') maxPointsInput.value = 10;
      if (e.target.value === 'percentage') maxPointsInput.value = 100;
    });

    // Test Builder logic
    function renderQuestionsList() {
      questionsListDOM.innerHTML = '';
      if (questionsList.length === 0) {
        questionsListDOM.innerHTML = '<span style="font-size:12px;color:#64748b">Asnjë pyetje e shtuar.</span>';
        return;
      }
      questionsList.forEach((q, idx) => {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:flex-start';
        item.innerHTML = `
          <span style="font-weight:bold;margin-top:8px">${idx + 1}.</span>
          <textarea class="q-text" rows="2" style="flex:1;padding:8px;border-radius:6px;border:1px solid #cbd5e1" placeholder="Shkruaj pyetjen këtu...">${q.text}</textarea>
          <button class="icon-btn q-rem" style="color:#ef4444;margin-top:2px">✖</button>
        `;

        item.querySelector('.q-text').addEventListener('input', (e) => {
          questionsList[idx].text = e.target.value;
        });

        item.querySelector('.q-rem').addEventListener('click', () => {
          questionsList.splice(idx, 1);
          renderQuestionsList();
        });

        questionsListDOM.appendChild(item);
      });
    }
    renderQuestionsList();

    overlay.querySelector('#addQuestionBtn').addEventListener('click', () => {
      questionsList.push({ text: '' });
      renderQuestionsList();
    });

    // Event listeners
    overlay.querySelector('#cancelAssignment').addEventListener('click', () => {
      overlay.remove();
    });

    overlay.querySelector('#saveAssignment').addEventListener('click', () => {
      // Validate questions if type is quiz
      if (assignmentTypeSelect.value === 'quiz') {
        questionsList = questionsList.filter(q => q.text.trim() !== '');
        if (questionsList.length === 0) {
          alert('⚠️ Ju lutem shtoni të paktën një pyetje për testin.');
          return;
        }
      }

      const assignment = createAssignment({
        title: overlay.querySelector('#assignmentTitle').value,
        description: overlay.querySelector('#assignmentDescription').value,
        gradeLevel: parseInt(overlay.querySelector('#assignmentGrade').value) || null,
        dueDate: overlay.querySelector('#assignmentDueDate').value || null,
        type: assignmentTypeSelect.value,
        gradingSystem: gradingSystemSelect.value,
        maxPoints: parseFloat(maxPointsInput.value) || 10,
        questions: assignmentTypeSelect.value === 'quiz' ? questionsList : [],
        hardLock: overlay.querySelector('#assignmentHardLock')?.checked || false
      });

      if (assignment.title) {
        // Use parent window function if accessible to show custom notification, or fallback to alert
        if (window.Classroom && window.Classroom.showNotification) {
          window.Classroom.showNotification('✅ Detyra u krijua me sukses!');
        } else {
          alert('✅ Detyra u krijua me sukses!');
        }
        overlay.remove();
        renderAssignmentsList();
      } else {
        alert('⚠️ Ju lutem vendosni titullin e detyrës.');
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    return overlay;
  }
  // Render assignments list
  function renderAssignmentsList() {
    const container = document.getElementById('assignmentsContainer');
    if (!container) return;
    const gradeLevel = state.academic.activeGrade;
    const assignments = state.assignments.list.filter(a =>
      gradeLevel ? a.gradeLevel === gradeLevel : true
    );

    if (assignments.length === 0) {
      container.innerHTML = `
    <div style="padding:20px;text-align:center;color:var(--muted)">
      <p>Nuk ka detyra të krijuara për këtë klasë.</p>
    </div>
  `;
      return;
    }

    let html = '<div style="display:flex;flex-direction:column;gap:12px">';

    assignments.sort((a, b) => b.createdAt - a.createdAt).forEach(assignment => {
      const submissions = state.assignments.submissions.filter(s => s.assignmentId === assignment.id);
      const graded = submissions.filter(s => s.status === 'graded').length;
      const pending = submissions.filter(s => s.status === 'pending').length;

      const dueDate = assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('sq-AL') : 'Pa afat';
      const isPastDue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

      html += `
    <div class="assignment-card" data-id="${assignment.id}" 
         style="padding:16px;background:#fff;border-radius:10px;border:1px solid rgba(15,33,56,0.12);
         cursor:pointer;transition:all 0.2s">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
        <div style="flex:1">
          <h5 style="margin:0 0 4px;color:var(--accent);font-size:15px">${assignment.title}</h5>
          <p style="margin:0;font-size:13px;color:var(--muted);line-height:1.4">
            ${assignment.description.substring(0, 100)}${assignment.description.length > 100 ? '...' : ''}
          </p>
        </div>
        <div style="padding:4px 8px;background:${isPastDue ? '#fee2e2' : '#dbeafe'};
             border-radius:6px;font-size:11px;font-weight:600;
             color:${isPastDue ? '#991b1b' : '#1e40af'};white-space:nowrap;margin-left:12px">
          ${assignment.type === 'written' ? '📝' : assignment.type === 'quiz' ? '❓' : '🎯'} 
          ${assignment.type === 'written' ? 'Shkrim' : assignment.type === 'quiz' ? 'Kuiz' : 'Projekt'}
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;
           padding-top:12px;border-top:1px solid rgba(15,33,56,0.08)">
        <div style="font-size:12px;color:var(--muted)">
          📅 ${dueDate} • 📊 ${assignment.maxPoints} pikë • 
          👥 ${submissions.length} dorëzime (${graded} vlerësuar, ${pending} në pritje)
        </div>
      </div>
    </div>
  `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Add click listeners
    container.querySelectorAll('.assignment-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        openAssignmentDetails(id);
      });

      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 4px 12px rgba(15,33,56,0.12)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
      });
    });
  }
  // Open assignment details
  function openAssignmentDetails(assignmentId) {
    const assignment = state.assignments.list.find(a => a.id === assignmentId);
    if (!assignment) return;
    const submissions = state.assignments.submissions.filter(s => s.assignmentId === assignmentId);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '200';
    modal.style.display = 'flex';

    modal.innerHTML = `
  <div class="modal" style="width:700px;max-width:95vw;max-height:90vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="margin:0;color:var(--accent)">${assignment.title}</h3>
      <button class="icon-btn close-modal" style="width:32px;height:32px;font-size:18px">×</button>
    </div>

    <div style="padding:12px;background:var(--assistant);border-radius:8px;margin-bottom:16px">
      <p style="margin:0;font-size:14px;line-height:1.6">${assignment.description}</p>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:16px">
      <div style="padding:8px;background:#fff;border-radius:6px">
        <div style="font-size:11px;color:var(--muted)">Lloji</div>
        <div style="font-size:14px;font-weight:600">
          ${assignment.type === 'written' ? '📝 Shkrim' : assignment.type === 'quiz' ? '❓ Kuiz' : '🎯 Projekt'}
        </div>
      </div>
      <div style="padding:8px;background:#fff;border-radius:6px">
        <div style="font-size:11px;color:var(--muted)">Data e Dorëzimit</div>
        <div style="font-size:14px;font-weight:600">
          ${assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('sq-AL') : 'Pa afat'}
        </div>
      </div>
      <div style="padding:8px;background:#fff;border-radius:6px">
        <div style="font-size:11px;color:var(--muted)">Pikët</div>
        <div style="font-size:14px;font-weight:600">${assignment.maxPoints}</div>
      </div>
    </div>

    <h4 style="margin:16px 0 12px;color:var(--accent)">📬 Dorëzimet (${submissions.length})</h4>
    <div id="submissionsListContainer"></div>
  </div>
`;

    document.body.appendChild(modal);

    // Close modal
    modal.querySelector('.close-modal').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Render submissions
    renderSubmissionsList(assignmentId, modal.querySelector('#submissionsListContainer'));
  }
  // Render submissions list
  function renderSubmissionsList(assignmentId, container) {
    const submissions = state.assignments.submissions.filter(s => s.assignmentId === assignmentId);
    if (submissions.length === 0) {
      container.innerHTML = `
    <div style="padding:20px;text-align:center;color:var(--muted);background:#fff;border-radius:8px">
      <p>Nuk ka dorëzime ende.</p>
    </div>
  `;
      return;
    }

    let html = '<div style="display:flex;flex-direction:column;gap:8px">';

    submissions.forEach(submission => {
      const student = state.students.list.find(s => s.id === submission.studentId);
      const studentName = student ? student.name : 'Nxënës i panjohur';

      const statusColor = submission.status === 'graded' ? '#16a34a' : '#f59e0b';
      const statusText = submission.status === 'graded' ? 'Vlerësuar' : 'Në pritje';

      html += `
    <div class="submission-item" data-id="${submission.id}"
         style="padding:12px;background:#fff;border-radius:8px;border:1px solid rgba(15,33,56,0.10);
         cursor:pointer;transition:all 0.2s">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="flex:1">
          <div style="font-weight:600;font-size:14px;margin-bottom:4px">${studentName}</div>
          <div style="font-size:12px;color:var(--muted)">
            Dorëzuar: ${new Date(submission.submittedAt).toLocaleDateString('sq-AL')} ${new Date(submission.submittedAt).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div style="text-align:right">
          <div style="padding:4px 8px;background:${statusColor};color:#fff;border-radius:6px;
               font-size:11px;font-weight:600;margin-bottom:4px">
            ${statusText}
          </div>
          ${submission.grade !== null ?
          `<div style="font-size:16px;font-weight:700;color:${statusColor}">${submission.grade}</div>`
          : ''}
        </div>
      </div>
    </div>
  `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Add click listeners
    container.querySelectorAll('.submission-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.dataset.id);
        openSubmissionGrading(id);
      });

      item.addEventListener('mouseenter', () => {
        item.style.transform = 'translateX(4px)';
        item.style.borderColor = 'var(--accent)';
      });

      item.addEventListener('mouseleave', () => {
        item.style.transform = 'translateX(0)';
        item.style.borderColor = 'rgba(15,33,56,0.10)';
      });
    });
  }
  // Open submission grading modal
  function openSubmissionGrading(submissionId) {
    const submission = state.assignments.submissions.find(s => s.id === submissionId);
    if (!submission) return;
    const assignment = state.assignments.list.find(a => a.id === submission.assignmentId);
    const student = state.students.list.find(s => s.id === submission.studentId);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.zIndex = '300';
    modal.style.display = 'flex';

    // Build Student Content visually
    let studentContentHTML = '';
    if (assignment.type === 'quiz' && assignment.questions && assignment.questions.length > 0) {
      assignment.questions.forEach((q, idx) => {
        studentContentHTML += `
          <div style="margin-bottom:12px">
            <div style="font-weight:bold;font-size:13px;color:var(--accent)">P${idx + 1}: ${q.text}</div>
            <div style="margin-top:4px;padding:8px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;font-size:13px">
              ${(submission.answers && submission.answers[idx]) ? submission.answers[idx] : '<i style="color:#94a3b8">E papërgjigjur</i>'}
            </div>
          </div>
        `;
      });
    } else {
      studentContentHTML = `<div style="font-size:14px;line-height:1.6;white-space:pre-wrap">${submission.content || '(Pa përmbajtje)'}</div>`;
    }

    // Build Grading Input based on grading system
    let gradingInputHTML = '';
    if (assignment.gradingSystem === 'albanian') {
      gradingInputHTML = `
        <select id="submissionGrade" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-size:14px">
          <option value="">Zgjidh Notën (1–10)</option>
          ${[10,9,8,7,6,5,4,3,2,1].map(n => `<option value="${n}" ${submission.grade == n ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      `;
    } else if (assignment.gradingSystem === 'american' || assignment.gradingSystem === 'letter') {
      gradingInputHTML = `
        <select id="submissionGrade" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-size:14px">
          <option value="">Select Letter Grade (A–F)</option>
          ${['A','B','C','D','F'].map(n => `<option value="${n}" ${submission.grade === n ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      `;
    } else if (assignment.gradingSystem === 'german') {
      gradingInputHTML = `
        <select id="submissionGrade" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-size:14px">
          <option value="">Note wählen (1–6)</option>
          ${[1,2,3,4,5,6].map(n => `<option value="${n}" ${submission.grade == n ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      `;
    } else if (assignment.gradingSystem === 'greek' || assignment.gradingSystem === 'french') {
      gradingInputHTML = `
        <input type="number" id="submissionGrade" min="0" max="20" step="0.5"
               placeholder="0 - 20"
               value="${submission.grade !== null ? submission.grade : ''}"
               style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);
                      background:var(--input-bg);color:var(--text);font-size:14px" />
      `;
    } else if (assignment.gradingSystem === 'ib') {
      gradingInputHTML = `
        <select id="submissionGrade" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--input-bg);color:var(--text);font-size:14px">
          <option value="">Select IB Grade (1–7)</option>
          ${[7,6,5,4,3,2,1].map(n => `<option value="${n}" ${submission.grade == n ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      `;
    } else if (assignment.gradingSystem === 'percentage' || assignment.gradingSystem === 'uk') {
      gradingInputHTML = `
        <input type="number" id="submissionGrade" min="0" max="100" 
               placeholder="0 - 100%"
               value="${submission.grade !== null ? submission.grade : ''}"
               style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);
                      background:var(--input-bg);color:var(--text);font-size:14px" />
      `;
    } else {
      gradingInputHTML = `
        <input type="number" id="submissionGrade" min="0" max="${assignment.maxPoints || 100}" 
               placeholder="Max: ${assignment.maxPoints || 100}"
               value="${submission.grade !== null ? submission.grade : ''}"
               style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border);
                      background:var(--input-bg);color:var(--text);font-size:14px" />
      `;
    }

    modal.innerHTML = `
  <div class="modal" style="width:600px;max-width:95vw;max-height:90vh;overflow-y:auto">
    <h3 style="margin:0 0 16px;color:var(--accent)">📋 Vlerësim Dorëzimi</h3>

    <div style="padding:12px;background:var(--assistant);border-radius:8px;margin-bottom:16px">
      <div style="font-size:13px;color:var(--muted);margin-bottom:4px">Nxënës</div>
      <div style="font-size:16px;font-weight:600">${student ? student.name : 'I panjohur'}</div>
    </div>

    <div style="padding:12px;background:#fff;border-radius:8px;margin-bottom:16px;
         border:1px solid rgba(15,33,56,0.12);max-height:40vh;overflow-y:auto">
      <div style="font-size:13px;color:var(--muted);margin-bottom:8px">Përmbajtja e Dorëzuar</div>
      ${studentContentHTML}
    </div>

    <div style="margin-bottom:12px">
      <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">
        Nota / Vlerësimi
      </label>
      ${gradingInputHTML}
    </div>

    <div style="margin-bottom:16px">
      <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">
        Komente dhe Feedback
      </label>
      <textarea id="submissionFeedback" rows="4"
                style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(15,33,56,0.20);
                background:#fff;font-size:14px;resize:vertical">${submission.feedback || ''}</textarea>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn-secondary close-grading">Mbyll</button>
      <button class="btn-primary save-grading">💾 Ruaj Vlerësimin</button>
    </div>
  </div>
`;

    document.body.appendChild(modal);

    // Close
    modal.querySelector('.close-grading').addEventListener('click', () => {
      modal.remove();
    });

    // Save
    modal.querySelector('.save-grading').addEventListener('click', () => {
      const gradeVal = modal.querySelector('#submissionGrade').value;
      const feedback = modal.querySelector('#submissionFeedback').value;

      let finalGrade = gradeVal;
      if (assignment.gradingSystem !== 'letter') {
        finalGrade = parseFloat(gradeVal);
        if (isNaN(finalGrade) || gradeVal === '') {
          alert('⚠️ Ju lutem vendosni një notë të vlefshme.');
          return;
        }
      } else {
        if (!finalGrade) {
          alert('⚠️ Ju lutem vendosni një notë të vlefshme.');
          return;
        }
      }

      gradeSubmission(submissionId, finalGrade, feedback);

      if (window.Classroom && window.Classroom.showNotification) {
        window.Classroom.showNotification('✅ Vlerësimi u ruajt me sukses!');
      } else {
        alert('✅ Vlerësimi u ruajt me sukses!');
      }
      modal.remove();
      const cont = document.querySelector('#submissionsListContainer');
      if (cont && typeof renderSubmissionsList === 'function') {
        renderSubmissionsList(assignment.id, cont);
      }
    });
  }
  // Add assignments section to teacher panel
  function initializeAssignmentsUI() {
    const teacherSection = document.getElementById('teacherToolsSection');
    if (!teacherSection) return;
    // Check if already initialized
    if (document.getElementById('assignmentsSection')) return;

    const assignmentsHTML = `
  <div id="assignmentsSection" style="margin-top:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <h3 class="panel-title">📝 Detyrat</h3>
      <button id="createAssignmentBtn" class="btn-primary" 
              style="padding:6px 12px;font-size:12px;border-radius:6px">
        + Krijo
      </button>
    </div>
    <div id="assignmentsContainer" style="max-height:300px;overflow-y:auto"></div>
  </div>
`;

    teacherSection.insertAdjacentHTML('beforeend', assignmentsHTML);

    // Wire create button
    document.getElementById('createAssignmentBtn').addEventListener('click', () => {
      if (window.Security && !window.Security.isTeacherModeUnlocked()) {
        alert('⚠️ Kjo veçori kërkon Teacher Mode.');
        return;
      }
      openAssignmentCreator();
    });

    renderAssignmentsList();
  }
  // Initialize when teacher mode is activated
  window.addEventListener('DOMContentLoaded', () => {
    // Watch for teacher mode changes
    const originalApplyModeUI = window.applyModeUI;
    if (originalApplyModeUI) {
      window.applyModeUI = function () {
        originalApplyModeUI();
        if (state.ui.teacherMode && state.ui.teacherModeUnlocked) {
          setTimeout(initializeAssignmentsUI, 100);
        }
      };
    }
  });
  // ----------------------------------------------------------------
  // AUTO-GRADE QUIZ SUBMISSIONS
  // ----------------------------------------------------------------
  function autoGradeQuiz(assignmentId) {
    const assignment = state.assignments.list.find(a => a.id === assignmentId);
    if (!assignment || assignment.type !== 'quiz') return null;

    const questions = assignment.questions || [];
    if (questions.length === 0) return null;

    const submissions = state.assignments.submissions.filter(s => s.assignmentId === assignmentId);
    const results = [];

    submissions.forEach(sub => {
      if (sub.status === 'graded') return; // skip already graded

      let correct = 0;
      let total = questions.length;
      const feedback = [];

      questions.forEach((q, idx) => {
        const studentAnswer = (sub.answers?.[idx] || '').toLowerCase().trim();
        const correctAnswer = (q.correctAnswer || '').toLowerCase().trim();

        if (!correctAnswer) {
          // No correct answer set — skip auto-grading this question
          total--;
          return;
        }

        if (studentAnswer === correctAnswer) {
          correct++;
          feedback.push(`Q${idx + 1}: ✅ Correct`);
        } else {
          feedback.push(`Q${idx + 1}: ❌ Your answer: "${sub.answers?.[idx] || '(blank)'}". Correct: "${q.correctAnswer}"`);
        }
      });

      if (total > 0) {
        const score = Math.round((correct / total) * assignment.maxPoints);
        sub.grade = score;
        sub.feedback = feedback.join('\n');
        sub.status = 'graded';
        sub._autoGraded = true;

        const student = state.students?.list?.find(s => s.id === sub.studentId);
        results.push({
          studentName: student?.name || `Student ${sub.studentId}`,
          score,
          maxPoints: assignment.maxPoints,
          correct,
          total,
          pct: Math.round((correct / total) * 100)
        });
      }
    });

    if (results.length > 0) {
      window.Toast?.success(`Auto-graded ${results.length} submissions!`);
      renderAssignmentsList();
    }

    return results;
  }

  // ----------------------------------------------------------------
  // EXPORT GRADES AS CSV
  // ----------------------------------------------------------------
  function exportGradesCSV(assignmentId) {
    const assignments = assignmentId
      ? state.assignments.list.filter(a => a.id === assignmentId)
      : state.assignments.list;

    let csv = 'Assignment,Student,Grade,Max Points,Percentage,Status,Submitted At,Feedback\n';

    assignments.forEach(a => {
      const subs = state.assignments.submissions.filter(s => s.assignmentId === a.id);
      subs.forEach(sub => {
        const student = state.students?.list?.find(s => s.id === sub.studentId);
        const pct = sub.grade !== null && a.maxPoints > 0 ? Math.round((sub.grade / a.maxPoints) * 100) : '';
        csv += `"${a.title}","${student?.name || sub.studentId}","${sub.grade ?? 'Not graded'}","${a.maxPoints}","${pct}%","${sub.status}","${new Date(sub.submittedAt).toISOString()}","${(sub.feedback || '').replace(/"/g, '""').replace(/\n/g, ' ')}"\n`;
      });

      // Also include students who haven't submitted
      const submittedIds = new Set(subs.map(s => s.studentId));
      const grade = a.gradeLevel;
      const missingStudents = (state.students?.list || []).filter(s => s.status === 'active' && s.gradeLevel === grade && !submittedIds.has(s.id));
      missingStudents.forEach(student => {
        csv += `"${a.title}","${student.name}","Not submitted","${a.maxPoints}","","missing","",""\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grades_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    window.Toast?.success('Grades exported to CSV!');
  }

  // Export functions
  window.Assignments = {
    createAssignment,
    submitAssignment,
    gradeSubmission,
    openAssignmentCreator,
    renderAssignmentsList,
    autoGradeQuiz,
    exportGradesCSV
  };
  console.log('✅ Assignments module initialized (with auto-grade + export)');
})();
