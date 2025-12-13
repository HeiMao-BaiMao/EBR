import ePub from "epubjs";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";

// Define types
type EpubRendition = any;
type Theme = 'light' | 'dark';

interface Book {
  path: string;
  title: string;
  author: string;
  cover_base64?: string;
}

// State
let activeRendition: EpubRendition | null = null;
let currentDirection: string = "ltr";
let libraryPaths: string[] = [];
let books: Book[] = [];
let currentTheme: Theme = 'light';

// Helpers
const getElement = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`${selector} is missing in the DOM`);
  }
  return element;
};

// --- Theme Logic ---

function initTheme() {
  const savedTheme = localStorage.getItem('theme') as Theme | null;
  if (savedTheme) {
    currentTheme = savedTheme;
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    currentTheme = 'dark';
  }
  
  applyTheme(currentTheme);
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
  applyTheme(currentTheme);
}

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  
  // If reader is active, update its theme
  if (activeRendition) {
    try {
      activeRendition.themes.select(theme);
    } catch (e) {
      console.warn("Failed to switch epub theme:", e);
    }
  }
}

// --- Bookshelf Logic ---

async function loadLibrary() {
  const stored = localStorage.getItem("libraryPaths");
  if (stored) {
    libraryPaths = JSON.parse(stored);
    await scanLibrary();
  }
}

async function scanLibrary() {
  try {
    console.log("Scanning paths:", libraryPaths);
    const result = await invoke<Book[]>("scan_books", { paths: libraryPaths });
    books = result;
    renderBookshelf();
  } catch (error) {
    console.error("Failed to scan library:", error);
  }
}

async function addLibraryPath() {
  try {
    const selected = await open({
      multiple: false,
      directory: true,
    });

    if (selected && typeof selected === "string") {
      if (!libraryPaths.includes(selected)) {
        libraryPaths.push(selected);
        localStorage.setItem("libraryPaths", JSON.stringify(libraryPaths));
        await scanLibrary();
      }
    }
  } catch (e) {
    console.error("Failed to open dialog:", e);
  }
}

function renderBookshelf() {
  const grid = getElement<HTMLDivElement>("#library-grid");
  grid.innerHTML = "";

  if (books.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" id="empty-state">
        <p>No books found. Add a folder to scan for EPUBs.</p>
      </div>
    `;
    return;
  }

  books.forEach((book) => {
    const card = document.createElement("div");
    card.className = "book-card";
    // Use arrow function to capture current book path
    card.onclick = () => openBook(book.path);

    const coverHtml = book.cover_base64
      ? `<img src="${book.cover_base64}" alt="${book.title}" loading="lazy" />`
      : `<span aria-hidden="true">📖</span>`;

    card.innerHTML = `
      <div class="book-cover ${!book.cover_base64 ? 'no-cover' : ''}">
        ${coverHtml}
      </div>
      <div class="book-info">
        <h3 class="book-title" title="${book.title}">${book.title}</h3>
        <p class="book-author" title="${book.author}">${book.author}</p>
      </div>
    `;
    grid.appendChild(card);
  });
}

// --- Reader Logic ---

function showView(viewId: "bookshelf-view" | "reader-view") {
  const bookshelf = getElement("#bookshelf-view");
  const reader = getElement("#reader-view");

  if (viewId === "bookshelf-view") {
    bookshelf.classList.remove("hidden");
    bookshelf.classList.add("active");
    reader.classList.add("hidden");
    reader.classList.remove("active");
  } else {
    bookshelf.classList.add("hidden");
    bookshelf.classList.remove("active");
    reader.classList.remove("hidden");
    reader.classList.add("active");
  }
}

async function openBook(filePath: string) {
  showView("reader-view");
  
  // Convert local path to asset URL (e.g., asset://localhost/...)
  const assetUrl = convertFileSrc(filePath);
  console.log("Opening book from path:", filePath);
  console.log("Converted asset URL:", assetUrl);
  
  await renderEpub(assetUrl);
}

function closeBook() {
  if (activeRendition) {
    try {
        activeRendition.destroy();
    } catch (e) {
        console.warn("Error destroying rendition:", e);
    }
    activeRendition = null;
  }
  exitFullscreen();
  showView("bookshelf-view");
}

function enterFullscreen() {
  document.body.classList.add("fullscreen-mode");
}

function exitFullscreen() {
  document.body.classList.remove("fullscreen-mode");
}

async function renderEpub(url: string) {
  const viewer = getElement<HTMLDivElement>("#viewer");
  viewer.innerHTML = ""; // Clear previous

  // Ensure DOM is visible
  await new Promise(resolve => requestAnimationFrame(resolve));

  try {
      console.log("Initializing ePub with URL:", url);
      const book = ePub(url);
      
      // Wait for book to be ready before rendering to ensure metadata is available
      console.log("Waiting for book.ready...");
      await book.ready;
      console.log("Book is ready");

      // Retrieve metadata safely
      let metadata;
      try {
          metadata = await book.loaded.metadata;
      } catch (e) {
          console.warn("Failed to load metadata:", e);
      }
      
      const direction = metadata?.direction;
      
      currentDirection = direction || "ltr";
      console.log("Book direction:", currentDirection);

      enterFullscreen();

      console.log("Rendering to viewer...");
      activeRendition = book.renderTo(viewer, {
        width: "100%",
        height: "100%",
        flow: "paginated",
        manager: "default",
        // @ts-ignore
        spread: "always",
        // @ts-ignore
        allowScriptedContent: true
      });

      // Register Themes
      console.log("Registering themes...");
      // Dark Theme
      activeRendition.themes.register("dark", {
        body: { 
          color: "#f1f5f9 !important",
          background: "#0f172a !important" 
        }
      });
      // Light Theme (Default)
      activeRendition.themes.register("light", {
        body: { 
          color: "#0f172a !important",
          background: "#ffffff !important" 
        }
      });

      // Select current theme
      activeRendition.themes.select(currentTheme);

      console.log("Displaying rendition...");
      await activeRendition.display();
      console.log("Rendition displayed");
      
      // Handle key events
      setupKeyboardNavigation();

  } catch (e) {
      console.error("Error rendering EPUB:", e);
      viewer.innerHTML = `<div style="color:red; padding:20px;">
        <h3>Error loading book</h3>
        <p>${e}</p>
        <p>URL: ${url}</p>
      </div>`;
  }
}

function setupKeyboardNavigation() {
  // Remove previous listeners to avoid duplicates if possible, 
  // but simpler here to just rely on the fact that we destroy/recreate the view.
  // Ideally, we should attach to document and check state.
}

// Global key listener
window.addEventListener("keyup", (e) => {
    if (!activeRendition) return;
    if (document.getElementById("reader-view")?.classList.contains("hidden")) return;

    const isRTL = currentDirection === "rtl";

    switch (e.key) {
      case "ArrowLeft":
        if (isRTL) activeRendition.next();
        else activeRendition.prev();
        break;
      case "ArrowRight":
        if (isRTL) activeRendition.prev();
        else activeRendition.next();
        break;
      case "Escape":
        closeBook();
        break;
    }
});

window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadLibrary();
  
  const addBtn = document.getElementById("add-folder-btn");
  if (addBtn) {
      addBtn.addEventListener("click", addLibraryPath);
  }

  const backBtn = document.getElementById("back-btn");
  if (backBtn) {
      backBtn.addEventListener("click", closeBook);
  }
  
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
      themeBtn.addEventListener("click", toggleTheme);
  }
  
  window.addEventListener("resize", () => {
    if (activeRendition) {
      try {
          activeRendition.resize();
      } catch (e) {
          console.warn("Resize error:", e);
      }
    }
  });
});
