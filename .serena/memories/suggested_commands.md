# Development Workflow & Suggested Commands

## Setup
1.  Install dependencies: `pnpm install`

## Running the App
- **Development Mode:** `pnpm tauri dev`
    - This runs the Vite frontend server and compiles the Rust backend.
    - Hot module replacement (HMR) is active for frontend.
    - Rust changes trigger a recompile and app restart.

## Building
- **Production Build:** `pnpm tauri build`
    - Creates an optimized executable in `src-tauri/target/release/`.

## Quality Assurance
- **Type Check (Frontend):** `tsc` (or via build script).
- **Rust Formatting:** `cd src-tauri && cargo fmt`
- **Rust Linting:** `cd src-tauri && cargo clippy`
- **Clean Build:** `cd src-tauri && cargo clean` (Use if build artifacts are corrupted).

## File Structure Navigation
- `src/`: Frontend logic (`main.ts`) and styles (`styles.css`).
- `src-tauri/src/lib.rs`: Main Rust logic (commands like `scan_books`).
- `src-tauri/tauri.conf.json`: Application configuration and capabilities.
