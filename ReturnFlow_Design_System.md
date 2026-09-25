# ReturnFlow / E-commerce Dashboard Design System

> A clean, premium B2B SaaS design system derived from the provided
> dashboard reference image.
>
> **Design direction:** minimal, editorial, financial-dashboard
> precision with a warm highlighter accent. The interface should feel
> calm, trustworthy, spacious, and operational rather than playful.

------------------------------------------------------------------------

## 1. Design Principles

### 1.1 Core principles

1.  **Clarity over decoration**
    -   Every visual element must communicate information or support an
        action.
    -   Avoid gradients, excessive shadows, glassmorphism, decorative
        illustrations, and unnecessary borders.
2.  **Quiet premium**
    -   Use large amounts of white space.
    -   Prefer thin borders and subtle gray surfaces.
    -   Use the dark teal as the structural anchor and the yellow as a
        selective attention color.
3.  **Data first**
    -   Metrics, statuses, tables, charts, and actions should be
        immediately scannable.
    -   Use strong typography hierarchy rather than large visual
        effects.
4.  **Consistent geometry**
    -   Use one radius system, one spacing system, and predictable
        component dimensions.
    -   Align cards, tables, navigation, and charts to a shared grid.
5.  **One strong accent**
    -   Yellow is the primary action/highlight color.
    -   Do not introduce many competing accent colors.
6.  **Functional color**
    -   Color should communicate state, not merely decoration.
    -   Status colors must remain consistent everywhere.

------------------------------------------------------------------------

# 2. Brand Personality

The visual language should communicate:

-   Professional
-   Modern
-   Reliable
-   Minimal
-   Operational
-   Premium
-   Trustworthy
-   Technical
-   Easy to scan

Avoid:

-   Neon-heavy interfaces
-   Purple-heavy SaaS styling
-   Excessive gradients
-   Large rounded "bubble" cards
-   Excessive shadows
-   Overly colorful dashboards
-   Dense enterprise legacy UI
-   Cartoon-style illustrations

------------------------------------------------------------------------

# 3. Color System

## 3.1 Primary color

### Primary Dark Teal

**HEX:** `#193438`

**RGB:** `25, 52, 56`

**HSL:** approximately `184°, 38%, 16%`

Use for:

-   App shell background
-   Sidebar background
-   Primary dark surfaces
-   Header/footer accents
-   Strong navigation states
-   High-contrast text on light backgrounds when appropriate
-   Brand mark
-   Selected navigation backgrounds

This is the main brand anchor.

------------------------------------------------------------------------

## 3.2 Primary accent

### Signal Yellow

**HEX:** `#F8FA87`

**RGB:** `248, 250, 135`

Use for:

-   Primary CTA backgrounds
-   Important metric icons
-   Selected/highlighted values
-   Notification counts
-   Chart highlights
-   Active indicators
-   Important badges
-   Hover emphasis where appropriate

Yellow should be used selectively. It should never dominate the entire
page.

### Yellow interaction states

  State             Color
  ----------------- -----------
  Default           `#F8FA87`
  Hover             `#EEF17A`
  Active            `#E5E86D`
  Soft background   `#FBFCD8`
  Border            `#E4E76D`
  Text on yellow    `#193438`

------------------------------------------------------------------------

# 4. Neutral Palette

## 4.1 Backgrounds

  Token            HEX         Usage
  ---------------- ----------- ---------------------------------------
  `bg-page`        `#FFFFFF`   Main application background
  `bg-subtle`      `#FAFAF9`   Secondary page sections
  `bg-muted`       `#F5F5F3`   Inputs, table headers, muted surfaces
  `bg-sidebar`     `#EAEAE8`   Light sidebar variant
  `bg-dark`        `#193438`   Dark application shell
  `bg-dark-soft`   `#29464A`   Dark hover/secondary surface

The reference image uses both a light content canvas and a deep teal
surrounding/app-shell treatment. The implementation may choose either: -
dark shell + white content, or - white shell + light-gray sidebar.

Do not mix multiple competing shell treatments on the same screen.

------------------------------------------------------------------------

## 4.2 Text colors

  Token               HEX         Usage
  ------------------- ----------- -----------------------------
  `text-primary`      `#111111`   Headings and primary values
  `text-secondary`    `#555555`   Supporting text
  `text-tertiary`     `#777777`   Metadata and labels
  `text-muted`        `#999999`   Disabled/subtle information
  `text-on-dark`      `#FFFFFF`   Text on dark teal
  `text-on-primary`   `#193438`   Text on yellow

### Text rule

Never use pure black everywhere.

Use `#111111` or a similarly near-black tone for primary content to
preserve the softer premium appearance.

------------------------------------------------------------------------

# 5. Border Palette

  Token              HEX         Usage
  ------------------ ----------- ----------------------------
  `border-default`   `#D9D9D6`   Standard card/input border
  `border-subtle`    `#E9E9E6`   Dividers and table rows
  `border-strong`    `#BDBDB8`   Important controls
  `border-dark`      `#193438`   Strong dark outlines
  `border-accent`    `#E4E76D`   Yellow active state

### Border rules

-   Default border: `1px solid #D9D9D6`
-   Do not use thick borders for normal cards.
-   Use borders instead of heavy shadows.
-   Section dividers should normally use `#E9E9E6`.

------------------------------------------------------------------------

# 6. Semantic Status Colors

These colors are functional and may be used in ReturnFlow status
components.

  Status    Color       Soft Background
  --------- ----------- -----------------
  Success   `#247A52`   `#EAF6EF`
  Warning   `#9A6B00`   `#FFF7D6`
  Error     `#B83A3A`   `#FCECEC`
  Info      `#356B82`   `#EAF4F8`
  Neutral   `#666666`   `#F2F2F0`

### Return status mapping

  Return Status     Visual Treatment
  ----------------- ------------------
  Pending Review    Warning
  Approved          Success
  Label Generated   Info
  In Transit        Info
  Received          Success
  Refunded          Success
  Rejected          Error

Do not use yellow for every status. Yellow is the brand accent; semantic
colors communicate system state.

------------------------------------------------------------------------

# 7. Typography

## 7.1 Primary font

### Inter

Use **Inter** as the default product font.

Why:

-   Excellent UI readability
-   Strong numerical typography
-   Clean SaaS appearance
-   Good support for tables and dashboards
-   Works well at small sizes
-   Matches the visual character of the reference

Fallback:

``` css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", sans-serif;
```

------------------------------------------------------------------------

# 8. Type Scale

  Token           Size   Weight   Line Height Usage
  ------------- ------ -------- ------------- -------------------------
  Display         32px      600          1.15 Major dashboard heading
  H1              28px      600           1.2 Page title
  H2              22px      600          1.25 Section title
  H3              18px      600           1.3 Card title
  Body Large      16px      400           1.5 Important body copy
  Body            14px      400           1.5 Default UI text
  Body Medium     14px      500           1.5 Navigation/actions
  Small           13px      400          1.45 Metadata
  Caption         12px      500           1.4 Labels
  Micro           11px      500          1.35 Compact metadata

### Typography rules

-   Use 600 rather than 700 for most headings.
-   Avoid excessive bold text.
-   Numbers in KPI cards may use 600.
-   Labels should generally use 12--13px.
-   Keep paragraph widths controlled; avoid long text lines inside
    dashboard cards.
-   Use sentence case for UI labels.
-   Avoid ALL CAPS except for tiny category labels when necessary.

------------------------------------------------------------------------

# 9. Font Weight Tokens

``` css
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
```

Do not use 800/900 weights in normal product UI.

------------------------------------------------------------------------

# 10. Spacing System

Use a **4px base spacing unit**.

  Token          Value
  ------------ -------
  `space-1`        4px
  `space-2`        8px
  `space-3`       12px
  `space-4`       16px
  `space-5`       20px
  `space-6`       24px
  `space-8`       32px
  `space-10`      40px
  `space-12`      48px
  `space-16`      64px
  `space-20`      80px

### Layout rule

Prefer generous spacing between sections:

-   Card internal padding: `20–24px`
-   Dashboard section spacing: `24–32px`
-   Page horizontal padding: `32px`
-   Sidebar content padding: `20–24px`

------------------------------------------------------------------------

# 11. Layout System

## Desktop

Recommended maximum content width:

``` text
1440px
```

Recommended page structure:

``` text
┌──────────────────────────────────────────────────────────┐
│ Top Header                                               │
├───────────────┬──────────────────────────────────────────┤
│ Sidebar       │ Main Content                             │
│               │                                          │
│ Navigation    │ Page Header                              │
│               │                                          │
│               │ KPI Cards                                │
│               │                                          │
│               │ Charts / Main Content                    │
│               │                                          │
│               │ Tables / Secondary Content               │
└───────────────┴──────────────────────────────────────────┘
```

### Sidebar

Recommended width:

``` text
220–260px
```

### Header

Recommended height:

``` text
64–72px
```

### Main content

Recommended maximum width:

``` text
1200–1280px
```

------------------------------------------------------------------------

# 12. Grid System

Use a 12-column desktop grid.

Recommended:

``` css
grid-template-columns: repeat(12, minmax(0, 1fr));
gap: 24px;
```

Common layouts:

-   KPI row: 4 columns each
-   Main chart: 8 columns
-   Secondary panel: 4 columns
-   Full table: 12 columns
-   Two equal panels: 6 + 6

Do not create arbitrary column widths for every screen.

------------------------------------------------------------------------

# 13. Border Radius

The reference has a restrained radius system.

  Token             Radius Usage
  --------------- -------- ----------------
  `radius-sm`          6px Inputs, badges
  `radius-md`          8px Buttons, cards
  `radius-lg`         12px Large cards
  `radius-xl`         16px Major panels
  `radius-full`     9999px Avatars/pills

### Rule

Default dashboard card radius:

``` text
8–12px
```

Avoid making every component extremely rounded.

------------------------------------------------------------------------

# 14. Shadows

The design should rely primarily on borders.

### Default

``` css
box-shadow: none;
```

### Elevated panel

``` css
box-shadow: 0 4px 18px rgba(25, 52, 56, 0.06);
```

### Modal / popover

``` css
box-shadow: 0 12px 32px rgba(25, 52, 56, 0.12);
```

### Rule

If a border communicates hierarchy clearly, do not add a shadow.

------------------------------------------------------------------------

# 15. Buttons

## Primary Button

Background:

``` text
#F8FA87
```

Text:

``` text
#193438
```

Border:

``` text
none
```

Height:

``` text
40px
```

Radius:

``` text
8px
```

Font:

``` text
14px / 500
```

Example:

``` text
Create Return
Generate Label
Approve Return
```

------------------------------------------------------------------------

## Secondary Button

``` text
Background: #FFFFFF
Border: #D9D9D6
Text: #193438
```

Use for:

-   Cancel
-   Filter
-   Export
-   View Details

------------------------------------------------------------------------

## Dark Button

``` text
Background: #193438
Text: #FFFFFF
```

Use sparingly for high-importance actions where yellow would conflict
with status communication.

------------------------------------------------------------------------

## Destructive Button

``` text
Background: #B83A3A
Text: #FFFFFF
```

Use only for destructive actions.

------------------------------------------------------------------------

# 16. Inputs

Default:

``` text
Height: 40–44px
Border: 1px solid #D9D9D6
Radius: 8px
Background: #FFFFFF
```

Focus:

``` text
Border: #193438
Box-shadow: 0 0 0 3px rgba(25, 52, 56, 0.10)
```

Placeholder:

``` text
#999999
```

Input rules:

-   Labels sit above inputs.
-   Never rely only on placeholders as labels.
-   Use clear validation messages.
-   Keep input groups vertically aligned.
-   Search inputs may include a leading icon.

------------------------------------------------------------------------

# 17. Navigation

Sidebar navigation should be simple and text-first.

### Default

``` text
Text: #555555
Background: transparent
```

### Hover

``` text
Background: #F5F5F3
Text: #193438
```

### Active

``` text
Background: #FFFFFF
Text: #193438
Font weight: 500–600
```

Optional active indicator:

``` text
3px solid #F8FA87
```

### Navigation spacing

``` text
Item height: 40–44px
Gap between groups: 24–32px
Icon-to-label gap: 10–12px
```

------------------------------------------------------------------------

# 18. Icons

Use one icon family throughout the application.

Recommended style:

-   Lucide
-   18--20px default
-   1.75--2px stroke
-   Simple outline icons
-   No mixing filled and outlined icon families unnecessarily

Common icons:

  Purpose         Icon
  --------------- -----------------
  Dashboard       LayoutDashboard
  Returns         RotateCcw
  Orders          Package
  Search          Search
  Analytics       BarChart3
  Settings        Settings
  Users           Users
  Notifications   Bell
  Tracking        Truck
  Refund          Banknote
  Upload          Upload
  Download        Download
  More            MoreHorizontal

------------------------------------------------------------------------

# 19. KPI Cards

KPI cards should resemble the reference:

``` text
┌──────────────────────────────────┐
│  [Icon]                          │
│                                  │
│  Available Returns               │
│  1,248                            │
│                                  │
│  ↑ 8.0%                          │
└──────────────────────────────────┘
```

Rules:

-   White background
-   1px border
-   8--12px radius
-   20--24px padding
-   Small descriptive label
-   Large number
-   Optional trend indicator
-   One small colored icon container
-   Avoid excessive decoration

------------------------------------------------------------------------

# 20. Charts

Charts should be minimal.

### Line chart

-   Thin line
-   Minimal grid
-   Light gray axes
-   One highlighted data point
-   Yellow may highlight the selected point
-   Avoid multiple colors unless multiple datasets are necessary

### Bar chart

-   Use dark teal as the primary dataset.
-   Use yellow for the selected/highlighted category.
-   Use semantic colors only when data meaning requires them.

### Chart labels

-   11--12px
-   Gray
-   Avoid excessive axis labels
-   Tooltips should use a white card with subtle border/shadow.

------------------------------------------------------------------------

# 21. Tables

Tables are a major component for ReturnFlow.

### Header

``` text
Background: #FAFAF9
Text: #777777
Font: 12–13px / 500
```

### Row

``` text
Height: 56–64px
Border-bottom: 1px solid #E9E9E6
```

### Primary value

``` text
#111111
Font weight: 500
```

### Secondary metadata

``` text
#777777
13px
```

### Table rules

-   Avoid vertical borders between every column.
-   Keep row density moderate.
-   Use status badges instead of long status text.
-   Keep actions at the far right.
-   Allow horizontal scrolling on smaller screens.

------------------------------------------------------------------------

# 22. Status Badges

Use compact pills.

``` text
Height: 24–28px
Padding: 4px 10px
Radius: 9999px
Font: 12px / 500
```

Example:

``` text
PENDING REVIEW
APPROVED
IN TRANSIT
RECEIVED
REFUNDED
REJECTED
```

Use semantic colors consistently.

------------------------------------------------------------------------

# 23. ReturnFlow Status Timeline

The return detail page should visually communicate:

``` text
PENDING REVIEW
      ↓
APPROVED
      ↓
LABEL GENERATED
      ↓
IN TRANSIT
      ↓
RECEIVED
      ↓
REFUNDED
```

Rejected returns branch from the review stage:

``` text
PENDING REVIEW
      ↓
   REJECTED
```

### Timeline rules

-   Completed step: dark teal or success green
-   Current step: yellow highlight
-   Upcoming step: muted gray
-   Connector: light gray
-   Current state must be visually obvious without relying only on
    color.

------------------------------------------------------------------------

# 24. Cards

Default card:

``` css
background: #FFFFFF;
border: 1px solid #D9D9D6;
border-radius: 10px;
padding: 24px;
```

Card hierarchy:

``` text
Card
 ├── Eyebrow / label
 ├── Heading
 ├── Supporting information
 └── Action / data
```

Do not place too many unrelated metrics in one card.

------------------------------------------------------------------------

# 25. Search

Search is a primary interaction for an operations dashboard.

Recommended:

``` text
Width: 280–360px
Height: 40px
Radius: 9999px or 8px
```

Searchable fields:

-   Return ID
-   Order ID
-   Customer
-   Tracking number
-   Product
-   Status
-   Merchant

Search results should prioritize exact identifiers.

------------------------------------------------------------------------

# 26. Filters

Use compact horizontal filters:

``` text
[Status ▼] [Date ▼] [Merchant ▼] [Carrier ▼] [Search]
```

Rules:

-   Keep filters visually lightweight.
-   Do not use bright backgrounds for every filter.
-   Active filters may use the yellow accent.
-   Provide a clear "Reset filters" action.

------------------------------------------------------------------------

# 27. Modals and Drawers

Use drawers for operational details when possible.

Recommended:

``` text
Width: 420–520px
```

Modal:

``` text
Max-width: 560px
```

Rules:

-   Clear title
-   Short supporting description
-   Form/content
-   Primary action
-   Secondary action
-   Escape key support
-   Click-outside behavior where appropriate

------------------------------------------------------------------------

# 28. File Upload / Return Evidence

ReturnFlow requires product evidence/photo uploads.

Recommended dropzone:

``` text
Background: #FAFAF9
Border: 1px dashed #BDBDB8
Radius: 10px
```

Hover:

``` text
Border: #193438
Background: #FBFCD8
```

Show:

-   File preview
-   File name
-   File size
-   Upload progress
-   Remove action
-   Upload success/error state

------------------------------------------------------------------------

# 29. Empty States

Empty states should remain minimal.

Structure:

``` text
[Small icon]

No returns found

There are no return requests matching your current filters.

[Clear filters]
```

Avoid oversized illustrations.

------------------------------------------------------------------------

# 30. Loading States

Use skeleton loading instead of spinners where possible.

Skeleton:

``` text
Background: #F0F0ED
Radius: 6px
```

Skeleton animation should be subtle.

Avoid full-screen loading animations for normal API requests.

------------------------------------------------------------------------

# 31. Toast Notifications

Position:

``` text
Bottom-right
```

Recommended width:

``` text
320–380px
```

Examples:

``` text
Return approved successfully
Label generated successfully
Refund processing started
Unable to generate label
```

Use semantic status colors.

------------------------------------------------------------------------

# 32. Responsive Rules

## Desktop

``` text
≥ 1200px
```

Use full sidebar + multi-column dashboard.

## Tablet

``` text
768px – 1199px
```

-   Reduce sidebar width
-   Collapse secondary panels
-   Convert some 4-column KPI layouts to 2 columns
-   Keep tables horizontally scrollable

## Mobile

``` text
< 768px
```

-   Sidebar becomes a drawer
-   Header becomes compact
-   KPI cards become one column
-   Charts become full width
-   Tables become horizontally scrollable or transform into cards
-   Filters may become a filter drawer
-   Avoid tiny text

------------------------------------------------------------------------

# 33. Motion

Motion should feel functional, not decorative.

### Duration

``` text
Fast: 120ms
Normal: 180ms
Slow: 240ms
```

### Easing

``` text
cubic-bezier(0.2, 0.8, 0.2, 1)
```

Use motion for:

-   Sidebar opening
-   Drawer transitions
-   Dropdowns
-   Toasts
-   Button hover
-   Status transitions
-   Table/filter updates

Avoid:

-   Large bouncing animations
-   Continuous decorative animations
-   Excessive page transitions

------------------------------------------------------------------------

# 34. Accessibility

Minimum requirements:

-   WCAG-aware contrast
-   Keyboard navigation
-   Visible focus states
-   Semantic HTML
-   Proper labels
-   `aria-label` for icon-only buttons
-   Do not communicate status using color alone
-   Minimum interactive target around 40px
-   Support reduced motion

### Focus style

``` css
outline: 2px solid #193438;
outline-offset: 2px;
```

------------------------------------------------------------------------

# 35. Design Tokens

Recommended CSS variables:

``` css
:root {
  --color-primary: #193438;
  --color-accent: #F8FA87;

  --color-bg: #FFFFFF;
  --color-bg-subtle: #FAFAF9;
  --color-bg-muted: #F5F5F3;
  --color-bg-sidebar: #EAEAE8;

  --color-text-primary: #111111;
  --color-text-secondary: #555555;
  --color-text-tertiary: #777777;
  --color-text-muted: #999999;
  --color-text-on-dark: #FFFFFF;

  --color-border: #D9D9D6;
  --color-border-subtle: #E9E9E6;
  --color-border-strong: #BDBDB8;

  --color-success: #247A52;
  --color-success-soft: #EAF6EF;

  --color-warning: #9A6B00;
  --color-warning-soft: #FFF7D6;

  --color-error: #B83A3A;
  --color-error-soft: #FCECEC;

  --color-info: #356B82;
  --color-info-soft: #EAF4F8;

  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  --shadow-sm: 0 2px 8px rgba(25, 52, 56, 0.04);
  --shadow-md: 0 4px 18px rgba(25, 52, 56, 0.06);
  --shadow-lg: 0 12px 32px rgba(25, 52, 56, 0.12);
}
```

------------------------------------------------------------------------

# 36. Tailwind Mapping

If Tailwind CSS is used, define the brand tokens instead of scattering
raw hex values throughout components.

Example conceptual mapping:

``` js
colors: {
  brand: {
    DEFAULT: "#193438",
    accent: "#F8FA87",
  },

  surface: {
    DEFAULT: "#FFFFFF",
    subtle: "#FAFAF9",
    muted: "#F5F5F3",
    sidebar: "#EAEAE8",
  },

  text: {
    primary: "#111111",
    secondary: "#555555",
    tertiary: "#777777",
    muted: "#999999",
  },

  border: {
    DEFAULT: "#D9D9D6",
    subtle: "#E9E9E6",
    strong: "#BDBDB8",
  },
}
```

------------------------------------------------------------------------

# 37. Page-by-Page Visual Rules

## Dashboard

Priority order:

1.  Page title
2.  KPI cards
3.  Main return activity chart
4.  Return status distribution
5.  Recent returns table
6.  Secondary operational information

The first viewport should communicate the current operational state
immediately.

------------------------------------------------------------------------

## Returns

Primary layout:

``` text
Returns
────────────────────────────────────
Search        Filters       Create Return

KPI / summary row

Returns table
```

Table columns:

``` text
Return ID
Order
Customer
Product
Reason
Status
Created
Action
```

------------------------------------------------------------------------

## Return Details

Recommended structure:

``` text
Return #RT-10294

[Status Badge]

Customer information
Order information
Product information
Return reason
Evidence
Tracking
Status timeline
Refund information

[Approve] [Reject] [Generate Label]
```

------------------------------------------------------------------------

## Create Return

Use a focused multi-step form:

``` text
1. Order
2. Product
3. Return Reason
4. Evidence
5. Review
6. Submit
```

Keep one primary action per step.

------------------------------------------------------------------------

# 38. Dashboard Visual Hierarchy

Use this hierarchy:

``` text
Level 1 — Page title / major number
Level 2 — Section heading
Level 3 — Card title / table primary value
Level 4 — Supporting metadata
Level 5 — Helper text
```

Never make every piece of text equally prominent.

------------------------------------------------------------------------

# 39. Image and Illustration Rules

The dashboard reference is primarily UI-driven.

When illustrations are needed:

-   Use simple geometric illustrations.
-   Use the brand teal and yellow.
-   Keep backgrounds neutral.
-   Avoid photographic hero images inside operational dashboards.
-   Product thumbnails should use consistent aspect ratios.
-   Use 4:3 or 1:1 product thumbnails.

------------------------------------------------------------------------

# 40. Data Visualization Rules

### Use yellow for:

-   Selected data
-   Key KPI
-   Important highlight
-   Current focus

### Use teal for:

-   Primary dataset
-   Main chart line
-   Navigation
-   Core brand information

### Use semantic colors for:

-   Success
-   Warning
-   Error
-   Information

Do not create rainbow charts.

------------------------------------------------------------------------

# 41. Content / Copy Rules

Use concise operational language.

Prefer:

``` text
Create Return
Approve Return
Generate Label
Start Refund
View Details
Download Label
Track Shipment
```

Avoid:

``` text
Let's get started with creating a return!
Click here to begin the return journey.
```

Dashboard copy should be direct.

------------------------------------------------------------------------

# 42. Number Formatting

Use consistent formatting:

``` text
1,248
₹1,49,999
98.4%
2,480 returns
```

For financial values in an India-focused product:

``` text
₹1,49,999
```

For international carrier data, support the relevant currency:

``` text
$24.80
€21.40
£19.10
```

Do not mix currency formats inside the same metric group without labels.

------------------------------------------------------------------------

# 43. Z-Index Layers

Recommended:

``` text
Base content: 0
Sticky header: 20
Dropdown: 40
Popover: 50
Drawer: 60
Modal: 70
Toast: 80
Critical overlay: 90
```

Avoid arbitrary z-index values such as `999999`.

------------------------------------------------------------------------

# 44. Component Naming

Use consistent component names:

``` text
AppShell
Sidebar
TopBar
PageHeader
KpiCard
ChartCard
DataTable
StatusBadge
SearchInput
FilterBar
DatePicker
Button
Input
Select
Modal
Drawer
Toast
EmptyState
Skeleton
Timeline
FileUploader
ReturnCard
ReturnDetails
```

------------------------------------------------------------------------

# 45. Engineering Rules

1.  Do not hardcode colors inside individual components.
2.  Use design tokens.
3.  Do not create one-off spacing values unless necessary.
4.  Reuse buttons, inputs, cards, badges, and tables.
5.  Keep responsive behavior inside reusable components.
6.  Use semantic HTML.
7.  Keep interactive states consistent.
8.  Keep loading, empty, error, and success states designed from the
    beginning.
9.  Do not use color alone to communicate meaning.
10. Keep visual complexity low.

------------------------------------------------------------------------

# 46. Do / Don't

## Do

-   Use white space.
-   Use thin borders.
-   Use dark teal as the structural brand color.
-   Use yellow as a selective highlight.
-   Use Inter.
-   Use 8--12px card radius.
-   Keep charts minimal.
-   Use consistent status colors.
-   Keep dashboard tables highly scannable.
-   Use clear action labels.

## Don't

-   Don't use purple gradients.
-   Don't use excessive glassmorphism.
-   Don't use 20--30px rounded cards everywhere.
-   Don't use many accent colors.
-   Don't use thick borders.
-   Don't overuse shadows.
-   Don't make every button yellow.
-   Don't use oversized decorative graphics.
-   Don't create inconsistent component spacing.
-   Don't mix several font families.

------------------------------------------------------------------------

# 47. Reference Implementation Summary

### Primary

``` text
#193438
Dark Teal
```

### Accent

``` text
#F8FA87
Signal Yellow
```

### Font

``` text
Inter
```

### Default background

``` text
#FFFFFF
```

### Secondary background

``` text
#FAFAF9
```

### Border

``` text
#D9D9D6
```

### Default radius

``` text
8–12px
```

### Base spacing

``` text
4px
```

### Primary UI philosophy

``` text
Minimal
+ Spacious
+ Operational
+ Data-first
+ High contrast
+ Low decoration
```

------------------------------------------------------------------------

# 48. One-Line Design Direction

> **Build a calm, premium operations dashboard where dark teal provides
> structure, soft yellow provides focus, white space provides hierarchy,
> and typography carries most of the visual communication.**
