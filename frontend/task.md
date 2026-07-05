# Servify Frontend Development Tasks

This task list tracks the progress of the Next.js frontend implementation and its integration with the NestJS backend.

## Phase 1: Setup & Initialization
- [x] Initialize Next.js app with TypeScript and Tailwind CSS
- [x] Configure shadcn/ui component library (`button.tsx` & `utils.ts` initialized)
- [x] Create API clients & State Providers
  - [x] Set up Axios base client with authorization interceptors (to attach JWT tokens)
  - [x] Set up TanStack React Query Provider in `app/layout.tsx`

## Phase 2: Core Pages & UI Design
- [x] **Home Page / Marketplace Landing Page**
  - [x] Design hero section (introducing Servify freelance marketplace)
  - [x] Create search bar/filter UI placeholder for services
  - [x] Design featured categories & top-rated freelancers display cards
  - [x] Add responsive mobile hamburger menu & navigation drawer
  - [x] Add premium light & dark mode toggle with local storage persistence
- [x] **Authentication Screens**
  - [x] Build `/signup` page using shadcn/ui Forms & input validation
  - [x] Build `/login` page using shadcn/ui Forms & input validation

## Phase 3: Backend API Integration
- [x] Integrate user signup API (calling `POST /api/v1/auth/signup`)
- [x] Integrate user login API (calling `POST /api/v1/auth/login`)
- [x] Implement JWT token storage (managing Auth state via Cookies/LocalStorage)
- [x] Integrate Auth session details & Logout action in Header navbar
- [x] Create route guards (redirecting unauthenticated users away from dashboards)

## Phase 4: Freelancer Profiles Dashboard
- [x] Create onboarding form UI for Freelancer profiles (category, bio, etc.)
- [x] Integrate onboarding API (calling `POST /api/v1/freelancers`)
- [ ] Build Freelancer dashboard displaying profile details (categories, status, rating)
