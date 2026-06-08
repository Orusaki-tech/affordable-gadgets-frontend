import http from 'k6/http';
import { check } from 'k6';
import { API_URL, HEADERS, THRESHOLDS } from './config.js';

export const options = {
  stages: [
    { duration: '2m', target: 200 },
    { duration: '5m', target: 500 },
    { duration: '5m', target: 1000 },
    { duration: '10m', target: 1500 },
    { duration: '5m', target: 2000 },
    { duration: '3m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.02'],
  },
};

const endpoints = [
  `${API_URL}/api/v1/public/products/`,
  `${API_URL}/api/v1/public/products/?page=2`,
  `${API_URL}/api/v1/public/products/brands/`,
  `${API_URL}/api/v1/public/promotions/`,
  `${API_URL}/api/v1/public/products/?search=iphone`,
  `${API_URL}/api/v1/public/products/?type=PH`,
  `${API_URL}/api/v1/public/products/?type=LT`,
  `${API_URL}/api/v1/public/reviews/`,
];

export default function () {
  const url = endpoints[Math.floor(Math.random() * endpoints.length)];
  http.get(url, { headers: HEADERS });
}
