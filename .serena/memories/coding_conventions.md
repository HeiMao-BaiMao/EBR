# Coding Conventions

## General
- **Tone:** Minimalist, functional, and native-feeling.
- **Safety:** Use `try-catch` blocks for async operations, especially file I/O and rendering.

## Frontend (TypeScript)
- **Strictness:** `strict: true` in `tsconfig.json`. No implicit `any`.
- **Styling:** Use CSS variables (e.g., `--bg-color`, `--text-color`) for all colors to support theming.
- **DOM Access:** Use helper functions like `getElement<T>` to ensure type safety when querying DOM elements.

## Backend (Rust)
- **Commands:** Expose functionality via `#[tauri::command]`.
- **Error Handling:** Use `Result` or `Option` appropriately. Avoid panics in commands; return errors to frontend.
- **Structure:** Keep `main.rs` minimal (entry point); put logic in `lib.rs` or modules.

## Theming
- **Variables:** Defined in `src/styles.css` under `:root` (Light) and `body.dark-theme` (Dark).
- **Logic:** `currentTheme` state in `main.ts` manages the toggle and persistence.
