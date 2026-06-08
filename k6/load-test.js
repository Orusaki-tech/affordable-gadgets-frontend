import { browseHomepage, browseCategory, browseProductListing } from './scenarios/browse.js';
import { default as viewProductDetail } from './scenarios/product-detail.js';
import { default as cartCheckoutFlow } from './scenarios/cart-checkout.js';
import { default as apiStress } from './scenarios/api-stress.js';
import { THRESHOLDS } from './config.js';

export const options = {
  stages: [
    { duration: '5m', target: 800 },
    { duration: '20m', target: 2500 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    ...THRESHOLDS,
  },
};

const userScenarios = [
  { fn: browseHomepage, weight: 25 },
  { fn: browseCategory, weight: 20 },
  { fn: browseProductListing, weight: 15 },
  { fn: viewProductDetail, weight: 20 },
  { fn: cartCheckoutFlow, weight: 10 },
  { fn: apiStress, weight: 10 },
];

const totalWeight = userScenarios.reduce((s, sc) => s + sc.weight, 0);

export default function () {
  let r = Math.random() * totalWeight;
  for (const sc of userScenarios) {
    r -= sc.weight;
    if (r <= 0) {
      sc.fn();
      return;
    }
  }
  userScenarios[userScenarios.length - 1].fn();
}
