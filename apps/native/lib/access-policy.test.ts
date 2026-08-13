import { describe, expect, test } from "bun:test";

import { FREE_DOCUMENT_LIMIT, canAddDocument } from "@/lib/access-policy";

describe("document access policy", () => {
  test("allows ten free documents and rejects the eleventh", () => {
    expect(FREE_DOCUMENT_LIMIT).toBe(10);
    expect(canAddDocument(9, false)).toBe(true);
    expect(canAddDocument(10, false)).toBe(false);
  });

  test("does not limit Pro document count", () => {
    expect(canAddDocument(10_000, true)).toBe(true);
  });
});
