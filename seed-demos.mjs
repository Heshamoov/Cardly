// Seed 3 demo invitations into the DB with stable slugs.
// Run: node seed-demos.mjs
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const baseSections = {
  names: true, date: true, time: true, venue: true, rsvp: true,
  message: true, map: true, countdown: true, showHostingLine: true,
  showSubHeadline: true, particles: true, program: false,
};

// A date ~6 months out so the countdown always looks alive
function futureDate(monthsAhead) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return d.toISOString().slice(0, 10);
}

const demos = [
  {
    slug: "demo-royal",
    title: "Royal Navy — Omar & Layla",
    data: {
      title: "Omar & Layla Wedding",
      eventType: "wedding",
      groomFirstName: "Omar", groomLastName: "Al Rashid",
      brideFirstName: "Layla", brideLastName: "Haddad",
      arGroomFirstName: "عمر", arGroomLastName: "الراشد",
      arBrideFirstName: "ليلى", arBrideLastName: "حداد",
      date: futureDate(6), time: "19:30",
      venueName: "The Ritz-Carlton Grand Ballroom",
      venueAddress: "Al Maryah Island, Abu Dhabi, UAE",
      arVenueName: "قاعة الاحتفالات الكبرى - ريتز كارلتون",
      arVenueAddress: "جزيرة المارية، أبوظبي، الإمارات",
      venueMapQuery: "The Ritz-Carlton Abu Dhabi Al Maryah Island",
      message: "Together with their families, request the honour of your presence as they celebrate the beginning of their forever.",
      arMessage: "بكل الحب والفرح، تتشرف العائلتان بدعوتكم لمشاركتهم فرحة بداية حياتهم معًا.",
      hostingLine: "Together With Their Families",
      arHostingLine: "بمشاركة عائلتيهما",
      subHeadline: "request the pleasure of your company",
      arSubHeadline: "يتشرفان بدعوتكم لحضور حفل زفافهما",
      envelopeStyle: "navy-gold",
      fontScale: 1.0,
      defaultLang: "en",
      scriptFont: "Cormorant Garamond",
      bodyFontChoice: "Lato",
      showParticles: true,
      rsvpDeadline: futureDate(5),
      sections: baseSections,
    },
  },
  {
    slug: "demo-blush",
    title: "Floral Blush — Sami & Hind",
    data: {
      title: "Sami & Hind Engagement",
      eventType: "engagement",
      groomFirstName: "Sami", groomLastName: "Khalil",
      brideFirstName: "Hind", brideLastName: "Nasser",
      arGroomFirstName: "سامي", arGroomLastName: "خليل",
      arBrideFirstName: "هند", arBrideLastName: "ناصر",
      date: futureDate(4), time: "18:00",
      venueName: "Emirates Palace Gardens",
      venueAddress: "West Corniche Road, Abu Dhabi, UAE",
      arVenueName: "حدائق قصر الإمارات",
      arVenueAddress: "طريق الكورنيش الغربي، أبوظبي، الإمارات",
      venueMapQuery: "Emirates Palace Abu Dhabi",
      message: "With hearts full of joy, we invite you to share in the celebration of our engagement.",
      arMessage: "بقلوب مفعمة بالفرح، ندعوكم لمشاركتنا فرحة خطوبتنا.",
      hostingLine: "With Their Families",
      arHostingLine: "بمشاركة عائلتيهما",
      subHeadline: "joyfully invite you to celebrate",
      arSubHeadline: "يسعدهما دعوتكم للاحتفال",
      envelopeStyle: "blush-rose",
      fontScale: 1.0,
      defaultLang: "en",
      scriptFont: "Cormorant Garamond",
      bodyFontChoice: "Lato",
      showParticles: true,
      rsvpDeadline: futureDate(3),
      sections: baseSections,
    },
  },
  {
    slug: "demo-ivory",
    title: "Classic Ivory — Yusuf & Mariam",
    data: {
      title: "Yusuf & Mariam Wedding",
      eventType: "wedding",
      groomFirstName: "Yusuf", groomLastName: "Saleh",
      brideFirstName: "Mariam", brideLastName: "Aziz",
      arGroomFirstName: "يوسف", arGroomLastName: "صالح",
      arBrideFirstName: "مريم", arBrideLastName: "عزيز",
      date: futureDate(8), time: "20:00",
      venueName: "Bab Al Shams Desert Resort",
      venueAddress: "Al Qudra Road, Dubai, UAE",
      arVenueName: "منتجع باب الشمس الصحراوي",
      arVenueAddress: "طريق القدرة، دبي، الإمارات",
      venueMapQuery: "Bab Al Shams Desert Resort Dubai",
      message: "We invite you to join us under the stars as two families become one. Your presence is the greatest gift.",
      arMessage: "ندعوكم لمشاركتنا تحت ضوء النجوم لحظة اتحاد عائلتين في عائلة واحدة. حضوركم أجمل هدية.",
      hostingLine: "Together With Their Families",
      arHostingLine: "بمشاركة عائلتيهما",
      subHeadline: "request the pleasure of your company",
      arSubHeadline: "يتشرفان بدعوتكم",
      envelopeStyle: "ivory-gold",
      fontScale: 1.0,
      defaultLang: "en",
      scriptFont: "Cormorant Garamond",
      bodyFontChoice: "Lato",
      showParticles: true,
      rsvpDeadline: futureDate(7),
      sections: baseSections,
    },
  },
];

const conn = await mysql.createConnection(DATABASE_URL);
for (const demo of demos) {
  const dataStr = JSON.stringify(demo.data);
  await conn.execute(
    `INSERT INTO invitations (slug, title, data, views, ownerOpenId, isPaid)
     VALUES (?, ?, ?, 0, NULL, 1)
     ON DUPLICATE KEY UPDATE title = VALUES(title), data = VALUES(data), isPaid = 1`,
    [demo.slug, demo.title, dataStr]
  );
  console.log(`Seeded: ${demo.slug}`);
}
await conn.end();
console.log("Done.");
