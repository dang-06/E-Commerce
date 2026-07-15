import assert from "node:assert/strict";
import test from "node:test";
import { databasePackageName } from "./index.js";

void test("exports the database package identity", () => {
  assert.equal(databasePackageName, "@ecommerce/database");
});
