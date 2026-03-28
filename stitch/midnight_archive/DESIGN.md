# Design System Specification: The Digital Curator

## 1. Overview & Creative North Star
The North Star for this design system is **"The Digital Curator."** In a world of cluttered information, this system acts as a sophisticated, quiet gallery for knowledge. We are moving away from the "SaaS-in-a-box" aesthetic—characterized by rigid grids and heavy borders—and moving toward an editorial, high-tech experience. 

The goal is to make the management of vast libraries feel weightless. We achieve this through **Intentional Asymmetry**, where large typographic headers offset densley packed data, and **Tonal Depth**, where the UI feels like layered sheets of obsidian glass rather than flat pixels.

## 2. Colors: Tonal Depth & The "No-Line" Rule
This system utilizes a "Deep Charcoal" foundation to reduce eye strain and emphasize vibrant data accents.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. Layout boundaries must be established through background color shifts. For example, a `surface-container-low` sidebar sitting against a `surface` main content area creates a natural, sophisticated break without the "boxed-in" feel of traditional outlines.

### Surface Hierarchy & Nesting
Instead of a flat grid, treat the UI as a series of physical layers.
*   **Base Layer (`surface` / `#060e20`):** The canvas.
*   **Secondary Layer (`surface-container-low` / `#091328`):** Use for large structural areas like sidebars.
*   **Elevated Layer (`surface-container` / `#0f1930`):** Use for primary interactive cards.
*   **Highlight Layer (`surface-bright` / `#1f2b49`):** Use for active states or floating modals.

### The "Glass & Gradient" Rule
To elevate the "high-tech" feel, use **Glassmorphism** for floating elements (Tooltips, Dropdowns, Hover States). 
*   **Formula:** `surface-variant` at 60% opacity + `backdrop-blur: 12px`.
*   **Signature Textures:** Apply a subtle linear gradient to main Action Buttons (from `primary` to `primary-dim`) to give them a "jewel-like" luster that feels tactile and premium.

## 3. Typography: Editorial Authority
We pair the utilitarian precision of **Inter** with the geometric character of **Manrope** to create a hierarchy that feels both modern and authoritative.

*   **Display (Manrope):** Large, expressive scales (`display-lg` at 3.5rem) should be used with tight letter-spacing (-0.02em) for hero moments and library stats.
*   **Headlines (Manrope):** Used to introduce new sections. The geometric nature of Manrope provides a "High-End Editorial" feel.
*   **Body & Labels (Inter):** Inter is our workhorse. Use `body-md` (0.875rem) for metadata and book descriptions to ensure maximum legibility at high densities.
*   **Hierarchy Note:** Always maintain at least a 2-step jump in scale between headlines and body text to create the "Asymmetric Depth" required for the Digital Curator look.

## 4. Elevation & Depth
Traditional drop shadows are forbidden. We use light and tone to simulate 3D space.

### The Layering Principle
Depth is achieved by "stacking" the surface-container tiers. Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural "recessed" look.

### Ambient Shadows
When a "floating" effect is mandatory (e.g., a book preview modal):
*   **Shadow Blur:** 40px - 60px.
*   **Opacity:** 4% - 8%.
*   **Color:** Use a tinted version of `on-surface` (`#dee5ff`) rather than pure black to mimic how light interacts with dark materials.

### The "Ghost Border" Fallback
If accessibility requirements demand a container boundary, use a **Ghost Border**:
*   **Token:** `outline-variant` (`#40485d`).
*   **Opacity:** Max 20%.
*   **Rule:** Never use 100% opacity for structural lines.

## 5. Components

### Buttons & Chips
*   **Primary Button:** Uses the `primary` to `primary-dim` gradient. Corner radius: `md` (0.75rem). No border.
*   **Secondary Button:** `surface-container-high` background with `on-surface` text.
*   **Selection Chips:** Use `secondary-container` for active states. These should have a `full` (9999px) radius to contrast against the `xl` (1.5rem) radius of content cards.

### Input Fields
*   **Styling:** Avoid "box" inputs. Use `surface-container-lowest` as the fill color.
*   **Focus State:** Instead of a thick border, use a subtle 2px glow (shadow) using the `primary` color at 30% opacity.

### Cards & Lists (The Library View)
*   **The Divider Ban:** Do not use line dividers between list items. Use vertical white space (Token `6` or `8`) or a subtle hover shift to `surface-container-highest`.
*   **Card Radius:** Use `xl` (1.5rem) for main dashboard cards and `lg` (1rem) for nested child cards.
*   **Interactive State:** On hover, a card should not move "up"; instead, increase the backdrop-blur and shift the background color from `surface-container` to `surface-bright`.

### Specialty Components: The "Loom" Scroll
For long library lists, implement a "Loom" scroll effect where the top and bottom of the list container fade into the background using a linear-gradient mask (from `surface` to transparent), making the content appear to emerge from the darkness.

## 6. Do's and Don'ts

### Do
*   **DO** use asymmetric padding. For example, a card might have 2rem padding on the top/left but 3rem on the bottom to create a custom, "designed" feel.
*   **DO** use `secondary` (emerald) and `tertiary` (pink/lavender) sparingly for status indicators (Available vs. Reserved).
*   **DO** leverage the `spacing-16` (4rem) for "Breathing Room" between major feature blocks.

### Don't
*   **DON'T** use pure white (`#ffffff`) for text. Use `on-surface` (`#dee5ff`) to maintain the "Dark Mode" atmosphere and reduce glare.
*   **DON'T** use 1px borders to separate table rows. Use alternating row colors (`surface` and `surface-container-low`).
*   **DON'T** use standard "Drop Shadows." If it doesn't look like ambient light, it doesn't belong in this system.