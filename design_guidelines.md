# Design Guidelines: Forex EA Hub

## Design Approach

**Selected Approach**: Design System-Inspired (Material Design + Medium's Content Architecture)

**Justification**: As an information-dense, trust-building platform in the financial technology space, the design must prioritize credibility, readability, and conversion efficiency. Drawing from Material Design's structured component library and Medium's content-first approach ensures professional presentation while maintaining SEO-optimized semantic structure.

**Key Design Principles**:
1. **Trust-First**: Professional aesthetics that build credibility in forex trading space
2. **Conversion-Optimized**: Clear visual hierarchy guiding users to download CTAs
3. **Content Clarity**: Typography and spacing that maximize readability for technical content
4. **Mobile-Dominant**: 60% mobile traffic requires mobile-first responsive design

---

## Core Design Elements

### A. Typography System

**Font Families** (via Google Fonts CDN):
- **Primary (Headings)**: Inter (weights: 600, 700, 800)
- **Secondary (Body)**: Inter (weights: 400, 500)
- **Code/Technical**: JetBrains Mono (weight: 400)

**Typography Hierarchy**:
- **H1 (Page Titles)**: 3xl (mobile) / 5xl (desktop), font-bold, tracking-tight
- **H2 (Section Headers)**: 2xl (mobile) / 4xl (desktop), font-semibold
- **H3 (Subsections)**: xl (mobile) / 2xl (desktop), font-semibold
- **H4 (Card Titles)**: lg (mobile) / xl (desktop), font-medium
- **Body Text**: base, font-normal, leading-relaxed (1.75)
- **Meta/Stats**: sm, font-medium, tracking-wide
- **Captions**: xs, font-normal
- **Buttons**: base, font-medium, tracking-wide

---

### B. Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24

**Container Strategy**:
- **Full-width sections**: `w-full` with inner `max-w-7xl mx-auto px-4 md:px-6`
- **Content sections**: `max-w-6xl mx-auto`
- **Blog content**: `max-w-3xl mx-auto` (optimal reading width)
- **Admin interface**: `max-w-screen-2xl mx-auto`

**Grid Systems**:
- **Blog Cards**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8`
- **Download Stats**: `grid-cols-2 md:grid-cols-4 gap-4`
- **Feature Highlights**: `grid-cols-1 md:grid-cols-3 gap-8`
- **Admin Dashboard**: `grid-cols-1 lg:grid-cols-4 gap-6`

**Vertical Rhythm**:
- **Section spacing**: `py-12 md:py-20` (standard), `py-16 md:py-28` (hero)
- **Component spacing**: `space-y-6 md:space-y-8` (vertical stacks)
- **Card padding**: `p-6 md:p-8`

---

### C. Component Library

#### **1. Navigation System**

**Header/Navbar**:
- Fixed/sticky navigation with `h-16 md:h-20`
- Logo (left, 32px height), nav links (center, desktop only), CTA button (right)
- Mobile: Hamburger menu with slide-out drawer
- Breadcrumbs on inner pages: `text-sm flex items-center gap-2 mb-6`

**Footer**:
- Multi-column layout: `grid-cols-1 md:grid-cols-4 gap-8 md:gap-12`
- Sections: Quick Links, Categories, Resources, Newsletter signup
- Social icons (24px, horizontal row)
- Copyright + legal links row at bottom with divider

#### **2. Homepage Components**

**Hero Section**:
- Full-width container, `min-h-[600px] md:min-h-[700px]`
- Large hero image (Forex trading charts, MT4/MT5 platform screenshots) with gradient overlay
- Centered content: H1 headline + subtitle + dual CTAs
- Trust badge row below: "500k+ Downloads | Updated Weekly | 100% Free"
- CTAs with blurred backgrounds when on images

**Featured EAs Section**:
- Section header with description
- 3-column grid of EA cards
- Each card: Image preview (16:9), EA name, compatibility badges, download count, primary CTA

**Latest Blog Posts**:
- Section header with "View All Posts" link
- 3-column grid (switches to 1-column mobile)
- Cards: Featured image, category tag, title, excerpt, read time, CTA

**Trust Signals Section**:
- Centered stats grid: Total Downloads, Active Users, EAs Available, Success Rate
- Large number + label format

**Newsletter Signup**:
- Centered form with email input + submit button
- Single-row layout on desktop, stacked on mobile
- Trust text: "Join 50k+ traders. No spam, unsubscribe anytime."

#### **3. Blog Post Page**

**Post Header**:
- Breadcrumb navigation
- H1 title with `max-w-3xl mx-auto`
- Meta row: Author, publish date, read time, category tags
- Featured image: `aspect-video w-full rounded-lg mb-8`

**Content Area**:
- `max-w-3xl mx-auto prose prose-lg` for MDX content
- TOC sidebar (desktop only, sticky): `hidden lg:block fixed right-8 top-32 w-64`
- Download CTA card: Sticky bottom bar (mobile) or inline card mid-content

**Related Posts**:
- "You May Also Like" section
- 3-card horizontal grid
- Same card style as homepage

#### **4. Download Page**

**Layout**: Two-column split on desktop (60/40), stacked on mobile

**Left Column**:
- EA/Indicator name (H1)
- Version badge + compatibility badges (MT4/MT5)
- Star rating + download count
- Detailed description with bullet points
- Setup instructions (collapsible accordions)
- User reviews section

**Right Column (Sticky)**:
- Screenshot carousel with thumbnails
- Download information card:
  - File size, last updated, version number
  - Primary download button (prominent, full-width)
  - Secondary "View Documentation" button
  - Installation guide link
  - Compatibility checklist

#### **5. Category/Archive Pages**

**Layout**:
- Page header with category name (H1) + description
- Filter/sort bar: `flex justify-between items-center mb-8`
- Blog grid: Same 3-column as homepage
- Pagination: Centered number buttons with prev/next

#### **6. Search Page**

**Search Interface**:
- Large search input at top: `max-w-2xl mx-auto`
- Real-time results below in card grid
- Filters sidebar (desktop): Categories, post type, date range
- Results count: "Showing X results for 'query'"

#### **7. Admin Dashboard**

**Layout Structure**:
- Sidebar navigation (fixed left, 240px width on desktop)
- Main content area with `p-6 md:p-8`
- Dashboard sections use card-based layout

**Dashboard Cards**:
- Stats overview: 4-column grid with icon + number + label
- Recent activity table with alternating row treatment
- Quick actions buttons in button group

**Post Editor**:
- Title input (large, prominent)
- MDX editor textarea with preview toggle
- Sidebar panel: Publish settings, categories, tags, featured image upload
- Action buttons: Save Draft, Preview, Publish

**File Upload Interface**:
- Drag-and-drop zone with dashed border
- File list table with: Name, Type, Size, Date, Actions
- Upload progress bars for active uploads

---

### D. Interactive Elements

**Buttons**:
- **Primary**: `px-6 py-3 rounded-lg font-medium`
- **Secondary**: Same size, outlined variant
- **Small**: `px-4 py-2 text-sm rounded-md`
- **Icon buttons**: Square with padding `p-2 md:p-3`

**Form Inputs**:
- Text inputs: `px-4 py-3 rounded-lg border-2 w-full`
- Labels: `text-sm font-medium mb-2 block`
- Focus states with ring utility
- Error states with border color change + helper text

**Cards**:
- Standard elevation with `rounded-xl border` (no drop shadows)
- Hover state: Slight scale transform `hover:scale-[1.02]`
- Transition: `transition-all duration-200`

**Badges/Tags**:
- Small rounded pills: `px-3 py-1 rounded-full text-xs font-medium`
- Category tags clickable with hover state

**Compatibility Badges**:
- Icon + text format: MT4/MT5 logos with labels
- Horizontal row layout with gap-2

---

### E. Images

**Hero Section**:
- Full-width background image showing professional Forex trading charts or MT4/MT5 platform interface
- Subtle gradient overlay for text readability
- High-quality, aspirational imagery conveying success and professionalism

**Blog Post Cards**:
- Featured images in 16:9 aspect ratio
- Images showing: Trading charts, EA performance graphs, indicator screenshots
- Consistent cropping and quality across all cards

**Download Pages**:
- Screenshot carousel showing EA/indicator in action
- MT4/MT5 platform screenshots with the tool installed
- Performance charts and backtest results
- Before/after comparison images where applicable

**Trust/Social Proof**:
- Optional: Platform compatibility icons (MetaTrader 4/5 logos)
- Optional: Trust badges or certification indicators

**Image Optimization**:
- All images using `next/image` component
- Priority loading for hero images
- Lazy loading for below-fold content
- WebP format with fallbacks

---

### F. Animations

**Minimal Approach** - Use sparingly:
- Smooth page transitions between routes
- Card hover states with scale transform
- Skeleton loading states for async content
- Subtle fade-in for images as they load
- No complex scroll-triggered animations
- No parallax effects

---

## Page-Specific Layouts

**Homepage**: Hero (700px) → Featured EAs (auto) → Latest Posts (auto) → Trust Stats (auto) → Newsletter (auto)

**Blog Post**: 80% content width, sticky TOC sidebar on desktop, generous line-height for readability

**Download Page**: Asymmetric two-column with sticky download panel

**Admin**: Traditional sidebar + content area layout, table-heavy for data management

**Category Pages**: Grid-dominant with filtering options

---

This design system creates a professional, trustworthy platform optimized for conversions while maintaining the clean, fast-loading experience critical for SEO performance.