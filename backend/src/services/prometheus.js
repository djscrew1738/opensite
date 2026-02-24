// services/prometheus.js
// Exposes metrics for Prometheus scraping

import client from 'prom-client';

export function initializeMetrics() {
  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics({ timeout: 5000 });

  new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 1.5, 2, 5],
  });
}

export function recordRequest(req, res, time) {
  const route = req.route ? req.route.path : req.path;
  const status = res.statusCode;
  const method = req.method;

  client.register.getSingleMetric('http_requests_total').inc({
    method,
    route,
    status_code: status,
  });

  client.register.getSingleMetric('http_request_duration_seconds').observe(
    {
      method,
      route,
      status_code: status,
    },
    time / 1000
  );
}

export async function getMetrics(req, res) {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
}
