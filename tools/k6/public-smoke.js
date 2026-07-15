import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<500"],
  },
};

const baseUrl = __ENV.BASE_URL || "http://localhost:4000/api/v1";
const phone = __ENV.TEST_PROMOTION_PHONE || "0901234567";

export default function () {
  const products = http.get(`${baseUrl}/products`);
  check(products, {
    "products endpoint responds": (response) => response.status === 200,
  });

  const promotion = http.post(
    `${baseUrl}/promotions/check`,
    JSON.stringify({ phone }),
    { headers: { "content-type": "application/json" } },
  );
  check(promotion, {
    "promotion endpoint returns a decision": (response) => [200, 201, 429].includes(response.status),
  });

  sleep(1);
}
