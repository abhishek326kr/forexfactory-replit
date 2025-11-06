# ForexFactory.cc - Forex EA Hub

## Overview
ForexFactory.cc is a professional Forex trading platform that serves as a comprehensive repository for Expert Advisors (EAs), trading indicators, and educational content for MetaTrader 4/5 users. The platform combines a content management system with a download marketplace, featuring SEO-optimized blog posts, downloadable trading tools, and an admin dashboard for content management. Its primary purpose is to provide traders with free access to tested Expert Advisors and custom indicators while building a community around algorithmic trading strategies, targeting Forex traders using MetaTrader platforms.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is a React 18+ TypeScript SPA using Wouter for routing. It leverages `shadcn/ui` components built on Radix UI primitives and Tailwind CSS for styling, with a custom theme for light/dark mode. State management is handled by React Query for server state and local React hooks for UI state, alongside a custom `AuthContext` for authentication. Key design decisions include mobile-first responsive design, SEO optimization via React Helmet, and a component-based architecture.

### Backend Architecture
The backend is built with Express.js and TypeScript on Node.js, providing a minimal, flexible framework for RESTful APIs. It includes API endpoints for posts, downloads, categories, authentication, and analytics. Authentication uses Passport.js with LocalStrategy and Express-session, implementing role-based access control and CSRF protection. Additional services include RSS/Atom feed generation, sitemap generation, dynamic robots.txt, and rate limiting.

### Data Layer
The project uses PostgreSQL configured via Drizzle ORM (transitioning from Prisma), chosen for its reliability and advanced features. The schema design includes tables for users, posts, downloads, categories, tags, comments, reviews, analytics, newsletters, and static pages. Drizzle provides type-safe queries and is managed with drizzle-kit for migrations.

### SEO Architecture
A comprehensive SEO strategy is implemented, including dynamic meta tag generation (Open Graph, Twitter Cards), JSON-LD structured data (Article, SoftwareApplication, FAQPage, Organization), dynamic sitemap and RSS/Atom feed generation, IndexNow integration for instant indexing, and dynamic robots.txt management. The system also includes AI-powered SEO for content optimization, keyword analysis, and title suggestions.

### Build & Development
Vite is used for frontend bundling, providing fast HMR and optimized production builds. The development workflow includes TypeScript compilation checking, path aliases, and a concurrent development server. Production builds bundle the frontend to `dist/public` and the backend to `dist/index.js`, creating a single deployment artifact.

## External Dependencies

### Third-Party Services
- **Session Storage**: `MemoryStore` (development), `connect-pg-simple` (production)
- **Authentication**: Passport.js (local strategy)
- **Indexing**: IndexNow (Bing, Yandex, etc.)
- **Object Storage**: Replit's object storage for file uploads

### Database
- **Primary Database**: PostgreSQL via `@neondatabase/serverless` driver
- **ORM**: Drizzle ORM

### UI Component Libraries
- **Core Components**: Radix UI primitives
- **Styling**: Tailwind CSS, `class-variance-authority`

### Security Dependencies
- `bcrypt` for password hashing
- `express-rate-limit` for API rate limiting
- `csrf` package for CSRF protection

### Development Tools
- `@replit/vite-plugin-runtime-error-modal`
- `@replit/vite-plugin-cartographer`
- `@replit/vite-plugin-dev-banner`

### Form Handling
- `react-hook-form` for form state management
- `zod` for schema validation
- `@hookform/resolvers` for Zod integration

### SEO & Metadata
- `react-helmet-async` for dynamic head management

### Monitoring & Analytics
- Custom analytics tracking system storing page views and download metrics in PostgreSQL.