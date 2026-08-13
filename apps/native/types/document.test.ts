import { describe, expect, test } from "bun:test";

import { getDocumentKindDefinition, normalizeDocumentKind } from "@/types/document";

describe("persisted document kinds", () => {
  test("preserves known kinds", () => {
    expect(normalizeDocumentKind("identity")).toBe("identity");
  });

  test("maps unknown legacy kinds to a safe fallback", () => {
    expect(normalizeDocumentKind("insurance")).toBe("other");
    expect(getDocumentKindDefinition("insurance").label).toBe("Other");
  });
});
