// timer.js - Encapsulating timer functionality
const timerModule = (() => {
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
    { name: "Science", time: 35, questions: 40 },
  ];
  const timeDisplay = document.getElementById("timeDisplay");
  const progressBar = document.getElementById("progressBar");
  const questionCounterDisplay = document.getElementById("questionCounter");
  const sectionTitleDisplay = document.getElementById("sectionTitle");
  const pauseBtn = document.getElementById("pauseBtn");
  const resumeBtn = document.getElementById("resumeBtn");
  const resetBtn = document.getElementById("resetBtn");
  const nextSectionContainer = document.getElementById("nextSectionContainer");
  const nextSectionBtn = document.getElementById("nextSectionBtn");

  let speedPreference = parseInt(getCookie("speed") || "0", 10); // Default to 'Right on Time'

  function getAdjustedTime(durationMinutes) {
    const earlyMinutes = [0, 5, 10][speedPreference];
    return Math.max(0, durationMinutes - earlyMinutes) * 60; // Ensure time doesn't go negative
  }

  function startInterval() {
    timerInterval = setInterval(updateTimer, 1000);
    isRunning = true;
    pauseBtn.style.display = "inline-block";
    resumeBtn.style.display = "none";
  }

  function updateTimer() {
    if (!isRunning) return;

    remainingTime--;
    if (remainingTime < 0) {
      clearInterval(timerInterval);
      remainingTime = 0;
      isRunning = false;
      timeDisplay.classList.add("warning");
      showNotification("⏱️ Time's up for " + currentSection + "!");
      if (currentFullTestSection < fullTestSections.length) {
        nextSectionContainer.style.display = "block";
      }
    }
    updateDisplay();
    updateProgressBar();
    updateQuestionGuidance();

    if (remainingTime <= 60 && remainingTime % 2 === 0 && isRunning) {
      timeDisplay.classList.add("warning");
      setTimeout(() => timeDisplay.classList.remove("warning"), 500); // Quick flash
    }
  }

  function updateDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function updateProgressBar() {
    const percentage = initialTime > 0 ? ((initialTime - remainingTime) / initialTime) * 100 : 0;
    progressBar.style.width = `${percentage}%`;
  }

  function updateQuestionGuidance() {
    if (totalQuestions > 0 && remainingTime >= 0) {
      const questionsPerMinute = totalQuestions / (initialTime / 60);
      const idealQuestions = Math.round(questionsPerMinute * ((initialTime - remainingTime) / 60));
      questionCounterDisplay.textContent = `Ideal pace: Aim to be around question ${idealQuestions} out of ${totalQuestions}`;
    } else if (totalQuestions > 0) {
      questionCounterDisplay.textContent = `Time's up! Review your answers.`;
    } else {
      questionCounterDisplay.textContent = ''; // No question guidance for timers without questions
    }
  }

  function showTimerScreen(sectionName) {
    document.querySelectorAll('.screen').forEach(screen => screen.style.display = 'none');
    document.getElementById("timerScreen").style.display = "flex"; // or 'block' depending on layout
    document.getElementById("backArrow").style.display = "flex"; // or 'block'
    sectionTitleDisplay.textContent = sectionName;
    currentSection = sectionName;
    nextSectionContainer.style.display = "none"; // Hide next section button by default
  }

  function startTimer(sectionName, durationMinutes, numQuestions) {
    if (document.getElementById("settingsModal").style.display === "block") {
      showNotification("Please close settings before starting the timer.");
      return;
    }
    showTimerScreen(sectionName);
    remainingTime = getAdjustedTime(durationMinutes);
    initialTime = remainingTime;
    totalQuestions = numQuestions;
    isRunning = true;
    timeDisplay.classList.remove("warning");
    updateDisplay();
    updateProgressBar();
    updateQuestionGuidance();
    startInterval();
  }

  function pauseTimer() {
    if (isRunning) {
      clearInterval(timerInterval);
      isRunning = false;
      pauseBtn.style.display = "none";
      resumeBtn.style.display = "inline-block";
    }
  }

  function resumeTimer() {
    if (!isRunning) {
      startInterval();
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    remainingTime = initialTime;
    updateDisplay();
    updateProgressBar();
    timeDisplay.classList.remove("warning");
    pauseBtn.style.display = "inline-block";
    resumeBtn.style.display = "none";
    nextSectionContainer.style.display = "none";
    questionCounterDisplay.textContent = ''; // Clear question guidance on reset
  }

  function startFullTest() {
    if (document.getElementById("settingsModal").style.display === "block") {
      showNotification("Please close settings before starting the timer.");
      return;
    }
    currentFullTestSection = 0;
    startNextFullTestSection();
  }

  function startNextFullTestSection() {
    if (currentFullTestSection < fullTestSections.length) {
      const sectionData = fullTestSections[currentFullTestSection];
      startTimer(sectionData.name, sectionData.time, sectionData.questions);
      currentFullTestSection++;
    } else {
      showNotification("🎉 Full ACT Test Completed!");
      goBack(); // Go back to menu after full test
    }
  }

  function nextSection() {
    resetTimer(); // Optionally reset timer between sections
    nextSectionContainer.style.display = "none";
    startNextFullTestSection();
  }

  function setSpeedPreference(value) {
    speedPreference = parseInt(value, 10);
    setCookie("speed", String(speedPreference));
  }

  function getSpeedPreference() {
    return speedPreference;
  }

  function updateSpeedDisplay() {
    const paceSelect = document.getElementById('paceSelect');
    if (paceSelect) {
      paceSelect.value = String(speedPreference);
    }
  }

  return {
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    startFullTest,
    startNextFullTestSection,
    nextSection,
    showTimerScreen,
    setSpeedPreference,
    getSpeedPreference,
    updateSpeedDisplay
  };
})();


// theme.js - Encapsulating theme functionality
const themeModule = (() => {
  const body = document.body;
  const paletteColors = [
    "#e03a3a", "#49e049", "#4287f5", "#FFFF00", "#FF00FF", "#00FFFF",
    "#FFFFFF", "#000000", "#3399FF", "#4CAF50", "#FF9800", "#9C27B0",
    "#E91E63", "#03A9F4", "#607D8B", "#795548"
  ];
  let selectedSwatch = null; // Track the selected swatch

  function applyTheme(themeName) {
    body.className = ''; // Clear existing theme classes
    if (themeName === "custom") {
      const customColor = getCookie("customColor") || "#3399ff";
      applyCustomColor(customColor);
      body.classList.add("custom-theme-buttons");
    } else if (themeName === "blue") {
      body.classList.add("blue-theme-buttons");
    } else if (themeName === "green") {
      body.classList.add("green-theme-buttons");
    } else if (themeName === "red") {
      body.classList.add("red-theme-buttons");
    }
    updateThemeCheckmarks(themeName);
  }

  function updateThemeCheckmarks(themeName) {
    document.querySelectorAll(".theme-option").forEach(option => {
      option.classList.remove("selected");
      if (option.dataset.theme === themeName) {
        option.classList.add("selected");
      }
    });
  }

  function showCustomColorPicker() {
    document.getElementById("customColorPicker").style.display = "block";
    document.getElementById("themeSelector").style.display = "none";
    updateThemeCheckmarks("custom");
    setSelectedSwatch(getCookie("customColor") || "#3399ff");
  }

  function hideCustomColorPicker() {
    document.getElementById("customColorPicker").style.display = "none";
    document.getElementById("themeSelector").style.display = "block";
    setSelectedSwatch(null);
  }

  function setCustomTheme(swatchElement) {
    const hexColor = swatchElement.dataset.color;
    setCookie("customColor", hexColor);
    setCookie("theme", "custom");
    applyTheme("custom");
  }

  function createColorPalette() {
    const palette = document.getElementById("colorPalette");
    paletteColors.forEach(color => {
      const swatch = document.createElement("div");
      swatch.classList.add("color-swatch");
      swatch.style.backgroundColor = color;
      swatch.dataset.color = color;
      swatch.addEventListener("click", function() {
        selectColorSwatch(this);
        setCustomTheme(this);
      });
      palette.appendChild(swatch);
    });
  }

  function selectColorSwatch(swatchElement) {
    if (selectedSwatch) {
      selectedSwatch.classList.remove("selected");
    }
    swatchElement.classList.add("selected");
    selectedSwatch = swatchElement;
  }

  function setSelectedSwatch(hexColor) {
    const palette = document.getElementById("colorPalette");
    const swatches = palette.querySelectorAll(".color-swatch");
    swatches.forEach(swatch => {
      if (swatch.dataset.color === hexColor) {
        selectColorSwatch(swatch);
        return;
      }
    });
    if (!hexColor && selectedSwatch) {
      selectedSwatch.classList.remove("selected");
      selectedSwatch = null;
    }
  }

  function applyCustomColor(hexColor) {
    if (!isValidHexColor(hexColor)) hexColor = "#3399ff"; // Fallback to default if invalid
    const darkerShade = colorShade(hexColor, -20);
    const rgb = hexToRgb(hexColor);
    const bgColorLight = colorShade(hexColor, 30);
    const bgColorDark = colorShade(hexColor, -30);

    document.documentElement.style.setProperty("--primary-color", hexColor);
    document.documentElement.style.setProperty("--primary-color-darker", darkerShade);
    document.documentElement.style.setProperty("--custom-color-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    document.documentElement.style.setProperty("--body-bg-light", bgColorLight);
    document.documentElement.style.setProperty("--body-bg-dark", bgColorDark);
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

    R = Math.min(255, Math.max(0, Math.round(R)));
    G = Math.min(255, Math.max(0, Math.round(G)));
    B = Math.min(255, Math.max(0, Math.round(B)));

    const toHex = (c) => {
      const hex = c.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    const RR = toHex(R);
    const GG = toHex(G);
    const BB = toHex(B);

    return "#" + RR + GG + BB;
  }

  function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }


  return {
    applyTheme,
    showCustomColorPicker,
    hideCustomColorPicker,
    createColorPalette,
    setCustomTheme,
    updateThemeCheckmarks,
    setSelectedSwatch
  };
})();


// utils.js - Utility functions like cookie management and notifications
const utilsModule = (() => {
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

  function showNotification(message) {
    const notification = document.createElement("div");
    notification.classList.add("notification");
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add("slide-out");
      notification.addEventListener('transitionend', () => {
        notification.remove();
      }, { once: true });
    }, 3000);
  }

  return {
    getCookie,
    setCookie,
    showNotification
  };
})();


// script.js - Main application logic - orchestrating modules and UI interaction
document.addEventListener("DOMContentLoaded", () => {
  const { getCookie, setCookie, showNotification } = utilsModule;
  const { applyTheme, createColorPalette, showCustomColorPicker, hideCustomColorPicker, setCustomTheme, updateThemeCheckmarks, setSelectedSwatch } = themeModule;
  const { startTimer, pauseTimer, resumeTimer, resetTimer, startFullTest, nextSection, showTimerScreen, setSpeedPreference, getSpeedPreference, updateSpeedDisplay } = timerModule;

  // --- UI Elements ---
  const speedSelectionDiv = document.getElementById("speedSelection");
  const menuDiv = document.getElementById("menu");
  const settingsModal = document.getElementById("settingsModal");
  const settingsIconBtn = document.getElementById("settingsIcon");
  const backArrowBtn = document.getElementById("backArrow");
  const customInputDiv = document.getElementById("customInput");
  const timerScreenDiv = document.getElementById("timerScreen");

  // --- Speed Preference Setup ---
  if (!getCookie("speed")) {
    menuDiv.style.display = "none";
    speedSelectionDiv.style.display = "block";
    settingsIconBtn.style.display = "none";
  } else {
    menuDiv.style.display = "flex";
    speedSelectionDiv.style.display = "none";
    settingsIconBtn.style.display = "flex";
  }

  document.querySelectorAll('.speed-option').forEach(button => {
    button.addEventListener('click', function() {
      setSpeedPreference(this.dataset.speed);
      speedSelectionDiv.style.display = "none";
      menuDiv.style.display = "flex";
      settingsIconBtn.style.display = "flex";
      updateSpeedDisplay(); // Update display in settings if open
      showNotification("⏱️ Pace preference saved!");
    });
  });


  // --- Settings Modal ---
  const paceSelectElement = document.getElementById("paceSelect");
  const closeSettingsModalBtn = document.getElementById("closeSettingsModalBtn");

  settingsIconBtn.addEventListener('click', showSettingsModal);
  closeSettingsModalBtn.addEventListener('click', hideSettingsModal);

  function showSettingsModal() {
    if (settingsModal.style.display === "block") {
      hideSettingsModal();
      return;
    }
    const currentTheme = getCookie("theme") || "blue";
    const currentSpeed = getCookie("speed") || "0";

    paceSelectElement.value = currentSpeed;
    themeModule.updateThemeCheckmarks(currentTheme); // Use themeModule's function

    if (currentTheme === "custom") {
      const customColor = getCookie("customColor") || "#3399ff";
      const customThemePreview = document.querySelector('.theme-option[data-theme="custom"] .theme-color');
      if (customThemePreview) {
        customThemePreview.style.backgroundColor = customColor;
        customThemePreview.innerHTML = "";
      }
      themeModule.showCustomColorPicker(); // Use themeModule's function
    } else {
      themeModule.hideCustomColorPicker(); // Use themeModule's function
      const customThemePreview = document.querySelector('.theme-option[data-theme="custom"] .theme-color');
      if (customThemePreview) {
        customThemePreview.style.backgroundColor = "";
        customThemePreview.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20" /></svg>`;
      }
    }
    settingsModal.style.display = "block";
  }

  function hideSettingsModal() {
    settingsModal.style.display = "none";
  }

  paceSelectElement.addEventListener('change', function() {
    setSpeedPreference(this.value);
    hideSettingsModal();
    showNotification("⏱️ Pace preference updated!");
  });


  // --- Theme Selection ---
  document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', function() {
      const themeValue = this.dataset.theme;
      if (themeValue === 'custom') {
        themeModule.showCustomColorPicker();
      } else {
        themeModule.applyTheme(themeValue);
        hideSettingsModal(); // Hide settings modal after theme selection
        showNotification(`🎨 Theme changed to ${themeValue}!`);
      }
    });
  });


  // --- Custom Color Picker Buttons ---
  const colorSwatches = document.querySelectorAll('.color-swatch');
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', function() {
      themeModule.setCustomTheme(this);
      showNotification("🎨 Custom theme applied!");
    });
  });


  // --- Menu Buttons ---
  document.querySelectorAll('.menu-button').forEach(button => {
    button.addEventListener('click', function() {
      startTimer(this.dataset.section, parseInt(this.dataset.time, 10), parseInt(this.dataset.questions, 10));
    });
  });

  document.getElementById('fullTestBtn').addEventListener('click', startFullTest);
  document.getElementById('customBtn').addEventListener('click', showCustomInput);


  // --- Custom Input ---
  const customTimeInput = document.getElementById('customTime');
  const customQuestionsInput = document.getElementById('customQuestions');
  const startCustomTimerBtn = document.getElementById('startCustomTimerBtn');
  const cancelCustomBtn = document.getElementById('cancelCustomBtn');

  startCustomTimerBtn.addEventListener('click', function() {
    const customTime = parseInt(customTimeInput.value);
    const customQuestions = parseInt(customQuestionsInput.value);
    if (isNaN(customTime) || isNaN(customQuestions) || customTime <= 0 || customQuestions <= 0) {
      alert("Please enter valid time and number of questions.");
      return;
    }
    startTimer("Custom Section", customTime, customQuestions);
  });

  cancelCustomBtn.addEventListener('click', goBack);


  function showCustomInput() {
    menuDiv.style.display = "none";
    customInputDiv.style.display = "flex";
    backArrowBtn.style.display = "flex";
    settingsIconBtn.style.display = "none";
  }


  // --- Timer Screen Controls ---
  const pauseTimerBtn = document.getElementById('pauseBtn');
  const resumeTimerBtn = document.getElementById('resumeBtn');
  const resetTimerBtn = document.getElementById('resetBtn');
  const nextSectionBtnElement = document.getElementById('nextSectionBtn');

  pauseTimerBtn.addEventListener('click', pauseTimer);
  resumeTimerBtn.addEventListener('click', resumeTimer);
  resetTimerBtn.addEventListener('click', resetTimer);
  nextSectionBtnElement.addEventListener('click', nextSection);


  // --- Back Arrow ---
  backArrowBtn.addEventListener('click', goBack);

  function goBack() {
    resetTimer();
    menuDiv.style.display = "flex";
    timerScreenDiv.style.display = "none";
    customInputDiv.style.display = "none";
    backArrowBtn.style.display = "none";
    speedSelectionDiv.style.display = "none";
    settingsIconBtn.style.display = "flex";
  }


  // --- Initial Theme and Palette Setup ---
  const savedTheme = getCookie("theme") || "blue";
  applyTheme(savedTheme);
  createColorPalette();
  themeModule.setSelectedSwatch(getCookie("customColor")); // Ensure swatch selection on load
  timerModule.updateSpeedDisplay(); // Ensure pace select in settings is updated on load

});
