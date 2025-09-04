// src/utils/irrigation.js

/** 安全夹取 */
const clamp = (v, min, max) => Math.min(Math.max(v ?? 0, min), max);

/**
 * 何时浇水（基于当天是否降雨/是否霜冻）
 */
export function whenToWaterToday({ rainMm = 0, meanTempC = 15 }) {
  if ((rainMm ?? 0) > 0.2) return "Right after rain";
  if ((meanTempC ?? 0) <= 1) return "Mid-morning (10–11 AM) to avoid ice damage";
  return "Before 9 AM (coolest time)";
}

/**
 * 日蒸发率（mm/day）
 * Evap = ((11.0236 * (T + 1.074) + 3 * (100 - RH)) / (80 - T))
 * 做合理夹取，避免异常值
 */
export function calcDailyEvaporation({ meanTempC, relHumidityPct }) {
  const T = clamp(meanTempC, -10, 45);         // 实际园艺范围
  const RH = clamp(relHumidityPct, 10, 100);
  const denom = Math.max(0.1, 80 - T);         // 防止除 0
  let evap = ((11.0236 * (T + 1.074)) + 3 * (100 - RH)) / denom;
  return clamp(evap, 0, 10);                   // 合理日蒸发 0~10 mm
}

/**
 * 蔬菜/小盆（每日）需水量（mm）
 * 3.5 + 0.8 * evap - rain
 */
export function calcAmountVegetablesDaily({ evapMm, rainMm }) {
  const mm = 3.5 + 0.8 * (evapMm ?? 0) - (rainMm ?? 0);
  return Math.max(0, mm);
}

/**
 * 宿根（壤/黏土，按周）需水量（mm）
 * 25 + 0.4 * weeklyEvap - weeklyRain
 * 返回 note：若沙土建议分两次
 */
export function calcAmountPerennialWeekly({ weeklyEvapMm, weeklyRainMm, soil = "loam" }) {
  const mm = 25 + 0.4 * (weeklyEvapMm ?? 0) - (weeklyRainMm ?? 0);
  const amount = Math.max(0, mm);
  const note = soil === "sand" && amount > 0
    ? "Sandy soil: split weekly watering into two sessions."
    : null;
  return { amountMm: amount, note };
}

/** 耐旱：仅干旱时浇水（这里按“周雨量 < 5mm”视为干旱） */
export function calcAmountLowWaterUse({ weeklyRainMm }) {
  return weeklyRainMm < 5 ? { amountMm: 10, note: "Low water use: water only in drought." } : { amountMm: 0 };
}

/**
 * 工具时长换算
 * - hoseLpm: L/min，若传则走“自定义 L/min”路线
 * - mmPerHour：用于滴灌/喷洒（如 15 或 40）
 */
export function secondsPerM2FromLpm(amountMm, hoseLpm = 12) {
  if (!hoseLpm || hoseLpm <= 0) return 0;
  return (amountMm / hoseLpm) * 60;
}
export function minutesFromMmPerHour(amountMm, mmPerHour) {
  if (!mmPerHour || mmPerHour <= 0) return 0;
  return (amountMm / mmPerHour) * 60;
}

/** 标准工具推荐时长 */
export function durationsForStandardTools(amountMm, { hoseLpm = 12 } = {}) {
  return {
    hose_or_can_seconds_per_m2: Math.round(secondsPerM2FromLpm(amountMm, hoseLpm)),
    drip_minutes: Math.round(minutesFromMmPerHour(amountMm, 15)),
    sprinkler_minutes: Math.round(minutesFromMmPerHour(amountMm, 40)),
  };
}

/** 桶法估流量（输入：桶体积 L、用时 秒），返回 L/min 与 L/h */
export function estimateFlowFromBucket({ liters, seconds }) {
  if (!liters || !seconds) return { lpm: 0, lph: 0 };
  const lps = liters / seconds;
  return { lpm: lps * 60, lph: lps * 3600 };
}

/**
 * 生成“今日浇灌”建议（对象 + 文本）
 * plantType: 'vegetables_pots' | 'perennial' | 'low_water_use'
 */
export function buildDailyIrrigationRecommendation({
  meanTempC, relHumidityPct, rainMm,
  soil = "loam", hoseLpm = 12, plantType = "vegetables_pots",
}) {
  const evap = calcDailyEvaporation({ meanTempC, relHumidityPct });
  const when = whenToWaterToday({ rainMm, meanTempC });

  let dailyAmountMm = 0;
  let dailyLines = [];

  if (plantType === "vegetables_pots") {
    dailyAmountMm = calcAmountVegetablesDaily({ evapMm: evap, rainMm });
    if (dailyAmountMm > 0) {
      const durs = durationsForStandardTools(dailyAmountMm, { hoseLpm });
      dailyLines.push(
        `Vegetables / Pots — Daily: ~${dailyAmountMm.toFixed(2)} mm`,
        `Hose/Can: ${durs.hose_or_can_seconds_per_m2}s per m² · Drip: ${durs.drip_minutes} min · Sprinkler: ${durs.sprinkler_minutes} min`
      );
    }
  } else if (plantType === "perennial") {
    // 按天仅给时段建议；用 buildWeeklyIrrigationRecommendation 产出具体周量
    dailyLines.push("Perennials are watered weekly; see weekly recommendation.");
  } else if (plantType === "low_water_use") {
    dailyLines.push("Low water use plants: water only in drought.");
  }

  // 基本提示
  const extraTips = [
    "Use 5–10 cm of mulch to reduce evaporation.",
    "Water soil around roots, not leaves.",
    "Water deeply and gently to avoid shallow roots and compaction.",
  ];

  return {
    whenToWater: when,
    evapMm: evap,
    dailyAmountMm,
    lines: [
      `When to water today: ${when}`,
      ...dailyLines,
      ...extraTips,
    ],
  };
}

/** 生成“本周浇灌”建议（基于 7 天数组 dailyList） */
export function buildWeeklyIrrigationRecommendation(dailyList, {
  soil = "loam", hoseLpm = 12
} = {}) {
  const days = (dailyList || []);
  const evapArr = days.map(d =>
    calcDailyEvaporation({
      meanTempC: d?.temp?.day ?? 0,
      relHumidityPct: d?.humidity ?? 60
    })
  );
  const weeklyEvap = evapArr.reduce((a, b) => a + b, 0);
  const weeklyRain = days.reduce((a, d) => a + (d?.rain ?? 0), 0);

  const { amountMm, note } = calcAmountPerennialWeekly({
    weeklyEvapMm: weeklyEvap,
    weeklyRainMm: weeklyRain,
    soil
  });

  const durs = durationsForStandardTools(amountMm, { hoseLpm });

  const lines = [];
  if (amountMm > 0) {
    lines.push(
      `Perennials — Weekly: ~${amountMm.toFixed(1)} mm (Evap ${weeklyEvap.toFixed(1)} mm · Rain ${weeklyRain.toFixed(1)} mm)`,
      `Hose/Can: ${durs.hose_or_can_seconds_per_m2}s per m² · Drip: ${durs.drip_minutes} min · Sprinkler: ${durs.sprinkler_minutes} min`
    );
    if (note) lines.push(note);
  } else {
    lines.push("Perennials — Weekly: No watering needed this week.");
  }

  return { weeklyAmountMm: amountMm, weeklyRainMm: weeklyRain, lines };
}
