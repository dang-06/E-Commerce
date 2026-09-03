import { createHmac, randomInt } from "node:crypto";

export interface SpxSignedRequest {
  headers: Record<string, string>;
  payloadText: string;
  randomNum: number;
  timestamp: number;
}

export function generateSpxCheckSign(input: {
  appId: number;
  appSecret: string;
  payloadText: string;
  randomNum: number;
  timestamp: number;
}): string {
  const originalValue = [input.appId, input.timestamp, input.randomNum, input.payloadText].join("_");
  return createHmac("sha256", input.appSecret).update(originalValue).digest("hex");
}

export function createSpxSignedRequest(input: {
  appId: number;
  appSecret: string;
  payload: unknown;
}): SpxSignedRequest {
  const timestamp = Math.floor(Date.now() / 1000);
  const randomNum = randomInt(1, 2_147_483_647);
  const payloadText = JSON.stringify(input.payload);
  const checkSign = generateSpxCheckSign({
    appId: input.appId,
    appSecret: input.appSecret,
    payloadText,
    randomNum,
    timestamp,
  });
  return {
    headers: {
      "app-id": String(input.appId),
      "check-sign": checkSign,
      "content-type": "application/json",
      "random-num": String(randomNum),
      timestamp: String(timestamp),
    },
    payloadText,
    randomNum,
    timestamp,
  };
}
