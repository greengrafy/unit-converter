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

function setupConverter(aEl, bEl, toB, toA) {
  aEl.addEventListener('input', () => {
    if (updating.has(aEl)) return;
    const v = parseInputRaw(aEl.value);
    if (v === null) {
      updating.add(bEl);
      bEl.value = '';
      updating.delete(bEl);
      announce('Cleared conversion');
      return;
    }
    const converted = toB(v);
    updating.add(bEl);
    bEl.value = formatNumberForInput(converted);
    updating.delete(bEl);
    announce(`${aEl.id} -> ${bEl.id}: ${bEl.value}`);
  });

  bEl.addEventListener('input', () => {
    if (updating.has(bEl)) return;
    const v = parseInputRaw(bEl.value);
    if (v === null) {
      updating.add(aEl);
      aEl.value = '';
      updating.delete(aEl);
      announce('Cleared conversion');
      return;
    }
    const converted = toA(v);
    updating.add(aEl);
    aEl.value = formatNumberForInput(converted);
    updating.delete(aEl);
    announce(`${bEl.id} -> ${aEl.id}: ${aEl.value}`);
  });
}

// Grab elements
const celsiusInput = document.getElementById('celsius');
const fahrenheitInput = document.getElementById('fahrenheit');

const kilogramsInput = document.getElementById('kilograms');
const poundsInput = document.getElementById('pounds');

const kilometersInput = document.getElementById('kilometers');
const milesInput = document.getElementById('miles');

// Wire converters
setupConverter(celsiusInput, fahrenheitInput, c => c * 9 / 5 + 32, f => (f - 32) * 5 / 9);
setupConverter(kilogramsInput, poundsInput, kg => kg * 2.20462, lb => lb / 2.20462);
setupConverter(kilometersInput, milesInput, km => km * 0.621371, mi => mi / 0.621371);

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

