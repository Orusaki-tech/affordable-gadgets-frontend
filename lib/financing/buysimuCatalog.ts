/** BuySimu (409) iPhone financing catalog — deposit-led BNPL matching. */
export type BuysimuPlanTerm = 12 | 16 | 24;

export type BuysimuFinancingOffer = {
  id: string;
  model: string;
  specs: string;
  cashPrice: number;
  /** Standard deposit (~40% cash) for 12/16-week plans */
  deposit: number;
  weekly12: number | null;
  weekly16: number | null;
  /** Higher deposit option paired with 24-week plans when listed */
  deposit6: number | null;
  weekly24: number | null;
};

export const BUYSIMU_FINANCING_OFFERS: readonly BuysimuFinancingOffer[] = [
  {
    id: "iphone-11-64gb",
    model: "iPhone 11",
    specs: "64GB",
    cashPrice: 25000,
    deposit: 10000,
    weekly12: 1875,
    weekly16: 1500,
    deposit6: null,
    weekly24: null,
  },
  {
    id: "iphone-11-128gb",
    model: "iPhone 11",
    specs: "128GB",
    cashPrice: 28500,
    deposit: 11400,
    weekly12: 2138,
    weekly16: 1710,
    deposit6: null,
    weekly24: null,
  },
  {
    id: "iphone-11-256gb",
    model: "iPhone 11",
    specs: "256GB",
    cashPrice: 33000,
    deposit: 13200,
    weekly12: 2475,
    weekly16: 1980,
    deposit6: null,
    weekly24: null,
  },
  {
    id: "iphone-11-pro-256gb",
    model: "iPhone 11 Pro",
    specs: "256GB",
    cashPrice: 37000,
    deposit: 14800,
    weekly12: 2775,
    weekly16: 2220,
    deposit6: null,
    weekly24: null,
  },
  {
    id: "iphone-11-pro-max-256gb",
    model: "iPhone 11 Pro Max",
    specs: "256GB",
    cashPrice: 43000,
    deposit: 17200,
    weekly12: 3225,
    weekly16: 2580,
    deposit6: null,
    weekly24: null,
  },
  {
    id: "iphone-12-64gb",
    model: "iPhone 12",
    specs: "64GB",
    cashPrice: 30000,
    deposit: 12000,
    weekly12: 2400,
    weekly16: null,
    deposit6: 15000,
    weekly24: 1200,
  },
  {
    id: "iphone-12-128gb",
    model: "iPhone 12",
    specs: "128GB",
    cashPrice: 35000,
    deposit: 14000,
    weekly12: 2800,
    weekly16: null,
    deposit6: 17500,
    weekly24: 1400,
  },
  {
    id: "iphone-12-pro-128gb",
    model: "iPhone 12 Pro",
    specs: "128GB",
    cashPrice: 43000,
    deposit: 17200,
    weekly12: 3440,
    weekly16: null,
    deposit6: 21500,
    weekly24: 1720,
  },
  {
    id: "iphone-12-pro-256gb",
    model: "iPhone 12 Pro",
    specs: "256GB",
    cashPrice: 45000,
    deposit: 18000,
    weekly12: 3600,
    weekly16: null,
    deposit6: 22500,
    weekly24: 3420,
  },
  {
    id: "iphone-12-pro-max-128gb",
    model: "iPhone 12 Pro Max",
    specs: "128GB",
    cashPrice: 55000,
    deposit: 22000,
    weekly12: 4400,
    weekly16: null,
    deposit6: 27500,
    weekly24: 2200,
  },
  {
    id: "iphone-12-pro-max-256gb",
    model: "iPhone 12 Pro Max",
    specs: "256GB",
    cashPrice: 58000,
    deposit: 23200,
    weekly12: 4640,
    weekly16: null,
    deposit6: 29000,
    weekly24: 2320,
  },
  {
    id: "iphone-12-mini-64gb",
    model: "iPhone 12 mini",
    specs: "64GB",
    cashPrice: 26500,
    deposit: 10600,
    weekly12: 2120,
    weekly16: null,
    deposit6: 13250,
    weekly24: 1060,
  },
  {
    id: "iphone-12-mini-128gb",
    model: "iPhone 12 mini",
    specs: "128GB",
    cashPrice: 29500,
    deposit: 11800,
    weekly12: 2360,
    weekly16: null,
    deposit6: 14750,
    weekly24: 1180,
  },
  {
    id: "iphone-12-mini-256gb",
    model: "iPhone 12 mini",
    specs: "256GB",
    cashPrice: 33000,
    deposit: 13200,
    weekly12: 2640,
    weekly16: null,
    deposit6: 16500,
    weekly24: 1320,
  },
  {
    id: "iphone-13-128gb",
    model: "iPhone 13",
    specs: "128GB",
    cashPrice: 43000,
    deposit: 17200,
    weekly12: 3440,
    weekly16: null,
    deposit6: 21500,
    weekly24: 1720,
  },
  {
    id: "iphone-13-256gb",
    model: "iPhone 13",
    specs: "256GB",
    cashPrice: 48000,
    deposit: 19200,
    weekly12: 3840,
    weekly16: null,
    deposit6: 24000,
    weekly24: 1920,
  },
  {
    id: "iphone-13-pro-128gb",
    model: "iPhone 13 Pro",
    specs: "128GB",
    cashPrice: 53000,
    deposit: 21200,
    weekly12: 4240,
    weekly16: null,
    deposit6: 26500,
    weekly24: 2120,
  },
  {
    id: "iphone-13-pro-256gb",
    model: "iPhone 13 Pro",
    specs: "256GB",
    cashPrice: 58000,
    deposit: 23200,
    weekly12: 4640,
    weekly16: null,
    deposit6: 29000,
    weekly24: 2320,
  },
  {
    id: "iphone-13-pro-1tb-512gb",
    model: "iPhone 13 Pro",
    specs: "1TB &512GB",
    cashPrice: 75000,
    deposit: 30000,
    weekly12: 6000,
    weekly16: null,
    deposit6: 37500,
    weekly24: 3000,
  },
  {
    id: "iphone-13-pro-max-128gb",
    model: "iPhone 13 Pro Max",
    specs: "128GB",
    cashPrice: 59000,
    deposit: 23600,
    weekly12: 4720,
    weekly16: null,
    deposit6: 29500,
    weekly24: 2360,
  },
  {
    id: "iphone-13-pro-max-256gb",
    model: "iPhone 13 Pro Max",
    specs: "256GB",
    cashPrice: 65000,
    deposit: 26000,
    weekly12: 5200,
    weekly16: null,
    deposit6: 32500,
    weekly24: 2600,
  },
  {
    id: "iphone-13-pro-max-512gb",
    model: "iPhone 13 Pro Max",
    specs: "512GB",
    cashPrice: 120000,
    deposit: 48000,
    weekly12: 9600,
    weekly16: null,
    deposit6: 60000,
    weekly24: 4800,
  },
  {
    id: "iphone-13-mini-128gb",
    model: "iPhone 13 mini",
    specs: "128GB",
    cashPrice: 36500,
    deposit: 14600,
    weekly12: 2920,
    weekly16: null,
    deposit6: 18250,
    weekly24: 1460,
  },
  {
    id: "iphone-13-mini-256gb",
    model: "iPhone 13 mini",
    specs: "256GB",
    cashPrice: 38500,
    deposit: 15400,
    weekly12: 3080,
    weekly16: null,
    deposit6: 19250,
    weekly24: 1540,
  },
  {
    id: "iphone-14-128gb",
    model: "iPhone 14",
    specs: "128GB",
    cashPrice: 49500,
    deposit: 19800,
    weekly12: 3960,
    weekly16: null,
    deposit6: 24750,
    weekly24: 1980,
  },
  {
    id: "iphone-14-256gb",
    model: "iPhone 14",
    specs: "256GB",
    cashPrice: 65000,
    deposit: 26000,
    weekly12: 5200,
    weekly16: null,
    deposit6: 32500,
    weekly24: 2600,
  },
  {
    id: "iphone-14-pro-128gb",
    model: "iPhone 14 Pro",
    specs: "128GB",
    cashPrice: 65000,
    deposit: 26000,
    weekly12: 5200,
    weekly16: null,
    deposit6: 32500,
    weekly24: 2600,
  },
  {
    id: "iphone-14-pro-256gb",
    model: "iPhone 14 Pro",
    specs: "256GB",
    cashPrice: 68000,
    deposit: 27200,
    weekly12: 5440,
    weekly16: null,
    deposit6: 34000,
    weekly24: 2720,
  },
  {
    id: "iphone-14-pro-max-128gb",
    model: "iPhone 14 Pro Max",
    specs: "128GB",
    cashPrice: 70000,
    deposit: 28000,
    weekly12: 5600,
    weekly16: null,
    deposit6: 35000,
    weekly24: 2800,
  },
  {
    id: "iphone-14-pro-max-256gb",
    model: "iPhone 14 Pro Max",
    specs: "256GB",
    cashPrice: 75000,
    deposit: 30000,
    weekly12: 6000,
    weekly16: null,
    deposit6: 37500,
    weekly24: 3000,
  },
  {
    id: "iphone-15-128gb",
    model: "iPhone 15",
    specs: "128GB",
    cashPrice: 65000,
    deposit: 26000,
    weekly12: 5200,
    weekly16: null,
    deposit6: 32500,
    weekly24: 2600,
  },
  {
    id: "iphone-15-256gb",
    model: "iPhone 15",
    specs: "256GB",
    cashPrice: 90000,
    deposit: 36000,
    weekly12: 7200,
    weekly16: null,
    deposit6: 45000,
    weekly24: 3600,
  },
  {
    id: "iphone-15-plus-128gb",
    model: "iPhone 15 Plus",
    specs: "128GB",
    cashPrice: 65000,
    deposit: 26000,
    weekly12: null,
    weekly16: null,
    deposit6: 26000,
    weekly24: 2925,
  },
  {
    id: "iphone-15-plus-256gb",
    model: "iPhone 15 Plus",
    specs: "256GB",
    cashPrice: 90000,
    deposit: 36000,
    weekly12: null,
    weekly16: null,
    deposit6: 36000,
    weekly24: 4050,
  },
  {
    id: "iphone-15-pro-128gb",
    model: "iPhone 15 Pro",
    specs: "128GB",
    cashPrice: 80000,
    deposit: 32000,
    weekly12: 6400,
    weekly16: null,
    deposit6: 40000,
    weekly24: 3200,
  },
  {
    id: "iphone-15-pro-256gb",
    model: "iPhone 15 Pro",
    specs: "256GB",
    cashPrice: 85000,
    deposit: 34000,
    weekly12: 6800,
    weekly16: null,
    deposit6: 42500,
    weekly24: 3400,
  },
  {
    id: "iphone-15-pro-max-256gb",
    model: "iPhone 15 Pro Max",
    specs: "256GB",
    cashPrice: 100000,
    deposit: 40000,
    weekly12: 8000,
    weekly16: null,
    deposit6: 50000,
    weekly24: 4000,
  },
  {
    id: "iphone-15-pro-max-512gb",
    model: "iPhone 15 Pro Max",
    specs: "512GB",
    cashPrice: 108000,
    deposit: 43200,
    weekly12: 8640,
    weekly16: null,
    deposit6: 54000,
    weekly24: 4320,
  },
  {
    id: "iphone-16-128gb",
    model: "iPhone 16",
    specs: "128GB",
    cashPrice: 85000,
    deposit: 34000,
    weekly12: 6800,
    weekly16: null,
    deposit6: 42500,
    weekly24: 3400,
  },
  {
    id: "iphone-16-256gb",
    model: "iPhone 16",
    specs: "256GB",
    cashPrice: 96000,
    deposit: 38400,
    weekly12: 7680,
    weekly16: null,
    deposit6: 48000,
    weekly24: 3840,
  },
  {
    id: "iphone-16-pro-128gb",
    model: "iPhone 16 Pro",
    specs: "128GB",
    cashPrice: 105000,
    deposit: 42000,
    weekly12: 8400,
    weekly16: null,
    deposit6: 52500,
    weekly24: 4200,
  },
  {
    id: "iphone-16-pro-256gb",
    model: "iPhone 16 Pro",
    specs: "256GB",
    cashPrice: 110000,
    deposit: 44000,
    weekly12: 8800,
    weekly16: null,
    deposit6: 55000,
    weekly24: 4400,
  },
  {
    id: "iphone-16-pro-max-256gb",
    model: "iPhone 16 Pro Max",
    specs: "256GB",
    cashPrice: 115000,
    deposit: 46000,
    weekly12: 9200,
    weekly16: null,
    deposit6: 57500,
    weekly24: 4600,
  },
  {
    id: "iphone-16-pro-max-512gb",
    model: "iPhone 16 Pro Max",
    specs: "512GB",
    cashPrice: 140000,
    deposit: 56000,
    weekly12: null,
    weekly16: null,
    deposit6: 56000,
    weekly24: 6300,
  },
  {
    id: "iphone-16e-128gb",
    model: "iPhone 16e",
    specs: "128GB",
    cashPrice: 58000,
    deposit: 23200,
    weekly12: 4640,
    weekly16: null,
    deposit6: 29000,
    weekly24: 2320,
  },
] as const;

export function formatKes(amount: number): string {
  return `KSh ${Math.round(amount).toLocaleString('en-KE')}`;
}

export function weeklyForTerm(
  offer: BuysimuFinancingOffer,
  term: BuysimuPlanTerm
): number | null {
  if (term === 12) return offer.weekly12;
  if (term === 16) return offer.weekly16;
  return offer.weekly24;
}

export function depositForTerm(
  offer: BuysimuFinancingOffer,
  term: BuysimuPlanTerm
): number {
  if (term === 24 && offer.deposit6 != null) return offer.deposit6;
  return offer.deposit;
}

export function offerHasTerm(
  offer: BuysimuFinancingOffer,
  term: BuysimuPlanTerm
): boolean {
  const weekly = weeklyForTerm(offer, term);
  return weekly != null && weekly > 0 && depositForTerm(offer, term) > 0;
}

/** Phones whose required deposit fits within the budget. */
export function offerGenerationRank(model: string): number {
  const match = model.match(/iPhone\s+(\d+)/i);
  if (!match) return 0;
  return Number(match[1]) || 0;
}

export function findOffersForDeposit(
  budget: number,
  term: BuysimuPlanTerm = 12
): BuysimuFinancingOffer[] {
  const b = Math.max(0, budget);
  return BUYSIMU_FINANCING_OFFERS.filter((offer) => {
    if (!offerHasTerm(offer, term)) return false;
    return depositForTerm(offer, term) <= b;
  }).sort((a, bOffer) => {
    // Prefer newer generations first, then closest deposit to budget, then higher cash.
    const genDiff = offerGenerationRank(bOffer.model) - offerGenerationRank(a.model);
    if (genDiff !== 0) return genDiff;
    const da = Math.abs(depositForTerm(a, term) - b);
    const db = Math.abs(depositForTerm(bOffer, term) - b);
    if (da !== db) return da - db;
    return bOffer.cashPrice - a.cashPrice;
  });
}

export const BUYSIMU_DEPOSIT_MIN = Math.min(
  ...BUYSIMU_FINANCING_OFFERS.map((o) => o.deposit)
);
export const BUYSIMU_DEPOSIT_MAX = Math.max(
  ...BUYSIMU_FINANCING_OFFERS.map((o) => Math.max(o.deposit, o.deposit6 ?? 0))
);
