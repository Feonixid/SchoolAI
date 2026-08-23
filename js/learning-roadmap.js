// js/learning-roadmap.js — Visual Learning Roadmaps & Skill Trees
// ================================================================
// Interactive subject-based progression paths with prerequisite
// skill nodes, progress tracking, and gamification XP rewards.
// ================================================================

(function () {
  'use strict';

  // ----------------------------------------------------------------
  // ROADMAP DATA — Each subject has ordered skill nodes
  // ----------------------------------------------------------------
  const ROADMAPS = {
    math: {
      title: 'Matematikë — Rruga e Mësimit',
      emoji: '📐',
      nodes: [
        { id: 'm1', title: 'Numrat & Veprimet Bazë', desc: 'Mbledhja, zbritja, shumëzimi, pjesëtimi. Vetitë komutative, shoqëruese dhe shpërndarëse.', status: 'completed', progress: 100 },
        { id: 'm2', title: 'Thyesat & Numrat Dhjetorë', desc: 'Thyesat e zakonshme, dhjetore, përqindjet. Krahasimi, thjeshtimi dhe veprimet me thyesa.', status: 'completed', progress: 100 },
        { id: 'm3', title: 'Algjebra e Hershme', desc: 'Shprehjet algjebrike, ekuacionet lineare me 1 ndryshore, formula V=I·R si model algjebrik.', status: 'current', progress: 65 },
        { id: 'm4', title: 'Gjeometria Plane', desc: 'Sipërfaqet, perimetrat, këndet, trekëndëshat, rrethët, teorema e Pitagorës (a²+b²=c²).', status: 'locked', progress: 0 },
        { id: 'm5', title: 'Funksionet & Grafikët', desc: 'Funksionet lineare f(x)=mx+b, kuadratike f(x)=ax²+bx+c, domeni dhe rrezja.', status: 'locked', progress: 0 },
        { id: 'm6', title: 'Trigonometria', desc: 'sin, cos, tan; rrethi njësi; identitetet trigonometrike; ekuacionet trigonometrike.', status: 'locked', progress: 0 },
        { id: 'm7', title: 'Probabiliteti & Statistika', desc: 'Mesatarja, mediana, moda, devijimi standard, shpërndarja normale, teorema e Bajesit.', status: 'locked', progress: 0 },
        { id: 'm8', title: 'Kalkulus I — Derivatet', desc: 'Limitet, derivatet, rregullat e diferencimit, optimizimi, pikat kritike.', status: 'locked', progress: 0 }
      ]
    },
    physics: {
      title: 'Fizikë — Rruga e Mësimit',
      emoji: '🚀',
      nodes: [
        { id: 'p1', title: 'Mekanika: Lëvizja & Forcat', desc: 'Shpejtësia, nxitimi, 3 ligjet e Njutonit, fërkimi, forca normale, diagramat e forcave.', status: 'completed', progress: 100 },
        { id: 'p2', title: 'Energjia & Puna', desc: 'Energjia kinetike Ek=½mv², energjia potenciale Ep=mgh, ruajtja e energjisë, fuqia P=W/t.', status: 'completed', progress: 100 },
        { id: 'p3', title: 'Qarqet Elektrike & Ligji i Ohm-it', desc: 'Tensioni, rryma, rezistenca, V=I·R, qarqet në seri dhe paralel, fuqia elektrike P=V·I.', status: 'current', progress: 45 },
        { id: 'p4', title: 'Valët & Optika', desc: 'Valët mekanike dhe elektromagnetike, pasqyrimi, thyerja, difrakcia, interferenca.', status: 'locked', progress: 0 },
        { id: 'p5', title: 'Termodinamika', desc: 'Temperatura, nxehtësia, ligjet e termodinamikës, entropia, ciklet termodinamike.', status: 'locked', progress: 0 },
        { id: 'p6', title: 'Graviteti & Astronomia', desc: 'Ligji i gravitacionit universal F=GMm/r², orbitat, ligjet e Keplerit, shpejtësia kozmike.', status: 'locked', progress: 0 },
        { id: 'p7', title: 'Fizika Bërthamore & Kuantike', desc: 'Modeli atomik, radioaktiviteti, fisioni, fuzioni, efekti fotoelektrik, dualizmi valë-grimcë.', status: 'locked', progress: 0 }
      ]
    },
    biology: {
      title: 'Biologji — Rruga e Mësimit',
      emoji: '🧬',
      nodes: [
        { id: 'b1', title: 'Qeliza & Organelet', desc: 'Qeliza prokariote vs eukariote, membrana qelizore, bërthama, mitokondrit, ribozomet.', status: 'completed', progress: 100 },
        { id: 'b2', title: 'Ndjekja Qelizore: Mitoza & Mejoza', desc: 'Cikli qelizor, fazat e mitozës (profazë, metafazë, anafazë, telofazë), kryqëzimi gjenetik.', status: 'completed', progress: 100 },
        { id: 'b3', title: 'DNA, ARN & Sinteza e Proteinave', desc: 'Struktura e DNA-së, replikimi, transkriptimi, translacioni, kodonët dhe aminoacidet.', status: 'current', progress: 72 },
        { id: 'b4', title: 'Gjenetika e Mendelit', desc: 'Ligjet e Mendelit, katrori Punnett, dominanca, recessiviteti, gjenetika e lidhur me seksin.', status: 'locked', progress: 0 },
        { id: 'b5', title: 'Evolucioni & Seleksioni Natyror', desc: 'Teoria e Darvinit, seleksioni natyror, speciimi, fosilet, dëshmitë e evolucionit.', status: 'locked', progress: 0 },
        { id: 'b6', title: 'Ekologjia & Ekosistemet', desc: 'Rrjetet ushqimore, ciklet biogjokimike, biodiversiteti, ndryshimet klimatike.', status: 'locked', progress: 0 }
      ]
    },
    chemistry: {
      title: 'Kimi — Rruga e Mësimit',
      emoji: '⚗️',
      nodes: [
        { id: 'c1', title: 'Struktura Atomike & Tabela Periodike', desc: 'Protonet, neutronet, elektronet, numri atomik, masat atomike, grupet dhe periudat.', status: 'completed', progress: 100 },
        { id: 'c2', title: 'Lidhjet Kimike', desc: 'Lidhja jonike, kovalente, metalike. Strukturat e Ljuisit, polariteti, elektronegativiteti.', status: 'current', progress: 55 },
        { id: 'c3', title: 'Reaksionet & Stekiometria', desc: 'Balancimi i ekuacioneve, molet, masa molare, rendimenti, llogaritjet stekiometrike.', status: 'locked', progress: 0 },
        { id: 'c4', title: 'Acidet, Bazat & pH', desc: 'Teoria Brønsted-Lowry, pH=-log[H+], neutralizimi, tretësirat tampon.', status: 'locked', progress: 0 },
        { id: 'c5', title: 'Kimia Organike Bazë', desc: 'Alkanet, alkenet, alkinet, grupet funksionale, izomeria, emërtimi IUPAC.', status: 'locked', progress: 0 }
      ]
    },
    cs: {
      title: 'Shkenca Kompjuterike — Rruga e Mësimit',
      emoji: '💻',
      nodes: [
        { id: 'cs1', title: 'Hyrje në Mendimin Algoritmik', desc: 'Dekompozimi, abstragimi, njohja e modeleve, algoritmet hap-pas-hapi.', status: 'completed', progress: 100 },
        { id: 'cs2', title: 'Variablat, Kushtet & Ciklet', desc: 'Tipet e të dhënave, if/else, for/while, operatorët logjikë, pseudokodi.', status: 'completed', progress: 100 },
        { id: 'cs3', title: 'Funksionet & Modulariteti', desc: 'Përkufizimi i funksioneve, parametrat, kthimi i vlerave, fushëveprimi (scope), rekursioni.', status: 'current', progress: 40 },
        { id: 'cs4', title: 'Strukturat e të Dhënave', desc: 'Listat, stivat, rradhët, pemët, grafet, hash maps, kompleksiteti Big-O.', status: 'locked', progress: 0 },
        { id: 'cs5', title: 'Algoritmet e Renditjes & Kërkimit', desc: 'Bubble Sort, Selection Sort, Quick Sort, Binary Search, analiza e kohës.', status: 'locked', progress: 0 },
        { id: 'cs6', title: 'Programimi i Orientuar në Objekte', desc: 'Klasat, objektet, trashëgimia, polimorfizmi, enkapsulimi, abstraksioni.', status: 'locked', progress: 0 },
        { id: 'cs7', title: 'Bazat e Inteligjencës Artificiale', desc: 'Rrjetat neurale, gradient descent, funksionet e aktivizimit, mësimi i mbikëqyrur.', status: 'locked', progress: 0 }
      ]
    },
    history: {
      title: 'Histori — Rruga e Mësimit',
      emoji: '🏛️',
      nodes: [
        { id: 'h1', title: 'Qytetërimet e Lashta', desc: 'Mesopotamia, Egjipti, Greqia, Roma. Shkrimi, ligjet, demokracia, filozofia.', status: 'completed', progress: 100 },
        { id: 'h2', title: 'Mesjeta & Rilindja', desc: 'Feudalizmi, Kryqëzatat, Perandoria Osmane, Rilindja Europiane, zbulimet shkencore.', status: 'completed', progress: 100 },
        { id: 'h3', title: 'Historia e Kombit Shqiptar', desc: 'Ilirët, Skënderbeu, Rilindja Kombëtare, Pavarësia 1912, Lidhja e Prizrenit.', status: 'current', progress: 58 },
        { id: 'h4', title: 'Revolucionet & Luftërat Botërore', desc: 'Revolucioni Francez, Industrial, Lufta e Parë dhe e Dytë Botërore.', status: 'locked', progress: 0 },
        { id: 'h5', title: 'Lufta e Ftohtë & Bota Moderne', desc: 'Blloku Lindor/Perëndimor, Muri i Berlinit, rënia e komunizmit, globalizimi.', status: 'locked', progress: 0 }
      ]
    },
    economics: {
      title: 'Ekonomi — Rruga e Mësimit',
      emoji: '📊',
      nodes: [
        { id: 'e1', title: 'Hyrje: Kërkesa, Oferta, Tregu', desc: 'Ligji i kërkesës dhe ofertës, ekuilibri, elasticiteti, teprica konsumatore/prodhuese.', status: 'completed', progress: 100 },
        { id: 'e2', title: 'Makroekonomia Bazë', desc: 'PBB, inflacioni, papunësia, cikli ekonomik, politika fiskale dhe monetare.', status: 'current', progress: 30 },
        { id: 'e3', title: 'Sistemi Financiar & Bankat', desc: 'Paratë, bankat qendrore, norma e interesit, kredia, borxhi publik.', status: 'locked', progress: 0 },
        { id: 'e4', title: 'Tregtia Ndërkombëtare', desc: 'Avantazhi krahasues, tarifa, kuotat, marrëveshjet tregtare, globalizimi ekonomik.', status: 'locked', progress: 0 }
      ]
    }
  };

  let activeSubject = 'math';

  function init() {
    if (document.getElementById('roadmapOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'roadmapOverlay';
    overlay.className = 'roadmap-overlay';
    overlay.innerHTML = `
      <div class="roadmap-window" role="dialog" aria-modal="true">
        <div class="roadmap-header">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">🗺️</span>
            <div>
              <h2 style="margin:0;font-size:18px;font-weight:700">Harta e Dijes — Rrugët e Mësimit</h2>
              <div style="font-size:12px;color:var(--text-muted)">Ndiq progresin tënd në çdo lëndë, hap pas hapi drejt zotërimit</div>
            </div>
          </div>
          <button id="closeRoadmapBtn" class="school-os-close-btn" title="Mbyll Hartën">×</button>
        </div>

        <div class="roadmap-body">
          <div class="roadmap-subject-nav" id="roadmapSubjectNav"></div>
          <div class="roadmap-tree-area" id="roadmapTreeArea"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    wireEvents();
    renderSubjectNav();
    renderRoadmapTree();
  }

  function wireEvents() {
    const overlay = document.getElementById('roadmapOverlay');
    document.getElementById('closeRoadmapBtn')?.addEventListener('click', close);
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay?.style.display === 'flex') close();
    });
  }

  function renderSubjectNav() {
    const nav = document.getElementById('roadmapSubjectNav');
    if (!nav) return;

    nav.innerHTML = Object.entries(ROADMAPS).map(([key, data]) => {
      const completedCount = data.nodes.filter(n => n.status === 'completed').length;
      const pct = Math.round((completedCount / data.nodes.length) * 100);
      return `
        <button class="roadmap-subject-btn ${key === activeSubject ? 'active' : ''}" data-subject="${key}">
          <span style="font-size:18px">${data.emoji}</span>
          <div style="flex:1;overflow:hidden">
            <div style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${data.title.split(' — ')[0]}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:1px">${pct}% e përfunduar</div>
          </div>
        </button>
      `;
    }).join('');

    nav.querySelectorAll('.roadmap-subject-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSubject = btn.dataset.subject;
        renderSubjectNav();
        renderRoadmapTree();
      });
    });
  }

  function renderRoadmapTree() {
    const area = document.getElementById('roadmapTreeArea');
    if (!area) return;

    const roadmap = ROADMAPS[activeSubject];
    if (!roadmap) return;

    const completedCount = roadmap.nodes.filter(n => n.status === 'completed').length;
    const totalPct = Math.round((completedCount / roadmap.nodes.length) * 100);

    area.innerHTML = `
      <div style="margin-bottom:20px">
        <h3 style="margin:0 0 4px;font-size:18px;font-weight:700;color:var(--text)">${roadmap.emoji} ${roadmap.title}</h3>
        <div style="display:flex;align-items:center;gap:12px;margin-top:8px">
          <div style="flex:1;height:8px;border-radius:4px;background:rgba(148,163,184,0.2);overflow:hidden">
            <div style="height:100%;width:${totalPct}%;border-radius:4px;background:linear-gradient(90deg,#10b981,#059669);transition:width 0.3s"></div>
          </div>
          <span style="font-size:13px;font-weight:700;color:${totalPct === 100 ? '#10b981' : '#6366f1'}">${totalPct}%</span>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:6px">${completedCount} / ${roadmap.nodes.length} aftësi të përfunduara</div>
      </div>

      ${roadmap.nodes.map((node, idx) => {
        const dotClass = node.status === 'completed' ? 'completed' : (node.status === 'current' ? 'current' : 'locked');
        const bodyClass = node.status === 'completed' ? 'completed' : (node.status === 'current' ? 'current' : '');
        const dotContent = node.status === 'completed' ? '✓' : (node.status === 'current' ? '▶' : '🔒');
        const statusLabel = node.status === 'completed' ? '<span style="color:#10b981;font-weight:700;font-size:11.5px">✅ E Përfunduar</span>' :
                            (node.status === 'current' ? '<span style="color:#6366f1;font-weight:700;font-size:11.5px">📖 Duke Mësuar Tani</span>' :
                             '<span style="color:var(--text-muted);font-weight:600;font-size:11.5px">🔒 E Kyçur (Përfundo hapat e mëparshëm)</span>');

        return `
          <div class="skill-node">
            <div class="skill-node-dot ${dotClass}">${dotContent}</div>
            <div class="skill-node-body ${bodyClass}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
                <div>
                  <div style="font-weight:700;font-size:14px;color:var(--text)">${idx + 1}. ${node.title}</div>
                  <div style="font-size:12.5px;color:var(--text-muted);margin-top:3px;line-height:1.5">${node.desc}</div>
                </div>
                ${statusLabel}
              </div>
              ${node.status !== 'locked' ? `
                <div class="skill-progress-bar">
                  <div class="skill-progress-fill ${node.progress === 100 ? 'done' : ''}" style="width:${node.progress}%"></div>
                </div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${node.progress}% e përfunduar</div>
              ` : ''}
              ${node.status === 'current' ? `
                <button class="os-btn-primary skill-start-btn" data-skill="${node.id}" style="margin-top:10px;padding:7px 16px;font-size:12.5px">
                  ▶ Vazhdo Mësimin
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    `;

    area.querySelectorAll('.skill-start-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        close();
        // Route to the appropriate lab/tool based on subject
        if (activeSubject === 'math' && window.InteractiveLab) window.InteractiveLab.open('math');
        else if (activeSubject === 'physics' && window.InteractiveLab) window.InteractiveLab.open('circuits');
        else if (activeSubject === 'biology' && window.InteractiveLab) window.InteractiveLab.open('dna');
        else if (activeSubject === 'chemistry' && window.InteractiveLab) window.InteractiveLab.open('reactions');
        else if (activeSubject === 'cs' && window.InteractiveLab) window.InteractiveLab.open('algorithms');
        else if (activeSubject === 'history' && window.InteractiveLab) window.InteractiveLab.open('timeline');
        else if (activeSubject === 'economics' && window.InteractiveLab) window.InteractiveLab.open('economics');
      });
    });
  }

  function open() {
    init();
    const overlay = document.getElementById('roadmapOverlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function close() {
    const overlay = document.getElementById('roadmapOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  window.LearningRoadmap = { open, close };

  document.addEventListener('DOMContentLoaded', init);
})();
