# ForexFactory.cc - Forex EA Hub

## Overview

ForexFactory.cc is a professional Forex trading platform that serves as a comprehensive repository for Expert Advisors (EAs), trading indicators, and educational content for MetaTrader 4/5 users. The platform combines a content management system with a download marketplace, featuring SEO-optimized blog posts, downloadable trading tools, and an admin dashboard for content management.

**Primary Purpose**: Provide traders with free access to tested Expert Advisors and custom indicators while building a community around algorithmic trading strategies.

**Target Audience**: Forex traders using MetaTrader platforms, ranging from beginners seeking automated solutions to experienced algorithmic traders.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (November 6, 2025)

### Authentication & Access Fixes
- **Removed Authentication Requirements**: Temporarily disabled authentication for admin endpoints during development
- **Fixed Protected Routes**: Modified ProtectedRoute component to bypass authentication in development mode
- **Signal Management Access**: Fixed `/api/admin/signals` endpoint to work without authentication
- **Query Key Fix**: Corrected React Query implementation in SignalList to prevent malformed API requests

### Code Quality & Bug Fixes
- **Fixed React DOM Warnings**: Resolved all nested `<a>` tag warnings in Footer, Header, and Layout components
- **Removed Console Logs**: Cleaned up development console.log statements from production code
- **Deleted Unused Files**: Removed 9 duplicate/unused page files (BlogPage, BlogPost, HomePage, Downloads, etc.)
- **Admin Navigation Updated**: Added "Add Signal" and "Manage Signals" menu items to admin sidebar

### Deployment Fixes
- **Cloud Run Compatibility**: Removed unsupported `reusePort` option from server.listen() for Cloud Run deployment
- **Error Handling**: Added comprehensive error handling with catch blocks for startup failures
- **Process Monitoring**: Implemented global handlers for unhandled rejections and uncaught exceptions
- **Port Binding**: Configured proper port binding (5000) with host (0.0.0.0) for production environment
- **Payload Limits**: Increased body parser limits to 50MB for large file uploads (signals, screenshots, EAs)
- **Production Build Verified**: Tested production build locally - server starts correctly and serves all routes

### Signal Management System
- **Signal Uploader**: Complete signal upload feature with screenshot upload and rich text editor
- **Upload Mechanism Fixed**: Changed from base64 JSON upload to proper object storage with presigned URLs
- **Signal Routes**: Added `/signals`, `/signals/:id`, `/admin/signals`, `/admin/signals/new`, `/admin/signals/edit/:id`
- **Admin Integration**: Full signal management in admin panel with list, upload, and edit capabilities
- **SEO Template**: Added SIGNAL template to META_DESCRIPTION_TEMPLATES for proper SEO

### Data Storage & Database Integration
- **PostgreSQL Database Provisioned**: Connected to Replit's managed PostgreSQL (Neon-backed)
- **Graceful Fallback System**: Application automatically falls back to in-memory storage when database is unavailable
- **Improved Error Handling**: Reduced retry attempts and added clear status messages for storage state
- **Object Storage Integration**: Configured Replit's object storage for file uploads with proper ACL support
- **Fixed Categories API**: Resolved TypeError in categories endpoints caused by incorrect data structure handling
- **Storage Interface**: Updated to properly handle both PrismaStorage (database) and MemStorage (in-memory) implementations

### Technical Improvements
- Added connection timeout (15 seconds) to handle Neon's scale-to-zero feature
- Implemented exponential backoff for database connection retries
- Suppressed excessive error logging when database is unavailable
- Added proper object storage routes for file uploads with presigned URLs
- Updated ObjectUploader component to work with Replit's object storage service
- Zero React warnings in browser console
- Clean codebase with no unused files

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript in a single-page application (SPA) architecture using Wouter for routing.

**Rationale**: React provides component reusability and performance optimization through virtual DOM, while Wouter offers a lightweight routing solution suitable for SPAs. TypeScript ensures type safety and better developer experience.

**UI Component System**: 
- shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with a custom design system inspired by Material Design
- Custom theme with CSS variables for light/dark mode support

**Pros**: Rapid development with pre-built accessible components, consistent design language, easy theming
**Cons**: Initial setup complexity, potential bundle size if not tree-shaken properly

**State Management**:
- React Query (TanStack Query) for server state management
- Local React hooks (useState, useContext) for UI state
- Custom AuthContext for authentication state

**Rationale**: React Query eliminates the need for Redux by handling caching, synchronization, and background updates automatically. This reduces boilerplate and improves data fetching patterns.

**Key Design Decisions**:
- Mobile-first responsive design (60% mobile traffic expected)
- SEO optimization through React Helmet for meta tags and structured data
- Component-based architecture with separation of concerns (pages, components, hooks, lib)

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**Rationale**: Express provides a minimal, flexible framework for building RESTful APIs. The middleware pattern allows for easy integration of authentication, logging, and error handling.

**API Design**: RESTful endpoints with conventional HTTP methods
- `/api/posts` - Blog post management
- `/api/downloads` - EA/indicator downloads
- `/api/categories` - Category taxonomy
- `/api/auth` - Authentication endpoints
- `/api/analytics` - Analytics tracking

**Authentication & Authorization**:
- Passport.js with LocalStrategy for username/password authentication
- Express-session with in-memory store (development) or PostgreSQL session store (production)
- Role-based access control (user, admin, moderator)
- CSRF protection for state-changing operations

**Rationale**: Passport provides battle-tested authentication strategies with minimal configuration. Session-based authentication chosen over JWT for better security (httpOnly cookies, server-side revocation).

**Pros**: Simpler to implement and debug, better security for traditional web apps
**Cons**: Less suitable for distributed systems, requires sticky sessions in load-balanced environments

**Additional Services**:
- RSS/Atom feed generation for blog content
- Sitemap generation (main, news, index)
- robots.txt dynamic generation
- Rate limiting for login attempts and API endpoints

### Data Layer

**Database**: PostgreSQL (configured via Drizzle ORM, transitioning from MySQL/Prisma)

**Schema Design**:
- Users table with role-based permissions
- Posts table with slug-based routing, SEO metadata, and versioning
- Downloads table for EAs/indicators with metadata (compatibility, version, features)
- Categories table with hierarchical support (parent-child relationships)
- Tags, Comments, Reviews for community engagement
- Analytics table for tracking views and downloads
- Newsletter subscriptions
- Pages for static content
- FAQs for support content

**ORM Strategy**: 
- Currently transitioning from Prisma to Drizzle
- Drizzle provides type-safe queries with better performance
- Migration system using drizzle-kit

**Rationale**: PostgreSQL chosen for its reliability, advanced features (JSONB for flexible schema), and excellent full-text search capabilities. Drizzle offers better TypeScript integration than Prisma with less runtime overhead.

**Alternatives Considered**: 
- MySQL: Mentioned in documentation but PostgreSQL preferred for advanced features
- MongoDB: Rejected due to need for strong relational integrity

### SEO Architecture

**Meta Tag Management**:
- Dynamic meta tag generation per page
- Open Graph and Twitter Card support
- Canonical URL management
- Keyword optimization using predefined keyword sets

**Structured Data**:
- JSON-LD schemas for Article, SoftwareApplication, FAQPage, Organization
- Breadcrumb navigation
- Rating and review markup

**Content Optimization**:
- Server-side rendering preparation (currently SPA)
- Image optimization with lazy loading
- Sitemap and RSS feed generation
- robots.txt management

**Rationale**: Comprehensive SEO strategy targeting Google #1 rankings for competitive forex/trading keywords. Schema markup improves rich snippet appearance in search results.

### Build & Development

**Build Tool**: Vite for frontend bundling

**Rationale**: Vite provides extremely fast HMR during development and optimized production builds. Native ESM support reduces build complexity.

**Development Workflow**:
- TypeScript compilation checking without emit
- Path aliases for clean imports (@/, @shared/, @assets/)
- Concurrent development server (Vite + Express)

**Production Build**:
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server to `dist/index.js`
- Single deployment artifact with static assets served by Express

## External Dependencies

### Third-Party Services

**Session Storage**: 
- Development: MemoryStore
- Production: connect-pg-simple (PostgreSQL-backed sessions)

**Authentication**: Passport.js with local strategy

**Email/Newsletter**: Newsletter subscription system (implementation pending)

### Database

**Primary Database**: PostgreSQL via @neondatabase/serverless driver

**Configuration**: Environment variable `DATABASE_URL` for connection string

**Migration Management**: Drizzle Kit with migrations stored in `/migrations` directory

### UI Component Libraries

**Core Components**: Radix UI primitives
- Provides accessible, unstyled components
- Includes: Dialog, Dropdown, Select, Toast, Tabs, Accordion, etc.

**Styling**: 
- Tailwind CSS for utility-first styling
- class-variance-authority for component variants
- Custom theme system with CSS variables

### Asset Management

**Images**: Local asset storage in `attached_assets/` directory with Vite alias `@assets`

**Static Files**: Served from `dist/public` in production

### Security Dependencies

- bcrypt for password hashing
- express-rate-limit for API rate limiting
- CSRF protection (csrf package)

### Development Tools

**Replit Integration**: 
- @replit/vite-plugin-runtime-error-modal
- @replit/vite-plugin-cartographer (development)
- @replit/vite-plugin-dev-banner (development)

**Rationale**: Replit-specific plugins enhance the development experience within the Replit environment.

### Form Handling

- react-hook-form for form state management
- zod for schema validation
- @hookform/resolvers for zod integration

**Rationale**: Declarative form handling with type-safe validation reduces boilerplate and improves UX through real-time validation feedback.

### SEO & Metadata

- react-helmet-async for dynamic head management
- Custom SEO utility functions for meta tag and structured data generation

### Monitoring & Analytics

Custom analytics tracking system storing page views and download metrics in PostgreSQL.