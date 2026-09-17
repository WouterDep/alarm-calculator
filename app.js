const STORAGE_KEY = "alarm-calculator-settings-v3";
const LEGACY_STORAGE_KEYS = ["alarm-calculator-settings-v2", "alarm-calculator-settings-v1"];

const dayKeys = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const orderedDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const defaultRegularSchedule = Object.fromEntries(orderedDays.map((day) => [day, "09:00"]));
const defaultVacationSchedule = Object.fromEntries(orderedDays.map((day) => [day, "09:30"]));

const defaults = {
  targetDate: getTodayDateString(),
  scheduleType: "regular",
  schedules: {
    regular: defaultRegularSchedule,
    vacation: defaultVacationSchedule,
  },
  showerEnabled: true,
  showerDuration: 15,
  shavingEnabled: false,
  shavingDuration: 5,
  breakfastEnabled: true,
  breakfastDuration: 20,
  transportMode: "ebike",
  durationEbike: 30,
  durationRacingBike: 25,
  durationCar: 35,
};

const schoolHolidays = [
  { name: "Summer vacation", start: "2026-07-01", end: "2026-08-31" },
  { name: "Autumn vacation", start: "2026-11-02", end: "2026-11-08" },
  { name: "Armistice Day", start: "2026-11-11", end: "2026-11-11" },
  { name: "Christmas vacation", start: "2026-12-21", end: "2027-01-03" },
  { name: "Carnival vacation", start: "2027-02-08", end: "2027-02-14" },
  { name: "Easter vacation", start: "2027-03-29", end: "2027-04-11" },
  { name: "Labour Day", start: "2027-05-01", end: "2027-05-01" },
  { name: "Ascension break", start: "2027-05-06", end: "2027-05-07" },
  { name: "Whit Monday", start: "2027-05-17", end: "2027-05-17" },
  { name: "Summer vacation", start: "2027-07-01", end: "2027-08-31" },
  { name: "Autumn vacation", start: "2027-11-01", end: "2027-11-07" },
  { name: "Armistice Day", start: "2027-11-11", end: "2027-11-11" },
  { name: "Christmas vacation", start: "2027-12-27", end: "2028-01-09" },
  { name: "Carnival vacation", start: "2028-02-28", end: "2028-03-05" },
  { name: "Easter vacation", start: "2028-04-03", end: "2028-04-17" },
  { name: "Labour Day", start: "2028-05-01", end: "2028-05-01" },
  { name: "Ascension break", start: "2028-05-25", end: "2028-05-26" },
  { name: "Whit Monday", start: "2028-06-05", end: "2028-06-05" },
  { name: "Summer vacation", start: "2028-07-01", end: "2028-08-31" },
  { name: "Autumn vacation", start: "2028-10-30", end: "2028-11-05" },
  { name: "Armistice Day", start: "2028-11-11", end: "2028-11-11" },
  { name: "Christmas vacation", start: "2028-12-25", end: "2029-01-07" },
  { name: "Carnival vacation", start: "2029-02-12", end: "2029-02-18" },
  { name: "Easter vacation", start: "2029-04-02", end: "2029-04-15" },
  { name: "Labour Day", start: "2029-05-01", end: "2029-05-01" },
  { name: "Ascension break", start: "2029-05-10", end: "2029-05-11" },
  { name: "Whit Monday", start: "2029-05-21", end: "2029-05-21" },
  { name: "Summer vacation", start: "2029-07-01", end: "2029-08-31" },
  { name: "Autumn vacation", start: "2029-10-29", end: "2029-11-04" },
  { name: "Armistice Day", start: "2029-11-11", end: "2029-11-11" },
  { name: "Christmas vacation", start: "2029-12-24", end: "2030-01-06" },
  { name: "Carnival vacation", start: "2030-03-04", end: "2030-03-10" },
  { name: "Easter vacation", start: "2030-04-08", end: "2030-04-22" },
  { name: "Labour Day", start: "2030-05-01", end: "2030-05-01" },
  { name: "Ascension break", start: "2030-05-30", end: "2030-05-31" },
  { name: "Whit Monday", start: "2030-06-10", end: "2030-06-10" },
  { name: "Summer vacation", start: "2030-07-01", end: "2030-08-31" },
];

const form = document.querySelector("#plannerForm");
const alarmTime = document.querySelector("#alarmTime");
const summaryTitle = document.querySelector("#summaryTitle");
const summaryText = document.querySelector("#summaryText");
const copyButton = document.querySelector("#copyButton");
const holidayName = document.querySelector("#holidayName");

function getTodayDateString() {
  return formatDateInput(new Date());
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
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

function normalizeSettings(settings) {
  const legacyEta = settings.etaWork || defaults.schedules.regular.Monday;
  return {
    ...defaults,
    ...settings,
    targetDate: getTodayDateString(),
    scheduleType: settings.scheduleType || defaults.scheduleType,
    schedules: {
      regular: { ...defaultRegularSchedule, ...fillLegacySchedule(settings.schedules?.regular, legacyEta) },
      vacation: { ...defaultVacationSchedule, ...fillLegacySchedule(settings.schedules?.vacation, legacyEta) },
    },
  };
}

function fillLegacySchedule(schedule, fallbackEta) {
  if (schedule) return schedule;
  return Object.fromEntries(orderedDays.map((day) => [day, fallbackEta]));
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
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

function pluralize(value, unit) {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

function getNumber(formData, key) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function roundTimeToFiveMinutes(time) {
  const rounded = Math.round(toMinutes(time) / 5) * 5;
  return fromMinutes(rounded);
}

function getScheduleFromForm(formData, prefix) {
  return Object.fromEntries(
    orderedDays.map((day) => [day, roundTimeToFiveMinutes(formData.get(`${prefix}${day}`) || "09:00")]),
  );
}

function readSettings() {
  const formData = new FormData(form);
  return {
    targetDate: formData.get("targetDate") || defaults.targetDate,
    scheduleType: formData.get("scheduleType") || defaults.scheduleType,
    schedules: {
      regular: getScheduleFromForm(formData, "regular"),
      vacation: getScheduleFromForm(formData, "vacation"),
    },
    showerEnabled: formData.has("showerEnabled"),
    showerDuration: getNumber(formData, "showerDuration"),
    shavingEnabled: formData.has("shavingEnabled"),
    shavingDuration: getNumber(formData, "shavingDuration"),
    breakfastEnabled: formData.has("breakfastEnabled"),
    breakfastDuration: getNumber(formData, "breakfastDuration"),
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

    if (control instanceof RadioNodeList) {
      control.value = value;
    } else if (control.type === "checkbox") {
      control.checked = Boolean(value);
    } else {
      control.value = value;
    }
  }
}

function prefixSchedule(prefix, schedule) {
  return Object.fromEntries(Object.entries(schedule).map(([day, eta]) => [`${prefix}${day}`, eta]));
}

function getHolidayForDate(dateString) {
  return schoolHolidays.find((holiday) => dateString >= holiday.start && dateString <= holiday.end);
}

function getEtaForDate(settings) {
  const date = parseDateInput(settings.targetDate);
  const day = dayKeys[date.getDay()];
  const scheduleType = settings.scheduleType;
  return {
    day,
    scheduleType,
    etaWork: settings.schedules[scheduleType][day],
  };
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

function calculate(settings) {
  const holiday = getHolidayForDate(settings.targetDate);
  const eta = getEtaForDate(settings);
  const shower = settings.showerEnabled ? settings.showerDuration : 0;
  const shaving = settings.shavingEnabled ? settings.shavingDuration : 0;
  const breakfast = settings.breakfastEnabled ? settings.breakfastDuration : 0;
  const transport = getTransportDuration(settings);
  const total = shower + shaving + breakfast + transport;
  const alarm = fromMinutes(toMinutes(eta.etaWork) - total);

  return { alarm, total, shower, shaving, breakfast, transport, holiday, ...eta };
}

function render() {
  const settings = readSettings();
  const result = calculate(settings);
  const label = result.scheduleType === "vacation" ? "School vacation week" : "Regular week";
  const date = parseDateInput(settings.targetDate);
  const formattedDate = new Intl.DateTimeFormat("en-BE", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
  const parts = [
    pluralize(result.total, "minute"),
    `to arrive at ${result.etaWork}`,
    `using ${getTransportLabel(settings.transportMode)}`,
  ];

  alarmTime.textContent = result.alarm;
  summaryTitle.textContent = formattedDate;
  summaryText.textContent = `Wake up at ${result.alarm}: ${label.toLowerCase()}, ${parts.join(" ")}`;
  holidayName.textContent = result.holiday ? result.holiday.name : "No school holiday detected";
  copyButton.setAttribute("aria-label", `Copy alarm time ${result.alarm}`);
  snapTimeInputsToFiveMinutes();
  saveSettings(settings);
}

function snapTimeInputsToFiveMinutes() {
  form.querySelectorAll('input[type="time"]').forEach((input) => {
    const rounded = roundTimeToFiveMinutes(input.value || "09:00");
    if (input.value !== rounded) input.value = rounded;
  });
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

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}
