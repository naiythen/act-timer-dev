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
  document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

function showSettingsModal() {
  const modal = document.getElementById("settingsModal");
  const currentSpeed = getCookie("speed") || "0";
  document.getElementById("paceSelect").value = currentSpeed;

  const currentTheme = getCookie("theme") || "blue";
  // apply theme when opening setting modal
  applyTheme(currentTheme);

  document.querySelectorAll(".theme-option").forEach((option) => {
    option.classList.remove("selected");
    if (option.getAttribute("data-theme") === currentTheme) {
      option.classList.add("selected");
    }
  });

  if (currentTheme === "custom") {
    showCustomColorPicker();
  } else {
    hideCustomColorPicker();
  }

  modal.style.display = "block";
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
  if (!getCookie("speed") && window.location.pathname === "/") {
    document.getElementById("menu").style.display = "none";
    document.getElementById("speedSelection").style.display = "block";
  } else {
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
  progressBar.style.width = `${percentComplete}%`;
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
      `ACT FULL Test - ${section.name}`,
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
  setCookie("theme", themeName);
  applyTheme(themeName);
  hideCustomColorPicker();
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
  }

  // Update checkmarks
  document.querySelectorAll(".theme-option").forEach((option) => {
    option.classList.remove("selected");
    if (option.getAttribute("data-theme") === themeName) {
      option.classList.add("selected");
    }
  });
}

function showCustomColorPicker() {
  document.getElementById("customColorPicker").style.display = "block";
  document.getElementById("themeSelector").style.display = "none";
  document.querySelectorAll(".theme-option").forEach((option) => {
    if (option.getAttribute("data-theme") !== "custom") {
      option.classList.remove("selected");
    } else {
      option.classList.add("selected");
    }
  });
  // Ensure previously selected swatch is marked if custom theme is already active
  if (getCookie("theme") === "custom") {
    const customColor = getCookie("customColor") || "#3399ff";
    setSelectedSwatch(customColor);
  }
}

function hideCustomColorPicker() {
  document.getElementById("customColorPicker").style.display = "none";
  document.getElementById("themeSelector").style.display = "block";
}

function setCustomTheme() {
  if (selectedSwatch) {
    const hexColor = selectedSwatch.dataset.color;
    console.log("setCustomTheme: hexColor from swatch:", hexColor);
    setCookie("customColor", hexColor);
    setCookie("theme", "custom");
    applyCustomColor(hexColor);
    hideCustomColorPicker();
    // Clear selectedSwatch after applying the theme
    selectedSwatch = null;
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
    }
  });
}

function applyCustomColor(hexColor) {
  console.log("applyCustomColor: Applying color:", hexColor);
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

  console.log("applyCustomColor: CSS variables set.");
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
