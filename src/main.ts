export {};

const EPUB_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js";

type EpubFactory = (input: ArrayBuffer | string) => EpubBook;

type EpubBook = {
  renderTo: (
    element: HTMLElement,
    options: { width: string | number; height: string | number }
  ) => EpubRendition;
};

type EpubRendition = {
  display: (target?: string) => Promise<void>;
  destroy: () => void;
};

declare global {
  interface Window {
    ePub?: EpubFactory;
  }
}

let activeRendition: EpubRendition | null = null;

const getElement = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`${selector} is missing in the DOM`);
  }
  return element;
};

async function loadEpubScript(): Promise<EpubFactory> {
  if (window.ePub) {
    return window.ePub;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = EPUB_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("EPUB.jsの読み込みに失敗しました"));
    document.head.appendChild(script);
  });

  if (!window.ePub) {
    throw new Error("EPUB.jsが利用できません");
  }

  return window.ePub;
}

function showStatus(message: string) {
  const statusEl = getElement<HTMLParagraphElement>("#status");
  statusEl.textContent = message;
}

function setFileName(name: string) {
  const fileNameEl = getElement<HTMLParagraphElement>("#file-name");
  fileNameEl.textContent = name;
}

function resetViewer() {
  const viewer = getElement<HTMLDivElement>("#viewer");
  viewer.innerHTML = "";
  if (activeRendition) {
    activeRendition.destroy();
    activeRendition = null;
  }
}

async function renderEpub(file: File) {
  const dropArea = getElement<HTMLDivElement>("#drop-area");
  const viewer = getElement<HTMLDivElement>("#viewer");

  showStatus("EPUB.jsを読み込み中...");
  const ePubFactory = await loadEpubScript();

  showStatus("EPUBを展開中...");
  const buffer = await file.arrayBuffer();
  resetViewer();

  const book = ePubFactory(buffer);
  activeRendition = book.renderTo(viewer, {
    width: "100%",
    height: "100%",
  });

  await activeRendition.display();
  dropArea.classList.add("has-book");
  setFileName(file.name);
  showStatus("EPUBを表示しています");
}

function validateFile(file: File | undefined): File | null {
  if (!file) {
    return null;
  }

  if (!file.name.toLowerCase().endsWith(".epub")) {
    showStatus("EPUBファイル（.epub）を選択してください");
    return null;
  }

  return file;
}

function setupFileInput() {
  const fileInput = getElement<HTMLInputElement>("#file-input");
  const dropArea = getElement<HTMLDivElement>("#drop-area");

  dropArea.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async () => {
    const file = validateFile(fileInput.files?.[0]);
    if (file) {
      await renderEpub(file);
    }
  });
}

function setupDragAndDrop() {
  const dropArea = getElement<HTMLDivElement>("#drop-area");

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });

  dropArea.addEventListener("dragenter", () => {
    dropArea.classList.add("dragging");
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("dragging");
  });

  dropArea.addEventListener("drop", async (event) => {
    dropArea.classList.remove("dragging");
    const file = validateFile(event.dataTransfer?.files?.[0]);
    if (file) {
      await renderEpub(file);
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  setupFileInput();
  setupDragAndDrop();
  showStatus("EPUB.jsでEPUBを表示します。ファイルをドロップしてください。");
});
