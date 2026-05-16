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

## Bug Fix: Missing EN/AR Toggle in Builder Form
- [x] Add EN/AR language toggle button to the builder form panel (visible in the editing view, not just preview)

## Bilingual Builder Form (EN + AR Content Input)
- [x] Add Arabic content fields to InvitationData: arBrideFirstName, arBrideLastName, arGroomFirstName, arGroomLastName, arVenueName, arVenueAddress, arMessage
- [x] Add EN/AR tab toggle to the builder form header
- [x] When AR tab is active, show Arabic input fields (RTL, Arabic font) for all text content
- [x] Persist Arabic fields in localStorage alongside English fields
- [x] Update PreviewContent in Builder to show Arabic content when lang=ar
- [x] Update InvitationPage in InvitationView to show Arabic content when lang=ar
- [x] Arabic fields are optional — fall back to English if Arabic not filled in

## Bug Fix: Builder Form Static Labels Not Translated to Arabic
- [x] Translate page title "CREATE YOUR / Wedding Invitation" to Arabic
- [x] Translate subtitle "Fill in your details · Toggle sections on or off · Preview & Publish" to Arabic
- [x] Translate "CHOOSE YOUR ENVELOPE STYLE" section heading to Arabic
- [x] Translate all section card titles (BRIDE & GROOM NAMES, WEDDING DATE, VENUE, etc.) to Arabic
- [x] Translate all input field labels and placeholders to Arabic
- [x] Translate button labels (Preview, Publish, Save, etc.) to Arabic
- [x] Translate "VIEW RSVP RESPONSES" button to Arabic

## Fix: Four Issues (May 17)
- [x] Fix Home page Arabic toggle not working (shows English after switching)
- [x] Add invitation title field to builder form (stored in DB and shown in dashboard)
- [x] Add delete invitation button on Guest Responses dashboard (with confirmation)
- [x] Rename "RSVP" to "Guest Responses" throughout the app (EN) and use Arabic equivalent in AR mode

## Fix: Security & Naming Gaps (May 17)
- [x] Make invitations.delete a protectedProcedure (owner-only, not public)
- [x] Also delete related rsvp_responses when an invitation is deleted
- [x] Replace remaining "RSVP" labels in Builder (viewRsvp button text, i18n keys) with "Guest Responses" / "استجابات الضيوف"

## Fix: Guest Responses Dashboard Arabic Toggle
- [x] Add EN/AR language toggle to Guest Responses dashboard header
- [x] Translate all dashboard labels to Arabic (RTL layout when AR selected)

## Fix: Groom First, Bride Second
- [x] Builder: swap groom/bride field order in EN and AR form sections
- [x] Preview: swap groom/bride display order in PreviewContent
- [x] Invitation: swap groom/bride display order in InvitationPage

## Fix: Countdown Timer Labels Not Translating to Arabic
- [x] Fix DAYS/HOURS/MINS/SECS labels in CountdownTimer (Builder Preview) to use Arabic when lang=ar
- [x] Fix DAYS/HOURS/MINS/SECS labels in CountdownTimer (Invitation) to use Arabic when lang=ar

## Fix: Countdown Timer Too Narrow
- [x] Widen countdown boxes (minWidth, padding) and increase gap between units in Builder Preview
- [x] Same fix in InvitationView CountdownTimer

## Fix: Preview Language Toggle + Font Size Control
- [x] Add EN/AR toggle button inside the Preview panel (visible to visitors)
- [x] Redesign font size control to be clearly labeled (e.g. "A-" / "A+" buttons with label "Font Size")

## Feature: Couple Photo Upload (Circular Portrait above Wax Seal)
- [x] Add couplePhotoUrl field to InvitationData and defaultData in Builder.tsx
- [x] couplePhotoUrl stored inside invitation JSON data (no schema migration needed)
- [x] Add uploadPhoto tRPC procedure (base64 → S3 → return URL) in invitationsRouter.ts
- [x] Add optional photo upload input in Builder form (with preview + remove button)
- [x] Display circular photo above wax seal on envelope scene in Preview (Builder)
- [x] Display circular photo above wax seal on envelope scene in Invitation (InvitationView)
- [x] When no photo: show initials as before (no regression)
- [x] Style: circular crop, gold ring border matching theme accent, subtle shadow

## New Envelope Styles (User-Provided Images)
- [x] Upload navy-floral and white-floral envelope images to storage
- [x] Add "Navy Floral" envelope style to Builder gallery and InvitationView
- [x] Add "White Floral" envelope style to Builder gallery and InvitationView
- [x] Define matching dark/light theme palettes for both new styles

## Bug Fixes (May 17 — Round 2)
- [x] Fix countdown timer overflow on mobile (boxes clip off screen edges)
- [x] Add "Can't Attend / Apology" decline button to RSVP section (alongside Confirm Attendance)
- [x] Sync fontScale between Builder preview and published InvitationView (currently mismatched)

## Feature: Personal Message Dropdown Suggestions
- [x] Add a styled dropdown above the message textarea in Builder with pre-written EN/AR messages
- [x] Selecting a suggestion auto-fills the message field (user can still edit freely after)
