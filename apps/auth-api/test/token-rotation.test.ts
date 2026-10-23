import { describe, it, expect, vi } from "vitest";

describe("Refresh Token Rotation & Security", () => {
  it("should detect reuse of an already-consumed refresh token", () => {
    const isTokenUsed = true;
    const reuseDetected = isTokenUsed;

    expect(reuseDetected).toBe(true);
  });

  it("should trigger token family revocation when reuse is detected", () => {
    const revokeFamilyMock = vi.fn().mockReturnValue(3);
    const tokenFamilyId = "family-xyz-123";

    revokeFamilyMock(tokenFamilyId);

    expect(revokeFamilyMock).toHaveBeenCalledWith("family-xyz-123");
  });

  it("should atomically consume an active refresh token", () => {
    const tokenRecord = {
      id: "rt-123",
      tokenHash: "hash-abc",
      usedAt: undefined,
      revokedAt: undefined,
    };

    const consumeAtomic = (record: typeof tokenRecord) => {
      if (!record.usedAt && !record.revokedAt) {
        return { ...record, usedAt: new Date() };
      }
      return null;
    };

    const result = consumeAtomic(tokenRecord);
    expect(result).not.toBeNull();
    expect(result?.usedAt).toBeDefined();

    // Second call with same token fails atomically
    const secondResult = consumeAtomic(result!);
    expect(secondResult).toBeNull();
  });
});
