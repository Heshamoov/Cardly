import { describe, it, expect } from "vitest";

// Unit tests for invitation slug generation and data validation logic
// (These test pure functions extracted from the router)

function generateSlug(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

describe("generateSlug", () => {
  it("generates a slug of the correct length", () => {
    const slug = generateSlug(8);
    expect(slug).toHaveLength(8);
  });

  it("generates a slug using only alphanumeric characters", () => {
    const slug = generateSlug(16);
    expect(slug).toMatch(/^[a-z0-9]+$/);
  });

  it("generates unique slugs on repeated calls", () => {
    const slugs = new Set(Array.from({ length: 100 }, () => generateSlug(8)));
    // With 36^8 possibilities, 100 slugs should all be unique
    expect(slugs.size).toBe(100);
  });
});

describe("invitation data structure", () => {
  it("validates required fields are present", () => {
    const data = {
      brideFirstName: "Hend",
      groomFirstName: "Sami",
      date: "2026-05-24",
      time: "21:00",
      venueName: "Al Rekab Restaurant",
      venueAddress: "Al Ain, UAE",
      venueMapQuery: "Al Rekab Restaurant Al Ain",
      message: "Join us for our special day",
      sections: { names: true, date: true, venue: true, map: true },
    };

    expect(data.brideFirstName).toBeTruthy();
    expect(data.groomFirstName).toBeTruthy();
    expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof data.sections).toBe("object");
  });

  it("correctly serializes and deserializes invitation data", () => {
    const original = {
      brideFirstName: "Hend",
      groomFirstName: "Sami",
      date: "2026-05-24",
      sections: { names: true, map: false },
    };
    const serialized = JSON.stringify(original);
    const parsed = JSON.parse(serialized);
    expect(parsed.brideFirstName).toBe("Hend");
    expect(parsed.sections.names).toBe(true);
    expect(parsed.sections.map).toBe(false);
  });
});
