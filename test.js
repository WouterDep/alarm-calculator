const assert = require("assert");
const { calculate, getNextMorningDate } = require("./app.js");

const thursday = new Date(2026, 8, 17, 21, 0, 0);
const friday = getNextMorningDate(thursday);
assert.strictEqual(friday.getDay(), 5, "Thursday night plans Friday");

const fridayNight = new Date(2026, 8, 18, 21, 0, 0);
const monday = getNextMorningDate(fridayNight);
assert.strictEqual(monday.getDay(), 1, "weekend skips to Monday");

const settings = {
  scheduleType: "regular",
  schedules: {
    regular: { Monday: "09:00", Tuesday: "09:00", Wednesday: "09:00", Thursday: "09:00", Friday: "09:00" },
    vacation: { Monday: "09:30", Tuesday: "09:30", Wednesday: "09:30", Thursday: "09:30", Friday: "09:30" },
  },
  baselineDuration: 20,
  showerEnabled: true,
  showerDuration: 15,
  washingDuration: 10,
  shavingEnabled: false,
  shavingDuration: 5,
  breakfastEnabled: true,
  breakfastDuration: 20,
  transportMode: "ebike",
  durationEbike: 30,
  durationRacingBike: 25,
  durationCar: 35,
};

const showered = calculate(settings, thursday);
assert.strictEqual(showered.day, "Friday");
assert.strictEqual(showered.etaWork, "09:00");
assert.strictEqual(showered.hygiene, 15);
assert.strictEqual(showered.total, 85);
assert.strictEqual(showered.alarm, "07:35");

const washed = calculate({ ...settings, showerEnabled: false }, thursday);
assert.strictEqual(washed.hygiene, 10);
assert.strictEqual(washed.total, 80);
assert.strictEqual(washed.alarm, "07:40");

console.log("ok");
