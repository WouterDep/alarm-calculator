const STORAGE_KEY = "alarm-calculator-settings-v4";
const LEGACY_STORAGE_KEYS = [
  "alarm-calculator-settings-v3",
  "alarm-calculator-settings-v2",
  "alarm-calculator-settings-v1",
];

const dayKeys = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekdayKeys = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const defaultRegularSchedule = Object.fromEntries(weekdayKeys.map((day) => [day, "09:00"]));
const defaultVacationSchedule = Object.fromEntries(weekdayKeys.map((day) => [day, "09:30"]));

const defaults = {
  scheduleType: "regular",
  schedules: {
    regular: defaultRegularSchedule,
    vacation: defaultVacationSchedule,
  },
  baselineDuration: 20,
  showerEnabled: true,
  showerDuration: 15,
  washingDuration: 10,
  shavingEnabled: false,
  shavingDuration: 5,
  breakfastEnabled: true,
  breakfastDuration: 20,
  extraTimeEnabled: true,
  extraTimeDuration: 10,
  transportMode: "ebike",
  durationEbike: 30,
  durationRacingBike: 25,
  durationCar: 35,
};

function getNextMorningDate(now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  return date;
}

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(totalMinutes) {
  const day = 24 * 60;
  const wrapped = ((totalMinutes % day) + day) % day;
  const hours = Math.floor(wrapped / 60).toString().padStart(2, "0");
  const minutes = (wrapped % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getTransportDuration(settings) {
  if (settings.transportMode === "racingBike") return settings.durationRacingBike;
  if (settings.transportMode === "car") return settings.durationCar;
  return settings.durationEbike;
}

function getTransportLabel(mode) {
  if (mode === "racingBike") return "racing bike";
  if (mode === "car") return "car";
  return "e-bike";
}

function calculate(settings, now = new Date()) {
  const date = getNextMorningDate(now);
  const day = dayKeys[date.getDay()];
  const scheduleType = settings.scheduleType;
  const etaWork = settings.schedules[scheduleType][day];
  const hygiene = settings.showerEnabled ? settings.showerDuration : settings.washingDuration;
  const shaving = settings.shavingEnabled ? settings.shavingDuration : 0;
  const breakfast = settings.breakfastEnabled ? settings.breakfastDuration : 0;
  const extra = settings.extraTimeEnabled ? settings.extraTimeDuration : 0;
  const transport = getTransportDuration(settings);
  const total = settings.baselineDuration + hygiene + shaving + breakfast + extra + transport;
  const alarm = fromMinutes(toMinutes(etaWork) - total);

  return { alarm, total, hygiene, shaving, breakfast, extra, transport, day, scheduleType, etaWork, date };
}

function loadSettings() {
  const saved = readStoredSettings(STORAGE_KEY);
  if (saved) return normalizeSettings(saved);
  const legacy = LEGACY_STORAGE_KEYS.map(readStoredSettings).find(Boolean);
  return normalizeSettings(legacy || defaults);
}

function readStoredSettings(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function pickWeekdays(schedule, fallback) {
  return Object.fromEntries(weekdayKeys.map((day) => [day, schedule?.[day] || fallback]));
}

function normalizeSettings(settings) {
  const legacyEta = settings.etaWork || defaults.schedules.regular.Monday;
  return {
    ...defaults,
    ...settings,
    scheduleType: settings.scheduleType || defaults.scheduleType,
    schedules: {
      regular: { ...defaultRegularSchedule, ...pickWeekdays(settings.schedules?.regular, legacyEta) },
      vacation: { ...defaultVacationSchedule, ...pickWeekdays(settings.schedules?.vacation, legacyEta) },
    },
  };
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function getNumber(formData, key) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function roundTimeToFiveMinutes(time) {
  const rounded = Math.round(toMinutes(time || "09:00") / 5) * 5;
  return fromMinutes(rounded);
}

function getScheduleFromForm(formData, prefix) {
  return Object.fromEntries(
    weekdayKeys.map((day) => [day, roundTimeToFiveMinutes(formData.get(`${prefix}${day}`))]),
  );
}

function prefixSchedule(prefix, schedule) {
  return Object.fromEntries(Object.entries(schedule).map(([day, eta]) => [`${prefix}${day}`, eta]));
}

function boot() {
  const form = document.querySelector("#plannerForm");
  const alarmTime = document.querySelector("#alarmTime");
  const summaryText = document.querySelector("#summaryText");
  const copyButton = document.querySelector("#copyButton");
  const settingsButton = document.querySelector("#settingsButton");
  const scheduleDialog = document.querySelector("#scheduleDialog");
  const closeSettings = document.querySelector("#closeSettings");

  function readSettings() {
    const formData = new FormData(form);
    return {
      scheduleType: formData.get("scheduleType") || defaults.scheduleType,
      schedules: {
        regular: getScheduleFromForm(formData, "regular"),
        vacation: getScheduleFromForm(formData, "vacation"),
      },
      baselineDuration: getNumber(formData, "baselineDuration"),
      showerEnabled: formData.has("showerEnabled"),
      showerDuration: getNumber(formData, "showerDuration"),
      washingDuration: getNumber(formData, "washingDuration"),
      shavingEnabled: formData.has("shavingEnabled"),
      shavingDuration: getNumber(formData, "shavingDuration"),
      breakfastEnabled: formData.has("breakfastEnabled"),
      breakfastDuration: getNumber(formData, "breakfastDuration"),
      extraTimeEnabled: formData.has("extraTimeEnabled"),
      extraTimeDuration: getNumber(formData, "extraTimeDuration"),
      transportMode: formData.get("transportMode") || defaults.transportMode,
      durationEbike: getNumber(formData, "durationEbike"),
      durationRacingBike: getNumber(formData, "durationRacingBike"),
      durationCar: getNumber(formData, "durationCar"),
    };
  }

  function applySettings(settings) {
    const flatSettings = {
      ...settings,
      ...prefixSchedule("regular", settings.schedules.regular),
      ...prefixSchedule("vacation", settings.schedules.vacation),
    };

    for (const [key, value] of Object.entries(flatSettings)) {
      const control = form.elements[key];
      if (!control) continue;
      if (control instanceof RadioNodeList) control.value = value;
      else if (control.type === "checkbox") control.checked = Boolean(value);
      else control.value = value;
    }
  }

  function render() {
    const settings = readSettings();
    const result = calculate(settings);
    const weekday = new Intl.DateTimeFormat("en-BE", { weekday: "long" }).format(result.date);
    summaryText.textContent = `${weekday} · ${result.etaWork} · ${result.total}m · ${getTransportLabel(settings.transportMode)}`;
    alarmTime.textContent = result.alarm;
    copyButton.setAttribute("aria-label", `Copy alarm time ${result.alarm}`);
    form.querySelectorAll('input[type="time"]').forEach((input) => {
      const rounded = roundTimeToFiveMinutes(input.value);
      if (input.value !== rounded) input.value = rounded;
    });
    saveSettings(settings);
  }

  async function copyAlarmTime() {
    const text = alarmTime.textContent;
    try {
      await navigator.clipboard.writeText(text);
      copyButton.classList.add("copied");
      window.setTimeout(() => copyButton.classList.remove("copied"), 900);
    } catch {
      summaryText.textContent = `Alarm time: ${text}`;
    }
  }

  applySettings(loadSettings());
  render();
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  copyButton.addEventListener("click", copyAlarmTime);
  settingsButton.addEventListener("click", () => scheduleDialog.showModal());
  closeSettings.addEventListener("click", () => scheduleDialog.close());

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js");
    });
  }
}

if (typeof document !== "undefined") boot();

if (typeof module !== "undefined") {
  module.exports = { calculate, getNextMorningDate };
}
