# Design Guidelines for Hackathon-Ready Full-Stack Template

## Design Approach

**Hybrid Strategy**: Marketing pages draw inspiration from modern real estate platforms (Homeverse aesthetic), while application dashboards follow Material Design principles for data-intensive interfaces.

## Typography System

**Font Families** (via Google Fonts CDN):
- **Headlines & Display**: Inter (weights: 600, 700, 800)
- **Body & UI**: Inter (weights: 400, 500, 600)
- **Data & Code**: JetBrains Mono (weight: 400)

**Type Scale**:
- Hero: text-5xl md:text-6xl lg:text-7xl (font-bold)
- H1: text-4xl md:text-5xl (font-bold)
- H2: text-3xl md:text-4xl (font-semibold)
- H3: text-2xl md:text-3xl (font-semibold)
- H4: text-xl md:text-2xl (font-medium)
- Body Large: text-lg (font-normal)
- Body: text-base (font-normal)
- Small: text-sm (font-normal)
- Tiny: text-xs (font-medium)

## Layout System

**Spacing Units**: Use Tailwind units 2, 4, 6, 8, 12, 16, 20, 24, 32
- Tight spacing: p-4, gap-2
- Standard: p-8, gap-4
- Generous: p-12, gap-8
- Section padding: py-20 md:py-32

**Container Strategy**:
- Full-width sections: w-full with max-w-7xl mx-auto
- Content blocks: max-w-6xl mx-auto
- Text content: max-w-3xl
- Forms: max-w-md

**Grid System**:
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Stat cards: grid-cols-2 lg:grid-cols-4 gap-4
- Forms: Single column (max-w-md)

## Landing/Marketing Pages

**Hero Section** (100vh):
- Large hero image background with gradient overlay
- Centered content with max-w-4xl
- Headline + subtitle + dual CTAs (primary "Get Started" + secondary "Learn More")
- Floating stats cards (grid-cols-3, semi-transparent cards with blur backdrop)

**Features Section**:
- Grid layout: 3 columns on desktop (grid-cols-1 md:grid-cols-3)
- Icon (Heroicons outline, w-12 h-12) + Title (text-xl) + Description (text-base)
- Cards with subtle elevation, rounded-2xl

**How It Works Section**:
- Timeline-style layout with numbered steps (1-2-3-4)
- Alternating left-right content blocks
- Step number in large circular badge

**Pricing Section** (if needed):
- 3-column comparison cards (Free, Pro, Enterprise)
- Highlighted "Popular" card with subtle emphasis
- Feature list with checkmark icons

**Footer**:
- Multi-column layout (Company, Product, Resources, Legal)
- Newsletter signup (inline form)
- Social icons (Heroicons)

## Authentication Pages

**Layout Pattern**: Split-screen on desktop
- Left: Branding panel (2/5 width) with gradient, logo, testimonial quote
- Right: Auth form (3/5 width) centered vertically

**Forms Structure**:
- Compact, single-column (max-w-sm)
- Input fields with labels above, helper text below
- OTP input: 6 separate input boxes (grid-cols-6, gap-2, monospace font)
- Clear error states below each field
- Primary action button full-width
- Secondary links (text-sm) below button
- OAuth buttons stacked below divider ("Or continue with")

**Pages Needed**:
- Sign Up (email + password + confirm)
- Sign In
- OTP Verification (for signup & password reset)
- Forgot Password
- Reset Password

## Dashboard Layout (All Roles)

**Structure**:
- Sidebar navigation (fixed, w-64 on desktop, hidden/drawer on mobile)
- Top bar (sticky, h-16): breadcrumb, search, notifications bell, theme toggle, profile dropdown
- Main content area with consistent padding (p-6 md:p-8)

**Sidebar Navigation**:
- Logo/brand at top (p-6)
- Nav items with icon + label (Heroicons, hover states)
- Active state with subtle background + accent border-left
- Role badge near bottom
- Collapse toggle on mobile

**Dashboard Metrics Cards**:
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Card structure: Icon (top-left) + Label + Large number + Trend indicator (↑/↓ with percentage)

## User Dashboard Sections

**Profile Management**:
- Two-column form (grid-cols-1 md:grid-cols-2 gap-6)
- Avatar upload (circular, 128px, with camera icon overlay)
- Grouped fields (Personal Info, Contact, Security)

**Document Upload**:
- Drag-and-drop zone (border-dashed, rounded-xl, min-h-48)
- File list table with columns: Name, Type, Size, Status, Actions
- Status badges (Pending/Verified/Rejected)

**Notifications Panel**:
- Side drawer (slide-in from right, w-96)
- List items with avatar + message + timestamp
- Unread indicator (dot badge)
- Mark all read action

## Admin Dashboard Sections

**User Management Table**:
- Data table with columns: Avatar, Name, Email, Role, Status, Joined, Actions
- Row actions: Edit, View, Delete (icon buttons)
- Bulk actions toolbar when rows selected
- Pagination at bottom

**Analytics Dashboard**:
- Chart.js visualizations in cards (rounded-xl, p-6)
- Chart types: Line (user growth), Bar (activity), Doughnut (user roles), Area (revenue)
- Date range picker (top-right of each chart card)
- Export button per chart

**Add Admin Form** (Modal):
- Modal overlay (backdrop blur)
- Form in centered card (max-w-lg)
- Email + Role dropdown + Permissions checkboxes
- Cancel + Send Invite buttons

## Payment Integration

**Checkout Page**:
- Two-column layout (order summary left, payment form right)
- Order summary card: sticky on scroll
- PayPal button integration (official SDK button)
- Payment method tabs (PayPal / Card)

**Transaction History**:
- Table with columns: ID, Date, Amount, Status, Method, Receipt
- Filter toolbar (date range, status, method)

## Component Library

**Buttons**:
- Sizes: sm (h-9 px-4 text-sm), md (h-11 px-6 text-base), lg (h-14 px-8 text-lg)
- Variants: Primary (solid), Secondary (outline), Ghost (transparent)
- Icon buttons: square aspect ratio
- Disabled state: opacity-50 cursor-not-allowed

**Input Fields**:
- Height: h-11 (consistent with md buttons)
- Padding: px-4
- Border: rounded-lg
- Focus state: ring treatment
- Floating labels or labels above

**Cards**:
- Standard: rounded-xl shadow-sm border
- Elevated: rounded-xl shadow-lg
- Interactive: hover:shadow-xl transition

**Badges**:
- Sizes: sm (text-xs px-2 py-0.5), md (text-sm px-3 py-1)
- Rounded: rounded-full
- Status badges: dot indicator + text

**Modals**:
- Backdrop: fixed inset-0 backdrop-blur-sm
- Content: max-w-lg mx-auto mt-20
- Close button: top-right absolute
- Rounded: rounded-2xl

**Icons**: Heroicons (via CDN), 20px (w-5 h-5) for buttons, 24px (w-6 h-6) for standalone

## Dark/Light Mode

- Theme toggle in top bar (sun/moon icon)
- Store preference in localStorage
- Implement using Tailwind's dark: variant classes throughout

## Responsive Breakpoints

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidebar: drawer on mobile, fixed on desktop
- Tables: horizontal scroll on mobile, full on desktop
- Forms: single column mobile, two-column desktop

## Images & Assets

**Hero Image**: Large, high-quality background image (real estate/modern workspace theme), 1920x1080, with dark gradient overlay for text contrast

**Dashboard Icons**: Heroicons outline for navigation, solid for status indicators

**Empty States**: Illustrative graphics (use placeholder comments for custom illustrations)

## Key UX Patterns

- Loading states: Skeleton loaders for tables/cards
- Empty states: Icon + message + action button
- Error states: Inline validation messages (text-sm text-red-600)
- Success feedback: Toast notifications (top-right corner)
- Confirmation dialogs: Modal with warning icon for destructive actions

This design system ensures visual consistency, professional polish, and exceptional usability across all user roles and features.