import {
	Counter,
	collectDefaultMetrics,
	Histogram,
	Registry,
} from "prom-client";

export const metricsRegistry = new Registry();

collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestCounter = new Counter({
	name: "http_requests_total",
	help: "Total number of HTTP requests",
	labelNames: ["method", "route", "status_code"],
	registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
	name: "http_request_duration_seconds",
	help: "Duration of HTTP requests in seconds",
	labelNames: ["method", "route", "status_code"],
	buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
	registers: [metricsRegistry],
});
