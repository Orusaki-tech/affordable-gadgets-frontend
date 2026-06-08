import http from 'k6/http';
import { check, sleep } from 'k6';
import { FRONTEND_URL, API_URL, HEADERS, randomSleep } from '../config.js';

const inventoryUnitIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const quantities = [1, 1, 1, 2];

export function createCart() {
  const res = http.post(
    `${API_URL}/api/v1/public/cart/`,
    JSON.stringify({ session_key: `k6_loadtest_${__VU}_${Date.now()}` }),
    { headers: HEADERS }
  );
  check(res, {
    'create cart ok': (r) => r.status < 500,
  });
  return res;
}

export function addItemToCart(cartId) {
  const unitId = inventoryUnitIds[Math.floor(Math.random() * inventoryUnitIds.length)];
  const qty = quantities[Math.floor(Math.random() * quantities.length)];

  const res = http.post(
    `${API_URL}/api/v1/public/cart/${cartId}/items/`,
    JSON.stringify({ inventory_unit_id: unitId, quantity: qty }),
    { headers: HEADERS }
  );
  check(res, {
    'add item ok': (r) => r.status < 500,
  });
  return res;
}

export default function () {
  http.get(`${FRONTEND_URL}/`, { headers: HEADERS });
  sleep(randomSleep(1, 2));

  const cartRes = createCart();
  if (cartRes.status >= 400) return;

  let cartId;
  try {
    cartId = JSON.parse(cartRes.body).id;
  } catch (e) {
    return;
  }

  addItemToCart(cartId);
  sleep(randomSleep(1, 2));
}
