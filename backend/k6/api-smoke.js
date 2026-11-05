import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = (__ENV.BASE_URL || "http://127.0.0.1:5000").replace(/\/+$/, "");
const isLocalBaseUrl =
  /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(BASE_URL);

if (!isLocalBaseUrl) {
  throw new Error(
    "This test is limited to localhost. Set BASE_URL to localhost or 127.0.0.1.",
  );
}

export const options = {
  stages: [
    { duration: "10s", target: 1 },
    { duration: "10s", target: 3 },
    { duration: "10s", target: 5 },
    { duration: "5s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

export default function () {
  const healthResponse = http.get(`${BASE_URL}/health`, {
    tags: { endpoint: "health" },
  });

  check(healthResponse, {
    "health returns HTTP 200": (response) => response.status === 200,
    "health reports connected database": (response) => {
      try {
        const body = response.json();
        return body.status === "ok" && body.database === "connected";
      } catch {
        return false;
      }
    },
  });

  const productsResponse = http.get(`${BASE_URL}/api/products`, {
    tags: { endpoint: "products" },
  });

  check(productsResponse, {
    "products returns HTTP 200": (response) => response.status === 200,
    "products returns a non-empty array": (response) => {
      try {
        const body = response.json();
        return Array.isArray(body) && body.length > 0;
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
