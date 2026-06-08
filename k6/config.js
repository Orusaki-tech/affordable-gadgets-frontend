export const FRONTEND_URL = __ENV.FRONTEND_URL || 'https://affordable-gadgetske.com';
export const API_URL = __ENV.API_URL || 'https://api.affordable-gadgetske.com';
export const PROMETHEUS_URL = __ENV.PROMETHEUS_URL || 'http://34.24.222.153:9090/api/v1/write';
export const K6_PROMETHEUS_OUT = __ENV.K6_PROMETHEUS_OUT || 'experimental-prometheus-rw';

export const THRESHOLDS = {
  http_req_duration: ['p(95)<2000'],
  http_req_failed: ['rate<0.01'],
};

export const HEADERS = {
  'Content-Type': 'application/json',
  'X-Brand-Code': 'AFFORDABLE_GADGETS',
};

export function randomSleep(min = 1, max = 4) {
  const ms = (Math.random() * (max - min) + min) * 1000;
  return ms;
}
