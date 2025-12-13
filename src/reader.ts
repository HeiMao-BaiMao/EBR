// @ts-ignore
import ePub from "@intity/epub-js";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { Rendition, Theme } from "./types";
import { getElement, showView } from "./utils";
import { getCurrentTheme } from "./theme";

let activeRendition: Rendition | null = null;
let currentDirection: string = "ltr";

export async function openBook(filePath: string) {
  showView("reader-view");
  
  const assetUrl = convertFileSrc(filePath);
  console.log("Opening book from path:", filePath);
  
  // Detect direction via Rust
  try {
      const dir = await invoke<string>("get_book_direction", { path: filePath });
      console.log("Rust detected direction:", dir);
      currentDirection = dir;
  } catch (e) {
      console.warn("Failed to detect direction via Rust:", e);
      currentDirection = "ltr";
  }
  
  await renderEpub(assetUrl);
}

export function closeBook() {
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

export function updateRenditionTheme(theme: Theme) {
    if (activeRendition) {
        try {
            activeRendition.themes.select(theme);
        } catch (e) {
            console.warn("Failed to update theme:", e);
        }
    }
}

function enterFullscreen() {
  document.body.classList.add("fullscreen-mode");
}

function exitFullscreen() {
  document.body.classList.remove("fullscreen-mode");
}

async function renderEpub(url: string) {
  const viewer = getElement<HTMLDivElement>("#viewer");
  viewer.innerHTML = "";

  await new Promise(resolve => requestAnimationFrame(resolve));

  try {
      console.log("Initializing ePub with URL:", url);
      const book: any = ePub(url);
      
      console.log("Waiting for book.ready...");
      await book.ready;
      console.log("Book is ready");

      try {
          if (book.opened) {
              await book.opened;
          }
      } catch (e) { console.warn("Error waiting for opened:", e); }

      let metadata: any = {};
      try {
          metadata = await book.loaded.metadata;
          console.log("Loaded Metadata:", metadata);
      } catch (e) {
          console.warn("Failed to load metadata:", e);
      }
      
      if (currentDirection !== "rtl") {
          let direction = metadata?.direction;
          if (!direction) {
            try {
                if (book.package?.metadata?.direction) {
                    direction = book.package.metadata.direction;
                } else if (book.spine?.direction) {
                   direction = book.spine.direction;
                }
            } catch (e) {}
          }
          if (direction) {
              currentDirection = direction;
          }
      }
      
      console.log("Final Book direction:", currentDirection);

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
      activeRendition.themes.register("dark", {
        body: { 
          color: "#f1f5f9 !important",
          background: "#0f172a !important" 
        }
      });
      activeRendition.themes.register("light", {
        body: { 
          color: "#0f172a !important",
          background: "#ffffff !important" 
        }
      });

      activeRendition.themes.select(getCurrentTheme());

      console.log("Displaying rendition...");
      await activeRendition.display();
      
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
    // Placeholder
}

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

window.addEventListener("resize", () => {
    if (activeRendition) {
      try {
          activeRendition.resize();
      } catch (e) {
          console.warn("Resize error:", e);
      }
    }
});
