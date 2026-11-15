# PortfolioBot

Vamshi Krishna Adam’s project portfolio, with GitHub-powered project discovery and an assistant grounded in public project documentation.

[Source on GitHub](https://github.com/vams2krish/PortfolioBot) · [Import into Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvams2krish%2FPortfolioBot)

![Portfolio homepage](docs/assets/portfolio-hero.png)

| Product view | Screenshot |
| --- | --- |
| Project gallery | [Browse projects](docs/assets/project-showcase.png) |
| Project detail | [Screenshots and deployment links](docs/assets/project-details.png) |
| Project assistant | [Scoped answer with sources](docs/assets/project-avatar-chat.png) |
| Contact | [Booking and contact links](docs/assets/contact.png) |
| Mobile | [Responsive homepage](docs/assets/portrait-mobile.png) |

## Run locally

Requires Node.js 20+. Run `npm start` and open http://127.0.0.1:4175/. Run `npm test` for automated tests and `npm run sync:github` to refresh the project snapshot manually.

Ollama is optional. When available, the local assistant answers using retrieved portfolio context; otherwise it shows relevant excerpts and source links. Configure `OLLAMA_URL` and optionally `OLLAMA_MODEL` in the process environment. The local-only image endpoint uses `AUTOMATIC1111_URL` and saves generated output separately from the supplied headshot.

## Deploy to Vercel

Import this repository using the link above. The project serves static assets from `public/` and API routes from `api/`. Hosted mode uses source excerpts and booking links without connecting to the local Ollama or image server. The hosted snapshot comes from the deployed Git revision; GitHub Actions can refresh it, and a Git-connected deployment picks up subsequent commits.

## Product flows

- Search and filter the gallery; select a project to browse its available images.
- Open the source repository, a hosted demo, or a notebook when available. Owner-only previews and unavailable endpoints are labeled.
- Ask the assistant about a selected project. Follow-up questions stay scoped to that project until the scope is cleared.
- Book a call through Calendly or use the contact links.

## Design and data

The palette in `public/design.css` uses navy backgrounds, layered slate surfaces, lavender for primary actions, and mint for focus and accents. Shared tokens cover color, spacing, and corner radii. Older styling files provide the base layout. The UI adapts to mobile and respects reduced-motion settings.

Personal details are in `profile.json`. Public repository metadata, README excerpts, image references, and deployment links are stored in `data/github-snapshot.json`. The local server can refresh the snapshot on an interval; GitHub Actions maintains the repository copy. When GitHub is unavailable, the last good snapshot remains in use.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/profile` | Public profile and project gallery |
| GET | `/api/status` | Local service or hosted mode status |
| POST | `/api/chat` | Question with optional project context |
| POST | `/api/avatar` | Optional local image generation |

Browser checks cover the gallery, search, project details, deployment links, scoped chat, Calendly links, and mobile width. The screenshot gallery shows the application running in hosted fallback mode.
