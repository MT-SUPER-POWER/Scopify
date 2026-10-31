# Scopify Web Frontend

This is the web frontend for Scopify, a music player application based on NetEase Music API.

## Overview

Scopify Web is a Next.js application that provides a modern music listening experience with features including:

- Music playback and controls
- Playlist management
- Search functionality
- User authentication
- Album and artist browsing
- Lyrics display
- Settings and preferences

## Tech Stack

- **Framework**: Next.js 16
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **3D Graphics**: Three.js with React Three Fiber
- **Animation**: Framer Motion
- **Icons**: Tabler Icons, Lucide React

## Development

### Prerequisites

- Bun 1.3.7+
- Node.js 20+

### Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the development server:

   ```bash
   pnpm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `dev` - Start development server
- `build` - Build the complete Next.js Web application
- `build:desktop` - Export the static renderer consumed by Electron
- `start` - Start production server
- `typecheck` - Check TypeScript without emitting files
- `test` - Run Web unit tests
- `lint` - Run ESLint
- `format` - Format code with Prettier
- `i18n:audit` - List hard-coded text candidates with x18n

### Internationalization

Translation resources, runtime helpers, and i18n tooling belong to this Web workspace. Run these commands from `repo/frontend/apps/web/`:

React components use `useTranslation` from `react-i18next`. Translation keys keep the resource namespace before the first dot (for example, `ui.next` refers to `next` in `ui.json`, while `folia.ui.next` refers to `ui.next` in `folia.json`). The saved app locale is synchronized with the i18next instance.

```bash
pnpm run i18n:audit # List hard-coded text candidates with x18n
```

From the repository root, `pnpm i18n:x18n check` also checks translation resources and usage. Its configuration recognizes literal keys stored in tables or passed through state, in addition to direct translation calls. When adding a locale namespace, add it to the `usage.regex` namespace alternatives in `x18n.config.json`. Add a narrow `usage.keysInUse` pattern for keys constructed dynamically outside translation calls.

The literal-key scan is conservative: a matching string can count as usage even if it is not translated, and a reported unused key may still be used dynamically. Review references before removing translations; type declarations and tests are excluded from usage scans.

## Project Structure

```
repo/frontend/apps/web/
├── app/              # Next.js app router pages
├── components/       # React components
├── constants/        # Web constants and translations
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── public/           # Static assets
├── resources/        # Assets imported by components
├── scripts/          # Web-only development and i18n tooling
├── store/            # Zustand state management
├── tests/            # Web unit tests
├── types/            # TypeScript type definitions
├── next.config.ts    # Next.js configuration
├── tsconfig.json     # Self-contained TypeScript configuration
└── package.json      # Project dependencies
```

## Configuration

The web frontend uses environment variables for configuration. Copy this directory's `.env.example` to `.env.local` when local overrides are required.

Key configuration files:

- `next.config.ts` - Next.js configuration
- `postcss.config.mjs` - PostCSS configuration
- `components.json` - shadcn/ui component configuration

## Integration with Electron

This app has two build profiles. The default `build` keeps the normal Next.js server features for Web deployment. `build:desktop` enables static export and writes the renderer artifact to `out/` for the Electron app under `repo/frontend/apps/desktop`.

For Electron integration, see the main Scopify repository.

## Docker Deployment

To run with Docker:

```bash
docker-compose up frontend
```

This will build and serve the web frontend on port 3000.

## License

See the LICENSE file in the root directory for details.
