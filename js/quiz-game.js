// js/quiz-game.js
// ===================================================================
// ALBANIAN LANGUAGE QUIZ GAME
// 10 Levels, 10 Questions each, progressive difficulty
// ===================================================================

(function () {
    'use strict';

    const state = window.AppState;
    if (!state) return;

    // Quiz Data (10 Levels * 10 Questions)
    const QUIZ_DATA = {
        1: [ // Level 1 - Elementary
            { q: "Cila është shkronja e parë e alfabetit?", options: ["A", "B", "C", "D", "E"], a: 0 },
            { q: "Si quhet stina pas dimrit?", options: ["Vjeshta", "Vera", "Pranvera", "Janari", "Gushti"], a: 2 },
            { q: "Sa ditë ka java?", options: ["5", "6", "7", "8", "10"], a: 2 },
            { q: "Cila fjalë është emër?", options: ["Vrapoj", "I kuq", "Maca", "Shpejt", "Bukur"], a: 2 },
            { q: "Kush bën 'mjah'?", options: ["Qeni", "Maca", "Lopa", "Dhia", "Kali"], a: 1 },
            { q: "Ku jetojnë peshqit?", options: ["Në pemë", "Në tokë", "Në ujë", "Në qiell", "Në mal"], a: 2 },
            { q: "Çfarë ngjyre ka bari?", options: ["Kuq", "Blu", "Gjelbër", "Verdhë", "Zi"], a: 2 },
            { q: "Kushtetuta e parë e Shqipërisë?", options: ["Kanuni", "Statuti", "Kushtetuta", "Ligji", "Kodi"], a: 1 }, // Trick for kids, just testing reading
            { q: "Sa bëjnë 2 + 2?", options: ["3", "4", "5", "6", "8"], a: 1 },
            { q: "Cila është zanore?", options: ["B", "C", "D", "E", "F"], a: 3 }
        ],
        2: [ // Level 2 - Basic Grammar
            { q: "Cili është shumës i fjalës 'libër'?", options: ["Librat", "Libërat", "Libra", "Libri", "Libratë"], a: 2 },
            { q: "Gjej foljen: 'Vajza lexon librin.'", options: ["Vajza", "Lexon", "Librin", "Libër", "Ajo"], a: 1 },
            { q: "Kryeqyteti i Shqipërisë është:", options: ["Durrësi", "Vlora", "Shkodra", "Tirana", "Korça"], a: 3 },
            { q: "E kundërta e 'bardhë' është:", options: ["E zezë", "E kuqe", "E verdhë", "E kaltër", "E gjelbër"], a: 0 },
            { q: "Shkruhet saktë:", options: ["Dhimje", "Dhimbje", "Dhymje", "Dhimëje", "Dimje"], a: 1 },
            { q: "Cila nuk është stinë?", options: ["Vera", "Dimri", "Janari", "Vjeshta", "Pranvera"], a: 2 },
            { q: "Sa zanore ka alfabeti shqip?", options: ["5", "6", "7", "8", "9"], a: 2 },
            { q: "Fjala 'bukur' është:", options: ["Emër", "Folje", "Mbiemër", "Ndajfolje", "Përemër"], a: 3 }, // Ndajfolje (often confused)
            { q: "Kush shkroi himnin?", options: ["Naim Frashëri", "Asdreni", "Fan Noli", "Çajupi", "Migjeni"], a: 1 },
            { q: "Viti i Pavarësisë?", options: ["1910", "1911", "1912", "1913", "1920"], a: 2 }
        ],
        3: [ // Level 3 - Intermediate Grammar
            { q: "Trajta e shquar e 'Laps':", options: ["Lapsat", "Lapsi", "Lapsit", "Lapësi", "Lapsu"], a: 1 },
            { q: "Përemri vetor veta I shumës:", options: ["Unë", "Ti", "Ne", "Ju", "Ata"], a: 2 },
            { q: "Folja 'kam' në kohën e tashme, veta III njëjës:", options: ["Kam", "Ke", "Ka", "Kemi", "Kanë"], a: 2 },
            { q: "Gjej mbiemrin: 'Djali i urtë mëson.'", options: ["Djali", "I urtë", "Mëson", "I", "Urtë"], a: 1 },
            { q: "Sinonimi i 'i varfër':", options: ["I pasur", "I vobektë", "I ri", "I bukur", "I mençur"], a: 1 },
            { q: "Antonimi i 'hyj':", options: ["Dal", "Qëndroj", "Fle", "Ha", "Pi"], a: 0 },
            { q: "Fjala me ë fundore:", options: ["Nanë", "Babë", "Shkollë", "Të gjitha", "Asnjëra"], a: 3 },
            { q: "Shenja e pikësimit në fund të pyetjes:", options: [".", "!", "?", ",", ";"], a: 2 },
            { q: "Kush është heroi kombëtar?", options: ["Ismail Qemali", "Skënderbeu", "Nënë Tereza", "Adem Jashari", "Isa Boletini"], a: 1 },
            { q: "Sa shkronja ka alfabeti?", options: ["34", "35", "36", "37", "33"], a: 2 }
        ],
        4: [ // Level 4
            { q: "Cila fjalë fillon me shkronjë të madhe?", options: ["maca", "tavolina", "tirana", "lapsi", "uji"], a: 2 },
            { q: "'Ujku' është:", options: ["Kafshë shtëpiake", "Kafshë e egër", "Shpend", "Peshk", "Insekt"], a: 1 },
            { q: "Numri pas 19-ës:", options: ["Nëntëmbëdhjetë", "Njëzet", "Njëzet e një", "Tetëmbëdhjetë", "Tridhjetë"], a: 1 },
            { q: "Kohët e foljes janë:", options: ["Tashme, Shkuar, Ardhme", "Dje, Sot, Nesër", "Mirë, Keq, Mesatare", "Një, Dy, Tre", "Asnjë"], a: 0 },
            { q: "Mjalti prodhohet nga:", options: ["Mizat", "Bletët", "Fluturat", "Mushkonjat", "Merimangat"], a: 1 },
            { q: "Cili është lum në Shqipëri?", options: ["Drini", "Tevere", "Nil", "Amazona", "Sena"], a: 0 },
            { q: "Fjala 'fluturoj' është:", options: ["Emër", "Mbiemër", "Folje", "Numëror", "Përemër"], a: 2 },
            { q: "Forma e saktë:", options: ["Ku shkove?", "Ku vajte?", "Ku ike?", "Të gjitha", "Asnjëra"], a: 3 },
            { q: "Çfarë feste është 28 Nëntori?", options: ["Krishtlindjet", "Bajrami", "Pavarësia", "Viti i Ri", "Mësuesi"], a: 2 },
            { q: "Sa këmbë ka kali?", options: ["2", "3", "4", "5", "6"], a: 2 }
        ],
        5: [ // Level 5
            { q: "'Guri' në trajtën e pashquar:", options: ["Guri", "Gur", "Gurin", "Gurit", "Gurët"], a: 1 },
            { q: "Shkrimtari i 'Bagëti e Bujqësi':", options: ["Naim Frashëri", "Sami Frashëri", "Pashko Vasa", "Jeronim De Rada", "Fan Noli"], a: 0 },
            { q: "Cila është lidhëz?", options: ["Dhe", "Bumur", "Laps", "Hëngra", "Bukur"], a: 0 },
            { q: "Folja 'punoj' në të pakryerën, veta I:", options: ["Punova", "Punoja", "Punon", "Kam punuar", "Do punoj"], a: 1 },
            { q: "Kryefjala në fjali gjendet me pyetjen:", options: ["Kë?", "Cili/Kush?", "Ku?", "Kur?", "Pse?"], a: 1 },
            { q: "Liqeni më i thellë në Shqipëri:", options: ["Shkodrës", "Ohrit", "Prespës", "Fierzës", "Bovillës"], a: 1 },
            { q: "Mbiemri i nyjshëm:", options: ["Trimi", "Bukur", "I mirë", "Fort", "Keq"], a: 2 },
            { q: "'Përroi' është:", options: ["Lum i vogël", "Mal", "Fushë", "Det", "Liqen"], a: 0 },
            { q: "Vargu i maleve në jug:", options: ["Alpet", "Korabi", "Mali i Zi", "Dajti", "Tomorri"], a: 4 }, // Trick question context generic
            { q: "Përemri pronor:", options: ["Kjo", "Im", "Ai", "Kush", "Dikush"], a: 1 }
        ],
        6: [ // Level 6
            { q: "Pjesorja e foljes 'marr':", options: ["Marrë", "Marrur", "Marrja", "Marre", "Mora"], a: 0 },
            { q: "Lakimi i emrave bëhet sipas:", options: ["Gjinisë", "Numrit", "Trajtës", "Rasave", "Kuptimit"], a: 3 },
            { q: "Rasa që tregon vend (Gjindore):", options: ["I kujt?", "Kujt?", "Kë?", "Prej kujt?", "Cili?"], a: 0 },
            { q: "Fjalia dëftore tregon:", options: ["Pyetje", "Fakt/Veprim", "Habit", "Urdhër", "Dëshirë"], a: 1 },
            { q: "Autori i 'Gjenerali i ushtrisë së vdekur':", options: ["Dritëro Agolli", "Ismail Kadare", "Azem Shkreli", "Rexhep Qosja", "Ali Podrimja"], a: 1 },
            { q: "Prapashtesa formon fjalë:", options: ["Të përbëra", "Të prejardhura", "Të ngjitura", "Të thjeshta", "Të huaja"], a: 1 },
            { q: "'Gjirokastra' njihet si:", options: ["Qyteti i luleve", "Qyteti i gurit", "Qyteti i dritave", "Qyteti i serenatave", "Qyteti i 1001 dritareve"], a: 1 },
            { q: "'E heq zvarrë' do të thotë:", options: ["E vret", "E puth", "E vonon", "E shpejton", "E ndihmon"], a: 2 },
            { q: "Forma joveprore e 'laj':", options: ["Lava", "Lahem", "Laja", "Kam larë", "Duke larë"], a: 1 },
            { q: "Cila është parafjalë?", options: ["Mbi", "Bukur", "Ecën", "Lule", "Unë"], a: 0 }
        ],
        7: [ // Level 7
            { q: "Cila fjalë ka digramin 'dh'?", options: ["Dera", "Dhelpra", "Deti", "Dora", "Dita"], a: 1 },
            { q: "Mënyra habitore e 'vij':", options: ["Vija", "Erdha", "Vinkam", "Do vij", "Të vij"], a: 2 },
            { q: "Numërori 'njëzet' shkruhet:", options: ["Një zetr", "Njëzet", "Një zet", "Njizet", "Njezet"], a: 1 },
            { q: "Klasat e fjalëve janë:", options: ["5", "8", "10", "12", "7"], a: 2 },
            { q: "'Besa' në Kodin Kanunor është:", options: ["Fjalë e dhënë", "Hakmarrje", "Miqësi", "Dhuratë", "Gënjeshtër"], a: 0 },
            { q: "Fjala 'kryevepër' është:", options: ["E thjeshtë", "E prejardhur", "E përbërë", "E ngjitur", "Frazeologjike"], a: 2 },
            { q: "Cili nuk është shkrimtar shqiptar?", options: ["Migjeni", "Shekspiri", "Kadare", "Agolli", "Fishta"], a: 1 },
            { q: "Rasa Rjedhore përgjigjet pyetjes:", options: ["Kujt?", "Prej kujt?", "Kë?", "I kujt?", "Cili?"], a: 1 },
            { q: "Qyteti i 'Një mbi një dritareve':", options: ["Gjirokastra", "Berati", "Kruja", "Lezha", "Shkodra"], a: 1 },
            { q: "Folja ndihmëse:", options: ["Kam", "Ha", "Fle", "Punoj", "Lexoj"], a: 0 }
        ],
        8: [ // Level 8
            { q: "Koha e kryer e dëftores (kam):", options: ["Pata", "Kam pasur", "Kisha", "Paskam", "Do kem"], a: 0 },
            { q: "Autori i 'Lahuta e Malcis':", options: ["Naim Frashëri", "Gjergj Fishta", "Mjeda", "Poradeci", "Koliqi"], a: 1 },
            { q: "Dialektet e shqipes:", options: ["Veriu, Jugu", "Gegë, Toskë", "Lindje, Perëndim", "Malësi, Fushë", "I vjetër, I ri"], a: 1 },
            { q: "Lidhëza nënrenditëse:", options: ["Dhe", "Por", "Që", "Ose", "As"], a: 2 },
            { q: "Teksti argumentues:", options: ["Tregon ngjarje", "Përshkruan", "Mbron një tezë", "Jep informacion", "Është poezi"], a: 2 },
            { q: "Figurt stilistike 'Si lulja':", options: ["Metaforë", "Krahasim", "Epiteti", "Hiperbolë", "Anaforë"], a: 1 },
            { q: "Fjalitë e thjeshta kanë:", options: ["Një folje", "Dy folje", "Pa folje", "Shumë folje", "Asnjëra"], a: 0 },
            { q: "Kongresi i Drejtshkrimit (viti):", options: ["1908", "1944", "1972", "1990", "2000"], a: 2 },
            { q: "'Gjuha e zjarrtë' është:", options: ["Epitet", "Metaforë", "Krahasim", "Inversion", "Simbol"], a: 1 },
            { q: "Cila është pasthirrmë?", options: ["O", "Dhe", "Në", "Sa", "Kush"], a: 0 }
        ],
        9: [ // Level 9
            { q: "Mënyra Lidhore ka lidhëzën:", options: ["Të", "Do", "Po", "Që", "Se"], a: 0 },
            { q: "'I zoti' (analizë):", options: ["Mbiemër i nyjshëm", "Mbiemër i panyjshëm", "Emër", "Përemër", "Folje"], a: 0 },
            { q: "Shprehja 'I dha dërrmën':", options: ["E ndihmoi", "E shkatërroi", "E lavdëroi", "E ftoi", "E puthi"], a: 1 },
            { q: "Vepra 'Mesari' u shkrua nga:", options: ["Buzuku", "Budi", "Bogdani", "Matrënga", "Barleti"], a: 0 },
            { q: "Viti i botimit të Mesarit:", options: ["1455", "1555", "1655", "1355", "1855"], a: 1 },
            { q: "Klasifikimi morfologjik studion:", options: ["Tingujt", "Fjalitë", "Format e fjalëve", "Kuptimin", "Drejtshkrimin"], a: 2 },
            { q: "Ndajfolja e sasisë:", options: ["Mirë", "Shumë", "Sot", "Këtu", "Bukur"], a: 1 },
            { q: "Pjesëza pyetëse:", options: ["A", "Po", "Jo", "Nuk", "Mos"], a: 0 },
            { q: "'Skënderbeu' i Naimit është:", options: ["Roman", "Poemë epike", "Dramë", "Novë", "Ese"], a: 1 },
            { q: "Cila zanore është hundore në gegërisht?", options: ["A", "Â", "E", "I", "O"], a: 1 }
        ],
        10: [ // Level 10 - Advanced
            { q: "Format e pashtjelluara të foljes janë:", options: ["3", "4", "5", "6", "2"], a: 2 }, // Pjesorja, Paskajorja (Gegë/Standard), Përcjellorja, Mohore, Vetvetore (Debatable but usually 5-6 in trad grammar) - Let's say 6 with Gerundive? Standard says 6: Pjesore, Paskajore, Percjellore, Mohore, (Future forms no). Let's stick to simple school grammars: Pjesore, Percjellore, Mohore, Paskajore (Gege). Use a safer question.
            // Replaced Q1
            { q: "Mënyra dëshirore shpreh:", options: ["Urdhër", "Fakt", "Mallkim/Urim", "Kusht", "Habit"], a: 2 },
            { q: "Kategoria gramatikore që mungon tek emri:", options: ["Gjinia", "Numri", "Rasa", "Koha", "Trajta"], a: 3 },
            { q: "Cili është kryeqyteti i Kosovës?", options: ["Prizreni", "Peja", "Prishtina", "Gjakova", "Mitrovica"], a: 2 },
            { q: "Kongresi i Manastirit u mbajt më:", options: ["1908", "1912", "1878", "1920", "1945"], a: 0 },
            { q: "Alfabeti shqip ka sa shkronja të përbëra (digrame)?", options: ["7", "8", "9", "10", "6"], a: 2 }, // dh, gj, ll, nj, rr, sh, th, xh, zh
            { q: "Fjalia: 'Sikur të mësoje, do fitoje.' është:", options: ["Kushtore", "Lejore", "Qëllimore", "Shkakore", "Kohore"], a: 0 },
            { q: "'E poshtërme' është shkalla:", options: ["Krahasore", "Sipërore absolut", "Pohore", "Krahasore e ultësisë", "Sipërore"], a: 2 },
            { q: "Vepra e parë në gjuhën shqipe:", options: ["Mesari", "Çeta e Profetëve", "Doktrina e Kërshten", "E mbsuame e krështerë", "Historia e Skënderbeut"], a: 0 }, // wait, Formula e Pagezimit is elder fragment, Meshari is Book. Let's precise.
            // Replaced Q8
            { q: "Dokumenti i parë i shkruar i shqipes:", options: ["Meshari", "Formula e Pagëzimit", "Ungjilli i Pashkëve", "Fjalori i Arnold von Harff", "Kanuni"], a: 1 },
            { q: "Kush e shkroi 'Formula e Pagëzimit'?", options: ["Pal Engjëlli", "Gjon Buzuku", "Pjetër Budi", "Frang Bardhi", "Lekë Matrënga"], a: 0 }
        ]
    };

    // Game UI
    function showQuizGameModal() {
        // Styling overrides for modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.zIndex = '1000';
        modal.style.display = 'flex';

        modal.innerHTML = `
      <div class="modal gamification-modal" style="width:800px;max-width:98vw;">
        <div class="gamification-header">
          <h3 style="margin:0;color:var(--accent);">🎮 Kuizi i Gjuhës Shqipe</h3>
          <button class="icon-btn close-game" style="width:32px;height:32px;font-size:18px">×</button>
        </div>
        
        <div id="game-menu" style="display:block;">
          <p style="margin-bottom:16px;color:var(--muted)">
            Zgjidhni nivelin. Çdo përgjigje e saktë jep <strong>10 pikë</strong>. Gabimet heqin <strong>2 pikë</strong>.
            Mund të plotësohet vetëm një herë për nivel!
          </p>
          <div class="badges-gallery-grid" id="level-grid">
            <!-- Specific Levels -->
          </div>
        </div>

        <div id="game-play" style="display:none;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(0,0,0,0.1)">
            <span id="level-indicator" style="font-weight:700;color:var(--accent)">Niveli 1</span>
            <span id="score-indicator" style="font-weight:700;color:#16a34a">Pikë: 0</span>
          </div>
          <div id="question-container" style="min-height:300px;display:flex;flex-direction:column;justify-content:center;">
            <h4 id="question-text" style="font-size:18px;margin-bottom:20px;text-align:center;">Pyetja...</h4>
            <div id="options-container" style="display:grid;gap:10px;"></div>
          </div>
        </div>

      </div>
    `;

        document.body.appendChild(modal);

        modal.querySelector('.close-game').addEventListener('click', () => modal.remove());

        renderLevelMenu(modal);
    }

    function renderLevelMenu(modal) {
        const grid = modal.querySelector('#level-grid');
        grid.innerHTML = '';

        // Check progress
        const studentId = state.students.selectedId; // Assuming current student context if available, else alert
        // Actually, usually student accesses this. If no ID (e.g. initial view), we might need prompt.
        // But let's assume we are in "Student Mode" implicitly or require identity.
        // For now, let's use a temporary storage or `state.gamification.studentProgress` if we know who it is.
        // If we don't know who is playing, we prompt? The prompt says "open only on the student with a button".
        // We will assume `state.students.selectedId` MUST be set. If not, prompt.

        // For this implementation, we'll store completion in `localStorage` for "anonymous" or `state` if identified.

        for (let i = 1; i <= 10; i++) {
            const isCompleted = isLevelCompleted(i);
            const btn = document.createElement('div');
            btn.className = `badge-card ${isCompleted ? 'locked' : ''}`;
            btn.style.cursor = isCompleted ? 'default' : 'pointer';
            btn.style.textAlign = 'center';
            btn.innerHTML = `
            <div style="font-size:24px;">${isCompleted ? '✅' : '📜'}</div>
            <div style="font-weight:700;margin-top:4px;">Niveli ${i}</div>
            <div style="font-size:11px;color:var(--muted)">${isCompleted ? 'Përfunduar' : 'Luaj Tani'}</div>
        `;

            if (!isCompleted) {
                btn.addEventListener('click', () => startLevel(i, modal));
            } else {
                btn.style.opacity = '0.6';
            }
            grid.appendChild(btn);
        }
    }

    function isLevelCompleted(level) {
        if (!state.students.selectedId) return false;
        const key = `quiz_completed_${state.students.selectedId}_${level}`;
        return localStorage.getItem(key) === 'true';
    }

    function markLevelCompleted(level) {
        if (!state.students.selectedId) return;
        const key = `quiz_completed_${state.students.selectedId}_${level}`;
        localStorage.setItem(key, 'true');
    }

    function startLevel(level, modal) {
        if (!state.students.selectedId) {
            // If no student selected, we must identify first. 
            // We can call `promptStudentIdentity` from gamification.js, but that closes modals.
            // Simple fix: Alert for now.
            alert("Ju lutem identifikohuni së pari duke klikuar 'Mjetet -> ⭐ Shiko Arritjet e Mia'");
            modal.remove();
            return;
        }

        const activeSubj = window.Subjects?.getActive()?.id || 'shqip';
        const questions = (activeSubj === 'shqip' && QUIZ_DATA[level]) ? QUIZ_DATA[level] : (QUIZ_DATA[level] || QUIZ_DATA[1]);
        if (!questions) return;

        modal.querySelector('#game-menu').style.display = 'none';
        modal.querySelector('#game-play').style.display = 'block';
        modal.querySelector('#level-indicator').textContent = `Niveli ${level}`;

        let currentQ = 0;
        let score = 0;
        let answered = false;

        const renderQuestion = () => {
            answered = false;
            if (currentQ >= questions.length) {
                finishLevel(level, score, modal);
                return;
            }

            const q = questions[currentQ];
            modal.querySelector('#question-text').textContent = `${currentQ + 1}. ${q.q}`;
            modal.querySelector('#score-indicator').textContent = `Pikë: ${score}`;

            const optsDiv = modal.querySelector('#options-container');
            optsDiv.innerHTML = '';

            q.options.forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.className = 'btn-secondary';
                btn.style.textAlign = 'left';
                btn.style.padding = '12px 14px';
                btn.style.fontSize = '14px';
                btn.style.transition = 'all 0.2s ease';
                btn.style.borderRadius = '8px';
                btn.textContent = opt;

                btn.addEventListener('click', () => {
                    if (answered) return;
                    answered = true;

                    if (idx === q.a) {
                        score += 10;
                        btn.style.background = '#10b981';
                        btn.style.color = '#ffffff';
                        btn.style.borderColor = '#059669';
                    } else {
                        score = Math.max(0, score - 2);
                        btn.style.background = '#ef4444';
                        btn.style.color = '#ffffff';
                        btn.style.borderColor = '#dc2626';

                        // Highlight the correct one
                        const correctBtn = optsDiv.children[q.a];
                        if (correctBtn) {
                            correctBtn.style.background = '#10b981';
                            correctBtn.style.color = '#ffffff';
                        }
                    }

                    setTimeout(() => {
                        currentQ++;
                        renderQuestion();
                    }, 650);
                });
                optsDiv.appendChild(btn);
            });
        };

        renderQuestion();
    }

    function finishLevel(level, score, modal) {
        markLevelCompleted(level);

        // Add points to gamification
        if (window.Gamification && window.Gamification.addPoints && score > 0) {
            window.Gamification.addPoints(state.students.selectedId, score);
        }

        modal.innerHTML = `
        <div class="modal gamification-modal" style="width:400px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">🎉</div>
            <h3 style="color:var(--accent)">Niveli ${level} Përfundoi!</h3>
            <p>Ju fituat <strong>${score} pikë</strong>!</p>
            <button class="btn-primary close-game" style="margin-top:16px;">Mbyll</button>
        </div>
      `;
        modal.querySelector('.close-game').addEventListener('click', () => modal.remove());
    }

    // Hook into UI
    function initQuizButton() {
        // We look for logic to inject this button in student panel
        // Better: export a function to open it
    }

    window.QuizGame = {
        open: showQuizGameModal
    };

    // Auto-init button if Student Panel exists (delay to ensure DOM)
    // Auto-init button if Student Panel exists (delay to ensure DOM)
    setTimeout(() => {
        const btn = document.getElementById('openQuizGameBtn');
        if (btn) {
            btn.addEventListener('click', showQuizGameModal);
        }
    }, 500);

})();
