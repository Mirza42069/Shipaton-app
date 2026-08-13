import { describe, expect, test } from "bun:test";

import {
  LIFETIME_PACKAGE_ID,
  LIFETIME_PRODUCT_ID,
  PRO_OFFERING_ID,
  isLifetimeProPackage,
} from "@/lib/pro-product";

function packageCandidate(overrides: Partial<Parameters<typeof isLifetimeProPackage>[0]> = {}) {
  return {
    identifier: LIFETIME_PACKAGE_ID,
    packageType: "LIFETIME",
    offeringIdentifier: PRO_OFFERING_ID,
    product: { identifier: LIFETIME_PRODUCT_ID },
    ...overrides,
  };
}

describe("Berkas Pro offering", () => {
  test("accepts only the lifetime package for the configured Play product", () => {
    expect(isLifetimeProPackage(packageCandidate())).toBe(true);
    expect(isLifetimeProPackage(packageCandidate({
      product: { identifier: `${LIFETIME_PRODUCT_ID}:buy` },
    }))).toBe(true);
  });

  test("rejects the legacy monthly subscription and unrelated products", () => {
    expect(isLifetimeProPackage(packageCandidate({
      packageType: "MONTHLY",
      product: { identifier: "berkas_pro_monthly" },
    }))).toBe(false);
    expect(isLifetimeProPackage(packageCandidate({
      product: { identifier: "another_lifetime_product" },
    }))).toBe(false);
  });

  test("rejects the wrong RevenueCat offering or package", () => {
    expect(isLifetimeProPackage(packageCandidate({ offeringIdentifier: "experiment" }))).toBe(false);
    expect(isLifetimeProPackage(packageCandidate({ identifier: "lifetime-custom" }))).toBe(false);
  });
});
