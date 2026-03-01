// TAB MANAGEMENT
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
let currentTab = 'unit-converter';

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.dataset.tab;
    
    if (targetTab === currentTab) return;

    // Determine animation direction
    const currentIndex = Array.from(tabButtons).findIndex(btn => btn.dataset.tab === currentTab);
    const targetIndex = Array.from(tabButtons).findIndex(btn => btn.dataset.tab === targetTab);
    const isMovingRight = targetIndex > currentIndex;

    // Remove active class from current tab and button
    const currentPanel = document.getElementById(currentTab);
    const currentButton = document.querySelector(`[data-tab="${currentTab}"]`);
    
    currentPanel.classList.add(isMovingRight ? 'exit-left' : 'exit-right');
    currentButton.classList.remove('active');

    // Add active class to new tab and button
    const targetPanel = document.getElementById(targetTab);
    targetPanel.classList.add('active');
    button.classList.add('active');

    // Update current tab
    currentTab = targetTab;

    // Remove exit animation class after animation completes
    setTimeout(() => {
      currentPanel.classList.remove('exit-left', 'exit-right', 'active');
    }, 400);
  });
});

// CALCULATOR
let calcDisplay = document.getElementById('calc-input');
let calcOutput = document.getElementById('calc-output');
let calcState = {
  current: '0',
  previous: '',
  operator: null,
  shouldResetDisplay: false,
  history: JSON.parse(localStorage.getItem('calcHistory')) || []
};

function updateDisplay() {
  calcDisplay.textContent = calcState.current;
}

function appendNumber(num) {
  if (calcState.shouldResetDisplay) {
    calcState.current = String(num);
    calcState.shouldResetDisplay = false;
  } else {
    if (calcState.current === '0' && num !== '.') {
      calcState.current = String(num);
    } else if (num === '.' && calcState.current.includes('.')) {
      return;
    } else {
      calcState.current += num;
    }
  }
  updateDisplay();
}

function setOperator(op) {
  if (calcState.operator !== null && !calcState.shouldResetDisplay) {
    calculate();
  }
  calcState.previous = calcState.current;
  calcState.operator = op;
  calcState.shouldResetDisplay = true;
}

function calculate() {
  if (calcState.operator === null || calcState.shouldResetDisplay) return;

  let result;
  const prev = parseFloat(calcState.previous);
  const current = parseFloat(calcState.current);

  switch (calcState.operator) {
    case '+':
      result = prev + current;
      break;
    case '-':
      result = prev - current;
      break;
    case '*':
      result = prev * current;
      break;
    case '/':
      result = current !== 0 ? prev / current : NaN;
      break;
    case '%':
      result = prev % current;
      break;
    default:
      return;
  }

  const historyEntry = `${prev} ${calcState.operator} ${current} = ${result}`;
  calcState.history.push(historyEntry);
  localStorage.setItem('calcHistory', JSON.stringify(calcState.history));
  addHistoryItem(historyEntry);

  calcState.current = String(result);
  calcState.operator = null;
  calcState.shouldResetDisplay = true;
  updateDisplay();
}

function clearCalculator() {
  calcState.current = '0';
  calcState.previous = '';
  calcState.operator = null;
  calcState.shouldResetDisplay = false;
  updateDisplay();
  calcOutput.textContent = '';
}

function deleteLastCharacter() {
  if (calcState.current.length > 1) {
    calcState.current = calcState.current.slice(0, -1);
  } else {
    calcState.current = '0';
  }
  updateDisplay();
}

// Calculate button handlers
document.querySelectorAll('.calc-btn').forEach(button => {
  button.addEventListener('click', () => {
    const num = button.dataset.num;
    const op = button.dataset.op;
    const action = button.dataset.action;

    if (num !== undefined) {
      appendNumber(num);
    } else if (op !== undefined) {
      setOperator(op);
    } else if (action === 'clear') {
      clearCalculator();
    } else if (action === 'delete') {
      deleteLastCharacter();
    } else if (action === 'equals') {
      calculate();
    }
  });
});

// History management
const historyList = document.getElementById('calc-history');
const clearHistoryBtn = document.getElementById('clear-history');

function addHistoryItem(entry) {
  if (calcState.history.length === 1) {
    historyList.innerHTML = '';
  }
  const item = document.createElement('div');
  item.className = 'history-item';
  item.textContent = entry;
  item.addEventListener('click', () => {
    const result = entry.split(' = ')[1];
    calcState.current = result;
    updateDisplay();
  });
  historyList.insertBefore(item, historyList.firstChild);
}

function renderHistory() {
  historyList.innerHTML = '';
  if (calcState.history.length === 0) {
    historyList.innerHTML = '<p class="empty-message">No calculations yet</p>';
    return;
  }
  calcState.history.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.textContent = entry;
    item.addEventListener('click', () => {
      const result = entry.split(' = ')[1];
      calcState.current = result;
      updateDisplay();
    });
    historyList.appendChild(item);
  });
}

clearHistoryBtn.addEventListener('click', () => {
  calcState.history = [];
  localStorage.setItem('calcHistory', JSON.stringify(calcState.history));
  renderHistory();
});

// Initialize history on page load
renderHistory();

// Generic converter helpers and wiring
const announcer = document.getElementById('announcer');

function announce(text) {
  if (announcer) announcer.textContent = text;
}

function parseInputRaw(value) {
  if (value === null || value === undefined) return null;
  // Accept comma as decimal separator, trim spaces
  const cleaned = String(value).trim().replace(/\s+/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

function formatNumberForInput(num) {
  if (!Number.isFinite(num)) return '';
  // Use locale-aware formatting but keep '.' as decimal separator for input usability
  // We'll limit to max 6 fractional digits and trim trailing zeros
  const opts = { maximumFractionDigits: 6 };
  const formatted = new Intl.NumberFormat(undefined, opts).format(num);
  // intl may use commas for thousands — convert to plain number with dot for the input
  return String(num.toFixed(6)).replace(/(?:\.\d+?)0+$/, (m)=>m.replace(/0+$/, '')).replace(/\.$/, '');
}

// Prevent recursive updates when programmatically setting values
const updating = new Set();

function setupConverter(aEl, bEl, toB, toA, formattedBEl, formattedAEl) {
  // By default aEl is editable and bEl is readonly (target)
  aEl.readOnly = false;
  bEl.readOnly = true;

  function computeFromA() {
    const v = parseInputRaw(aEl.value);
    if (v === null) {
      updating.add(bEl);
      bEl.value = '';
      if (formattedBEl) formattedBEl.textContent = '';
      updating.delete(bEl);
      announce('Cleared conversion');
      return;
    }
    const converted = toB(v);
    updating.add(bEl);
    bEl.value = formatNumberForInput(converted);
    if (formattedBEl) formattedBEl.textContent = new Intl.NumberFormat().format(converted);
    updating.delete(bEl);
    announce(`${aEl.id} -> ${bEl.id}: ${bEl.value}`);
  }

  function computeFromB() {
    const v = parseInputRaw(bEl.value);
    if (v === null) {
      updating.add(aEl);
      aEl.value = '';
      if (formattedAEl) formattedAEl.textContent = '';
      updating.delete(aEl);
      announce('Cleared conversion');
      return;
    }
    const converted = toA(v);
    updating.add(aEl);
    aEl.value = formatNumberForInput(converted);
    if (formattedAEl) formattedAEl.textContent = new Intl.NumberFormat().format(converted);
    updating.delete(aEl);
    announce(`${bEl.id} -> ${aEl.id}: ${aEl.value}`);
  }

  aEl.addEventListener('input', () => {
    if (updating.has(aEl)) return;
    computeFromA();
  });

  bEl.addEventListener('input', () => {
    if (updating.has(bEl)) return;
    // only compute from b if it is editable
    if (!bEl.readOnly) computeFromB();
  });
}

// Initialize converters by scanning the DOM
function getConversionFns(aId, bId) {
  // Temperature
  if ((aId === 'celsius' && bId === 'fahrenheit') || (aId === 'fahrenheit' && bId === 'celsius')) {
    return { toB: c => c * 9 / 5 + 32, toA: f => (f - 32) * 5 / 9 };
  }
  // Weight
  if ((aId === 'kilograms' && bId === 'pounds') || (aId === 'pounds' && bId === 'kilograms')) {
    return { toB: kg => kg * 2.20462, toA: lb => lb / 2.20462 };
  }
  // Distance
  if ((aId === 'kilometers' && bId === 'miles') || (aId === 'miles' && bId === 'kilometers')) {
    return { toB: km => km * 0.621371, toA: mi => mi / 0.621371 };
  }
  // Volume: liters <-> gallons (US)
  if ((aId === 'liters' && bId === 'gallons') || (aId === 'gallons' && bId === 'liters')) {
    return { toB: l => l * 0.264172052, toA: gal => gal / 0.264172052 };
  }
  // Default fallback (no-op)
  return { toB: x => x, toA: x => x };
}

function initConverters() {
  document.querySelectorAll('.converter').forEach(container => {
    const aId = container.dataset.a;
    const bId = container.dataset.b;
    const aEl = document.getElementById(aId);
    const bEl = document.getElementById(bId);
    const formattedBEl = document.getElementById('formatted-' + bId);
    const formattedAEl = document.getElementById('formatted-' + aId);
    const { toB, toA } = getConversionFns(aId, bId);

    if (!aEl || !bEl) return;

    setupConverter(aEl, bEl, toB, toA, formattedBEl, formattedAEl);

    // Swap handler
    const swapBtn = container.querySelector('.swap-btn');
    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        // swap readonly states
        aEl.readOnly = !aEl.readOnly;
        bEl.readOnly = !bEl.readOnly;
        // trigger recompute from the now-editable field
        if (!aEl.readOnly) {
          aEl.focus();
          aEl.dispatchEvent(new Event('input'));
        } else {
          bEl.focus();
          bEl.dispatchEvent(new Event('input'));
        }
      });
    }

    // Clear handler for this converter
    const clearBtn = container.querySelector('.clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        aEl.value = '';
        bEl.value = '';
        if (formattedAEl) formattedAEl.textContent = '';
        if (formattedBEl) formattedBEl.textContent = '';
        announce('Cleared converter');
      });
    }
  });

  // Global clear-all
  const clearAllBtn = document.getElementById('clear-all');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      document.querySelectorAll('.converter').forEach(container => {
        const aId = container.dataset.a;
        const bId = container.dataset.b;
        const aEl = document.getElementById(aId);
        const bEl = document.getElementById(bId);
        if (aEl) aEl.value = '';
        if (bEl) bEl.value = '';
        const formattedAEl = document.getElementById('formatted-' + aId);
        const formattedBEl = document.getElementById('formatted-' + bId);
        if (formattedAEl) formattedAEl.textContent = '';
        if (formattedBEl) formattedBEl.textContent = '';
      });
      announce('Cleared all converters');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initConverters);
} else {
  initConverters();
}

// Conversion rates reference
const conversionRates = {
  'celsius-fahrenheit': { from: 'Celsius', to: 'Fahrenheit', rate: c => c * 9 / 5 + 32, formula: '°C × 9/5 + 32' },
  'fahrenheit-celsius': { from: 'Fahrenheit', to: 'Celsius', rate: f => (f - 32) * 5 / 9, formula: '(°F - 32) × 5/9' },
  'kilograms-pounds': { from: 'Kilograms', to: 'Pounds', rate: kg => kg * 2.20462, formula: 'kg × 2.20462' },
  'pounds-kilograms': { from: 'Pounds', to: 'Kilograms', rate: lb => lb / 2.20462, formula: 'lb ÷ 2.20462' },
  'kilometers-miles': { from: 'Kilometers', to: 'Miles', rate: km => km * 0.621371, formula: 'km × 0.621371' },
  'miles-kilometers': { from: 'Miles', to: 'Kilometers', rate: mi => mi / 0.621371, formula: 'mi ÷ 0.621371' },
  'liters-gallons': { from: 'Liters', to: 'Gallons', rate: l => l * 0.264172052, formula: 'L × 0.264172052' },
  'gallons-liters': { from: 'Gallons', to: 'Liters', rate: gal => gal / 0.264172052, formula: 'gal ÷ 0.264172052' }
};

// Setup conversion rate dropdown
const dropdown = document.getElementById('conversion-rate-dropdown');
const rateDisplay = document.getElementById('conversion-rate-display');

if (dropdown) {
  dropdown.addEventListener('change', () => {
    const selected = dropdown.value;
    if (!selected || !conversionRates[selected]) {
      rateDisplay.innerHTML = '';
      return;
    }
    const data = conversionRates[selected];
    const conversion1 = data.rate(1);
    const displayRate = conversion1.toFixed(6).replace(/\.?0+$/, '');
    rateDisplay.innerHTML = `
      <div class="rate-info">
        <p><strong>1 ${data.from}</strong> = <strong>${displayRate} ${data.to}</strong></p>
        <p class="rate-formula">Formula: ${data.formula}</p>
      </div>
    `;
  });
}

// Copy button handlers
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const el = document.getElementById(targetId);
    if (!el || !el.value) return;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(el.value).then(() => {
        btn.textContent = 'Copied';
        setTimeout(() => btn.textContent = 'Copy', 1200);
      }).catch(() => {
        try {
          if (typeof el.select === 'function') el.select();
          document.execCommand('copy');
          btn.textContent = 'Copied';
          setTimeout(() => btn.textContent = 'Copy', 1200);
        } catch (e) {}
      });
    } else {
      try {
        if (typeof el.select === 'function') el.select();
        document.execCommand('copy');
        btn.textContent = 'Copied';
        setTimeout(() => btn.textContent = 'Copy', 1200);
      } catch (e) {}
    }
  });
});

