# Our Space — Codex Master Implementation Prompt

You are the lead product engineer responsible for implementing the first working MVP of **Our Space**.

Your task is not to brainstorm a product, redesign the concept, or introduce additional features. The product philosophy and core model have already been decided.

You must convert the specification below into a clean, production-oriented, locally runnable codebase.

---

# 1. Product Definition

**Our Space** is a private shared living space for two people who want to remain part of each other's everyday lives.

Mission:

> Live together, even when apart.

Core expression:

> Share love together.

North Star:

> Increase Presence.

Our Space is not:

* a social network
* a public feed
* a traditional messenger
* a productivity application
* an AI companion
* a relationship scoring tool

Our Space is:

> A continuous shared living space.

The product should make users feel:

* closer
* calmer
* more at home
* quietly aware that the other person is still part of their life

The interface must never compete with the relationship.

---

# 2. Non-Negotiable Product Principles

These principles must directly influence implementation decisions.

1. Build a home, not a feed.
2. Increase presence, not engagement.
3. Capture less. Live more.
4. Users capture moments. Our Space preserves the story.
5. Moments are captured. Memories are grown.
6. Time flows. Love waits.
7. Love should feel held, not measured.
8. Never turn love into an obligation.
9. Care can wait without disappearing.
10. Technology should disappear. Love should remain.
11. Silence is a valid state. An inactive home must never feel broken or empty.
12. No streaks, popularity counters, public likes, rankings, engagement scores, or manipulative notifications.
13. AI must remain invisible and assist people without becoming an emotional participant.
14. What happens inside a Space must remain private to that Space.

Do not add features that conflict with these principles.

---

# 3. MVP Scope

Implement only the following MVP capabilities:

1. Account registration and login
2. Create a private Space
3. Invite one other person into the Space
4. Enter the shared Home
5. View both Residents and their current Presence
6. Create a Life Point
7. View Life Points inside Home
8. Open a Life Point detail page
9. Respond to a Life Point
10. Convert a responded-to Life Point into a Shared Moment
11. Revisit past Shared Moments
12. Basic settings and privacy controls
13. Responsive mobile-first interface
14. Seed/demo mode for local testing

Do not implement:

* public profiles
* public content
* followers
* likes
* streaks
* chat rooms
* dating features
* family expansion
* children or pet accounts
* push notifications
* advanced AI generation
* relationship scores
* recommendation feeds
* advertisements
* subscriptions
* gamification
* complex memory algorithms

Leave clean extension points for future development, but do not build those features now.

---

# 4. Core Domain Model

There are exactly six core product entities:

1. Space
2. Resident
3. Presence
4. LifePoint
5. Response
6. SharedMoment

Do not create a core Memory entity.

Memory is not a separate database object.

A memory emerges from a Shared Moment as it accumulates time, revisits, responses, and meaning.

Principle:

> Moments are captured. Memories are grown.

Supporting infrastructure entities such as User, Session, Invitation, MediaAsset, and AuditLog are allowed, but they are not product-domain entities.

---

# 5. Entity Definitions

## 5.1 User

A User is an authenticated account.

Suggested fields:

```ts
id: string
email: string
name: string
passwordHash?: string
imageUrl?: string
createdAt: Date
updatedAt: Date
```

A User may become a Resident inside a Space.

For the MVP, one User can belong to one active Space.

Design the schema so this restriction can later be relaxed.

---

## 5.2 Space

A Space is the private shared home.

Suggested fields:

```ts
id: string
name: string
createdByUserId: string
createdAt: Date
updatedAt: Date
```

Rules:

* A Space is private.
* The MVP supports a maximum of two active Residents.
* Only Residents of the Space can access its data.
* A Space must never expose content publicly.
* Deleting or leaving a Space must require explicit confirmation.

---

## 5.3 Resident

A Resident represents a participant living inside a Space.

It is not identical to a User account because the product may later support remembered residents, pets, children, or other household participants.

Suggested fields:

```ts
id: string
spaceId: string
userId: string
displayName: string
avatarUrl?: string
role: "OWNER" | "RESIDENT"
joinedAt: Date
createdAt: Date
updatedAt: Date
```

Rules:

* Each Resident belongs to one Space.
* Each Space has at most two active Residents in the MVP.
* Resident-facing language should use “Resident” or a natural equivalent, not “member” where possible.

---

## 5.4 Presence

Presence represents “today's version” of a Resident.

It is not online status.

It must not expose surveillance-like information.

Suggested fields:

```ts
id: string
residentId: string
shortText?: string
mood?: string
context?: string
updatedAt: Date
```

Examples:

* “At the library”
* “A quiet morning”
* “Just finished basketball”
* “Heading home”

Rules:

* Do not show online/offline indicators.
* Do not show “last seen.”
* Do not show typing status.
* Presence is optional.
* An unset Presence should feel calm, not incomplete.
* Presence can be updated manually.
* Presence should be visually lightweight.

---

## 5.5 LifePoint

A Life Point is one meaningful moment.

It is not a post and does not need to tell a complete story.

Suggested fields:

```ts
id: string
spaceId: string
residentId: string
text?: string
mediaUrl?: string
mediaType?: "IMAGE" | "AUDIO"
visibility: "PRIVATE" | "SHARED_WITH_RESIDENT" | "SHARED_WITH_HOME"
status: "DRAFT" | "PUBLISHED" | "REMOVED"
occurredAt: Date
createdAt: Date
updatedAt: Date
```

MVP simplification:

* Support text
* Support one optional image
* Leave audio support as a typed extension point but do not fully implement recording unless straightforward
* Default visibility should be `SHARED_WITH_HOME`

Rules:

* A Life Point may contain only text, only media, or both.
* It should be fast to create.
* Do not force a title.
* Do not force tags.
* Do not force a location.
* Do not require a complete story.
* Do not expose public reactions or counters.
* The owner may remove it from Home or keep it private.
* A Life Point becomes eligible to form a Shared Moment after receiving at least one Response from the other Resident.

---

## 5.6 Response

A Response means receiving or holding a Life Point.

It is not a public comment thread.

Suggested fields:

```ts
id: string
lifePointId: string
residentId: string
text?: string
mediaUrl?: string
responseType: "TEXT" | "IMAGE" | "RECEIVED" | "HOLD_FOR_LATER"
createdAt: Date
updatedAt: Date
```

Rules:

* A Resident cannot respond to their own Life Point in the MVP.
* A Response belongs to exactly one Life Point.
* The interface must not call this a “comment.”
* Supported lightweight responses:

  * short text
  * “Received”
  * “Hold this for later”
  * optional image
* No reaction counts.
* No nested reply threads.
* No public visibility.
* No pressure to respond immediately.

---

## 5.7 SharedMoment

A Shared Moment is created when a Life Point has been received through a Response from the other Resident.

Suggested fields:

```ts
id: string
spaceId: string
lifePointId: string
createdAt: Date
updatedAt: Date
lastVisitedAt?: Date
visitCount: number
```

Rules:

* A Shared Moment references the originating Life Point.
* Its Responses are retrieved through the Life Point relationship.
* It should not duplicate Life Point content unnecessarily.
* Creation should be idempotent.
* Only one Shared Moment may exist per Life Point.
* A Shared Moment may be revisited later.
* Revisiting it should update `lastVisitedAt` and `visitCount`.
* Do not call the Shared Moment a “memory” in the database model.
* The UI may describe old Shared Moments using human language such as:

  * “Last summer”
  * “Our first week here”
  * “A quiet day together”

For the MVP, use simple date grouping. Do not implement advanced relationship-time inference.

---

# 6. Supporting Entities

Implement supporting entities as needed.

## Invitation

```ts
id: string
spaceId: string
email?: string
token: string
status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED"
expiresAt: Date
createdAt: Date
acceptedAt?: Date
```

## MediaAsset

```ts
id: string
spaceId: string
uploadedByUserId: string
storageKey: string
mimeType: string
sizeBytes: number
createdAt: Date
```

Use a storage abstraction.

For local development, store uploads locally.

Make it easy to replace the local adapter with S3-compatible storage later.

---

# 7. Required User Flows

## Flow A: First Entry

1. User opens the application.
2. User sees “Welcome Home.”
3. User creates an account or signs in.
4. User creates a Space.
5. User names the Space.
6. User receives an invitation link.
7. User may copy and share the link.
8. User enters Home.
9. Home should not display a depressing empty state.
10. Home should gently invite the user to leave today's first trace.

Suggested copy:

* “Welcome Home”
* “Create our space”
* “Invite someone important”
* “Leave a little of today”

---

## Flow B: Join Space

1. Invited user opens the invitation URL.
2. User signs in or creates an account.
3. User sees the Space name and inviter identity.
4. User accepts the invitation.
5. A Resident record is created.
6. User enters Home.
7. Both Residents appear in the Presence area.

Handle:

* expired token
* revoked token
* already accepted invitation
* Space already full
* signed-in account already belonging to the Space

---

## Flow C: Leave a Life Point

1. Resident selects the primary “Leave a little” action.
2. A lightweight composer opens.
3. Resident can enter short text.
4. Resident may attach one image.
5. Resident chooses privacy visibility if needed.
6. Resident publishes.
7. The Life Point appears inside Home.
8. The animation should feel like placing something gently into the home.

The composer must not look like a social-media posting form.

Avoid:

* hashtags
* audience metrics
* engagement prompts
* character-pressure UI
* trending suggestions

---

## Flow D: Receive a Life Point

1. Other Resident sees the Life Point.
2. Resident opens it.
3. Resident can:

   * send a short text response
   * choose “Received”
   * choose “Hold this for later”
4. A Response is created.
5. A Shared Moment is created if none exists.
6. The UI quietly indicates that the moment is now shared.

Avoid celebratory gamification.

---

## Flow E: Return to the Past

1. Resident opens “Visit.”
2. Resident sees past Shared Moments grouped by human-readable periods.
3. Resident opens a Shared Moment.
4. The original Life Point and Responses are shown together.
5. The visit is recorded.
6. The user may return Home easily.

For the MVP, grouping may include:

* Today
* This Week
* Earlier This Month
* Last Month
* Earlier

Do not create a high-density social feed.

---

# 8. Information Architecture

Use the following navigation:

```text
Home
Visit
Settings
```

Primary create action:

```text
Leave a little
```

Suggested routes:

```text
/
  marketing or redirect

/welcome
/login
/register

/invite/[token]

/home
/life-points/new
/life-points/[id]
/visit
/shared-moments/[id]
/settings
/settings/space
/settings/privacy
```

Authenticated application layout:

```text
AppShell
├── Header
├── MainContent
├── PrimaryCreateAction
└── BottomNavigation on mobile
```

---

# 9. Home Screen Specification

The Home screen is the central product experience.

Purpose:

> Help the user feel that shared life is still happening.

Primary emotion:

> Quiet reassurance.

The user should understand within approximately three seconds:

* who is here
* what has happened recently
* how to leave a small trace

Suggested structure:

```text
Home Header
Resident Presence Area
Today Section
Recent Life Points and Shared Moments
Gentle Past Moment
Primary “Leave a little” Action
```

Rules:

* Do not call the content area a Feed.
* Avoid infinite scroll.
* Limit initial Home results to a calm, finite set.
* Load additional older content through “Visit the past.”
* Do not display “No posts yet.”
* If there is no content, show:

  * the Residents
  * a calm environmental empty state
  * one gentle creation prompt
* Silence must feel intentional.
* Avoid badges, red dots, unread counts, and urgency cues.

Suggested empty-state copy:

> “It is quiet here today.”

Supporting copy:

> “You can leave a little of the day whenever it feels right.”

---

# 10. Visual Design Direction

Create a calm, warm, spacious interface.

Keywords:

* home
* quiet
* warm
* private
* soft
* intimate
* breathable
* timeless

Avoid:

* glossy social media aesthetics
* high-saturation gradients
* aggressive contrast
* notification red
* dense dashboards
* gamified cards
* excessive icons
* overly playful illustrations
* corporate SaaS appearance

Use:

* generous spacing
* soft borders
* subtle elevation
* rounded but not childish components
* readable typography
* restrained color palette
* natural motion
* strong accessibility contrast where required

Do not hardcode a complex brand identity yet.

Create reusable design tokens for:

```ts
spacing
radius
shadow
fontSize
fontWeight
surface
text
border
accent
danger
motionDuration
motionEasing
```

The design system should support light mode first.

Dark mode may be left as a future extension point.

---

# 11. Motion Principles

Motion should be calm and meaningful.

Implement subtle motion for:

* entering Home
* adding a Life Point
* opening a moment
* completing a Response
* transitioning to Visit

Avoid:

* bouncing
* confetti
* fireworks
* rapid pulsing
* attention-seeking loops
* reward animations

Default duration range:

```text
180ms–320ms for direct interactions
320ms–500ms for gentle page or content transitions
```

Respect `prefers-reduced-motion`.

---

# 12. Microcopy Principles

Use human, warm, restrained language.

Prefer:

* “Welcome Home”
* “Leave a little”
* “Someone left a moment”
* “Received”
* “Hold this for later”
* “Visit”
* “Remove from Home”
* “Keep privately”
* “It is quiet here today”

Avoid:

* “Post”
* “Comment”
* “Engagement”
* “Activity score”
* “Unread”
* “You have not posted today”
* “Keep your streak”
* “Your partner is waiting”
* “Respond now”

Do not create emotional pressure.

---

# 13. Privacy and Authorization

Privacy is essential.

Implement authorization at the server layer, not only in the UI.

Requirements:

* Users can only access Spaces where they are Residents.
* Users can only access Life Points visible to them.
* Private Life Points are visible only to their owner.
* Shared Home content is visible only to Residents of the relevant Space.
* Invitation tokens must be difficult to guess.
* Validate MIME types and upload size.
* Do not expose internal storage paths.
* Sanitize user-generated content.
* Add CSRF protection where applicable.
* Use secure password hashing.
* Add rate limiting abstractions to authentication and invitation endpoints.
* Do not send Space content to external AI providers in the MVP.

Never use relationship data for advertising or behavioral manipulation.

---

# 14. Technical Stack

Use:

```text
Next.js 15
React
TypeScript with strict mode
App Router
Tailwind CSS
PostgreSQL
Prisma ORM
Auth.js / NextAuth
Zod
React Hook Form where appropriate
Vitest
Testing Library
Playwright
ESLint
Prettier
```

Prefer Server Components by default.

Use Client Components only where interaction requires them.

Use Server Actions or route handlers consistently.

Do not mix patterns without reason.

Use a modular architecture.

Suggested structure:

```text
src/
  app/
  components/
    ui/
    home/
    presence/
    life-point/
    response/
    shared-moment/
  features/
    auth/
    spaces/
    residents/
    presence/
    life-points/
    responses/
    shared-moments/
    invitations/
    media/
  lib/
    auth/
    db/
    storage/
    validation/
    permissions/
    dates/
  server/
    services/
    repositories/
  styles/
  types/
```

Keep business logic outside React components.

---

# 15. Service Boundaries

Implement clear service modules:

```text
SpaceService
InvitationService
ResidentService
PresenceService
LifePointService
ResponseService
SharedMomentService
MediaService
```

Each service should:

* validate input
* enforce permissions
* execute business rules
* use transactions where necessary
* return typed results
* provide predictable errors

Use repository abstractions only where they improve testability.

Do not overengineer with unnecessary enterprise patterns.

---

# 16. Required API or Server Actions

Implement the equivalent of:

```text
POST   /api/spaces
GET    /api/spaces/current

POST   /api/invitations
GET    /api/invitations/[token]
POST   /api/invitations/[token]/accept

GET    /api/home

GET    /api/presence
PUT    /api/presence

POST   /api/life-points
GET    /api/life-points/[id]
PATCH  /api/life-points/[id]
DELETE /api/life-points/[id]

POST   /api/life-points/[id]/responses

GET    /api/shared-moments
GET    /api/shared-moments/[id]
POST   /api/shared-moments/[id]/visit

POST   /api/media/upload
```

The precise implementation may use Server Actions instead of REST endpoints, but the domain operations and boundaries must remain clear.

---

# 17. Required Business Rules

Enforce all of the following:

1. A Space may have at most two active Residents in the MVP.
2. A User may not accept an invitation to a full Space.
3. A Resident may not respond to their own Life Point.
4. A Shared Moment must be created only after a Response from the other Resident.
5. Shared Moment creation must be idempotent.
6. A private Life Point must never appear to the other Resident.
7. Removing a Life Point must not silently destroy associated content.
8. Use soft removal where appropriate.
9. Invitation acceptance must be transactional.
10. All Space-level reads must verify membership.
11. Home must return a finite, ordered collection.
12. Date grouping must be based on `occurredAt`, with fallback to `createdAt`.
13. All timestamps must be stored in UTC.
14. Display dates using the user's local timezone.
15. Do not expose exact activity tracking.

---

# 18. Home Query Shape

Return a typed Home view model similar to:

```ts
type HomeViewModel = {
  space: {
    id: string;
    name: string;
  };
  residents: Array<{
    id: string;
    displayName: string;
    avatarUrl?: string;
    presence?: {
      shortText?: string;
      mood?: string;
      updatedAt: string;
    };
  }>;
  today: Array<HomeItem>;
  recent: Array<HomeItem>;
  gentleReturn?: {
    sharedMomentId: string;
    label: string;
    previewText?: string;
    mediaUrl?: string;
  };
};

type HomeItem =
  | {
      type: "LIFE_POINT";
      id: string;
      resident: ResidentSummary;
      text?: string;
      mediaUrl?: string;
      occurredAt: string;
      responseState: "NONE" | "RECEIVED" | "HOLD_FOR_LATER" | "RESPONDED";
    }
  | {
      type: "SHARED_MOMENT";
      id: string;
      lifePointId: string;
      resident: ResidentSummary;
      text?: string;
      mediaUrl?: string;
      occurredAt: string;
      responseCount: number;
    };
```

Do not expose unnecessary database fields directly to the client.

---

# 19. Seed Data

Provide a seed script containing:

* two demo Users
* one Space
* two Residents
* two Presence records
* several Life Points
* several Responses
* at least two Shared Moments

Seed data should feel ordinary and human.

Examples:

* morning coffee
* basketball
* rain outside
* walking home
* a quiet dinner

Do not use generic SaaS placeholder data.

---

# 20. Required Tests

At minimum, include tests for:

## Unit and service tests

* Space creation
* invitation creation
* invitation acceptance
* full Space rejection
* Presence update
* Life Point creation
* private Life Point authorization
* preventing self-response
* Response creation
* idempotent Shared Moment creation
* Shared Moment visit tracking
* Home query filtering

## End-to-end tests

1. User creates a Space.
2. User creates an invitation.
3. Second user accepts it.
4. First Resident creates a Life Point.
5. Second Resident responds.
6. Shared Moment appears.
7. Both Residents can revisit it.
8. Unauthorized user cannot access the Space.

---

# 21. Accessibility

Meet WCAG-oriented baseline requirements.

Implement:

* keyboard navigation
* visible focus states
* semantic HTML
* accessible labels
* image alt text support
* reduced-motion support
* sufficient color contrast
* error messages connected to fields
* no interaction that depends only on color
* mobile touch targets of appropriate size

---

# 22. Error Handling

Use typed domain errors.

Examples:

```ts
SpaceNotFoundError
NotSpaceResidentError
SpaceFullError
InvitationExpiredError
InvitationAlreadyUsedError
CannotRespondToOwnLifePointError
LifePointNotVisibleError
UploadValidationError
```

Show user-facing errors in calm, non-technical language.

Avoid alarming language unless the issue is genuinely serious.

---

# 23. Implementation Sequence

Work in the following order.

## Phase 1: Foundation

* initialize project
* configure TypeScript
* configure Tailwind
* configure linting and formatting
* configure environment validation
* configure Prisma and PostgreSQL
* create base design tokens
* create test infrastructure

## Phase 2: Authentication and Space

* registration
* login
* protected routes
* Space creation
* Resident creation
* invitation flow

## Phase 3: Core Home

* application shell
* Home screen
* Resident Presence
* Presence editing
* empty and quiet states

## Phase 4: Life Points

* creation flow
* image upload
* display cards
* detail page
* visibility rules

## Phase 5: Response and Shared Moment

* response UI
* response service
* Shared Moment creation
* moment detail experience

## Phase 6: Visit

* Shared Moment history
* date grouping
* revisit tracking

## Phase 7: Quality

* authorization review
* accessibility
* tests
* responsive polish
* seed data
* documentation

Do not start advanced AI, push notifications, native applications, or family features.

---

# 24. Required Deliverables

Produce:

1. Complete runnable source code
2. Prisma schema
3. Database migrations
4. Seed script
5. `.env.example`
6. Local setup instructions
7. Architecture overview
8. API or Server Action documentation
9. Test suite
10. Sample accounts
11. Clear README
12. A short `DECISIONS.md` documenting important implementation decisions
13. A short `KNOWN_LIMITATIONS.md`
14. Screenshots are optional, but the application must run locally

---

# 25. README Requirements

The README must include:

```text
What Our Space is
Product principles
Technical stack
Local prerequisites
Environment variables
Database setup
Migration commands
Seed commands
Development command
Test commands
Production build command
Demo account credentials
Folder structure
Known MVP limitations
```

---

# 26. Definition of Done

The MVP is complete only when:

* a new user can register
* a user can create a Space
* the user can invite a second person
* the second person can join
* both appear as Residents
* Presence can be viewed and updated
* either Resident can create a Life Point
* privacy rules are enforced
* the other Resident can respond
* the response creates a Shared Moment
* Shared Moments can be revisited
* Home feels calm and complete even with little content
* the application works on mobile and desktop
* unauthorized users cannot access Space data
* tests pass
* setup is documented
* the project runs locally from a clean checkout

---

# 27. Working Instructions

Follow these instructions while implementing:

1. First inspect the existing repository.
2. Do not delete working code without a clear reason.
3. Summarize the current repository state.
4. Create an implementation checklist.
5. Implement in small, coherent steps.
6. Run tests after each major phase.
7. Fix TypeScript, lint, test, and build errors before moving forward.
8. Do not leave placeholder functions in core flows.
9. Do not silently reduce scope.
10. If a requirement is ambiguous, choose the simplest implementation consistent with the product principles.
11. Record major assumptions in `DECISIONS.md`.
12. Do not introduce additional product entities without justification.
13. Do not add engagement mechanics.
14. Do not add an AI personality.
15. Optimize first for correctness, privacy, clarity, and emotional calm.
16. At the end, run:

* lint
* typecheck
* unit tests
* end-to-end tests
* production build

17. Report exactly:

* what was implemented
* files added or changed
* tests executed
* unresolved limitations
* recommended next engineering step

Begin by inspecting the repository and producing the implementation checklist. Then proceed with implementation without asking broad product questions.
