import assert from "node:assert/strict";
import test from "node:test";
import { generateSpxCheckSign } from "./spx-signature.js";

void test("generates SPX check-sign using the documented HMAC-SHA256 vector", () => {
  const payloadText =
    '{"user_id":239404781503925,"user_secret":"85f0d570-a265-4d9d-857e-b30aa57c4fbe","service_type":1}';

  const checkSign = generateSpxCheckSign({
    appId: 100000,
    appSecret: "H25HY53GO4BA2GQ",
    payloadText,
    randomNum: 926611981,
    timestamp: 1677918414,
  });

  assert.equal(checkSign, "97e21b23940e4ddc96fb4d2474f02425353d2b0e23aee384f3f94c3d0b9ba17d");
});
