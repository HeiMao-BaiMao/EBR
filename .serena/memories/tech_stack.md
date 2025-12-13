# Tech Stack

## Frontend
- **Language:** TypeScript
- **Framework:** Vanilla (No heavy framework like React/Vue), using Vite for bundling.
- **Styling:** CSS Modules / Vanilla CSS with Custom Properties (Variables) for theming.
- **Libraries:**
    - `epubjs`: Rendering EPUB content.
    - `@tauri-apps/*`: Tauri core and plugins.

## Backend
- **Framework:** Tauri 2
- **Language:** Rust (2021 Edition)
- **Dependencies:**
    - `epub`: Parsing EPUB metadata in Rust.
    - `walkdir`: File system scanning.
    - `serde`, `serde_json`: Serialization.
    - `base64`: Image handling.

## Build Tools
- **Node:** `pnpm` (Package Manager), `vite` (Dev/Build).
- **Rust:** `cargo`.
