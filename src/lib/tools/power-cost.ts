// 家裡電腦架站的電費（TODO J11，2026-11-25）。瀏覽器端算。
// 電價不寫死：台電是累進費率、夏月非夏月不同，最準的是「自己帳單的總金額 ÷ 用電度數」，所以讓使用者自己填。

export function powerCost(avgWatts: number, hoursPerDay: number, pricePerKwh: number) {
  if (!(avgWatts > 0) || !(hoursPerDay > 0) || !(pricePerKwh > 0)) return null;
  const kwhPerMonth = (avgWatts * hoursPerDay * 30) / 1000;
  const perMonth = kwhPerMonth * pricePerKwh;
  return { kwhPerMonth, kwhPerYear: kwhPerMonth * 12, perMonth, perYear: perMonth * 12 };
}

/** 幾個月後自己架比租 VPS 划算（硬體已經有的話是 0；電費比月租還貴就回 null） */
export function breakEvenMonths(hardwareCost: number, powerPerMonth: number, vpsPerMonth: number): number | null {
  const saving = vpsPerMonth - powerPerMonth;
  if (saving <= 0) return null;
  return Math.ceil(Math.max(0, hardwareCost) / saving);
}
