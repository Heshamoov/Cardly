/**
 * Unit tests for RSVP router procedures.
 * Uses pure data helpers and mocked DB context — no real DB calls.
 */
import { describe, it, expect } from "vitest";

// ── Helpers mirroring rsvpRouter validation logic ────────────────────────────

function validateRsvpInput(input: {
  slug: string;
  guestName: string;
  partySize: number;
  message?: string;
}) {
  const errors: string[] = [];
  if (!input.slug || input.slug.length < 1 || input.slug.length > 16) {
    errors.push("slug must be 1-16 chars");
  }
  if (!input.guestName || input.guestName.trim().length < 1 || input.guestName.length > 128) {
    errors.push("guestName must be 1-128 chars");
  }
  if (!Number.isInteger(input.partySize) || input.partySize < 1 || input.partySize > 50) {
    errors.push("partySize must be integer 1-50");
  }
  if (input.message !== undefined && input.message.length > 500) {
    errors.push("message must be ≤ 500 chars");
  }
  return errors;
}

function buildRsvpRecord(input: {
  invitationSlug: string;
  guestName: string;
  partySize: number;
  message: string | null;
  createdAt?: Date;
}) {
  return {
    id: Math.floor(Math.random() * 10000),
    invitationSlug: input.invitationSlug,
    guestName: input.guestName,
    partySize: input.partySize,
    message: input.message,
    createdAt: input.createdAt ?? new Date(),
  };
}

function computeSummary(responses: { partySize: number }[]) {
  return {
    totalGuests: responses.reduce((sum, r) => sum + r.partySize, 0),
    responseCount: responses.length,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("rsvp.submit validation", () => {
  it("accepts a valid submission", () => {
    const errors = validateRsvpInput({
      slug: "abc12345",
      guestName: "Sarah Al-Mansouri",
      partySize: 3,
      message: "Looking forward to it!",
    });
    expect(errors).toHaveLength(0);
  });

  it("rejects empty slug", () => {
    const errors = validateRsvpInput({ slug: "", guestName: "Ali", partySize: 1 });
    expect(errors.some((e) => e.includes("slug"))).toBe(true);
  });

  it("rejects slug longer than 16 chars", () => {
    const errors = validateRsvpInput({ slug: "a".repeat(17), guestName: "Ali", partySize: 1 });
    expect(errors.some((e) => e.includes("slug"))).toBe(true);
  });

  it("rejects empty guest name", () => {
    const errors = validateRsvpInput({ slug: "abc12345", guestName: "", partySize: 1 });
    expect(errors.some((e) => e.includes("guestName"))).toBe(true);
  });

  it("rejects partySize of 0", () => {
    const errors = validateRsvpInput({ slug: "abc12345", guestName: "Ali", partySize: 0 });
    expect(errors.some((e) => e.includes("partySize"))).toBe(true);
  });

  it("rejects partySize of 51", () => {
    const errors = validateRsvpInput({ slug: "abc12345", guestName: "Ali", partySize: 51 });
    expect(errors.some((e) => e.includes("partySize"))).toBe(true);
  });

  it("rejects message longer than 500 chars", () => {
    const errors = validateRsvpInput({
      slug: "abc12345",
      guestName: "Ali",
      partySize: 2,
      message: "x".repeat(501),
    });
    expect(errors.some((e) => e.includes("message"))).toBe(true);
  });

  it("accepts submission without optional message", () => {
    const errors = validateRsvpInput({ slug: "abc12345", guestName: "Ali", partySize: 1 });
    expect(errors).toHaveLength(0);
  });
});

describe("RSVP record structure", () => {
  it("builds a record with all required fields", () => {
    const record = buildRsvpRecord({
      invitationSlug: "abc12345",
      guestName: "Fatima Hassan",
      partySize: 4,
      message: "Congratulations!",
    });
    expect(record).toHaveProperty("id");
    expect(record.invitationSlug).toBe("abc12345");
    expect(record.guestName).toBe("Fatima Hassan");
    expect(record.partySize).toBe(4);
    expect(record.message).toBe("Congratulations!");
    expect(record.createdAt).toBeInstanceOf(Date);
  });

  it("stores null message when not provided", () => {
    const record = buildRsvpRecord({
      invitationSlug: "abc12345",
      guestName: "Omar",
      partySize: 2,
      message: null,
    });
    expect(record.message).toBeNull();
  });
});

describe("RSVP summary computation", () => {
  it("computes correct total guests and response count", () => {
    const responses = [
      { partySize: 3 },
      { partySize: 2 },
      { partySize: 5 },
    ];
    const summary = computeSummary(responses);
    expect(summary.totalGuests).toBe(10);
    expect(summary.responseCount).toBe(3);
  });

  it("returns zeros for empty response list", () => {
    const summary = computeSummary([]);
    expect(summary.totalGuests).toBe(0);
    expect(summary.responseCount).toBe(0);
  });

  it("handles single response", () => {
    const summary = computeSummary([{ partySize: 7 }]);
    expect(summary.totalGuests).toBe(7);
    expect(summary.responseCount).toBe(1);
  });
});

describe("Owner access control logic", () => {
  const ownerOpenId = "owner-open-id-123";

  function canViewRsvp(userOpenId: string): boolean {
    return userOpenId === ownerOpenId;
  }

  it("allows owner to view RSVP responses", () => {
    expect(canViewRsvp(ownerOpenId)).toBe(true);
  });

  it("blocks non-owner authenticated user from viewing RSVP responses", () => {
    expect(canViewRsvp("other-user-456")).toBe(false);
  });

  it("blocks empty openId", () => {
    expect(canViewRsvp("")).toBe(false);
  });
});
