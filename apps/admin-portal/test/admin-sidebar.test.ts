import assert from "node:assert/strict"
import test from "node:test"
import { isAdminNavItemActive } from "../lib/navigation/admin-sidebar"

void test("dashboard nav only activates on the admin root", () => {
  assert.equal(isAdminNavItemActive("/admin", "/admin"), true)
  assert.equal(isAdminNavItemActive("/admin/products", "/admin"), false)
  assert.equal(isAdminNavItemActive("/admin/settings", "/admin"), false)
})

void test("section nav activates on exact section and nested pages", () => {
  assert.equal(isAdminNavItemActive("/admin/products", "/admin/products"), true)
  assert.equal(isAdminNavItemActive("/admin/products/123", "/admin/products"), true)
  assert.equal(isAdminNavItemActive("/admin/productivity", "/admin/products"), false)
})
