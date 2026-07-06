# mhs-gameplay-end — Context for Claude Code

## What This Repo Does

This repository will house the **end-of-game experience for Mission HydroSci (MHS)** — the culminating screens and interactions students see when they complete a unit or the entire game. The end experience serves three core goals: (1) reinforce positive feelings about the gameplay and learning experience, (2) summarize and reiterate key learning outcomes with integrated performance feedback, and (3) display a visual montage of in-game moments with Dr. Toppo narrating the student's journey and achievements.

Currently, this is a planning repository with minimal scaffolding. The actual implementation will integrate with stratahub (the MHS web app) to fetch student performance data, learning summaries, and in-game screenshots, then present them in an engaging, celebratory UI.

## Technology Stack

- **Language(s):** Primarily JavaScript/TypeScript (front-end experience); possible Go integration if merged into stratahub backend
- **Framework(s):** TBD — likely React or a lightweight UI framework for interactive experience; may use HTMX/Go templates if integrated with stratahub's Waffle stack
- **Database:** MongoDB (via stratahub's existing stores) — read-only access to student performance, logdata, and resource metadata
- **Deployment:** Likely served as part of stratahub (same Go server) or as a companion static/SPA application

## Folder Structure

```
mhs-gameplay-end/
├── README.md                           # Project overview
├── end-experience-goals.md             # Design goals and requirements
├── LICENSE                             # MIT License
├── .gitignore                          # Node.js project ignore patterns
├── ai/                                 # AI documentation
│   └── context.md                      # This file
├── src/                                # (To be created) Application source code
│   ├── components/                     # Reusable UI components
│   ├── screens/                        # End-experience screen flows
│   ├── services/                       # API calls, data fetching
│   ├── assets/                         # Images, audio, styling
│   └── index.js                        # Entry point
├── public/                             # (To be created) Static assets served as-is
└── docs/                               # (To be created) Design specs, mockups, API contracts
```

The organizing principle will depend on the final tech stack choice:
- **If React/SPA:** Organized by features/screens (splash, feedback, montage, celebration)
- **If Go/Waffle integration:** Will follow `stratahub/internal/app/features/endgame/` pattern with handler, routes, templates

## Code Patterns & Conventions

- **Naming:** Component/function names use PascalCase (React) or camelCase (functions). Screen/route names use descriptive, kebab-case format (e.g., `FeedbackSummary.jsx`, `student-journey-montage`).
- **Organization:** By feature/screen rather than by technical layer (components/ → screens/ → services). Shared UI components in a `common/` or `components/` folder.
- **Error handling:** Graceful fallbacks for missing student data (e.g., default messaging if screenshots unavailable). Network errors shown to user with retry option.
- **Auth:** Inherits from stratahub's session/auth system; end experience screens are gated to authenticated students/leaders viewing their own or assigned group data.
- **Data flow:** Fetches student performance summaries and screenshots from stratahub API; no server-side rendering of personalized content (all data is static after fetch).

## Key Dependencies & Gotchas

1. **Screenshot availability:** The montage feature depends on stratahub capturing and storing in-game screenshots at key moments. This requires coordination with the Unity game and stratahub's screenshot storage/retrieval. If screenshots aren't available, the experience must gracefully degrade to text-only feedback.

2. **Performance data timing:** The end experience reads from stratahub's graded student performance (mhsgrader output via Dashboard). Ensure the grading pipeline has completed before rendering the end experience; consider a "pending grade" state if timing is off.

3. **Narrative/personalization:** Dr. Toppo's narration and montage sequencing should reflect actual student choices and performance (green vs. yellow progress points, specific learning gaps). This requires rich context passed from stratahub; coordinate on the data contract (e.g., per-unit summaries, reason codes, screenshot metadata).

4. **Integration point:** This repo may initially be standalone (SPA or separate service) but will likely be merged into stratahub's feature structure (`internal/app/features/endgame/`) or served as a companion route. Design with both possibilities in mind; keep data-fetching logic decoupled from UI.

5. **Accessibility and engagement:** Student-facing experience; prioritize clear, encouraging language and inclusive design (color contrast, readable fonts, mobile-friendly). Avoid overwhelming amounts of text or metrics; focus on celebration and learning narrative.

## How to Run Locally

### If JavaScript/React (SPA):

```bash
# Install dependencies
npm install

# Start development server (usually http://localhost:3000)
npm start

# Build for production
npm run build
```

### If Go/Waffle integration (part of stratahub):

```bash
# After implementing as stratahub feature:
cd /path/to/stratahub
go run ./cmd/stratahub

# Routes will be available at http://localhost:8080/game-end/* (TBD)
```

### Expected environment variables (for API communication):

```bash
STRATAHUB_API_URL=http://localhost:8080  # Or deployed stratahub URL
STUDENT_ID=<from session>                # Passed from stratahub auth
```

## Related Repos

- **stratahub** — Main MHS web application (Go/Waffle); Dashboard displays student grades, and this repo will consume student performance data via stratahub's API. The end experience may eventually be integrated as a stratahub feature.
- **mhsgrading** — Defines grading rules and reason codes; the end experience will display these reason codes as part of feedback (e.g., "You selected the wrong argument—here's why it matters").
- **mhscurriculum** — Source curriculum and learning objectives; end experience should reference these when explaining what was learned.
- **Unity game (stratalog)** — Emits in-game events and screenshots; end experience will consume screenshot metadata to build the montage.

## Notes for Claude

1. **Phased rollout:** Start with a minimal "summary card" view (unit recap + key learning points), then expand to the full montage experience once screenshot infrastructure is solidified.

2. **Data contract:** Define the JSON API contract between stratahub and this end experience early (e.g., `GET /api/student/:studentId/unit/:unitId/summary`). This unblocks frontend development even if the backend isn't ready.

3. **Narrative layer:** Dr. Toppo's voice/narration isn't just data display—it's an emotional anchor. Consider simple animation/reveal sequences for text and images to make the experience feel alive and celebratory rather than static.

4. **Replay safety:** If end-experience screens can be revisited, ensure they show the correct data even after re-grading. Timestamp screenshots and grade results so montage order doesn't depend on database state alone.

5. **Testing:** Unit tests for data transformation logic (e.g., converting reason codes to student-friendly messages). Integration tests with stratahub API mocks. Manual testing with real student data from deployed stratahub instance.

6. **Documentation:** Once architecture is settled (SPA vs. Waffle feature), create a `DEPLOYMENT.md` or similar in this repo explaining how to integrate with stratahub or deploy standalone.
