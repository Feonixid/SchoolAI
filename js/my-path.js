// js/my-path.js
// ===================================================================
// MY PATH — Career Guidance & Personalized Learning Path
// ===================================================================
// Lets students set a career goal (doctor, engineer, teacher, etc.)
// and the AI adapts all subject teaching to connect to that path.
// Student profile (grade, mastery, goals) is stored in memory per subject.
// ===================================================================

(function () {
  'use strict';

  const state = window.AppState;
  if (!state) { console.error('MyPath: no AppState'); return; }

  // ----------------------------------------------------------------
  // CAREER PATHS DATABASE
  // ----------------------------------------------------------------
  const CAREER_PATHS = [
    {
      id: 'medicine',
      label: 'Doctor / Medicine',
      emoji: '🩺',
      color: '#dc2626',
      description: 'Become a physician, surgeon, or medical researcher',
      keySubjects: ['biologji', 'kimia', 'fizike', 'matematike'],
      relatedSubjects: ['anglisht', 'coding'],
      requirements: {
        'IB': 'HL Biology + Chemistry, usually HL Math. Score 38+ recommended.',
        'GCSE/A-Level': 'A*AA in Biology, Chemistry + one more. UCAT/BMAT required.',
        'AP': 'AP Biology, AP Chemistry, pre-med track. MCAT after bachelor\'s.',
        'Abitur': 'Leistungskurs Bio + Chemie. Abitur 1.0-1.3 typical for NC.',
        'Default': 'Strong grades in Biology and Chemistry are essential.'
      },
      milestones: [
        { grade: 9, tasks: ['Master cell biology and basic chemistry', 'Start volunteering at local clinics'] },
        { grade: 10, tasks: ['Excel in Biology and Chemistry', 'Learn basic first aid', 'Research medical schools'] },
        { grade: 11, tasks: ['Take advanced Biology/Chemistry courses', 'Shadow a doctor', 'Prepare for entrance exams'] },
        { grade: 12, tasks: ['Apply to medical programs', 'Take entrance exam (UCAT/MCAT/etc.)', 'Write personal statement'] },
      ]
    },
    {
      id: 'engineering',
      label: 'Engineer',
      emoji: '⚙️',
      color: '#2563eb',
      description: 'Build and design systems — mechanical, electrical, civil, software',
      keySubjects: ['matematike', 'fizike', 'coding'],
      relatedSubjects: ['kimia', 'ekonomi'],
      requirements: {
        'IB': 'HL Math AA + HL Physics. Score 36+ recommended.',
        'GCSE/A-Level': 'A*A*A in Maths, Physics, Further Maths.',
        'AP': 'AP Calculus BC, AP Physics C. Strong math foundation.',
        'Abitur': 'Leistungskurs Mathe + Physik.',
        'Default': 'Strong Mathematics and Physics are essential.'
      },
      milestones: [
        { grade: 9, tasks: ['Master algebra and basic physics', 'Try building simple projects'] },
        { grade: 10, tasks: ['Excel in Math and Physics', 'Learn basic programming (Python)', 'Join robotics club'] },
        { grade: 11, tasks: ['Take advanced Math/Physics', 'Build a portfolio project', 'Research engineering fields'] },
        { grade: 12, tasks: ['Apply to engineering programs', 'Complete a significant project', 'Take entrance exams'] },
      ]
    },
    {
      id: 'software',
      label: 'Software Developer / CS',
      emoji: '💻',
      color: '#7c3aed',
      description: 'Build apps, websites, AI systems, and software products',
      keySubjects: ['coding', 'matematike'],
      relatedSubjects: ['anglisht', 'fizike', 'cyber'],
      requirements: {
        'IB': 'HL Math + Computer Science if available.',
        'GCSE/A-Level': 'A*A in Maths + Computer Science.',
        'AP': 'AP Computer Science A, AP Calculus.',
        'Default': 'Strong programming skills and mathematical thinking.'
      },
      milestones: [
        { grade: 9, tasks: ['Learn Python basics', 'Build your first simple program', 'Understand variables and loops'] },
        { grade: 10, tasks: ['Build a personal website (HTML/CSS/JS)', 'Learn data structures', 'Start a GitHub profile'] },
        { grade: 11, tasks: ['Build a full app or game', 'Learn algorithms and OOP', 'Contribute to open source'] },
        { grade: 12, tasks: ['Build a portfolio of 3+ projects', 'Apply to CS programs', 'Prepare for technical interviews'] },
      ]
    },
    {
      id: 'cybersec',
      label: 'Cybersecurity Expert',
      emoji: '🔐',
      color: '#b91c1c',
      description: 'Protect systems, ethical hacking, security research',
      keySubjects: ['cyber', 'coding', 'matematike'],
      relatedSubjects: ['fizike', 'anglisht'],
      requirements: {
        'Default': 'Strong programming, networking knowledge, and security certifications (CompTIA Security+, CEH).'
      },
      milestones: [
        { grade: 9, tasks: ['Learn basic networking concepts', 'Understand how the internet works', 'Start learning Linux'] },
        { grade: 10, tasks: ['Learn Python for scripting', 'Study the CIA triad', 'Try beginner CTF challenges'] },
        { grade: 11, tasks: ['Study web security basics', 'Practice ethical hacking labs', 'Learn about encryption'] },
        { grade: 12, tasks: ['Compete in CTF events', 'Build a security portfolio', 'Study for CompTIA Security+'] },
      ]
    },
    {
      id: 'teacher',
      label: 'Teacher / Educator',
      emoji: '👩‍🏫',
      color: '#059669',
      description: 'Inspire the next generation as a teacher or professor',
      keySubjects: ['anglisht', 'shqip'],
      relatedSubjects: ['matematike', 'biologji', 'histori'],
      requirements: {
        'Default': 'Bachelor\'s degree + teaching certification. Strong communication skills. Passion for your subject.'
      },
      milestones: [
        { grade: 9, tasks: ['Identify your favorite subject to teach', 'Help classmates study', 'Practice explaining concepts'] },
        { grade: 10, tasks: ['Tutor younger students', 'Develop presentation skills', 'Read about pedagogy'] },
        { grade: 11, tasks: ['Lead study groups', 'Research education programs', 'Practice Socratic questioning'] },
        { grade: 12, tasks: ['Apply to education programs', 'Volunteer teaching', 'Create your teaching philosophy'] },
      ]
    },
    {
      id: 'lawyer',
      label: 'Lawyer / Legal',
      emoji: '⚖️',
      color: '#92400e',
      description: 'Practice law, advocate for justice, or work in policy',
      keySubjects: ['histori', 'anglisht', 'shqip', 'ekonomi'],
      relatedSubjects: ['coding'],
      requirements: {
        'Default': 'Strong grades in essay-based subjects. Law degree required. Critical thinking and debate skills essential.'
      },
      milestones: [
        { grade: 9, tasks: ['Read widely — history, current events', 'Practice essay writing', 'Join debate club'] },
        { grade: 10, tasks: ['Study ethics and philosophy', 'Practice argumentative writing', 'Learn about legal systems'] },
        { grade: 11, tasks: ['Take advanced History/English', 'Mock trial or Model UN', 'Research law schools'] },
        { grade: 12, tasks: ['Apply to law programs', 'Write strong personal statement', 'Prepare for entrance exams'] },
      ]
    },
    {
      id: 'business',
      label: 'Business / Entrepreneur',
      emoji: '📈',
      color: '#1d4ed8',
      description: 'Start a company, manage organizations, or work in finance',
      keySubjects: ['ekonomi', 'matematike', 'anglisht'],
      relatedSubjects: ['coding', 'histori'],
      requirements: {
        'Default': 'Strong economics and math. Business degree or MBA. Leadership skills.'
      },
      milestones: [
        { grade: 9, tasks: ['Learn basic economics concepts', 'Start a small project/venture', 'Practice mental math'] },
        { grade: 10, tasks: ['Study micro & macroeconomics', 'Learn basic accounting', 'Build a business plan'] },
        { grade: 11, tasks: ['Take advanced Economics/Math', 'Launch a school business', 'Learn about investing'] },
        { grade: 12, tasks: ['Apply to business programs', 'Complete real business project', 'Network with entrepreneurs'] },
      ]
    },
    {
      id: 'scientist',
      label: 'Scientist / Researcher',
      emoji: '🔬',
      color: '#0f766e',
      description: 'Research and discover in biology, chemistry, physics, or other fields',
      keySubjects: ['biologji', 'kimia', 'fizike', 'matematike'],
      relatedSubjects: ['coding', 'anglisht'],
      requirements: {
        'Default': 'Strong STEM grades. Research experience. PhD usually required for senior roles.'
      },
      milestones: [
        { grade: 9, tasks: ['Excel in all science subjects', 'Start a science fair project', 'Read scientific articles'] },
        { grade: 10, tasks: ['Specialize in your favorite science', 'Design and run experiments', 'Learn data analysis'] },
        { grade: 11, tasks: ['Take advanced STEM courses', 'Intern at a research lab', 'Write a research report'] },
        { grade: 12, tasks: ['Apply to STEM programs', 'Present at science fair', 'Contact university researchers'] },
      ]
    },
    {
      id: 'artist',
      label: 'Artist / Designer',
      emoji: '🎨',
      color: '#c026d3',
      description: 'Create in visual arts, graphic design, UI/UX, or media',
      keySubjects: ['anglisht', 'coding'],
      relatedSubjects: ['histori', 'shqip'],
      requirements: {
        'Default': 'Portfolio of creative work. Technical skills (digital tools, web design). Creativity and vision.'
      },
      milestones: [
        { grade: 9, tasks: ['Build a sketchbook habit', 'Learn basic digital tools', 'Study art history'] },
        { grade: 10, tasks: ['Create a digital portfolio', 'Learn HTML/CSS for web design', 'Study color theory'] },
        { grade: 11, tasks: ['Specialize (graphic, UI/UX, fine art)', 'Take on freelance projects', 'Research art schools'] },
        { grade: 12, tasks: ['Prepare portfolio for applications', 'Apply to art/design programs', 'Exhibition or showcase'] },
      ]
    },
    {
      id: 'undecided',
      label: 'Still Exploring',
      emoji: '🧭',
      color: '#6366f1',
      description: 'Not sure yet — and that\'s perfectly okay!',
      keySubjects: [],
      relatedSubjects: [],
      requirements: {
        'Default': 'Keep an open mind, try different subjects, and pay attention to what excites you most.'
      },
      milestones: [
        { grade: 9, tasks: ['Try every subject with an open mind', 'Notice what you enjoy most', 'Talk to people in different careers'] },
        { grade: 10, tasks: ['Focus on your top 2-3 subjects', 'Do aptitude self-assessment', 'Shadow professionals'] },
        { grade: 11, tasks: ['Start narrowing your focus', 'Research university programs', 'Do internships'] },
        { grade: 12, tasks: ['Choose a flexible program', 'Apply to several options', 'It\'s okay to change path later!'] },
      ]
    },
  ];

  // ----------------------------------------------------------------
  // STUDENT PROFILE (persisted in localStorage)
  // ----------------------------------------------------------------
  function getProfile() {
    try {
      return JSON.parse(localStorage.getItem('eduai_student_profile')) || {};
    } catch { return {}; }
  }

  function saveProfile(profile) {
    localStorage.setItem('eduai_student_profile', JSON.stringify(profile));
    // Also inject into AppState for AI access
    if (!state.student) state.student = {};
    state.student.profile = profile;
    window.dispatchEvent(new CustomEvent('studentProfileUpdated', { detail: profile }));
  }

  // ----------------------------------------------------------------
  // BUILD MY PATH PANEL
  // ----------------------------------------------------------------
  function buildPathPanel() {
    const panel = document.createElement('div');
    panel.id = 'myPathPanel';
    panel.className = 'my-path-panel';
    panel.style.display = 'none';

    const profile = getProfile();

    panel.innerHTML = `
      <div class="path-header">
        <h2 style="margin:0;font-size:20px;font-weight:700;color:var(--text)">
          🧭 My Path
        </h2>
        <p style="margin:4px 0 0;font-size:13px;color:var(--muted)">
          Set your career goal and I'll adapt everything to help you get there.
        </p>
        <button id="pathClose" class="path-close-btn" title="Close">&times;</button>
      </div>

      <!-- Student Info Section -->
      <div class="path-section">
        <h3 class="path-section-title">About You</h3>
        <div class="path-form-grid">
          <div class="path-field">
            <label>Your Name</label>
            <input id="pathName" class="path-input" placeholder="Enter your name"
                   value="${profile.name || ''}">
          </div>
          <div class="path-field">
            <label>Grade</label>
            <select id="pathGrade" class="path-input">
              <option value="">Select grade</option>
              ${[9,10,11,12].map(g =>
                `<option value="${g}" ${profile.grade == g ? 'selected' : ''}>Grade ${g}</option>`
              ).join('')}
            </select>
          </div>
          <div class="path-field">
            <label>Curriculum</label>
            <select id="pathCurriculum" class="path-input">
              <option value="">Select curriculum</option>
              ${['IB', 'American/AP', 'UK/GCSE', 'German/Abitur', 'Greek', 'Italian', 'French Bac', 'Other'].map(c =>
                `<option value="${c}" ${profile.curriculum === c ? 'selected' : ''}>${c}</option>`
              ).join('')}
            </select>
          </div>
          <div class="path-field">
            <label>Learning Style</label>
            <select id="pathLearningStyle" class="path-input">
              <option value="">How do you learn best?</option>
              ${['Step-by-step explanations', 'Visual diagrams', 'Practice problems', 'Real-world examples', 'Discussion & questions'].map(s =>
                `<option value="${s}" ${profile.learningStyle === s ? 'selected' : ''}>${s}</option>`
              ).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Career Path Selection -->
      <div class="path-section">
        <h3 class="path-section-title">Choose Your Path</h3>
        <div class="path-grid" id="pathGrid">
          ${CAREER_PATHS.map(p => `
            <button class="path-card ${profile.careerPath === p.id ? 'selected' : ''}"
                    data-path-id="${p.id}"
                    style="--path-color:${p.color}">
              <span class="path-card-emoji">${p.emoji}</span>
              <span class="path-card-label">${p.label}</span>
              <span class="path-card-desc">${p.description}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Path Details (shown when a path is selected) -->
      <div id="pathDetails" class="path-section" style="display:${profile.careerPath ? 'block' : 'none'}">
        <div id="pathDetailsContent"></div>
      </div>

      <!-- Subject Mastery Self-Assessment -->
      <div class="path-section">
        <h3 class="path-section-title">Subject Mastery</h3>
        <p style="font-size:12px;color:var(--muted);margin:0 0 12px">
          Rate your confidence in each subject. This helps the AI adapt to your level.
        </p>
        <div id="pathMastery" class="path-mastery-grid">
          ${buildMasterySliders(profile)}
        </div>
      </div>

      <!-- Save Button -->
      <div style="padding:16px 20px;text-align:center">
        <button id="pathSave" class="path-save-btn">
          Save My Path
        </button>
        <p id="pathSaveStatus" style="font-size:12px;color:var(--muted);margin:6px 0 0"></p>
      </div>
    `;

    document.body.appendChild(panel);

    // Event listeners
    panel.querySelector('#pathClose').addEventListener('click', () => {
      panel.style.display = 'none';
    });

    panel.querySelectorAll('.path-card').forEach(card => {
      card.addEventListener('click', () => {
        panel.querySelectorAll('.path-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        showPathDetails(card.dataset.pathId);
      });
    });

    panel.querySelector('#pathSave').addEventListener('click', saveCurrentProfile);

    // Show details if path already selected
    if (profile.careerPath) {
      showPathDetails(profile.careerPath);
    }
  }

  function buildMasterySliders(profile) {
    const subjects = window.Subjects ? window.Subjects.getAll() : [];
    if (!subjects.length) return '<p style="color:var(--muted)">Subjects not loaded yet.</p>';
    const mastery = profile.mastery || {};
    const levels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

    return subjects.map(s => {
      const level = mastery[s.id] || 2; // default: intermediate (index 2)
      return `
        <div class="mastery-item">
          <span class="mastery-emoji">${s.emoji}</span>
          <span class="mastery-label">${s.label}</span>
          <input type="range" class="mastery-slider" data-subject="${s.id}"
                 min="0" max="4" value="${level}" title="${levels[level]}">
          <span class="mastery-level" id="mastery-${s.id}">${levels[level]}</span>
        </div>
      `;
    }).join('');
  }

  function showPathDetails(pathId) {
    const path = CAREER_PATHS.find(p => p.id === pathId);
    if (!path) return;

    const profile = getProfile();
    const grade = parseInt(profile.grade) || 10;
    const curriculum = profile.curriculum || 'Default';
    const reqText = path.requirements[curriculum] || path.requirements['Default'] || '';

    // Find milestones for current grade
    const currentMilestone = path.milestones.find(m => m.grade === grade);
    const futureMilestones = path.milestones.filter(m => m.grade > grade);

    const subjects = window.Subjects ? window.Subjects.getAll() : [];
    const keySubjectNames = path.keySubjects.map(id => {
      const s = subjects.find(sub => sub.id === id);
      return s ? `${s.emoji} ${s.label}` : id;
    });
    const relatedSubjectNames = path.relatedSubjects.map(id => {
      const s = subjects.find(sub => sub.id === id);
      return s ? `${s.emoji} ${s.label}` : id;
    });

    const detailsDiv = document.getElementById('pathDetailsContent');
    if (!detailsDiv) return;

    detailsDiv.innerHTML = `
      <div class="path-detail-header" style="--path-color:${path.color}">
        <span style="font-size:36px">${path.emoji}</span>
        <div>
          <h3 style="margin:0;font-size:18px;color:${path.color}">${path.label}</h3>
          <p style="margin:2px 0 0;font-size:13px;color:var(--muted)">${path.description}</p>
        </div>
      </div>

      ${reqText ? `
        <div class="path-req-box">
          <strong>Requirements (${curriculum}):</strong>
          <p style="margin:4px 0 0">${reqText}</p>
        </div>
      ` : ''}

      ${keySubjectNames.length ? `
        <div style="margin:12px 0">
          <strong style="font-size:13px;color:var(--text)">Key Subjects:</strong>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
            ${keySubjectNames.map(n => `<span class="path-tag key">${n}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      ${relatedSubjectNames.length ? `
        <div style="margin:8px 0">
          <strong style="font-size:13px;color:var(--text)">Also Helpful:</strong>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
            ${relatedSubjectNames.map(n => `<span class="path-tag related">${n}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      ${currentMilestone ? `
        <div class="path-milestone current">
          <h4 style="margin:0 0 8px;color:${path.color}">
            Your Tasks Now (Grade ${grade})
          </h4>
          <ul style="margin:0;padding-left:20px">
            ${currentMilestone.tasks.map(t => `<li style="margin:4px 0">${t}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${futureMilestones.length ? `
        <div class="path-milestone future">
          <h4 style="margin:0 0 8px;color:var(--muted)">Coming Up</h4>
          ${futureMilestones.map(m => `
            <div style="margin:8px 0">
              <strong style="font-size:12px;color:var(--text)">Grade ${m.grade}:</strong>
              <ul style="margin:2px 0 0;padding-left:20px;font-size:13px">
                ${m.tasks.map(t => `<li style="margin:2px 0;color:var(--muted)">${t}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    document.getElementById('pathDetails').style.display = 'block';
  }

  function saveCurrentProfile() {
    const panel = document.getElementById('myPathPanel');
    if (!panel) return;

    const selectedCard = panel.querySelector('.path-card.selected');
    const mastery = {};
    panel.querySelectorAll('.mastery-slider').forEach(slider => {
      mastery[slider.dataset.subject] = parseInt(slider.value);
    });

    const profile = {
      name: panel.querySelector('#pathName').value.trim(),
      grade: panel.querySelector('#pathGrade').value,
      curriculum: panel.querySelector('#pathCurriculum').value,
      learningStyle: panel.querySelector('#pathLearningStyle').value,
      careerPath: selectedCard ? selectedCard.dataset.pathId : null,
      mastery: mastery,
      updatedAt: new Date().toISOString(),
    };

    saveProfile(profile);

    const status = panel.querySelector('#pathSaveStatus');
    if (status) {
      status.textContent = 'Saved! The AI will now adapt to your path and level.';
      status.style.color = '#059669';
      setTimeout(() => { status.textContent = ''; }, 3000);
    }

    // Update mastery level labels
    const levels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    panel.querySelectorAll('.mastery-slider').forEach(slider => {
      const label = document.getElementById(`mastery-${slider.dataset.subject}`);
      if (label) label.textContent = levels[slider.value];
    });
  }

  // ----------------------------------------------------------------
  // AI CONTEXT INJECTION — gives the model student profile
  // ----------------------------------------------------------------
  window.getStudentProfileContext = function () {
    const profile = getProfile();
    if (!profile || !profile.name) return '';

    const levels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    const path = CAREER_PATHS.find(p => p.id === profile.careerPath);

    let ctx = '\n--- STUDENT PROFILE ---\n';
    ctx += `NAME: ${profile.name}\n`;
    if (profile.grade) ctx += `GRADE: ${profile.grade}\n`;
    if (profile.curriculum) ctx += `CURRICULUM: ${profile.curriculum}\n`;
    if (profile.learningStyle) ctx += `LEARNING STYLE: ${profile.learningStyle}\n`;
    if (path) {
      ctx += `CAREER GOAL: ${path.label} (${path.description})\n`;
      ctx += `KEY SUBJECTS: ${path.keySubjects.join(', ')}\n`;
      ctx += 'INSTRUCTION: Connect explanations to this career path when relevant. ';
      ctx += 'For example, if studying biology and the student wants to be a doctor, emphasize medical applications.\n';
    }

    // Current subject mastery
    const activeSubject = window.Subjects?.getActive();
    if (activeSubject && profile.mastery) {
      const level = profile.mastery[activeSubject.id];
      if (level !== undefined) {
        ctx += `MASTERY IN ${activeSubject.label.toUpperCase()}: ${levels[level]}\n`;
        if (level <= 1) {
          ctx += 'INSTRUCTION: Use simple language, many examples, go slowly. Check understanding frequently.\n';
        } else if (level >= 3) {
          ctx += 'INSTRUCTION: Student is advanced. Use technical terminology, go deeper, challenge them.\n';
        }
      }
    }

    return ctx;
  };

  // ----------------------------------------------------------------
  // STYLES
  // ----------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('myPathStyles')) return;
    const style = document.createElement('style');
    style.id = 'myPathStyles';
    style.textContent = `
      .my-path-panel {
        position: fixed; top: 0; right: 0; bottom: 0;
        width: min(460px, 92vw);
        background: var(--bg, #0f0f17);
        border-left: 1px solid var(--border, #2a2a3a);
        z-index: 9000;
        overflow-y: auto;
        box-shadow: -8px 0 32px rgba(0,0,0,0.4);
        animation: pathSlideIn 0.3s ease;
      }
      @keyframes pathSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .path-header {
        padding: 20px; position: relative;
        border-bottom: 1px solid var(--border, #2a2a3a);
        background: linear-gradient(135deg, rgba(99,102,241,0.08), transparent);
      }
      .path-close-btn {
        position: absolute; top: 12px; right: 12px;
        background: none; border: none; color: var(--muted);
        font-size: 24px; cursor: pointer; padding: 4px 8px; border-radius: 6px;
      }
      .path-close-btn:hover { background: rgba(255,255,255,0.1); color: var(--text); }
      .path-section {
        padding: 16px 20px;
        border-bottom: 1px solid var(--border, #1a1a2a);
      }
      .path-section-title {
        margin: 0 0 12px; font-size: 14px; font-weight: 600;
        color: var(--text); letter-spacing: 0.5px; text-transform: uppercase;
      }
      .path-form-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
      }
      .path-field label {
        display: block; font-size: 11px; color: var(--muted);
        margin-bottom: 4px; font-weight: 500;
      }
      .path-input {
        width: 100%; padding: 8px 10px; border-radius: 8px;
        border: 1px solid var(--border, #2a2a3a);
        background: var(--bg-alt, #1a1a2a); color: var(--text);
        font-size: 13px; outline: none;
      }
      .path-input:focus { border-color: #6366f1; }

      .path-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 8px;
      }
      .path-card {
        display: flex; flex-direction: column; align-items: center;
        padding: 14px 10px; border-radius: 12px; cursor: pointer;
        border: 2px solid transparent;
        background: var(--bg-alt, #1a1a2a);
        transition: all 0.2s ease; text-align: center;
      }
      .path-card:hover {
        border-color: var(--path-color); background: rgba(99,102,241,0.06);
        transform: translateY(-2px);
      }
      .path-card.selected {
        border-color: var(--path-color);
        background: linear-gradient(135deg, color-mix(in srgb, var(--path-color) 12%, transparent), transparent);
        box-shadow: 0 0 20px color-mix(in srgb, var(--path-color) 20%, transparent);
      }
      .path-card-emoji { font-size: 28px; margin-bottom: 6px; }
      .path-card-label { font-size: 13px; font-weight: 600; color: var(--text); }
      .path-card-desc { font-size: 10px; color: var(--muted); margin-top: 4px; line-height: 1.3; }

      .path-detail-header {
        display: flex; align-items: center; gap: 12px;
        padding: 12px; border-radius: 10px; margin-bottom: 12px;
        background: linear-gradient(135deg, color-mix(in srgb, var(--path-color) 10%, transparent), transparent);
      }
      .path-req-box {
        padding: 10px 14px; border-radius: 8px; font-size: 13px;
        background: rgba(99,102,241,0.06); border-left: 3px solid #6366f1;
        color: var(--text); margin: 8px 0;
      }
      .path-tag {
        padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500;
      }
      .path-tag.key { background: rgba(37,99,235,0.15); color: #60a5fa; }
      .path-tag.related { background: rgba(99,102,241,0.1); color: #a5b4fc; }
      .path-milestone {
        padding: 12px; border-radius: 8px; margin: 8px 0;
      }
      .path-milestone.current {
        background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.2);
      }
      .path-milestone.future {
        background: rgba(99,102,241,0.04);
      }
      .path-milestone li { font-size: 13px; }

      .path-mastery-grid { display: flex; flex-direction: column; gap: 8px; }
      .mastery-item {
        display: grid; grid-template-columns: 28px 100px 1fr 80px;
        align-items: center; gap: 8px; font-size: 13px;
      }
      .mastery-emoji { font-size: 16px; text-align: center; }
      .mastery-label { color: var(--text); font-weight: 500; }
      .mastery-slider {
        -webkit-appearance: none; width: 100%; height: 6px;
        border-radius: 3px; background: var(--border, #2a2a3a);
        outline: none;
      }
      .mastery-slider::-webkit-slider-thumb {
        -webkit-appearance: none; width: 16px; height: 16px;
        border-radius: 50%; background: #6366f1; cursor: pointer;
      }
      .mastery-level {
        font-size: 11px; color: var(--muted); text-align: right;
      }
      .path-save-btn {
        padding: 10px 32px; border-radius: 10px; border: none;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white; font-size: 14px; font-weight: 600;
        cursor: pointer; transition: all 0.2s;
      }
      .path-save-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(99,102,241,0.4);
      }

      /* My Path button in toolbar */
      .my-path-toolbar-btn {
        padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border);
        background: var(--input-bg);
        color: var(--text); font-size: 13px; font-weight: 500;
        cursor: pointer; transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
        display: flex; align-items: center; gap: 6px;
        white-space: nowrap; flex-shrink: 0;
      }
      .my-path-toolbar-btn:hover {
        border-color: var(--accent); background: var(--hover-bg);
      }
      .my-path-toolbar-btn:active {
        transform: scale(0.96);
      }
    `;
    document.head.appendChild(style);
  }

  // ----------------------------------------------------------------
  // ADD BUTTON TO UI
  // ----------------------------------------------------------------
  function addToolbarButton() {
    if (document.getElementById('myPathBtn')) {
      const existing = document.getElementById('myPathBtn');
      existing.addEventListener('click', () => {
        const panel = document.getElementById('myPathPanel');
        if (panel) {
          panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
      });
      return;
    }

    const btn = document.createElement('button');
    btn.className = 'my-path-toolbar-btn';
    btn.id = 'myPathBtn';
    btn.innerHTML = '🧭 My Path';
    btn.title = 'Set your career path and learning goals';
    btn.addEventListener('click', () => {
      const panel = document.getElementById('myPathPanel');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      }
    });

    const headerActions = document.querySelector('.header-actions, .header');
    if (headerActions) {
      headerActions.insertBefore(btn, headerActions.firstChild);
    }
  }

  // ----------------------------------------------------------------
  // INIT
  // ----------------------------------------------------------------
  function init() {
    injectStyles();
    buildPathPanel();
    addToolbarButton();

    // Load saved profile into state
    const profile = getProfile();
    if (profile.name) {
      if (!state.student) state.student = {};
      state.student.profile = profile;
    }

    // Listen for mastery slider changes
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('mastery-slider')) {
        const levels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
        const label = document.getElementById(`mastery-${e.target.dataset.subject}`);
        if (label) label.textContent = levels[e.target.value];
      }
    });

    console.log('My Path module loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ----------------------------------------------------------------
  // PUBLIC API
  // ----------------------------------------------------------------
  window.MyPath = {
    getProfile,
    saveProfile,
    getCareerPaths: () => CAREER_PATHS,
    open: () => {
      const p = document.getElementById('myPathPanel');
      if (p) p.style.display = 'block';
    },
    close: () => {
      const p = document.getElementById('myPathPanel');
      if (p) p.style.display = 'none';
    },
  };

})();
