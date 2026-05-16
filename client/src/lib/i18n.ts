/**
 * Bilingual translations for the invitation page.
 * Only static UI labels are translated — the couple's custom text
 * (names, venue, message) is always shown as entered.
 */
export type Lang = "en" | "ar";

export const translations = {
  en: {
    // Section labels
    togetherWith: "Together with their families",
    requestPleasure: "request the pleasure of your company at the celebration of their marriage",
    dateLabel: "Date & Time",
    venueLabel: "Venue",
    messageLabel: "A Personal Message",
    countdownLabel: "Counting Down",
    findUs: "Find Us",
    getDirections: "📍 Get Directions",
    withLove: "With love",
    tapToOpen: "Tap to open",

    // RSVP
    rsvpLabel: "RSVP",
    yourName: "Your Name *",
    namePlaceholder: "e.g. Sarah Al-Mansouri",
    numberOfGuests: "Number of Guests *",
    messageOptional: "Message (optional)",
    messagePlaceholder: "A short note for the couple…",
    confirmAttendance: "Confirm Attendance",
    sending: "Sending…",
    thankYou: "Thank you!",
    rsvpReceived: "Your RSVP has been received. We look forward to celebrating with you!",
    nameRequired: "Please enter your name.",
    partySizeError: "Party size must be between 1 and 50.",
    somethingWrong: "Something went wrong. Please try again.",
  },
  ar: {
    // Section labels
    togetherWith: "بمشاركة عائلتيهما",
    requestPleasure: "يطلبان شرف حضوركم لمشاركتهم فرحة زفافهم",
    dateLabel: "التاريخ والوقت",
    venueLabel: "مكان الحفل",
    messageLabel: "رسالة شخصية",
    countdownLabel: "العد التنازلي",
    findUs: "الموقع",
    getDirections: "📍 احصل على الاتجاهات",
    withLove: "مع كل الحب",
    tapToOpen: "اضغط للفتح",

    // RSVP
    rsvpLabel: "تأكيد الحضور",
    yourName: "اسمك *",
    namePlaceholder: "مثال: سارة المنصوري",
    numberOfGuests: "عدد الحضور *",
    messageOptional: "رسالة (اختياري)",
    messagePlaceholder: "كلمة قصيرة للعروسين…",
    confirmAttendance: "تأكيد الحضور",
    sending: "جارٍ الإرسال…",
    thankYou: "شكراً لك!",
    rsvpReceived: "تم استلام تأكيدك. نتطلع إلى الاحتفال معك!",
    nameRequired: "يرجى إدخال اسمك.",
    partySizeError: "يجب أن يكون عدد الحضور بين 1 و 50.",
    somethingWrong: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
  },
} as const;

export type Translations = typeof translations.en;

/** Arabic font stack for RTL mode */
export const ARABIC_FONT = "'Noto Naskh Arabic', 'Amiri', serif";
