// Grab elements
const celsiusInput = document.getElementById("celsius");
const fahrenheitInput = document.getElementById("fahrenheit");

const kilogramsInput = document.getElementById("kilograms");
const poundsInput = document.getElementById("pounds");

const kilometersInput = document.getElementById("kilometers");
const milesInput = document.getElementById("miles");

// Helper: parse value or return null
function getNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

// === Temperature ===
celsiusInput.addEventListener("input", () => {
  const c = getNumber(celsiusInput.value);
  if (c === null) {
    fahrenheitInput.value = "";
    return;
  }
  const f = c * 9 / 5 + 32;
  fahrenheitInput.value = f.toFixed(2);
});

fahrenheitInput.addEventListener("input", () => {
  const f = getNumber(fahrenheitInput.value);
  if (f === null) {
    celsiusInput.value = "";
    return;
  }
  const c = (f - 32) * 5 / 9;
  celsiusInput.value = c.toFixed(2);
});

// === Weight ===
kilogramsInput.addEventListener("input", () => {
  const kg = getNumber(kilogramsInput.value);
  if (kg === null) {
    poundsInput.value = "";
    return;
  }
  const lb = kg * 2.20462;
  poundsInput.value = lb.toFixed(2);
});

poundsInput.addEventListener("input", () => {
  const lb = getNumber(poundsInput.value);
  if (lb === null) {
    kilogramsInput.value = "";
    return;
  }
  const kg = lb / 2.20462;
  kilogramsInput.value = kg.toFixed(2);
});

// === Distance ===
kilometersInput.addEventListener("input", () => {
  const km = getNumber(kilometersInput.value);
  if (km === null) {
    milesInput.value = "";
    return;
  }
  const mi = km * 0.621371;
  milesInput.value = mi.toFixed(2);
});

milesInput.addEventListener("input", () => {
  const mi = getNumber(milesInput.value);
  if (mi === null) {
    kilometersInput.value = "";
    return;
  }
  const km = mi / 0.621371;
  kilometersInput.value = km.toFixed(2);
});
