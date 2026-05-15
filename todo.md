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
