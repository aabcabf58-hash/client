(function () {
  const STORAGE_KEY = "customer_theme";
  const root = document.documentElement;
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function getSavedTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return null;
  }

  function getInitialTheme() {
    return getSavedTheme() || (mediaQuery.matches ? "dark" : "light");
  }

  function updateButton(button, theme) {
    if (!button) {
      return;
    }

    const isDark = theme === "dark";

    button.textContent = isDark ? "☀️" : "🌙";
    button.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
    button.title = isDark ? "Light mode" : "Dark mode";
  }

  function applyTheme(theme, save = false) {
    const selectedTheme = theme === "light" ? "light" : "dark";

    root.dataset.theme = selectedTheme;

    if (save) {
      localStorage.setItem(STORAGE_KEY, selectedTheme);
    }

    updateButton(
      document.getElementById("themeToggleButton"),
      selectedTheme
    );
  }

  applyTheme(getInitialTheme());

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("spacePlanets")) {
      const planets = document.createElement("div");
      planets.id = "spacePlanets";
      planets.className = "space-planets";
      planets.setAttribute("aria-hidden", "true");
      planets.innerHTML = `
        <span class="space-planet planet-blue"></span>
        <span class="space-planet planet-gold"></span>
        <span class="space-planet planet-ringed"></span>
      `;
      document.body.appendChild(planets);
    }

    if (document.getElementById("themeToggleButton")) {
      return;
    }

    const button = document.createElement("button");

    button.id = "themeToggleButton";
    button.className = "theme-toggle";
    button.type = "button";

    updateButton(button, root.dataset.theme);

    button.addEventListener("click", function () {
      const nextTheme =
        root.dataset.theme === "dark" ? "light" : "dark";

      applyTheme(nextTheme, true);
    });

    document.body.appendChild(button);
  });

  mediaQuery.addEventListener("change", function (event) {
    if (!getSavedTheme()) {
      applyTheme(event.matches ? "dark" : "light");
    }
  });

  window.addEventListener("storage", function (event) {
    if (
      event.key === STORAGE_KEY &&
      (event.newValue === "light" || event.newValue === "dark")
    ) {
      applyTheme(event.newValue);
    }
  });
})();
