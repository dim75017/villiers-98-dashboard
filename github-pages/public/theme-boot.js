(() => {
  const root = document.documentElement;
  let theme = "dark";
  try {
    const saved = window.localStorage.getItem("villiers-98-theme-v1");
    theme = saved === "light" || saved === "dark"
      ? saved
      : window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#f3eee4" : "#070a11");
})();
