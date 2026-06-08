import http from 'k6/http';
import { check, sleep } from 'k6';
import { FRONTEND_URL, HEADERS, THRESHOLDS, randomSleep } from './config.js';

export const options = {
  stages: [
    { duration: '2m', target: 200 },
    { duration: '6m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: THRESHOLDS,
};

const categoryCodes = ['PH', 'LT', 'TB', 'AC'];

const productSlugs = [
  'iphone-15-pro-max',
  'samsung-galaxy-s24-ultra',
  'macbook-air-m3',
  'xiaomi-redmi-note-13-pro',
  'ipad-air-m2',
  'sony-wh-1000xm5',
  'google-pixel-8-pro',
  'hp-spectre-x360',
  'airpods-pro-2',
  'samsung-galaxy-tab-s9',
];

export default function () {
  const pageType = Math.random();

  if (pageType < 0.30) {
    const res = http.get(`${FRONTEND_URL}/`, { headers: HEADERS });
    check(res, { 'homepage 200': (r) => r.status === 200 });
    sleep(randomSleep(2, 5));

  } else if (pageType < 0.55) {
    const code = categoryCodes[Math.floor(Math.random() * categoryCodes.length)];
    const res = http.get(`${FRONTEND_URL}/products/?type=${code}`, { headers: HEADERS });
    check(res, { 'category 200': (r) => r.status === 200 });
    sleep(randomSleep(3, 6));

  } else if (pageType < 0.80) {
    const slug = productSlugs[Math.floor(Math.random() * productSlugs.length)];
    const res = http.get(`${FRONTEND_URL}/products/${slug}/`, { headers: HEADERS });
    check(res, { 'product detail 200': (r) => r.status === 200 });
    sleep(randomSleep(4, 8));

  } else {
    const res = http.get(`${FRONTEND_URL}/products/`, { headers: HEADERS });
    check(res, { 'product listing 200': (r) => r.status === 200 });
    sleep(randomSleep(2, 5));
  }
}
