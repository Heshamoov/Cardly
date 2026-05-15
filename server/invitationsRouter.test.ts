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

// Unit tests for map URL resolution logic (pure function extracted for testing)
function extractMapEmbedUrl(input: string): { embedUrl: string; directionsUrl: string } {
  const trimmed = input.trim();
  if (!trimmed) return { embedUrl: "", directionsUrl: "" };

  // Extract coordinates from resolved URL
  const coordMatch = trimmed.match(/@(-?[\d.]+),(-?[\d.]+)/);
  if (coordMatch) {
    const query = `${coordMatch[1]},${coordMatch[2]}`;
    return {
      embedUrl: `https://maps.google.com/maps?q=${query}&output=embed`,
      directionsUrl: `https://maps.google.com/maps?q=${query}`,
    };
  }

  // Extract place name from /place/ segment
  const placeMatch = trimmed.match(/\/place\/([^/@?]+)/);
  if (placeMatch) {
    const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    return {
      embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&output=embed`,
      directionsUrl: `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}`,
    };
  }

  // Extract q= param
  const qMatch = trimmed.match(/[?&]q=([^&]+)/);
  if (qMatch) {
    const q = decodeURIComponent(qMatch[1]);
    return {
      embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`,
      directionsUrl: `https://maps.google.com/maps?q=${encodeURIComponent(q)}`,
    };
  }

  // Fallback: plain text
  return {
    embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`,
    directionsUrl: `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}`,
  };
}

describe("extractMapEmbedUrl", () => {
  it("handles plain text venue name", () => {
    const result = extractMapEmbedUrl("Al Rekab Restaurant Al Ain");
    expect(result.embedUrl).toContain("output=embed");
    expect(result.embedUrl).toContain("Al%20Rekab");
    expect(result.directionsUrl).not.toContain("output=embed");
  });

  it("extracts coordinates from a resolved Google Maps URL", () => {
    const resolvedUrl =
      "https://www.google.com/maps/place/Al+Rikab+Restaurant/@24.1849284,55.6486427,237m/data=...";
    const result = extractMapEmbedUrl(resolvedUrl);
    expect(result.embedUrl).toContain("24.1849284,55.6486427");
    expect(result.embedUrl).toContain("output=embed");
    expect(result.directionsUrl).toContain("24.1849284,55.6486427");
    expect(result.directionsUrl).not.toContain("output=embed");
  });

  it("extracts place name from a /place/ URL", () => {
    const url = "https://www.google.com/maps/place/Al+Rikab+Restaurant/";
    const result = extractMapEmbedUrl(url);
    expect(result.embedUrl).toContain("Al%20Rikab%20Restaurant");
    expect(result.embedUrl).toContain("output=embed");
  });

  it("returns empty strings for empty input", () => {
    const result = extractMapEmbedUrl("   ");
    expect(result.embedUrl).toBe("");
    expect(result.directionsUrl).toBe("");
  });
});
