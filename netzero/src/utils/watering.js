// utils/watering.js
// Compute irrigation recommendations (daily and weekly), for table display of watering durations.
// Covers all the rules and unit conversions you provided.

/** Default parameters (can be overridden) */
export const DEFAULTS = {
  hoseLpm: 12,           // Garden hose/watering can: 12 L/min
  dripRate: 15,          // Drip/rotary irrigation: 15 mm/hour
  sprayRate: 40,         // Spray/sprinkler: 40 mm/hour
  soil: "loam",          // Typical soil in Victoria; sandy soil will trigger split watering note
};

/** Safe number conversion */
const n = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

/**
 * Convert mm water need into durations for 3 watering tools
 * 1 mm = 1 L/m²; thus mm maps directly to litres for 1 m²
 */
export function durationsForStandardTools(amountMm, cfg = DEFAULTS) {
  const mm = Math.max(0, n(amountMm));
  if (mm <= 0) {
    return { hoseSecPerM2: 0, dripMin: 0, sprayMin: 0 };
  }
  const hoseSecPerM2 = (mm / n(cfg.hoseLpm, DEFAULTS.hoseLpm)) * 60;
  const dripMin = (mm / n(cfg.dripRate, DEFAULTS.dripRate)) * 60;
  const sprayMin = (mm / n(cfg.sprayRate, DEFAULTS.sprayRate)) * 60;
  return { hoseSecPerM2, dripMin, sprayMin };
}

/** Format output for display */
const fmtSecPerM2 = (sec) => `${Math.round(Math.max(0, sec))} seconds\nper metre\u00B2`;
const fmtMin = (min) => `${Math.round(Math.max(0, min))} minutes`;

/**
 * Daily evaporation (mm/day)
 * = ((11.0236 * (T + 1.074) + 3 * (100 - RH)) / (80 - T))
 * Applies to RH >= 50%. Capped T < 80 to avoid zero division.
 */
export function calcDailyEvaporation(meanTempC, relHumidityPct) {
  let T = n(meanTempC, 0);
  let RH = Math.min(100, Math.max(0, n(relHumidityPct, 60)));
  T = Math.min(79.9, T); // Avoid divide-by-zero
  const evap = ((11.0236 * (T + 1.074)) + 3 * (100 - RH)) / (80 - T);
  return Math.max(0, evap);
}

/** Determine best time to water today */
export function whenToWaterToday({ meanTempC, rainMm }) {
  const t = n(meanTempC, 0);
  const r = n(rainMm, 0);
  if (r > 0.1) return "Right after rain";
  if (t <= 1) return "Mid-morning (10–11 AM)";
  return "Before 9 AM";
}

/** Daily watering for vegetables/pots
 * = 3.5 + evaporation * 0.8 − rain
 */
export function calcAmountVegetablesDaily(evapMm, rainMm) {
  const amt = 3.5 + n(evapMm, 0) * 0.8 - n(rainMm, 0);
  return Math.max(0, amt);
}

/** Weekly watering for perennials
 * = 25 + weeklyEvap * 0.4 − weeklyRain
 */
export function calcAmountPerennialWeekly(weeklyEvapMm, weeklyRainMm) {
  const amt = 25 + n(weeklyEvapMm, 0) * 0.4 - n(weeklyRainMm, 0);
  return Math.max(0, amt);
}

/** Drought rule for low water use plants */
export function calcAmountLowWaterUse(weeklyEvapMm, weeklyRainMm) {
  const evap = n(weeklyEvapMm, 0);
  const rain = n(weeklyRainMm, 0);
  const drought = rain < 5 && evap > 20;
  return {
    drought,
    note: drought
      ? "Low water use plants: water only in drought (deep soak, then allow soil to dry)."
      : "Low water use plants: no watering in a normal week.",
  };
}

/** Table row for daily irrigation (vegetables/pots) */
export function buildDailyIrrigationRecommendation({
  meanTempC,
  relHumidityPct,
  rainMm,
  hoseLpm = DEFAULTS.hoseLpm,
  dripRate = DEFAULTS.dripRate,
  sprayRate = DEFAULTS.sprayRate,
}) {
  const evap = calcDailyEvaporation(meanTempC, relHumidityPct);
  const amount = calcAmountVegetablesDaily(evap, rainMm);
  const durs = durationsForStandardTools(amount, { hoseLpm, dripRate, sprayRate });
  const when = whenToWaterToday({ meanTempC, rainMm });

  return {
    when,
    plant: "Vegetables / Pots",
    howOften: "Daily",
    amountMm: amount,
    cells: {
      hose: amount > 0 ? fmtSecPerM2(durs.hoseSecPerM2) : "—",
      drip: amount > 0 ? fmtMin(durs.dripMin) : "—",
      spray: amount > 0 ? fmtMin(durs.sprayMin) : "—",
    },
    lines: amount > 0
      ? [
          `Vegetables/pots need ~${amount.toFixed(2)} mm today.`,
          `Garden hose/watering can: ${fmtSecPerM2(durs.hoseSecPerM2).replace("\n", " ")}`,
          `Drip/rotary: ${fmtMin(durs.dripMin)}`,
          `Spray/sprinkler: ${fmtMin(durs.sprayMin)}`,
        ]
      : ["No watering needed for vegetables/pots today."],
  };
}

/** Table row for weekly irrigation (perennials) */
export function buildWeeklyIrrigationRecommendation(
  next7,
  {
    hoseLpm = DEFAULTS.hoseLpm,
    dripRate = DEFAULTS.dripRate,
    sprayRate = DEFAULTS.sprayRate,
    soil = DEFAULTS.soil,
  } = {}
) {
  const days = Array.isArray(next7) ? next7.slice(0, 7) : [];
  const evapList = days.map((d) =>
    calcDailyEvaporation(n(d?.temp?.day), n(d?.humidity, 60))
  );
  const weeklyEvap = evapList.reduce((a, b) => a + b, 0);
  const weeklyRain = days.reduce((a, d) => a + n(d?.rain, 0), 0);

  const amount = calcAmountPerennialWeekly(weeklyEvap, weeklyRain);
  const durs = durationsForStandardTools(amount, { hoseLpm, dripRate, sprayRate });

  const lowUse = calcAmountLowWaterUse(weeklyEvap, weeklyRain);

  const noteSandy =
    soil === "sandy"
      ? "Note: if your soil is sandy, split the weekly perennial watering to twice a week."
      : "Note: if your soil is sandy, split the weekly perennial watering to twice a week.";

  const lines = amount > 0
    ? [
        `Perennials need ~${amount.toFixed(2)} mm this week.`,
        `Garden hose/watering can: ${fmtSecPerM2(durs.hoseSecPerM2).replace("\n", " ")}`,
        `Drip/rotary: ${fmtMin(durs.dripMin)}`,
        `Spray/sprinkler: ${fmtMin(durs.sprayMin)}`,
        noteSandy,
        lowUse.note,
      ]
    : [
        "Perennials: no weekly watering required.",
        noteSandy,
        lowUse.note,
      ];

  return {
    plant: "Perennial",
    howOften: "Weekly",
    amountMm: amount,
    cells: {
      hose: amount > 0 ? fmtSecPerM2(durs.hoseSecPerM2) : "—",
      drip: amount > 0 ? fmtMin(durs.dripMin) : "—",
      spray: amount > 0 ? fmtMin(durs.sprayMin) : "—",
    },
    lines,
    lowWaterUse: lowUse,
  };
}

/** Generate full table: both rows + notes */
export function buildWateringTable(todayDaily, next7, opts = {}) {
  const dayRow = buildDailyIrrigationRecommendation({
    meanTempC: n(todayDaily?.temp?.day, 0),
    relHumidityPct: n(todayDaily?.humidity, 60),
    rainMm: n(todayDaily?.rain, 0),
    hoseLpm: opts.hoseLpm ?? DEFAULTS.hoseLpm,
    dripRate: opts.dripRate ?? DEFAULTS.dripRate,
    sprayRate: opts.sprayRate ?? DEFAULTS.sprayRate,
  });

  const weekRow = buildWeeklyIrrigationRecommendation(next7, {
    hoseLpm: opts.hoseLpm ?? DEFAULTS.hoseLpm,
    dripRate: opts.dripRate ?? DEFAULTS.dripRate,
    sprayRate: opts.sprayRate ?? DEFAULTS.sprayRate,
    soil: opts.soil ?? DEFAULTS.soil,
  });

  const extraTips = [
    "Use 5–10 cm of mulch (retain moisture, suppress weeds, improve soil).",
    "Water the soil around the roots, not the leaves (reduce fungus in winter / leaf burn in summer).",
    "Water deeply and gently at an even pace (prevent shallow roots and soil compaction).",
  ];

  return {
    whenToWaterToday: dayRow.when,
    rows: [
      {
        plant: dayRow.plant,
        howOften: dayRow.howOften,
        hose: dayRow.cells.hose,
        drip: dayRow.cells.drip,
        spray: dayRow.cells.spray,
      },
      {
        plant: weekRow.plant,
        howOften: weekRow.howOften,
        hose: weekRow.cells.hose,
        drip: weekRow.cells.drip,
        spray: weekRow.cells.spray,
      },
    ],
    notes: [
      ...(todayDaily?.soil === "sandy" || opts.soil === "sandy"
        ? ["If your soil is sandy, split the weekly perennial watering into two sessions."]
        : ["If your soil is sandy, split the weekly perennial watering into two sessions."]),
      weekRow.lowWaterUse?.note,
      ...extraTips,
    ],
  };
}
