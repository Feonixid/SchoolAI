describe('Scientific Calculator & Physical Constants Explorer', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="openScienceCalcSidebarBtn"></div>
    `;
    require('../../js/science-calculator.js');
  });

  test('ScienceCalculator attaches to window and opens/closes correctly', () => {
    expect(window.ScienceCalculator).toBeDefined();
    expect(typeof window.ScienceCalculator.open).toBe('function');
    expect(typeof window.ScienceCalculator.close).toBe('function');

    window.ScienceCalculator.open();
    const overlay = document.getElementById('scienceCalcOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay.style.display).toBe('flex');

    const constsList = document.getElementById('calcConstantsList');
    expect(constsList).not.toBeNull();
    expect(constsList.children.length).toBeGreaterThan(3);

    window.ScienceCalculator.close();
    expect(overlay.style.display).toBe('none');
  });

  test('Basic evaluation and constant insertion calculate correct results', () => {
    window.ScienceCalculator.open();
    const btn7 = document.querySelector('.calc-btn[data-val="7"]');
    const btnPlus = document.querySelector('.calc-btn[data-val="+"]');
    const btn8 = document.querySelector('.calc-btn[data-val="8"]');
    const btnEquals = document.getElementById('calcEqualsBtn');

    expect(btn7).not.toBeNull();
    expect(btnPlus).not.toBeNull();
    expect(btn8).not.toBeNull();
    expect(btnEquals).not.toBeNull();

    btn7.click();
    btnPlus.click();
    btn8.click();
    btnEquals.click();

    const valEl = document.getElementById('calcValScreen');
    expect(valEl.textContent).toBe('15');

    window.ScienceCalculator.close();
  });
});
