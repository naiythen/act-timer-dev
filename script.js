let timerInterval = null;
let isRunning = false;
let currentSection = "";
let totalQuestions = 0;
let initialDurationSeconds = 0;
let endTime = 0;
let pausedTime = 0;
let wakeLock = null;
let isFullTest = false;
let currentFullTestSectionIndex = 0;
let notificationTimeout = null;

const fullTestSections = [
  { name: "English", time: 45, questions: 75 },
  { name: "Math", time: 60, questions: 60 },
  { name: "Break", time: 10, questions: 0 },
  { name: "Reading", time: 35, questions: 40 },
  { name: "Science", time: 35, questions: 40 },
];

const paceDescriptions = {
  0: "On Time",
  1: "5 Min Early",
  2: "10 Min Early",
};

const timeDisplay = document.getElementById("timeDisplay");
const progressBar = document.querySelector(".progress-bar");
const sectionTitle = document.getElementById("sectionTitle");
const questionPacingDisplay = document.getElementById("questionPacing");
const paceDescriptionSpan = document.getElementById("paceDescription");
const targetQuestionSpan = document.getElementById("targetQuestion");
const totalQuestionCountSpan = document.getElementById("totalQuestionCount");
const separatorSpan = questionPacingDisplay?.querySelector(".separator"); // Added optional chaining
const togglePacingVisibilityButton = document.getElementById(
  "togglePacingVisibility"
);
const pauseResumeButton = document.getElementById("pauseResumeButton");
const backArrow = document.getElementById("backArrow");
const settingsButton = document.getElementById("settingsButton");
const fullscreenButton = document.getElementById("fullscreenButton");
const alarmSound = document.getElementById("alarmSound");
const fullTestProgressDisplay = document.getElementById("fullTestProgress");
const notificationArea = document.getElementById("notificationArea");
const settingsScreen = document.getElementById("settingsScreen");
const modeToggleButton = document.getElementById("modeToggle");

function initialize() {
  const savedMode = getCookie("uiMode") || "light";
  const savedTheme = getCookie("theme");
  const savedSpeed = getCookie("speed");

  applyMode(savedMode);
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    applyTheme("#3498db");
  }

  if (savedSpeed === null && !getCookie("speedPromptShown")) {
    showSpeedSelection();
    setCookie("speedPromptShown", "true", 1);
  } else {
    showMenu();
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  initializeSettingsPage();

  if (togglePacingVisibilityButton && questionPacingDisplay) {
    // Check both exist
    togglePacingVisibilityButton.addEventListener("click", () => {
      questionPacingDisplay.classList.toggle("blurred");
    });
  }
}

function getCookie(name) {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split("=");
    if (cookieName.trim() === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

function setCookie(name, value, days = 365) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const encodedValue = encodeURIComponent(value);
  document.cookie = `${name}=${encodedValue};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

function setTheme(color) {
  setCookie("theme", color);
  applyTheme(color);
  updateSelectedThemeUI(color);
}

function applyTheme(color) {
  const rgb = hexToRgb(color);
  document.documentElement.style.setProperty("--primary-color", color);
  document.documentElement.style.setProperty(
    "--primary-hover-color",
    0.2126 * rgb.r + 0.7159 * rgb.g + 0.0721 * rgb.b < 128
      ? getLighterShade(color, 0.2)
      : getDarkerShade(color, 0.2)
  );
  document.documentElement.style.setProperty("--progress-bar-start", color);
  document.documentElement.style.setProperty(
    "--progress-bar-end",
    getLighterShade(color, 0.3)
  );
  document.documentElement.style.setProperty(
    "--button-shadow",
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`
  );
  document.documentElement.style.setProperty(
    "--primary-rgb",
    `${rgb.r}, ${rgb.g}, ${rgb.b}`
  );
  document.documentElement.style.setProperty(
    "--theme-option-selected-border",
    color
  );
}

function applyMode(mode) {
  if (mode === "dark") {
    document.body.classList.add("dark-theme");
  } else {
    document.body.classList.remove("dark-theme");
  }
}

function setMode(mode) {
  applyMode(mode);
  setCookie("uiMode", mode);
  if (modeToggleButton) {
    modeToggleButton.checked = mode === "dark";
  }
}

function toggleMode(isDarkModeChecked) {
  const newMode = isDarkModeChecked ? "dark" : "light";
  setMode(newMode);
}

function getDarkerShade(color, factor) {
  const { r, g, b } = hexToRgb(color);
  const newR = Math.max(0, Math.round(r * (1 - factor)));
  const newG = Math.max(0, Math.round(g * (1 - factor)));
  const newB = Math.max(0, Math.round(b * (1 - factor)));
  return rgbToHex(newR, newG, newB);
}

function getLighterShade(color, factor) {
  const { r, g, b } = hexToRgb(color);
  const newR = Math.min(255, Math.round(r + (255 - r) * factor));
  const newG = Math.min(255, Math.round(g + (255 - g) * factor));
  const newB = Math.min(255, Math.round(b + (255 - b) * factor));
  return rgbToHex(newR, newG, newB);
}

function hexToRgb(hex) {
  if (typeof hex !== "string" || !hex) return { r: 0, g: 0, b: 0 };
  hex = hex.replace("#", "");
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

function showSpeedSelection() {
  hideAllScreens();
  document.getElementById("speedSelection").style.display = "flex";
  settingsButton.style.display = "none";
  fullscreenButton.style.display = "block";
}

function setSpeedPreference(speedValue) {
  setCookie("speed", speedValue);
  showMenu();
}

function getSpeedAdjustmentMinutes() {
  const speedPref = getCookie("speed") || "0";
  if (speedPref === "1") return 5;
  if (speedPref === "2") return 10;
  return 0;
}

function startTimer(section, timeMinutes, questions) {
  isFullTest = false;
  currentSection = section;
  totalQuestions = questions;
  const adjustmentMinutes = getSpeedAdjustmentMinutes();
  initialDurationSeconds = Math.max(1, (timeMinutes - adjustmentMinutes) * 60);
  endTime = Date.now() + initialDurationSeconds * 1000;
  pausedTime = 0;

  setupTimerUI(false);
  startInterval();
}

function startFullTest() {
  isFullTest = true;
  currentFullTestSectionIndex = 0;
  startNextFullTestSection();
}

function startNextFullTestSection() {
  if (currentFullTestSectionIndex >= fullTestSections.length) {
    stopTimer();
    showNotification("Full ACT Test Completed!");
    showMenu();
    return;
  }

  const section = fullTestSections[currentFullTestSectionIndex];
  currentSection = section.name;
  totalQuestions = section.questions;
  const adjustmentMinutes =
    section.name === "Break" ? 0 : getSpeedAdjustmentMinutes();
  initialDurationSeconds = Math.max(1, (section.time - adjustmentMinutes) * 60);
  endTime = Date.now() + initialDurationSeconds * 1000;
  pausedTime = 0;

  setupTimerUI(false);
  fullTestProgressDisplay.textContent = `Section ${
    currentFullTestSectionIndex + 1
  } of ${fullTestSections.length}: ${currentSection}`;
  fullTestProgressDisplay.style.display = "block";

  startInterval();
}

function startCustomTimer() {
  const timeInput = document.getElementById("customTime");
  const questionsInput = document.getElementById("customQuestions");
  const timeMinutes = parseInt(timeInput.value, 10);
  const questions = parseInt(questionsInput.value, 10) || 0;

  if (isNaN(timeMinutes) || timeMinutes <= 0) {
    showNotification("Please enter a valid time in minutes.", "error");
    return;
  }

  isFullTest = false;
  currentSection = "Custom Timer";
  totalQuestions = questions;
  initialDurationSeconds = timeMinutes * 60;
  endTime = Date.now() + initialDurationSeconds * 1000;
  pausedTime = 0;

  setupTimerUI(true);
  startInterval();
}

function setupTimerUI(isCustom) {
  hideAllScreens();
  document.getElementById("timerScreen").style.display = "flex";
  document.body.classList.add("timer-active");
  backArrow.style.display = "block";
  settingsButton.style.display = "none";
  fullscreenButton.style.display = "block";

  sectionTitle.textContent = currentSection;
  pauseResumeButton.textContent = "Pause";

  if (questionPacingDisplay) {
    questionPacingDisplay.style.display = "inline-flex";
    questionPacingDisplay.classList.remove("blurred");
  }

  if (isCustom) {
    paceDescriptionSpan.textContent = "Pace: On Time";
    paceDescriptionSpan.style.display = "inline";
    if (totalQuestions > 0) {
      totalQuestionCountSpan.textContent = `Questions: ${totalQuestions}`;
      totalQuestionCountSpan.style.display = "inline";
      targetQuestionSpan.style.display = "none";
      if (separatorSpan) separatorSpan.style.display = "inline";
    } else {
      totalQuestionCountSpan.style.display = "none";
      targetQuestionSpan.style.display = "none";
      if (separatorSpan) separatorSpan.style.display = "none";
    }
  } else {
    const speedPref = getCookie("speed") || "0";
    paceDescriptionSpan.textContent = `Pace: ${
      paceDescriptions[speedPref] || "On Time"
    }`;
    paceDescriptionSpan.style.display = "inline";
    targetQuestionSpan.style.display = "inline";
    totalQuestionCountSpan.style.display = "none";
    if (separatorSpan) separatorSpan.style.display = "inline";
  }

  updateTimerDisplay();
}

function startInterval() {
  clearInterval(timerInterval);
  isRunning = true;
  timerInterval = setInterval(updateTimer, 100);
  requestWakeLock();
  updateTimer();
}

function updateTimer() {
  if (!isRunning) return;

  const now = Date.now();
  const remainingSeconds = Math.max(0, Math.round((endTime - now) / 1000));

  updateTimerDisplay(remainingSeconds);

  if (remainingSeconds <= 0) {
    handleTimerEnd();
  }
}

function updateTimerDisplay(seconds = null) {
  let remainingSeconds;
  if (seconds !== null) {
    remainingSeconds = seconds;
  } else {
    remainingSeconds = isRunning
      ? Math.max(0, Math.round((endTime - Date.now()) / 1000))
      : Math.max(0, Math.round(pausedTime / 1000));
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const displaySeconds = remainingSeconds % 60;
  timeDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(
    displaySeconds
  ).padStart(2, "0")}`;

  const progressPercent =
    initialDurationSeconds > 0
      ? (remainingSeconds / initialDurationSeconds) * 100
      : 0;
  progressBar.style.width = `${progressPercent}%`;

  if (
    targetQuestionSpan.style.display !== "none" &&
    totalQuestions > 0 &&
    initialDurationSeconds > 0
  ) {
    const elapsedSeconds = initialDurationSeconds - remainingSeconds;
    const targetQuestion = Math.min(
      totalQuestions,
      Math.max(
        1,
        Math.ceil((elapsedSeconds / initialDurationSeconds) * totalQuestions)
      )
    );
    targetQuestionSpan.textContent = `You should be on Q: ${targetQuestion}`;
  }

  if (currentSection !== "Custom Timer") {
    const speedPref = getCookie("speed") || "0";
    paceDescriptionSpan.textContent = `Pace: ${
      paceDescriptions[speedPref] || "On Time"
    }`;
  }

  if (remainingSeconds <= 10 && remainingSeconds > 0) {
    timeDisplay.classList.add("warning");
  } else {
    timeDisplay.classList.remove("warning");
  }
}

function handleTimerEnd() {
  clearInterval(timerInterval);
  isRunning = false;
  releaseWakeLock();

  if (alarmSound) {
    alarmSound.currentTime = 0;
    alarmSound.play().catch((e) => console.error("Error playing sound:", e));
  }

  timeDisplay.classList.add("warning");

  if (isFullTest) {
    currentFullTestSectionIndex++;
    showNotification(
      `${currentSection} Section Finished! Starting next section soon...`
    );
    setTimeout(() => {
      timeDisplay.classList.remove("warning");
      startNextFullTestSection();
    }, 3000);
  } else {
    showNotification(`${currentSection} Timer Finished!`);
  }
}

function pauseResumeTimer() {
  if (isRunning) {
    clearInterval(timerInterval);
    pausedTime = endTime - Date.now();
    isRunning = false;
    pauseResumeButton.textContent = "Resume";
    releaseWakeLock();
  } else {
    if (pausedTime > 0) {
      endTime = Date.now() + pausedTime;
      pausedTime = 0;
      startInterval();
      pauseResumeButton.textContent = "Pause";
    }
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  isFullTest = false;
  currentFullTestSectionIndex = 0;
  pausedTime = 0;
  endTime = 0;
  releaseWakeLock();
  showMenu();
  resetTimerUI();
}

function resetTimerUI() {
  timeDisplay.textContent = "00:00";
  progressBar.style.width = "100%";
  timeDisplay.classList.remove("warning");
  if (questionPacingDisplay) questionPacingDisplay.style.display = "none";
  if (questionPacingDisplay) questionPacingDisplay.classList.remove("blurred");
  fullTestProgressDisplay.style.display = "none";
  document.body.classList.remove("timer-active");
  document.body.classList.remove("fullscreen-active");
  backArrow.style.display = "none";
  settingsButton.style.display = "block"; // Ensure visible on reset
  fullscreenButton.style.display = "block"; // Ensure visible on reset
}

async function requestWakeLock() {
  if ("wakeLock" in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        if (isRunning && document.visibilityState === "visible") {
          requestWakeLock();
        } else {
          wakeLock = null;
        }
      });
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
      wakeLock = null;
    }
  } else {
    console.warn("Screen Wake Lock API not supported.");
  }
}

function releaseWakeLock() {
  if (wakeLock !== null) {
    wakeLock
      .release()
      .then(() => {
        wakeLock = null;
      })
      .catch((err) => {
        console.error("Error releasing wake lock:", err);
      });
  }
}

function handleVisibilityChange() {
  if (
    document.visibilityState === "visible" &&
    isRunning &&
    wakeLock === null
  ) {
    requestWakeLock();
  }
}

function hideAllScreens() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("timerScreen").style.display = "none";
  document.getElementById("customInput").style.display = "none";
  document.getElementById("speedSelection").style.display = "none";
  if (settingsScreen) settingsScreen.style.display = "none";
}

function showMenu() {
  hideAllScreens();
  resetTimerUI();
  document.getElementById("menu").style.display = "flex";
}

function showCustomInput() {
  hideAllScreens();
  document.getElementById("customInput").style.display = "flex";
  settingsButton.style.display = "block";
  fullscreenButton.style.display = "block";
  backArrow.style.display = "none";
}

function backToMenu() {
  showMenu();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement
      .requestFullscreen()
      .then(() => {})
      .catch((err) =>
        showNotification(`Error enabling full-screen: ${err.message}`, "error")
      );
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {});
    }
  }
}

function handleFullscreenChange() {
  if (!document.fullscreenElement) {
    document.body.classList.remove("fullscreen-active");
  } else {
    document.body.classList.add("fullscreen-active");
  }
}

function openSettings() {
  // Check if settings are already open
  if (settingsScreen && settingsScreen.style.display === "flex") {
    closeSettings(); // If open, close it
    return; // Stop execution here
  }
  // Otherwise, open settings
  hideAllScreens();
  if (settingsScreen) settingsScreen.style.display = "flex";
  initializeSettingsPage();
  settingsButton.style.display = "block";
  fullscreenButton.style.display = "block";
  backArrow.style.display = "none";
}

function closeSettings() {
  showMenu(); // Always go back to menu when closing settings
}

function initializeSettingsPage() {
  populatePaceSettings();
  populateThemeSettings();
  const currentMode = getCookie("uiMode") || "light";
  if (modeToggleButton) {
    modeToggleButton.checked = currentMode === "dark";
  }
}

function populatePaceSettings() {
  const savedSpeed = getCookie("speed") || "0";
  const paceSelect = document.getElementById("paceSelect");
  if (paceSelect) paceSelect.value = savedSpeed;
}

function populateThemeSettings() {
  const savedTheme = getCookie("theme");
  if (savedTheme) {
    updateSelectedThemeUI(savedTheme);
  }
}

function updatePaceSetting(value) {
  const previousValue = getCookie("speed") || "0";
  if (value !== previousValue) {
    setCookie("speed", value);
    showNotification("Pace Preference Changed!");
    if (isRunning && currentSection !== "Custom Timer") {
      updateTimerDisplay();
    }
  }
}

function updateSelectedThemeUI(selectedColor) {
  const themeOptions = document.querySelectorAll(".theme-color-option");
  themeOptions.forEach((option) => {
    if (option.getAttribute("data-color") === selectedColor) {
      option.classList.add("selected-theme");
    } else {
      option.classList.remove("selected-theme");
    }
  });
}

function showNotification(message, type = "info") {
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
    const existingNotif = notificationArea.querySelector(".notification");
    if (existingNotif) {
      existingNotif.remove();
    }
  }

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  notificationArea.appendChild(notification);

  notificationTimeout = setTimeout(() => {
    if (notificationArea.contains(notification)) {
      notification.remove();
    }
    notificationTimeout = null;
  }, 3000);
}

initialize();
