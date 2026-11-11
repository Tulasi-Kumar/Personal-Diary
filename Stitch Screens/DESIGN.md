---
name: DayBook
colors:
  surface: '#fdf9f1'
  surface-dim: '#dddad2'
  surface-bright: '#fdf9f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3eb'
  surface-container: '#f1ede6'
  surface-container-high: '#ece8e0'
  surface-container-highest: '#e6e2da'
  on-surface: '#1c1c17'
  on-surface-variant: '#50453b'
  inverse-surface: '#31302b'
  inverse-on-surface: '#f4f0e8'
  outline: '#83746a'
  outline-variant: '#d5c3b7'
  surface-tint: '#80552b'
  primary: '#7e5329'
  on-primary: '#ffffff'
  primary-container: '#9a6b3f'
  on-primary-container: '#fffcff'
  inverse-primary: '#f5bb88'
  secondary: '#645d58'
  on-secondary: '#ffffff'
  secondary-container: '#e8ded7'
  on-secondary-container: '#68615c'
  tertiary: '#645b54'
  on-tertiary: '#ffffff'
  tertiary-container: '#7e736c'
  on-tertiary-container: '#fffdff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc0'
  primary-fixed-dim: '#f5bb88'
  on-primary-fixed: '#2d1600'
  on-primary-fixed-variant: '#653e16'
  secondary-fixed: '#ebe0da'
  secondary-fixed-dim: '#cfc5be'
  on-secondary-fixed: '#1f1b17'
  on-secondary-fixed-variant: '#4c4641'
  tertiary-fixed: '#eee0d7'
  tertiary-fixed-dim: '#d1c4bb'
  on-tertiary-fixed: '#211a15'
  on-tertiary-fixed-variant: '#4e453f'
  background: '#fdf9f1'
  on-background: '#1c1c17'
  surface-variant: '#e6e2da'
typography:
  display:
    fontFamily: EB Garamond
    fontSize: 38px
    fontWeight: '400'
    lineHeight: 46px
    letterSpacing: -0.01em
  display-mobile:
    fontFamily: EB Garamond
    fontSize: 30px
    fontWeight: '400'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: EB Garamond
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 36px
    letterSpacing: 0em
  headline-md:
    fontFamily: EB Garamond
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: 0em
  headline-sm:
    fontFamily: EB Garamond
    fontSize: 19px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: 0em
  body-lg:
    fontFamily: EB Garamond
    fontSize: 19px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.01em
  body-md:
    fontFamily: EB Garamond
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-sm:
    fontFamily: EB Garamond
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.06em
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes a quiet, literary sanctuary for daily reflection. Inspired by artisanal bookmaking, fine book typography, and tactile archival paper, the interface rejects aggressive digital patterns, loud notifications, and glossy decorative chrome.

### Brand Personality & Core Values
- **Literary & Timeless:** Evoking the tactile intimacy of archival paper, cloth bindings, and letterpress ink.
- **Serene & Unhurried:** Generous margins, deliberate typographic hierarchy, and breathing room that calm the mind and invite deep reflection.
- **Restrained & Dignified:** High discipline in visual cues; zero vibrant badges, no gratuitous animations, and strictly functional accents.

### Design Movement
- **Editorial Papercraft / Literary Minimalism:** Characterized by flat, paper-like surfaces, hairline structural rules, generous book-like margins, and sophisticated serif typography paired with quiet, micro-scaled sans-serif functional elements.

## Colors

The color palette translates the physical presence of ink absorbed into unbleached deckle-edge paper. High contrast is avoided in favor of warm, low-strain tonal relationships.

### Palette Roles
- **Paper Canvas (`#FAF6EE`):** The primary paper background. Soft, warm ivory that reduces eye fatigue during introspective writing sessions.
- **Subtle Surface (`#F5EFE3`, `#F4EFE4`):** Secondary nested containers, paper sheets, and calendar tiles.
- **Deep Ink (`#241F1B`):** The primary typography tone; dark charcoal-brown with zero harsh pure-black harshness.
- **Secondary Ink (`#6E645D`):** Running headers, entry dates, meta text, and secondary copy.
- **Muted Ink (`#8C8075`):** Placeholders, subtle timestamps, and disabled states.
- **Muted Bronze (`#9A6B3F`):** The singular focal accent. Used sparingly for active dates, bookmark indicators, active navigation marks, and current selection indicators.
- **Hairline Border (`#E8DFD1` / `#EDE5D8`):** Archival bookbinding rules and discreet separators.

## Typography

The typographic strategy balances classic literary body text with whisper-quiet, utilitarian sans-serif UI microcopy.

### Type Roles & Treatment
- **Headlines & Editorial Body (EB Garamond):** Generous line height (1.6 to 1.7x) ensures fatigue-free long-form reading and writing. Used for chapter-like titles, diary prose, quotes, and reflections. First paragraphs of long entries may feature an unadorned serif drop cap spanning two lines.
- **Labels & Functional UI (Inter):** Rendered in understated, tracking-spaced small caps or medium weights. Used strictly for dates, days of the week, tab labels, utility toolbars, and metadata.
- **Typographic Discipline:** Never italicize sans-serif labels. Limit bold weights strictly to active date marks or structural emphasis.

## Layout & Spacing

Layouts in this design system follow the classical margins of fine book typography. Rather than packing content edge-to-edge, the screen provides a safe frame that mimics physical page borders.

### Layout Model
- **Reading Measure:** The primary writing and reading column adheres to an optimal line length (55–70 characters per line), naturally centered within wider screen sizes.
- **Rhythm & Rules:** Vertical flow is organized by generous gaps and fine, 1px horizontal rules rather than boxed containers.
- **Breakpoints & Adaptation:**
  - **Mobile (<640px):** Single-column layout with 1.25rem outer margins to preserve paper framing even on small displays.
  - **Tablet & Desktop (≥640px):** Content width caps at 680px for standard diary views. Split-pane layout (Calendar/Archive column on the left, Reader/Editor on the right) engages only above 960px.

## Elevation & Depth

Visual hierarchy is communicated through tonal shifts and hairline perimeters rather than digital drop shadows.

### Elevation Principles
- **No Drop Shadows:** Standard blur shadows are strictly avoided. Depth is purely planar, reminiscent of physical paper laid upon paper.
- **Hairline Outlines:** Containers and cards rely on a 1px solid border (`#E8DFD1`).
- **Surface Layering:** Elevated sheets (such as modals or slide-up drawers) employ a soft paper tone (`#FAF6EE`) stacked atop backdrop paper (`#F5EFE3`) with a soft 12% opacity neutral dark scrim (`rgba(36, 31, 27, 0.12)`).

## Shapes

The shape system evokes trimmed book stock and artisanal paper cuts.

### Corner Rules
- **Structural Cards & Sheets:** Fixed at `0.25rem` (4px) to retain an authentic paper feel without aggressive digital rounding.
- **Buttons & Chips:** Subtle `0.25rem` rounding; never fully pill-shaped.
- **Indicators & Date Dots:** Active day markers and status indicators use pure circular forms (size matching text line-height).

## Components

Components are quiet instruments designed to disappear while reading or writing.

### Buttons
- **Primary:** Background in `#241F1B`, typography in `#FAF6EE`, subtle 0.25rem radius. Used exclusively for core confirmations (e.g., "Save Entry").
- **Secondary / Text:** Flat `#FAF6EE` background, 1px solid `#E8DFD1` border, `#241F1B` text.
- **Tertiary / Literary Link:** Understated text button in `#9A6B3F` or `#6E645D` with no background or border, using Inter 11px uppercase.

### Cards & Entry Containers
- Plain canvas background (`#FAF6EE` or `#F4EFE4`) framed by a 1px `#E8DFD1` outline.
- Generous internal padding (`space-lg`).
- Cards avoid heavy hover lifts; interaction is signaled via subtle text color transitions and slight border warmth.

### Lists & Dividers
- Unbordered list rows separated solely by a 1px solid `#EDE5D8` hairline.
- Date labels positioned as floating marginalia or understated subheaders in Inter small caps (`label-md`).

### Text Inputs & Editor
- Borderless writing field blending directly into the paper background.
- Subtle placeholder text in `#8C8075` with classic serif italic styling.
- Zero floating labels or bouncy micro-interactions.

### Selection Controls (Checkboxes & Radios)
- Minimalist, thin 1px `#6E645D` square or circular outlines.
- Selected state fills with `#9A6B3F` displaying an understated ivory inner check or dot.

### Bottom Navigation Bar
- Grounded on `#FAF6EE` with a 1px `#E8DFD1` top border.
- Four core destinations: Home, Calendar, Memories, Profile.
- Thin-line 1.25px stroke iconography.
- Inactive items rendered in `#8C8075`; active item highlighted in `#9A6B3F` with an optional 3px bronze dot beneath.

### Calendar Grid
- Clean, open grid with invisible cell borders.
- Dates rendered in Inter (`label-md`).
- Entries present indicated by a single 3px `#9A6B3F` dot underneath the date number. Current day designated with a subtle 1px bronze ring or circular fill.