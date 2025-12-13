export const getElement = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`${selector} is missing in the DOM`);
  }
  return element;
};

export function showView(viewId: "bookshelf-view" | "reader-view") {
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
