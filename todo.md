# Wedding Invite Builder — TODO

## Builder (Creator Flow)
- [x] Builder page: editable template with all sections visible
- [x] Inline editing for each section (bride name, groom name, date, time, venue, message)
- [x] Show/hide toggle per section
- [x] Venue location search (Google Maps embed via place name)
- [x] Preview button — shows clean guest view
- [x] Publish button — saves invitation to DB, generates unique shareable link
- [x] Copy link UI after publish

## Guest View (Invitation Page)
- [x] Envelope screen — beautiful animated envelope centered on screen
- [x] Tap/click envelope to trigger open animation
- [x] Envelope flap opens with smooth CSS animation
- [x] Invitation card slides out from envelope
- [x] Scrollable invitation page with all visible sections
- [x] Section: Bride & Groom names (hero, large script font)
- [x] Section: Date & Time
- [x] Section: Venue name & address
- [x] Section: Personal message
- [x] Section: Embedded Google Map of venue
- [x] Section: Countdown timer to wedding day
- [x] Background music autoplay (romantic, optional — deferred, browsers block autoplay)

## Backend
- [x] Database table: invitations (id, slug, data JSON, createdAt)
- [x] API: POST /api/invitations — save and return slug
- [x] API: GET /api/invitations/:slug — fetch invitation data

## Design
- [x] Mobile-first layout (max-width 480px centered)
- [x] Royal Gold theme: deep navy/dark background, gold accents, serif fonts
- [x] Smooth animations throughout
- [x] Responsive for desktop too

## Venue Improvement
- [x] Replace map query field with smart venue input: search by name OR paste a Google Maps link
- [x] Parse Google Maps link to extract embed URL automatically
- [x] Show live map preview inside the builder venue section

## Bug Fixes & Improvements
- [x] Fix map embed: pasted Google Maps links must correctly render the map in preview
- [x] Guest view: tapping the map opens Google Maps for directions
- [x] Persist all builder form data in localStorage (auto-save on every change, restore on page load)

## Short URL Fix
- [x] Resolve maps.app.goo.gl short links server-side to extract real location coordinates
- [x] Use resolved coordinates for map embed iframe and Get Directions button
- [x] Show loading state while resolving, and error state if resolution fails

## Envelope Selection Gallery
- [x] Generate 4 wedding envelope images with wax candle seals (different styles/colors)
- [x] Add envelope selection gallery as first section in builder
- [x] Highlight selected envelope with gold border/glow
- [x] Store selected envelope style in invitation data
- [x] Use selected envelope style in guest invitation view

## Smooth Envelope Opening Animation
- [x] CSS 3D flap lift animation — envelope top flap rotates open with perspective transform
- [x] Wax seal crack/fade effect during opening
- [x] Invitation card slides up and out of envelope smoothly
- [x] Particle/confetti burst on envelope open
- [x] Full animation sequence: tap → shake (0.35s) → flap lifts (0.85s) → card rises (0.9s) → invitation revealed

## Envelope Redesign
- [x] Full-screen envelope (100vw x 100vh)
- [x] Top flap opens upward (rotateX from bottom edge), bottom flap opens downward
- [x] 2-second slow realistic opening animation
- [x] Background expands after opening to reveal invitation from the top
- [x] Scroll to top when invitation is revealed
- [x] Real printed font feel — letterpress-style serif/script throughout invitation

## Envelope Split Animation Redesign
- [x] Full-screen envelope photo fills entire viewport (no background mismatch)
- [x] Top half uses clip-path to show top 50% of envelope photo, slides UP on open
- [x] Bottom half uses clip-path to show bottom 50% of envelope photo, slides DOWN on open
- [x] White/cream background revealed underneath as halves slide apart
- [x] Wax seal stays centered and fades out during opening
- [x] Same animation in both Builder preview and InvitationView guest page

## Mobile-First Fixes
- [x] Envelope fills full screen on mobile — use object-fit: cover on the image halves
- [x] Top banner buttons compact and mobile-friendly (smaller, icon-only or short labels)
- [x] TAP TO OPEN hint visible inside the envelope viewport
- [x] Envelope image covers full portrait screen without cropping the wax seal

## Envelope Theme Color Palettes (User-Specified)
- [x] Replace all four envelope theme objects with exact user-specified color palettes
- [x] Add secondary background, text color, and all accent variables to theme objects
- [x] Apply --bg-secondary, --text-primary, --accent, --accent-secondary CSS variables to invitation-page
- [x] Update invitation text colors to use --text-primary (not hardcoded cream/navy)
- [x] Update borders, dividers, decorative lines to use theme accent
- [x] Update Get Directions button to use theme accent colors
- [x] Update countdown timer colors to use theme variables
- [x] Add smooth CSS transition on .invitation-page for theme switching
- [x] Update envelope-scene background to match selected envelope theme
- [x] Update fs-expand-overlay background to match selected envelope theme

## RSVP Feature
- [x] Add rsvp_responses table to drizzle schema (id, invitationSlug, guestName, partySize, message, createdAt)
- [x] Add publicProcedure: rsvp.submit — save guest name + party size for a given slug
- [x] Add protectedProcedure: rsvp.getBySlug — return all responses for a slug (owner only)
- [x] Add protectedProcedure: rsvp.getAllForOwner — return all RSVPs across all owner's invitations
- [x] Add RSVP form section to InvitationView.tsx (name, party size, optional message, submit button)
- [x] Style RSVP form with envelope theme colors (CSS variables)
- [x] Show success confirmation after submission; prevent duplicate submissions (localStorage flag)
- [x] Add /rsvp-dashboard route (protected, login required)
- [x] RSVP dashboard: total headcount, per-invitation breakdown, list of guest names + party sizes
- [x] Add RSVP dashboard link to builder page header (visible only when logged in)
- [x] Write vitest tests for rsvp.submit and rsvp.getBySlug procedures

## Arabic / English Language Toggle
- [x] Create shared i18n translations object (EN + AR) for all static invitation labels
- [x] Add EN/AR toggle button to InvitationView guest page (top-right corner, styled with theme colors)
- [x] Apply dir="rtl" and font-family switch (Arabic: Amiri or Noto Naskh Arabic) when AR selected
- [x] Add EN/AR toggle button to Builder preview panel (same position)
- [x] Apply RTL + Arabic translations in Builder preview when AR selected
- [x] Add EN/AR toggle to RSVP form labels in both views
- [x] Persist language choice in localStorage per invitation slug
