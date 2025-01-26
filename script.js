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

// Predefined colors for the palette
const paletteColors = [
  "#FF0000",
  "#00FF00",
  "#0000FF",
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

  // 1. Read cookies for theme and pace
  const currentTheme = getCookie("theme") || "blue"; // Default to blue if no theme cookie
  const currentSpeed = getCookie("speed") || "0"; // Default to 'Right on Time' if no speed cookie

  console.log(
    "showSettingsModal: Reading cookies - Theme:",
    currentTheme,
    ", Pace:",
    currentSpeed
  ); // Debugging

  // 2. Set Pace in GUI
  document.getElementById("paceSelect").value = currentSpeed;
  console.log("showSettingsModal: Pace select dropdown set to:", currentSpeed); // Debugging

  // 3. Set Theme in GUI
  console.log(
    "showSettingsModal: Setting theme checkmarks for theme:",
    currentTheme
  ); // Debugging
  document.querySelectorAll(".theme-option").forEach((option) => {
    option.classList.remove("selected"); // Clear all checkmarks first
    const themeValue = option.getAttribute("data-theme");
    if (themeValue === currentTheme) {
      option.classList.add("selected"); // Set checkmark for the current theme
      console.log(
        "showSettingsModal: Checkmark added to theme option:",
        themeValue
      ); // Debugging
    } else {
      console.log(
        "showSettingsModal: Checkmark removed from theme option:",
        themeValue
      ); // Debugging
    }
  });

  // 4. Handle Custom Theme Preview and Color Picker Visibility
  if (currentTheme === "custom") {
    console.log(
      "showSettingsModal: Current theme is 'custom', updating custom theme preview."
    ); // Debugging
    showCustomColorPicker(); // Ensure color picker is ready if we switch to custom directly later (though it's hidden initially)
    const customColor = getCookie("customColor") || "#3399ff"; // Get custom color from cookie
    const customThemePreview = document.querySelector(
      '.theme-option[data-theme="custom"] .theme-color'
    );
    if (customThemePreview) {
      customThemePreview.style.backgroundColor = customColor; // Set preview color
      customThemePreview.innerHTML = ""; // Clear plus icon
      console.log(
        "showSettingsModal: Custom theme preview updated to color:",
        customColor
      ); // Debugging
    }
  } else {
    console.log(
      "showSettingsModal: Current theme is NOT 'custom', hiding color picker and resetting preview."
    ); // Debugging
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
      console.log(
        "showSettingsModal: Custom theme preview reset to plus icon."
      ); // Debugging
    }
  }

  modal.style.display = "block"; // Finally, show the settings modal
  console.log("showSettingsModal: Settings modal displayed."); // Debugging
}

function hideSettingsModal() {
  document.getElementById("settingsModal").style.display = "none";
}

function updateSpeedPreference(speedValue) {
  setCookie("speed", speedValue);
  hideSettingsModal();

  const confirmation = document.createElement("div");
  confirmation.textContent = "⏱️ Pace preference updated!";
  confirmation.style.position = "fixed";
  confirmation.style.bottom = "20px";
  confirmation.style.right = "20px";
  confirmation.style.background = "#3399ff";
  confirmation.style.color = "white";
  confirmation.style.padding = "15px 25px";
  confirmation.style.borderRadius = "8px";
  confirmation.style.boxShadow = "0 4px 15px rgba(51, 153, 255, 0.3)";
  confirmation.style.zIndex = "1000";
  document.body.appendChild(confirmation);
  setTimeout(() => confirmation.remove(), 2000);
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded event fired!"); // Debugging line

  // Check for the 'speed' cookie. If NOT present, show speed selection.
  if (!getCookie("speed")) {
    console.log("Speed cookie NOT found. Showing speed selection."); // Debugging line
    document.getElementById("menu").style.display = "none";
    document.getElementById("speedSelection").style.display = "block";
    document.getElementById("settingsIcon").style.display = "none"; // Hide settings icon initially
  } else {
    console.log("Speed cookie FOUND. Showing menu and settings icon."); // Debugging line
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

  const confirmation = document.createElement("div");
  confirmation.textContent = "⏱️ Speed preference saved!";
  confirmation.style.position = "fixed";
  confirmation.style.bottom = "20px";
  confirmation.style.right = "20px";
  confirmation.style.background = "#3399ff";
  confirmation.style.color = "white";
  confirmation.style.padding = "15px 25px";
  confirmation.style.borderRadius = "8px";
  confirmation.style.boxShadow = "0 4px 15px rgba(51, 153, 255, 0.3)";
  confirmation.style.zIndex = "1000";
  confirmation.style.fontWeight = "500";
  document.body.appendChild(confirmation);
  setTimeout(() => confirmation.remove(), 2000);
}

function startTimer(sectionName, durationMinutes, numQuestions) {
  if (document.getElementById("settingsModal").style.display === "block") {
    alert("Please close settings before starting the timer.");
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

function showTimerScreen(sectionName) {
  document.getElementById("menu").style.display = "none";
  document.getElementById("customInput").style.display = "none";
  document.getElementById("timerScreen").style.display = "block";
  document.getElementById("backArrow").style.display = "flex";
  document.getElementById("settingsIcon").style.display = "none";
  document.getElementById("sectionTitle").textContent = sectionName;
}

function updateDisplay() {
  let minutes = Math.floor(remainingTime / 60);
  let seconds = remainingTime % 60;
  document.getElementById("timeDisplay").textContent =
    String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
}

function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");
  const percentComplete = ((initialTime - remainingTime) / initialTime) * 100;
  progressBar.style.width = `${percentComplete}%;`;
}

function updateQuestionGuidance() {
  const questionCounter = document.getElementById("questionCounter");
  if (totalQuestions === 0) {
    questionCounter.style.display = "none";
    return;
  }

  const speed = parseInt(getCookie("speed")) || 0;
  const speedOffset = speed * 5 * 60;
  const adjustedTime = Math.max(initialTime - speedOffset, 1);
  const timePerQuestion = adjustedTime / totalQuestions;
  const elapsedTime = initialTime - remainingTime;

  const questionsShouldComplete = Math.min(
    Math.ceil(elapsedTime / timePerQuestion),
    totalQuestions
  );

  if (!questionCounter.querySelector(".counter-container")) {
    const container = document.createElement("div");
    container.className = "counter-container";
    const textSpan = document.createElement("span");
    textSpan.className = "question-text";
    textSpan.textContent = `You should be on Question: ${questionsShouldComplete}/${totalQuestions}`;
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "eye-toggle";
    toggleBtn.setAttribute("aria-label", "Toggle visibility");
    const openEyeSVG = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    openEyeSVG.setAttribute("viewBox", "0 0 24 24");
    openEyeSVG.setAttribute("stroke-linecap", "round");
    openEyeSVG.setAttribute("stroke-linejoin", "round");
    openEyeSVG.innerHTML =
      '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    const closedEyeSVG = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    closedEyeSVG.setAttribute("viewBox", "0 0 24 24");
    closedEyeSVG.setAttribute("stroke-linecap", "round");
    closedEyeSVG.setAttribute("stroke-linejoin", "round");
    closedEyeSVG.innerHTML =
      '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
    toggleBtn.appendChild(openEyeSVG);
    toggleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      container.classList.toggle("blurred");
      toggleBtn.innerHTML = "";
      toggleBtn.appendChild(
        container.classList.contains("blurred") ? closedEyeSVG : openEyeSVG
      );
    });
    container.appendChild(textSpan);
    container.appendChild(toggleBtn);
    questionCounter.innerHTML = "";
    questionCounter.appendChild(container);
  } else {
    const textSpan = questionCounter.querySelector(".question-text");
    textSpan.textContent = `You should be on Question: ${questionsShouldComplete}/${totalQuestions}`;
  }
}

function startInterval() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (isRunning && remainingTime > 0) {
      remainingTime--;
      updateDisplay();
      updateProgressBar();
      updateQuestionGuidance();
      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        remainingTime = 0;
        updateDisplay();
        updateProgressBar();
        updateQuestionGuidance();
        isRunning = false;
        showNextSectionButton();
      }
    }
  }, 1000);
}

function pauseTimer() {
  isRunning = false;
}

function resumeTimer() {
  if (!isRunning && remainingTime > 0) {
    isRunning = true;
    startInterval();
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  remainingTime = initialTime;
  isRunning = false;
  updateDisplay();
  updateProgressBar();
  updateQuestionGuidance();
  hideNextSectionButton();
}

function showNextSectionButton() {
  if (currentFullTestSection < fullTestSections.length) {
    document.getElementById("nextSectionContainer").style.display = "block";
  }
}

function hideNextSectionButton() {
  document.getElementById("nextSectionContainer").style.display = "none";
}

function startFullTest() {
  if (document.getElementById("settingsModal").style.display === "block") {
    alert("Please close settings before starting the timer.");
    return;
  }
  currentFullTestSection = 0;
  startNextFullTestSection();
}

function startNextFullTestSection() {
  if (currentFullTestSection < fullTestSections.length) {
    const section = fullTestSections[currentFullTestSection];
    startTimer(
      `ACT Full Test - ${section.name}`,
      section.time,
      section.questions
    );
    currentFullTestSection++;
  }
}

function nextSection() {
  resetTimer();
  hideNextSectionButton();
  startNextFullTestSection();
}

function showCustomInput() {
  if (document.getElementById("settingsModal").style.display === "block") {
    alert("Please close settings before starting the timer.");
    return;
  }
  document.getElementById("menu").style.display = "none";
  document.getElementById("customInput").style.display = "block";
}

function startCustomTimer() {
  if (document.getElementById("settingsModal").style.display === "block") {
    alert("Please close settings before starting the timer.");
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
  console.log("setTheme: Setting theme to:", themeName); // Debugging
  setCookie("theme", themeName);
  applyTheme(themeName); // Apply theme immediately
  hideSettingsModal();
}

function applyTheme(themeName) {
  console.log("applyTheme called with themeName:", themeName);
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
  } else {
    console.log("applyTheme: Unknown themeName:", themeName); // Debugging
  }

  // Update checkmarks in settings (important to do this *after* applying theme)
  updateThemeCheckmarks(themeName);
}

function updateThemeCheckmarks(themeName) {
  console.log(
    "updateThemeCheckmarks: Updating checkmarks for theme:",
    themeName
  ); // Debugging
  document.querySelectorAll(".theme-option").forEach((option) => {
    option.classList.remove("selected");
    const optionTheme = option.getAttribute("data-theme");
    if (optionTheme === themeName) {
      option.classList.add("selected");
      console.log("updateThemeCheckmarks: Selected option:", optionTheme); // Debugging
    } else {
      console.log("updateThemeCheckmarks: Not selected option:", optionTheme); // Debugging
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
  console.log("hideCustomColorPicker: Color picker hidden, swatch deselected."); // Debugging
}

function setCustomTheme() {
  if (selectedSwatch) {
    const hexColor = selectedSwatch.dataset.color;
    console.log("setCustomTheme: hexColor from swatch:", hexColor);
    setCookie("customColor", hexColor);
    setCookie("theme", "custom");
    applyTheme("custom"); // Apply theme immediately, pass 'custom' to applyTheme
    hideCustomColorPicker();
    // Clear selectedSwatch after applying the theme - No, keep it selected for next time
    // selectedSwatch = null;
    console.log("setCustomTheme: Custom theme applied and cookies set.");
  } else {
    console.log("setCustomTheme: No swatch selected.");
    alert("Please select a color from the palette.");
  }
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
  console.log(
    "selectColorSwatch: Selected color:",
    selectedSwatch.dataset.color
  );
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
  console.log("applyCustomColor: Applying color:", hexColor); // Debugging
  const body = document.body;
  body.classList.add("custom-theme-buttons");
  console.log("applyCustomColor: Added class 'custom-theme-buttons' to body");

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

  console.log("applyCustomColor: CSS variables set:", {
    customColor: hexColor,
    customColorDarker: darkerShade,
    customColorRgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    customColorBgLight: bgColorLight,
    customColorBgDark: bgColorDark,
  });
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
