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
      const wasAReadOnly = aEl.readOnly;
      // swap readonly states
      aEl.readOnly = !aEl.readOnly;
      bEl.readOnly = !bEl.readOnly;
      // swap values so the editable field keeps current numeric value, and recompute
      if (!aEl.readOnly) {
        // now aEl editable — compute from a
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

// Copy button handlers
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const el = document.getElementById(targetId);
    if (!el || !el.value) return;
    navigator.clipboard?.writeText(el.value).then(() => {
      btn.textContent = 'Copied';
      setTimeout(() => btn.textContent = 'Copy', 1200);
    }).catch(() => {
      // Fallback: select + execCopy
      el.select?.();
      try { document.execCommand('copy'); btn.textContent = 'Copied'; setTimeout(() => btn.textContent = 'Copy', 1200); } catch (e) {}
    });
  });
});

