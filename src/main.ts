import { initTheme, toggleTheme } from "./theme";
import { initBookshelf } from "./bookshelf";
import { closeBook, updateRenditionTheme } from "./reader";

window.addEventListener("DOMContentLoaded", () => {
  // Theme initialization
  initTheme((newTheme) => {
      // Callback when theme changes, update reader if active
      updateRenditionTheme(newTheme);
  });
  
  // Bookshelf initialization
  initBookshelf();
  
  // Event listeners for global buttons (back, theme)
  const backBtn = document.getElementById("back-btn");
  if (backBtn) {
      backBtn.addEventListener("click", closeBook);
  }
  
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
      themeBtn.addEventListener("click", toggleTheme);
  }
});