import http from 'k6/http';
import { check, sleep } from 'k6';
import { FRONTEND_URL, HEADERS, randomSleep } from '../config.js';

const categoryCodes = ['PH', 'LT', 'TB', 'AC'];
const sortOptions = ['', '&sort=price_asc', '&sort=price_desc', '&sort=newest'];

export function browseHomepage() {
  const res = http.get(`${FRONTEND_URL}/`, { headers: HEADERS });
  check(res, {
    'homepage status 200': (r) => r.status === 200,
    'homepage body ok': (r) => r.body.length > 100,
  });
  sleep(randomSleep(1, 3));
}

export function browseCategory() {
  const code = categoryCodes[Math.floor(Math.random() * categoryCodes.length)];
  const sort = Math.random() < 0.3 ? sortOptions[Math.floor(Math.random() * sortOptions.length)] : '';
  const page = Math.random() < 0.2 ? '&page=2' : '';

  const res = http.get(`${FRONTEND_URL}/products/?type=${code}${sort}${page}`, { headers: HEADERS });
  check(res, {
    'category listing status 200': (r) => r.status === 200,
  });
  sleep(randomSleep(2, 4));
}

export function browseProductListing() {
  const sort = sortOptions[Math.floor(Math.random() * sortOptions.length)];
  const res = http.get(`${FRONTEND_URL}/products/${sort}`, { headers: HEADERS });
  check(res, {
    'product listing status 200': (r) => r.status === 200,
  });
  sleep(randomSleep(1, 3));
}

export default function () {
  browseHomepage();
  if (Math.random() < 0.7) browseCategory();
  if (Math.random() < 0.5) browseProductListing();
}
