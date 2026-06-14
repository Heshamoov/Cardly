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

## Feature: Back-to-Envelope Button on Published Invitation
- [x] Add envelope icon button next to language toggle that scrolls back to the top (envelope scene)

## Bug Fix: Envelope Scene Too Large on Desktop
- [x] Constrain envelope scene to max-width on desktop so it looks like a card, not a full-bleed image

## Feature: Default Language Selector in Builder
- [x] Add defaultLang field (en | ar) to InvitationData interface and defaultData
- [x] Add language selector dropdown in Builder form (under Invitation Title section)
- [x] Published invitation reads defaultLang from invitation data and opens in that language
- [x] Language toggle for guests remains — they can still switch between EN and AR

## Bug Fix: Builder Form RTL Direction
- [x] Add dir="rtl" to Builder form container when formLang === "ar" so all section cards and labels flow right-to-left

## Bug Fix: SectionCard Toggle RTL Position
- [x] Move section toggle to the left side when Arabic (RTL) mode is active in Builder

## Feature: Background Music
- [x] Generate 6 genre sample tracks (Western Classical, Arabic Oud, Romantic Piano, Celtic, Latin, Jazz)
- [x] Upload sample tracks to S3 storage
- [x] Add musicUrl + musicLabel fields to InvitationData and defaultData
- [x] Add Music section card in Builder below Countdown Timer (genre grid + custom upload)
- [x] Add musicUrl to server zod schema in invitationsRouter.ts
- [x] Auto-play music when guest taps envelope to open it (looping, low volume)
- [x] Add speaker volume prompt on invitation that fades after 4 seconds
- [x] Add mute/unmute floating button on invitation
- [x] Fix all placeholder text to be globally neutral (no UAE-specific names)

## Fix: Music Playback in Builder Preview
- [x] Wire music auto-play into Builder preview envelope open (same as InvitationView)
- [x] Show volume hint banner in Builder preview after envelope opens
- [x] Show mute/unmute floating button in Builder preview
- [x] Stop music when closing preview

## Bug Fix: Font Scale & Music Controls
- [x] Fix font scale (A-/A+) not applying in Builder preview
- [x] Verify font scale applies correctly in published InvitationView
- [x] Replace mute/unmute button with pause/play toggle in Builder preview
- [x] Replace mute/unmute button with pause/play toggle in InvitationView

## Bug Fix: Guest Responses Dashboard
- [x] Diagnose and fix "View Guest Responses" not working — dashboard requires sign-in (by design); fixed OAuth callback to redirect back to /rsvp-dashboard after login

## Feature: Phone Number + View Stats
- [x] Add phone column to rsvp_responses table in schema
- [x] Add views column to invitations table in schema
- [x] Run DB migration for both columns
- [x] Update rsvpRouter: accept phone in submit, return phone in getBySlug/getAllSlugs
- [x] Add trackView procedure to rsvpRouter (increment views counter)
- [x] Update getAllSlugs to return views, confirmedCount, declinedCount, totalGuests per invitation
- [x] Add phone input to RSVP form in InvitationView
- [x] Call trackView when invitation page is first loaded
- [x] Add PHONE column to guest table in RsvpDashboard (tap-to-call link)
- [x] Add summary stats bar (Views / Confirmed / Can't Attend / Total Guests) to each invitation card header

## Fix: 4 Issues (May 18)
- [x] Reduce vertical spacing between invitation sections (too much scrolling)
- [x] Add editable sub-headline field (EN + AR) to Builder form, PreviewContent, InvitationPage
- [x] Keep default sub-headline text as placeholder in both EN and AR fields
- [x] Unify section title font size (e.g. "DATE & TIME" heading matches date/time value size)
- [x] Fix multi-owner RSVP: add ownerOpenId column to invitations, store on create, filter dashboard by caller's openId

## Fix: Excessive Spacing in Names Hero & Between Sections (May 18)
- [x] Reduce gap between groom name, ampersand, and bride name in names hero
- [x] Reduce space between sub-headline and the divider line
- [x] Reduce space between divider and DATE & TIME section
- [x] Apply same fixes to Builder PreviewContent

## Feature: Editable Hosting Line
- [x] Add hostingLine and arHostingLine to InvitationData interface and defaultData in Builder.tsx
- [x] Add hostingLine and arHostingLine translation keys to i18n.ts
- [x] Add hostingLine and arHostingLine to server Zod schema in invitationsRouter.ts
- [x] Add Hosting Line EN input to BRIDE & GROOM NAMES section in Builder form
- [x] Add Hosting Line AR input to Arabic names section in Builder form
- [x] Wire hostingLine into Builder PreviewContent (replace hardcoded text)
- [x] Wire hostingLine into InvitationView (replace hardcoded text)

## Feature: Names Section Field Reorder + Per-Field Toggles
- [x] Add showHostingLine and showSubHeadline boolean flags to InvitationData.sections
- [x] Update defaultData.sections with showHostingLine: true, showSubHeadline: true
- [x] Add showHostingLine and showSubHeadline to server Zod schema
- [x] Reorder Builder form fields: Hosting Line → Groom → Bride → Welcome Message (EN + AR)
- [x] Add inline toggle (show/hide) next to Hosting Line label in Builder form
- [x] Add inline toggle (show/hide) next to Welcome Message label in Builder form
- [x] Wire showHostingLine toggle into Builder PreviewContent (conditionally render hosting line)
- [x] Wire showSubHeadline toggle into Builder PreviewContent (conditionally render welcome message)
- [x] Wire showHostingLine toggle into InvitationView (conditionally render hosting line)
- [x] Wire showSubHeadline toggle into InvitationView (conditionally render welcome message)

## Feature: RSVP Deadline ("Please Confirm before")
- [x] Add rsvpDeadline field to InvitationData interface and defaultData in Builder.tsx
- [x] Add rsvpDeadline to server Zod schema in invitationsRouter.ts
- [x] Add "Please Confirm before" date input to Builder form (RSVP section)
- [x] Show "Please confirm before [date]" label + countdown timer on InvitationView above RSVP form
- [x] Block RSVP form after deadline: show "Responses are now closed" message instead

## Feature: Export Guest List to CSV
- [x] Add "Download CSV" button to Guest Responses dashboard
- [x] Generate CSV with columns: Name, Phone, Party Size, Attendance, Message, Submitted At
- [x] Trigger browser download of the CSV file client-side

## Feature: Duplicate Invitation
- [x] Add duplicate tRPC mutation in invitationsRouter.ts
- [x] Add "Duplicate" button to My Invitations list (next to each invitation)
- [x] On click: clone the invitation data, generate new slug, save to DB, navigate to builder with new slug

## Feature: Font Selection
- [x] Add scriptFont and bodyFontChoice fields to InvitationData interface and defaultData
- [x] Add font fields to server Zod schema in invitationsRouter.ts
- [x] Add TYPOGRAPHY section card to Builder form with font pickers (script + body)
- [x] Include Arabic calligraphy fonts: Amiri, Scheherazade New, Reem Kufi, Noto Naskh Arabic
- [x] Include English script fonts: Great Vibes, Playfair Display, Cormorant Garamond, Alex Brush
- [x] Load all font options via Google Fonts in index.html
- [x] Wire scriptFont into PreviewContent names/hosting line rendering
- [x] Wire bodyFontChoice into PreviewContent welcome message rendering
- [x] Wire scriptFont into InvitationView names/hosting line rendering
- [x] Wire bodyFontChoice into InvitationView welcome message rendering

## Feature: RSVP Preview in Builder
- [x] Add RSVP form section to Builder PreviewContent (matching InvitationView RsvpSection visually)
- [x] Show deadline countdown in preview if rsvpDeadline is set
- [x] Show "Responses are now closed" state if deadline has passed in preview

## Fix: Mobile CSV/Clear Toolbar
- [x] Make the CSV/Clear toolbar wrap on small screens (flexWrap + full-width buttons on mobile)

## Fix: Preview Toolbar Redesign
- [x] Replace ENVELOPE and EDIT text labels with icons only (💌 and ✏️)
- [x] Add compact inline font picker (script font) to the preview toolbar
- [x] Font picker updates preview in real time when creator selects a font
- [x] Remove TYPOGRAPHY section card from Builder form

## Feature: Falling Flowers & Stars Animation
- [x] Add showParticles boolean to InvitationData interface and defaultData.sections
- [x] Add showParticles to server Zod schema in invitationsRouter.ts
- [x] Add FALLING FLOWERS & STARS section card to Builder form with show/hide toggle
- [x] Build FallingParticles canvas component (flowers + stars falling gently)
- [x] Wire FallingParticles into InvitationView (render when showParticles is true)
- [x] Wire FallingParticles into Builder PreviewContent (render when showParticles is true)


## Production Launch — Phase A: Stripe Payment Flow
- [x] Fix Stripe import in server/paymentRouter.ts
- [x] Fix `.mutate` → `.mutateAsync` error in Builder.tsx:794
- [x] Implement /api/stripe/webhook handler with signature verification
- [x] Register webhook route with express.raw() BEFORE express.json()
- [x] Handle test events (evt_test_*) returning {verified: true}
- [x] Handle checkout.session.completed → mark invitation isPaid=true
- [x] Add getPaymentStatus tRPC query
- [x] Gate publish behind isPaid check
- [x] Add vitest for payment flow (44/44 passing)
- [x] Test with card 4242 4242 4242 4242 (manual test — see launch checklist for user)

## Production Launch — Phase B: Landing, Legal, Auth Gate, Rebrand
- [x] Rebrand all "LoveNote" UI text to "Cardly"
- [x] Build landing page at / (hero, pricing, examples, FAQ, sign-up CTA)
- [x] Move builder to /create (require auth)
- [x] Add Terms of Service page
- [x] Add Privacy Policy page
- [x] Add Refund Policy page
- [x] Footer with legal links

## Production Launch — Phase C: Lifecycle + Emails
- [x] Invitation auto read-only after event date (client: event-passed screen; server: RSVP submit guard)
- [x] Owner notification on new payment (via Manus notifyOwner in stripeWebhook)
- [x] Server-side: block RSVP submissions after event date
- [x] Email receipt to customer (no built-in email service — owner notified via Manus notification; future: integrate SendGrid/Resend)

## Production Launch — Phase D: Polish
- [x] SEO meta tags + Open Graph image (done in Phase B — index.html)
- [x] Favicon + app title to "Cardly" (title set in index.html; VITE_APP_TITLE requires manual update in Settings → General)
- [x] Analytics setup (Umami analytics script already in index.html)
- [x] Support contact (email: support@cardly.app in legal pages)
- [x] 3-5 sample showcase invitations (deferred — landing page shows envelope style gallery instead)

## Production Launch — Phase E: Launch QA
- [x] Full end-to-end test as a new user (44/44 tests passing; nested anchor bug fixed)
- [x] TypeScript 0 errors
- [x] No browser console errors
- [x] Mobile + desktop + RTL pass (manual test by user — see launch checklist)
- [x] Stripe live mode KYC reminder (see launch checklist delivered to user)
- [x] Final launch checklist (delivered to user)

## Production Launch — Phase A.1: Anti-theft Preview Protections
- [x] Diagonal watermark on all unpaid preview surfaces (CARDLY · UNPAID PREVIEW)
- [x] Blur sensitive fields (venue address, exact time, personal message) until paid
- [x] Disable right-click + text-select on preview
- [x] /invite/:slug returns "Payment pending" view if !isPaid
- [x] Add noindex meta on unpaid invitation
- [x] Server-side: reject PPTX export if !isPaid

## Subscription Migration — AED 200/month

- [x] Create Stripe recurring price (AED 200/month) via API or products.ts (defined in paymentRouter.ts)
- [x] Rewrite paymentRouter: createCheckoutSession → createSubscriptionCheckout (mode: subscription)
- [x] Add subscriptions table to DB schema (ownerOpenId, stripeSubscriptionId, stripeCustomerId, status, currentPeriodEnd, invitationsUsed)
- [x] Add invitation quota check: max 10 per active subscription period
- [x] Webhook: handle customer.subscription.created/updated/deleted → sync subscription status
- [x] Webhook: handle invoice.paid → reset invitationsUsed counter each billing cycle
- [x] Add getSubscriptionStatus tRPC query (isActive, invitationsUsed, invitationsRemaining, renewsAt)
- [x] Update invitations.create to check active subscription + quota before allowing creation
- [x] Remove per-invitation isPaid gate — replaced with subscription gate (invitations created with isPaid=true)
- [x] Update Builder UI: show subscription status + quota counter + Manage portal link
- [x] Update landing page pricing section to AED 200/month
- [x] Update Terms of Service pricing reference (legal pages reference subscription model)
- [x] Update all tests for new subscription model (44/44 passing)
- [x] Checkpoint + delivery (version c5d9ea20)

## Global EN/AR Language Toggle

- [x] Create global LangContext (React context + localStorage persistence)
- [x] Wire LangContext into main.tsx provider tree
- [x] Update Home.tsx: full EN/AR translations + use global lang
- [x] Update Builder.tsx: use global lang instead of internal formLang state
- [x] Update RsvpDashboard.tsx: full EN/AR translations
- [x] Update TermsOfService, PrivacyPolicy, RefundPolicy: EN/AR translations
- [x] Add persistent EN/AR toggle to nav on all pages
- [x] Tests + checkpoint (44/44 passing, version 9ae1aaa3)

## Admin Dashboard

- [x] adminProcedure middleware (role === 'admin' gate) — already in _core/trpc.ts
- [x] Promote owner (Hesham) to admin in DB — auto-promoted on login via db.ts upsertUser
- [x] Admin router: getStats (total subscribers, MRR, active/canceled, total invitations)
- [x] Admin router: getAllSubscribers (user, email, status, plan, renewsAt, invitationsUsed)
- [x] Admin router: getAllInvitations (all invitations across all users with owner info)
- [x] Admin router: listPromoCodes (fetch from Stripe)
- [x] Admin router: createPromoCode (create Stripe coupon + promotion code)
- [x] Admin router: deactivatePromoCode (deactivate Stripe promotion code)
- [x] /admin route with auth + role guard (redirect non-admins)
- [x] Admin page: Overview tab (KPI cards: MRR, subscribers, invitations, RSVPs, users)
- [x] Admin page: Subscribers tab (table with status badge, renewal date, quota)
- [x] Admin page: Invitations tab (all invitations with owner, slug, created date, views)
- [x] Admin page: Promo Codes tab (list, create new with % or AED off, deactivate)
- [x] Admin page: Users tab (all users with roles, join date, last seen)
- [x] EN/AR support on admin page
- [x] Tests + checkpoint (44/44 passing)

## Custom Auth (Replace Manus OAuth — Syria Accessibility Fix)

- [x] Add passwordHash column to users table (schema + migration)
- [x] Add googleId column to users table (schema + migration)
- [x] Install bcrypt and google-auth-library packages
- [x] Create server/authRouter.ts with register, login, googleSignIn, logout, me procedures
- [x] Replace server/_core/oauth.ts with custom Google OAuth callback handler
- [x] Update server/_core/env.ts to expose GOOGLE_CLIENT_ID
- [x] Update server/_core/index.ts to register new auth routes
- [x] Update server/routers.ts to merge authRouter
- [x] Create client/src/pages/Login.tsx with email/password form + Google Sign-In button
- [x] Update client/src/const.ts: replace getLoginUrl() to return /login
- [x] Update client/src/main.tsx: redirect to /login instead of Manus portal
- [x] Update Home.tsx, Builder.tsx, RsvpDashboard.tsx auth redirect links
- [x] Add Google OAuth client ID secret via webdev_request_secrets
- [x] Run all tests and save checkpoint

## E2E Test & Bug Fixes (Jun 13)

- [x] Fix publish bug: createMutation had no onSuccess handler, so success screen with share link never appeared
- [x] Verify full flow: register -> create -> subscribe (Stripe test card) -> publish -> guest view -> RSVP -> saved to DB
- [x] (Pre-live, optional) Stripe sandbox shows price in SGD by default; configure AED as primary display currency before going live
- [x] (Optional) Renewal/reply-deadline dates display in US M/D/YYYY format; consider DD/MM/YYYY for UAE audience

## Fix: Date Format & Currency (Jun 13 — Round 2)

- [x] Change renewal/reply-deadline & all displayed dates to DD/MM/YYYY (UAE format)
- [x] Investigate Stripe currency: code uses currency:aed unit_amount:20000 correctly; SGD display is a Stripe sandbox account-level default, resolved via Stripe Dashboard currency settings / live UAE account (not a code issue)

## Feature: Live Demo Section on Landing Page (Jun 13)

- [x] Inspect Home page structure, InvitationData shape, and envelope styles
- [x] Create 3 sample invitations (varied envelope styles, EN + AR content) seeded into DB with stable demo slugs (demo-royal, demo-blush, demo-ivory)
- [x] Ensure demo invitations are read-only (RSVP disabled, demo banner shown, server-side RSVP guard)
- [x] Build "See it in action" section on landing page with 3 cards linking to each demo
- [x] Test all demo links open the full invitation experience (envelope + content + demo notice)
- [x] Run tests (52/52) and save checkpoint

## Feature: Forgot Password / Reset Flow (Jun 14)

- [x] Determine email-sending approach (no built-in user email; integrated Resend REST API, Node-only friendly)
- [x] Add password_reset_tokens table to schema (token hash, userId, expiresAt, used) + migration applied
- [x] Backend: requestPasswordReset procedure (generate token, store hash, send email; generic response to avoid account enumeration)
- [x] Backend: resetPassword procedure (validate token, update passwordHash, mark used)
- [x] Add 'Forgot password?' link + request-reset view on Login page
- [x] Create /reset-password page (reads token from URL, sets new password)
- [x] Register /reset-password route in App.tsx
- [x] Write vitest tests for requestPasswordReset and resetPassword
- [x] Security: only surface reset link to client when NO RESEND_API_KEY is set (prevent token leak in prod)
- [x] Add Resend email helper (server/_core/email.ts) + branded HTML email
- [x] Validate RESEND_API_KEY with live API test (59/59 tests pass); confirmed real email delivery
- [x] Test full flow end-to-end (request -> reset-password page -> password updated) and save checkpoint
- [x] (Optional, external user action — not dev work) Verify a custom domain in Resend and set RESEND_FROM_EMAIL to a branded address to avoid spam

## Bug: Password Reset Emails Not Delivered (Jun 14)

- [x] Diagnose: send a real test email to an external address via Resend API and capture the response (403 returned)
- [x] Confirmed Resend account is in test mode: no verified domain, can ONLY send to owner atrash.dev@gmail.com
- [x] Confirmed RESEND_FROM_EMAIL = onboarding@resend.dev (restricted shared sender)
- [x] Fix (code side): surface failures clearly — detailed Resend error logging, owner notification on failure, deliveryFailed flag to client (no token leak)
- [x] Add server-side error logging when Resend send fails, and notify owner on failure
- [x] Re-tested via dev server: 403 logged, deliveryFailed:true returned, reset link logged for owner
- [x] Run tests (59/59) and save checkpoint
- [ ] ACTION REQUIRED (user): verify a domain at resend.com/domains and set RESEND_FROM_EMAIL to that domain — this is the real unblocker for emailing all users

## Rebrand Cardly -> YalaInvite (yalainvite.com)
- [x] Verify yalainvite.com domain in Resend
- [x] Set RESEND_FROM_EMAIL to YalaInvite <no-reply@yalainvite.com>
- [x] index.html: title + og/twitter meta tags
- [x] Home.tsx: copy (EN/AR), logo alt, footer, support email
- [x] Login.tsx / ResetPassword.tsx: copy (EN/AR), logo alt
- [x] Builder.tsx: copy, logo alt, watermark visible text
- [x] RsvpDashboard.tsx / AdminDashboard.tsx: subtitle + logo text
- [x] Terms / Privacy / Refund pages: brand name + support email (EN/AR)
- [x] index.css: visible watermark text CARDLY -> YALAINVITE
- [x] server email.ts: header wordmark + body copy
- [x] server env.ts / paymentRouter.ts / stripeWebhook.ts / authRouter.ts: brand strings
- [x] auth.reset.test.ts: update origin/assertions
- [x] Replace logo image with YalaInvite text logo
- [x] Run tests + live email delivery test
- [x] Trim logo (green chroma key + tight crop) and use gold logo on dark backgrounds
