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
15. Create and confirm a persistent cartoon visual identity for each Resident
16. Express a Resident's voluntarily shared current state through the same confirmed character
17. Provide a map with clearly defined markers / status points as a core spatial expression

Items 15–17 were added by the 2026-09-04 product-requirement revision. They were not part of the original implementation baseline. Their product goals are confirmed and required, while detailed design, safety conditions, Phase placement, and implementation approval remain pending. See Section 28 and [`AVATAR_AND_MAP_SPEC.md`](./AVATAR_AND_MAP_SPEC.md).

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
* advanced AI generation outside the narrowly scoped Resident cartoon-identity requirement in Section 28
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
* A Resident's confirmed cartoon identity is a persistent visual expression of that Resident, not a different generated person for each state update.
* The presence of `avatarUrl` or a single static image does not by itself complete the cartoon-identity or state-animation requirements.
* Detailed identity, asset, consent, lifecycle, and animation requirements are defined by Section 28 and [`AVATAR_AND_MAP_SPEC.md`](./AVATAR_AND_MAP_SPEC.md); their implementation is not yet approved.

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
9. After registration or first entry, the product prominently invites the user to create a cartoon identity; this must not be hidden only in low-frequency Settings.
10. Whether identity creation blocks Home, requires a real photo, or offers a non-photo fallback remains undecided and must not be inferred.
11. Home should not display a depressing empty state.
12. Home should gently invite the user to leave today's first trace.

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

2026-09-04 进一步确认：真实世界像素地图是未来 Home 的全屏主体，不新增次级 Map destination。本轮只批准具体规格与隔离原型；生产导航与 `/home` 切换仍需实施批准。见第 29 节。

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

以下是已验收 Phase 3 的历史文字布局；后续由第 29 节地图主体演进取代其视觉结构，保留 Quiet Home 哲学与业务基础：

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
* 争夺注意力的插画；第 29 节温暖像素 Q 版角色是已明确要求
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
* expressing a voluntarily shared current state through the Resident's same confirmed cartoon identity, once that feature is designed and approved

Presence 状态动画不暗示在线、定位、后台监控或推断情绪。第 29 节另行明确基于本人授权且已记录的可信位置变化回放；状态动画与位置回放不能混为一体。 An expired or cleared Presence must not continue to present an old animation as current. Preserve a meaningful static presentation under `prefers-reduced-motion`; see Section 28.

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
* The Section 28 avatar flow does not authorize external processing by itself. Before any selfie or photo is transmitted, the exact input, provider, informed consent, retention, deletion, access, failure, and withdrawal behavior must be separately approved.
* Even if a future avatar-specific exception is approved, Presence, LifePoint, Response, SharedMoment, Space content, and relationship data must not be included as implicit AI inputs.
* A map requirement does not authorize continuous location collection or background tracking.

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
15. 不暴露精确活动已读、last-seen 或无感监控；第 29 节允许本人知情、自主控制的共享位置表达，采集及后台能力仍须专项批准。

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

The 2026-09-04 revision also establishes three required delivery tracks: `AVATAR-01`, `ANIMATION-01`, and `MAP-01`. Their product outcomes are mandatory, not optional post-MVP decoration, but their exact placement within or alongside Phases 4–7 is a proposal that requires separate approval. Dependency guidance is recorded in [`AVATAR_AND_MAP_SPEC.md`](./AVATAR_AND_MAP_SPEC.md) and `IMPLEMENTATION_PLAN.md`: identity precedes state animation; map semantics and privacy must be settled before map implementation; and integration with LifePoint / SharedMoment / Visit must follow the actual availability of those domain capabilities.

Do not start AI implementation, map integration, push notifications, native applications, or family features without explicit Phase approval. The confirmed avatar requirement narrows the former blanket AI exclusion only at the product-goal level; no provider or external-data exception is currently approved.

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
* each Resident can complete the approved create/select/adjust-or-regenerate/confirm flow for a persistent cartoon identity, and the confirmed identity remains consistent across later use
* the same confirmed character can express approved, user-initiated current states with reduced-motion/static equivalence and without monitoring or identity drift
* the map and its approved marker/status-point semantics are delivered as a discoverable core spatial expression without forcing LifePoint location or implying continuous tracking

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

---

# 28. 卡通身份、状态动画与地图要求修订（2026-09-04）

本节是对原 Master Spec 的正式产品要求修订。原始规格只包含可选 `avatarUrl`、通用 motion、文字 Home 和“不得强制 LifePoint location”等基础，并未完整要求下列能力；不得声称这些功能一直存在于已完成的 Phase 1–3 验收基线中。

## 已确认的产品目标

1. **AVATAR-01 — 持久的卡通视觉身份：**Our Space 必须让 Resident 经历“自拍或上传照片 → AI 生成候选 → 选择、调整或重新生成 → 明确确认满意形象 → 后续持续使用同一角色”的完整目标流程。注册后或首次进入 Space 时必须显著引导，不能仅藏在低频 Settings。
2. **ANIMATION-01 — 同一角色的状态动画：**后续由用户主动留下的当前状态，应通过已确认的同一角色呈现相应动作或表情。只交付静态头像或每次生成身份不一致的新角色都不算完成。
3. **MAP-01 — 地图与标记／状态点：**地图是核心空间表达，不是可无限延期的边缘附加页面。标记／状态点必须具有明确、可区分、可访问的产品语义。

这些能力不增加第七个核心产品实体。它们必须保持 Quiet Home、双语 i18n、语言无关 URL、私密 Space 边界与 LifePoint → Response → SharedMoment → Visit 闭环。

## 当前仍有效的边界

- Presence 仍是可选、手动、非监控的“此刻”，并遵循 viewer-local-day freshness；过期或清除后，不得继续用旧动画表示当前活动。
- 状态动画不代表实时定位、online/offline、后台行为监控或情绪推断。
- 地图现已确认对应真实世界地理关系；这不自动授权位置采集或后台持续定位。
- Presence 与 LifePoint 必须保持概念区分；不得把所有状态点直接等同于 LifePoint。
- LifePoint 仍不强制 title、tag 或 location。
- 保留 `prefers-reduced-motion` 和等价静态展示，不引入装扮经济、等级、奖励、签到、streak 或更新压力。

## 尚未收口且不得擅自决定

- 头像创建是否阻断 Home、是否必须使用真人照片，以及拒绝上传/生成失败/不满意/撤回时的继续路径。
- 像素与柔和线条的 Q 版方向已确认；生产资源/渲染技术、完整动作库、状态映射、map provider 与 AI provider 仍待定。
- 地图对应真实地理并作为 Home 主体已确认；marker 分类与时间/权限规则在第 29 节及详细规格中细化，生产 lifecycle 仍需按阶段批准。
- 自拍、原图、候选、最终资源和可能的位置数据的保存、访问、期限、删除与 lifecycle 行为。
- 任何外部处理例外。用户确认 avatar 产品目标不等于授权把自拍、Presence 或 Space 内容发送给外部 provider。

详细需求状态、依赖、隐私条件、建议验收证据和未决问题集中记录于 [`AVATAR_AND_MAP_SPEC.md`](./AVATAR_AND_MAP_SPEC.md)。当前进一步批准具体规格、研究与隔离原型；AVATAR-01、ANIMATION-01、MAP-01 的生产实施及完整 Phase 4 均未获得批准。已完成 Phase 1–3 的历史验收继续有效。

对于已经获得明确批准的 implementation Phase，应先检查仓库并生成 implementation checklist，再按批准范围推进；不得把本节的产品目标确认当作 implementation 授权。

# 29. 真实世界像素地图 Home 具体修订（2026-09-04）

本节取代第 8–10、28 节中地图类型/入口未定及仅文字视觉布局作为未来目标的旧表述，不追溯修改 Phase 3 历史验收。详细规则与子要求集中见 [AVATAR_AND_MAP_SPEC.md](./AVATAR_AND_MAP_SPEC.md)。

- `MAP-01`：真实道路、水系、公园与地点关系必须来自地理数据；未来进入 Home 即见全屏地图。手机 375×812 与约 1280px 桌面分别设计。温暖米色、低饱和绿地/蓝水、克制 POI 和像素界面语言；用户进一步确认《星露谷物语》式像素乡野视觉，使用原创纹理/树冠/屋顶且保留真实地理关系，装饰不冒充实测 POI；候选色不是最终品牌色批准。底图必须保留来源/许可归因。
- `AVATAR-01`：像素感 + 柔和线条的原创 Q 版持久身份，约 2.5–3 头身；首次进入突出引导，自拍/上传 → AI 候选 → 选择/调整/重试 → 本人明确确认。是否阻断、照片替代及 provider/数据 lifecycle 尚待决定。
- `ANIMATION-01`：同一角色的自愿 Presence 表达与位置变化严格分离。GPS 不更新 `Presence.updatedAt`；clear/跨日停止旧状态动作而保留身份。可信新位置变化才触发一次短回放，无基线不虚构起点，无变化不走动，无数据不宣称未移动。
- 将采集、可信变化判断、回放分层。位置共享只能由被定位本人开启，不能由 OWNER 或伴侣代开；照片与位置分别授权。暂停/撤销后停止新读取/回放，重新检查缓存访问权限，不能拼接暂停期间路线。
- 只有端点时标明变化示意，不用导航路径伪造实际轨迹；有样本仅回放有效段，缺口保持缺口。步态不证明交通方式。长距离切换街区镜头；A→B→A 不被吞掉，多段有界且说明选择范围。
- 完成/跳过后刷新和语言切换不自动重播。游标属于查看者私有 UI 状态，按账户/Space 隔离，不形成对方可见的已读。可关闭、可跳过，reduced-motion 有文本与静态前后位置等价。
- Resident 地理锚点、Presence 动作和 LifePoint 生活针含义不同；无地点 LifePoint 保持自然入口，不强制选坐标，不因 GPS 自动创建生活记录或 SharedMoment。六核心实体与原 LifePoint → Response → SharedMoment → Visit 闭环完整保留。
- Web/PWA 无法可靠保证被定位方隐藏/锁屏/关闭页面后的持续采样。完整后台目标需要原生定位工作包及明确范围修订；旧 native applications 排除项尚未被授权修改。不得偷偷降为“双方一直开网页”，也不得直接创建原生工程。
- 本轮授权仅限相关文档、实现研究、`prototypes/map-home/` 的原创代码/合规公开数据/独立测试/截图，以及验证后的提交和正常 push；不改生产代码、依赖、Schema、migration，不请求自拍或位置，不调用付费服务/外部 AI。

本轮状态：**具体规格与隔离原型已完成，等待用户确认视觉和实现方案。** 这不代表 AI 头像、真实位置共享、后台轨迹、生产地图 Home 或 Phase 4 已完成。
