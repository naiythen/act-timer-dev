let timerInterval;
let remainingTime = 0;
let isRunning = false;
let currentSection = "";
let totalQuestions = 0;
let initialTime = 0;
let currentFullTestSection = 0;
const fullTestSections = [
  { name: "English", time: 45, questions: 75 },
  { name: "Math", time: 60, questions: 60 },
  { name: "Reading", time: 35, questions: 40 },
];

// Predefined colors for the palette (less neon)
const paletteColors = [
  "#e03a3a",
  "#49e049",
  "#4287f5",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFFFFF",
  "#000000",
  "#3399FF",
  "#4CAF50",
  "#FF9800",
  "#9C27B0",
  "#E91E63",
  "#03A9F4",
  "#607D8B",
  "#795548",
];
let selectedSwatch = null; // Track the selected swatch

function getCookie(name) {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split("=");
    if (cookieName.trim() === name) {
      return cookieValue;
    }
  }
  return null;
}

function setCookie(name, value, days = 365) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/;SameSite=Lax;`;
}

function showSettingsModal() {
  const modal = document.getElementById("settingsModal");

  // Toggle functionality: if modal is already shown, hide it and return
  if (modal.style.display === "block") {
    hideSettingsModal();
    return;
  }

  // 1. Read cookies for theme and pace
  const currentTheme = getCookie("theme") || "blue"; // Default to blue if no theme cookie
  const currentSpeed = getCookie("speed") || "0"; // Default to 'Right on Time' if no speed cookie

  // 2. Set Pace in GUI
  document.getElementById("paceSelect").value = currentSpeed;

  // 3. Set Theme in GUI
  document.querySelectorAll(".theme-option").forEach((option) => {
    option.classList.remove("selected"); // Clear all checkmarks first
    const themeValue = option.getAttribute("data-theme");
    if (themeValue === currentTheme) {
      option.classList.add("selected"); // Set checkmark for the current theme
    }
  });

  // 4. Handle Custom Theme Preview and Color Picker Visibility
  if (currentTheme === "custom") {
    const customColor = getCookie("customColor") || "#3399ff"; // Get custom color from cookie
    const customThemePreview = document.querySelector(
      '.theme-option[data-theme="custom"] .theme-color'
    );
    if (customThemePreview) {
      customThemePreview.style.backgroundColor = customColor; // Set preview color
      customThemePreview.innerHTML = ""; // Clear plus icon
    }
    showCustomColorPicker(); // Ensure color picker is shown for custom theme
  } else {
    hideCustomColorPicker(); // Hide color picker for non-custom themes
    // Revert custom theme preview to plus icon for other themes
    const customThemePreview = document.querySelector(
      '.theme-option[data-theme="custom"] .theme-color'
    );
    if (customThemePreview) {
      customThemePreview.style.backgroundColor = ""; // Reset background color
      customThemePreview.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20M2 12h20" />
        </svg>`; // Restore plus icon
    }
  }

  modal.style.display = "block"; // Finally, show the settings modal
}

function hideSettingsModal() {
  document.getElementById("settingsModal").style.display = "none";
}

function updateSpeedPreference(speedValue) {
  setCookie("speed", speedValue);
  hideSettingsModal();
  showNotification("⏱️ Pace preference updated!");
}

document.addEventListener("DOMContentLoaded", function () {
  // Check for the 'speed' cookie. If NOT present, show speed selection.
  if (!getCookie("speed")) {
    document.getElementById("menu").style.display = "none";
    document.getElementById("speedSelection").style.display = "block";
    document.getElementById("settingsIcon").style.display = "none"; // Hide settings icon initially
  } else {
    document.getElementById("menu").style.display = "flex"; // Or 'block' depending on your menu's needs
    document.getElementById("speedSelection").style.display = "none";
    document.getElementById("settingsIcon").style.display = "flex";
  }

  // Apply theme from cookie on load
  const savedTheme = getCookie("theme") || "blue"; // Default to blue if no theme is set
  applyTheme(savedTheme);

  // Initialize color palette
  createColorPalette();
});

function setSpeedPreference(speedValue) {
  setCookie("speed", speedValue);
  document.getElementById("speedSelection").style.display = "none";
  document.getElementById("menu").style.display = "flex";
  document.getElementById("settingsIcon").style.display = "flex";
  showNotification("⏱️ Speed preference saved!");
}

function startTimer(sectionName, durationMinutes, numQuestions) {
  if (document.getElementById("settingsModal").style.display === "block") {
    showNotification("Please close settings before starting the timer.");
    return;
  }
  showTimerScreen(sectionName);
  remainingTime = durationMinutes * 60;
  initialTime = remainingTime;
  totalQuestions = numQuestions;
  isRunning = true;
  updateDisplay();
  updateProgressBar();
  updateQuestionGuidance();
  startInterval();
}

function startFullTest() {
  if (document.getElementById("settingsModal").style.display === "block") {
    showNotification("Please close settings before starting the timer.");
    return;
  }
  currentFullTestSection = 0;
  startNextFullTestSection();
}

function startCustomTimer() {
  if (document.getElementById("settingsModal").style.display === "block") {
    showNotification("Please close settings before starting the timer.");
    return;
  }
  const customTime = parseInt(document.getElementById("customTime").value);
  const customQuestions = parseInt(
    document.getElementById("customQuestions").value
  );
  if (
    isNaN(customTime) ||
    isNaN(customQuestions) ||
    customTime <= 0 ||
    customQuestions <= 0
  ) {
    alert("Please enter valid time and number of questions.");
    return;
  }
  startTimer("Custom Section", customTime, customQuestions);
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.classList.add("notification");
  notification.textContent = message;
  document.body.appendChild(notification);
    // Trigger slide-out animation after 3 seconds
    setTimeout(() => {
      notification.classList.add("slide-out");
      notification.addEventListener('transitionend', () => {
        notification.remove(); // Remove from DOM after animation completes
      }, { once: true }); // Ensure event listener runs only once
    }, 3000);
}


function goBack() {
  resetTimer();
  document.getElementById("menu").style.display = "flex";
  document.getElementById("timerScreen").style.display = "none";
  document.getElementById("customInput").style.display = "none";
  document.getElementById("backArrow").style.display = "none";
  document.getElementById("speedSelection").style.display = "none";
  document.getElementById("settingsIcon").style.display = "flex";
}

function setTheme(themeName) {
  setCookie("theme", themeName);
  applyTheme(themeName); // Apply theme immediately
  hideSettingsModal(); // Hide settings modal when preset theme is chosen
}

function applyTheme(themeName) {
  const body = document.body;
  body.classList.remove(
    "red-theme-buttons",
    "green-theme-buttons",
    "blue-theme-buttons",
    "custom-theme-buttons"
  );

  if (themeName === "custom") {
    const customColor = getCookie("customColor") || "#3399ff";
    applyCustomColor(customColor);
  } else if (themeName === "blue") {
    body.classList.add("blue-theme-buttons");
  } else if (themeName === "green") {
    body.classList.add("green-theme-buttons");
  } else if (themeName === "red") {
    body.classList.add("red-theme-buttons");
  }
  // Update checkmarks in settings (important to do this *after* applying theme)
  updateThemeCheckmarks(themeName);
}

function updateThemeCheckmarks(themeName) {
  document.querySelectorAll(".theme-option").forEach((option) => {
    option.classList.remove("selected");
    const optionTheme = option.getAttribute("data-theme");
    if (optionTheme === themeName) {
      option.classList.add("selected");
    }
  });
}

function showCustomColorPicker() {
  document.getElementById("customColorPicker").style.display = "block";
  document.getElementById("themeSelector").style.display = "none";
  updateThemeCheckmarks("custom"); // Ensure 'custom' is checked when color picker is shown
  setSelectedSwatch(getCookie("customColor") || "#3399ff"); // Select the previously chosen swatch
}

function hideCustomColorPicker() {
  document.getElementById("customColorPicker").style.display = "none";
  document.getElementById("themeSelector").style.display = "block";
  setSelectedSwatch(null); // Deselect any selected swatch when hiding color picker!
}

function setCustomTheme(swatchElement) { // Modified to accept swatchElement
  const hexColor = swatchElement.dataset.color;
  setCookie("customColor", hexColor);
  setCookie("theme", "custom");
  applyTheme("custom"); // Apply theme immediately
}

function createColorPalette() {
  const palette = document.getElementById("colorPalette");
  paletteColors.forEach((color) => {
    const swatch = document.createElement("div");
    swatch.classList.add("color-swatch");
    swatch.style.backgroundColor = color;
    swatch.dataset.color = color; // Store color in data attribute
    swatch.addEventListener("click", function () {
      selectColorSwatch(this);
      setCustomTheme(this); // Apply custom theme immediately on swatch click
    });
    palette.appendChild(swatch);
  });
}

function selectColorSwatch(swatchElement) {
  // Remove 'selected' class from previously selected swatch
  if (selectedSwatch) {
    selectedSwatch.classList.remove("selected");
  }
  // Add 'selected' class to the clicked swatch
  swatchElement.classList.add("selected");
  selectedSwatch = swatchElement; // Update selectedSwatch
}

function setSelectedSwatch(hexColor) {
  const palette = document.getElementById("colorPalette");
  const swatches = palette.querySelectorAll(".color-swatch");
  swatches.forEach((swatch) => {
    if (swatch.dataset.color === hexColor) {
      selectColorSwatch(swatch); // Programmatically select the swatch
      return; // Exit after finding the swatch
    }
  });
  // If no swatch found matching hexColor, you might want to deselect any previously selected swatch:
  if (!hexColor && selectedSwatch) {
    selectedSwatch.classList.remove("selected");
    selectedSwatch = null;
  }
}

function applyCustomColor(hexColor) {
  const body = document.body;
  body.classList.add("custom-theme-buttons");

  // Calculate darker shade (you might want a more sophisticated method)
  const darkerShade = colorShade(hexColor, -20);
  const rgb = hexToRgb(hexColor);
  const bgColorLight = colorShade(hexColor, 30);
  const bgColorDark = colorShade(hexColor, -30);

  document.documentElement.style.setProperty("--custom-color", hexColor);
  document.documentElement.style.setProperty(
    "--custom-color-darker",
    darkerShade
  );
  document.documentElement.style.setProperty(
    "--custom-color-rgb",
    `${rgb.r}, ${rgb.g}, ${rgb.b}`
  );
  document.documentElement.style.setProperty(
    "--custom-color-bg-light",
    bgColorLight
  );
  document.documentElement.style.setProperty(
    "--custom-color-bg-dark",
    bgColorDark
  );
}

function isValidHexColor(hex) {
  return /^#([0-9A-F]{3}){1,2}$/i.test(hex);
}

function colorShade(hexColor, percent) {
  let R = parseInt(hexColor.substring(1, 3), 16);
  let G = parseInt(hexColor.substring(3, 5), 16);
  let B = parseInt(hexColor.substring(5, 7), 16);

  R = parseInt((R * (100 + percent)) / 100);
  G = parseInt((G * (100 + percent)) / 100);
  B = parseInt((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = Math.round(R);
  G = Math.round(G);
  B = Math.round(B);

  const RR = R.toString(16).length == 1 ? "0" + R.toString(16) : R.toString(16);
  const GG = G.toString(16).length == 1 ? "0" + G.toString(16) : G.toString(16);
  const BB = B.toString(16).length == 1 ? "0" + B.toString(16) : B.toString(16);

  return "#" + RR + GG + BB;
}

function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
