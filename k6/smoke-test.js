import { browseHomepage } from './scenarios/browse.js';
import { PROMETHEUS_URL, THRESHOLDS } from './config.js';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: THRESHOLDS,
};

export default function () {
  browseHomepage();
}
