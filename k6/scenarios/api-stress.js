import http from 'k6/http';
import { check } from 'k6';
import { API_URL, HEADERS } from '../config.js';

const endpoints = [
  `${API_URL}/api/v1/public/products/`,
  `${API_URL}/api/v1/public/products/?page=2`,
  `${API_URL}/api/v1/public/products/brands/`,
  `${API_URL}/api/v1/public/promotions/`,
  `${API_URL}/api/v1/public/products/?search=iphone`,
  `${API_URL}/api/v1/public/products/?ordering=-created_at`,
  `${API_URL}/api/v1/public/products/?type=PH`,
  `${API_URL}/api/v1/public/products/?type=LT`,
  `${API_URL}/api/v1/public/products/?type=TB`,
  `${API_URL}/api/v1/public/products/?type=AC`,
  `${API_URL}/api/v1/public/reviews/`,
];

export default function () {
  const url = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(url, { headers: HEADERS });
  check(res, {
    'api 200': (r) => r.status === 200,
  });
}
