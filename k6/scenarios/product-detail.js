import http from 'k6/http';
import { check, sleep } from 'k6';
import { FRONTEND_URL, HEADERS, randomSleep } from '../config.js';

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
  const slug = productSlugs[Math.floor(Math.random() * productSlugs.length)];
  const res = http.get(`${FRONTEND_URL}/products/${slug}/`, { headers: HEADERS });
  check(res, {
    'product detail status 200': (r) => r.status === 200,
    'product detail body': (r) => r.body.length > 500,
  });
  sleep(randomSleep(3, 6));
}
