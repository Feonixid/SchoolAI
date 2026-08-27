describe('Interactive Learning Lab, AI Playground & Socratic Tutor', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = `
      <div id="chat"></div>
      <input id="input" />
      <button id="sendBtn"></button>
      <button id="clearBtn"></button>
    `;
    require('../../js/socratic-tutor.js');
    require('../../js/interactive-lab.js');
  });

  test('SocraticTutor is exposed and enabled by default', () => {
    expect(window.SocraticTutor).toBeDefined();
    expect(window.SocraticTutor.isEnabled()).toBe(true);
    expect(typeof window.SocraticTutor.getSocraticPrompt).toBe('function');
  });

  test('SocraticTutor detects common student misconceptions', () => {
    const mathMistake = window.SocraticTutor.detectMisconception('I think (a + b)^2 is just a^2 + b^2');
    expect(mathMistake).not.toBeNull();
    expect(mathMistake.concept).toContain('Binomial');

    const physicsMistake = window.SocraticTutor.detectMisconception('Heavier objects fall faster due to heavy mass');
    expect(physicsMistake).not.toBeNull();
    expect(physicsMistake.concept).toContain('Gravity');
  });

  test('InteractiveLab attaches to window and opens/closes correctly', () => {
    expect(window.InteractiveLab).toBeDefined();
    expect(typeof window.InteractiveLab.open).toBe('function');
    expect(typeof window.InteractiveLab.close).toBe('function');

    window.InteractiveLab.open('physics');
    const overlay = document.getElementById('interactiveLabOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay.style.display).toBe('flex');

    window.InteractiveLab.close();
    expect(overlay.style.display).toBe('none');
  });

  test('InteractiveLab opens AI Neural Network and Activation functions tabs', () => {
    window.InteractiveLab.open('ai');
    const aiPane = document.getElementById('lab-ai');
    expect(aiPane).not.toBeNull();
    expect(aiPane.classList.contains('active')).toBe(true);

    window.InteractiveLab.open('activations');
    const actPane = document.getElementById('lab-activations');
    expect(actPane).not.toBeNull();
    expect(actPane.classList.contains('active')).toBe(true);

    window.InteractiveLab.open('circuits');
    const circuitPane = document.getElementById('lab-circuits');
    expect(circuitPane).not.toBeNull();
    expect(circuitPane.classList.contains('active')).toBe(true);

    window.InteractiveLab.open('reactions');
    const reactPane = document.getElementById('lab-reactions');
    expect(reactPane).not.toBeNull();
    expect(reactPane.classList.contains('active')).toBe(true);

    window.InteractiveLab.open('economics');
    const econPane = document.getElementById('lab-economics');
    expect(econPane).not.toBeNull();
    expect(econPane.classList.contains('active')).toBe(true);

    window.InteractiveLab.open('dna');
    const dnaPane = document.getElementById('lab-dna');
    expect(dnaPane).not.toBeNull();
    expect(dnaPane.classList.contains('active')).toBe(true);

    window.InteractiveLab.open('astronomy');
    const astroPane = document.getElementById('lab-astronomy');
    expect(astroPane).not.toBeNull();
    expect(astroPane.classList.contains('active')).toBe(true);

    window.InteractiveLab.close();
  });
});
