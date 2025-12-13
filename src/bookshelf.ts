import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { BookType } from "./types";
import { getElement } from "./utils";
import { openBook } from "./reader";

let libraryPaths: string[] = [];
let books: BookType[] = [];

export async function initBookshelf() {
  await loadLibrary();
  
  const addBtn = document.getElementById("add-folder-btn");
  if (addBtn) {
      addBtn.addEventListener("click", addLibraryPath);
  }
}

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
    const result = await invoke<BookType[]>("scan_books", { paths: libraryPaths });
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
