// --- Global Variables ---
let timerInterval = null; // Holds the interval ID for the timer
let isRunning = false; // Tracks if the timer is currently running
let currentSection = ""; // Name of the current section (e.g., "English")
let totalQuestions = 0; // Number of questions for the current section
let initialDurationSeconds = 0; // Initial timer duration in seconds
let endTime = 0; // Timestamp (ms since epoch) when the timer should end
let pausedTime = 0; // Stores remaining time in ms when paused
let wakeLock = null; // Holds the Screen Wake Lock object
let isFullTest = false; // Flag to indicate if a full test is running
let currentFullTestSectionIndex = 0; // Index for the current section in a full test

// Array defining the sections of a full ACT test
const fullTestSections = [
  { name: "English", time: 45, questions: 75 },
  { name: "Math", time: 60, questions: 60 },
  // Standard 10-minute break after Math
  { name: "Break", time: 10, questions: 0 },
  { name: "Reading", time: 35, questions: 40 },
  { name: "Science", time: 35, questions: 40 },
  // Optional Writing section (can be added if needed)
  // { name: "Writing", time: 40, questions: 1 },
];

// DOM Element References
const timeDisplay = document.getElementById("timeDisplay");
const progressBar = document.querySelector(".progress-bar");
const sectionTitle = document.getElementById("sectionTitle");
const questionCounter = document.getElementById("questionCounter");
const pauseResumeButton = document.getElementById("pauseResumeButton");
const backArrow = document.getElementById("backArrow");
const settingsButton = document.getElementById("settingsButton");
const fullscreenButton = document.getElementById("fullscreenButton");
const alarmSound = document.getElementById("alarmSound"); // Get the audio element
const fullTestProgressDisplay = document.getElementById("fullTestProgress");

// --- Initialization ---

// Function called when the script loads
function initialize() {
  // Check for saved speed preference on load
  const savedSpeed = getCookie("speed");
  if (savedSpeed === null && !getCookie("speedPromptShown")) {
    // Show speed selection if no preference is saved and prompt hasn't been shown
    showSpeedSelection();
    setCookie("speedPromptShown", "true", 1); // Mark prompt as shown for 1 day
  } else {
    // Otherwise, show the main menu
    showMenu();
  }
  // Apply saved theme or default
  applyTheme();
  // Add event listener for visibility changes (important for Wake Lock)
  document.addEventListener("visibilitychange", handleVisibilityChange);
  // Apply initial theme settings from cookies
  initializeSettingsPage();
}

// --- Cookie Management ---

// Gets a cookie value by name
function getCookie(name) {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split("=");
    if (cookieName.trim() === name) {
      // Decode the cookie value in case it contains special characters
      return decodeURIComponent(cookieValue);
    }
  }
  return null; // Return null if cookie not found
}

// Sets a cookie with a name, value, and optional expiration days
function setCookie(name, value, days = 365) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000); // Calculate expiration date
  // Encode the cookie value to handle special characters
  const encodedValue = encodeURIComponent(value);
  // Set the cookie with secure attributes
  document.cookie = `${name}=${encodedValue};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

// --- Theme Management ---

// Sets the theme color cookie and applies the theme
function setTheme(color) {
  setCookie("theme", color); // Save theme color to cookie
  applyTheme(color); // Apply the new theme immediately
  updateSelectedThemeUI(color); // Update UI in settings
}

// Applies the theme based on the provided color or cookie
function applyTheme(color) {
  let themeColor = color || getCookie("theme"); // Use provided color or get from cookie

  // Fallback to default if no theme is set
  if (!themeColor) {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    themeColor = prefersDark ? "#3498db" : "#3498db"; // Default blue for both
    setCookie("theme", themeColor); // Save the default
  }

  // Determine if the selected theme is dark based on luminance
  const rgb = hexToRgb(themeColor);
  const luminance = 0.2126 * rgb.r + 0.7159 * rgb.g + 0.0721 * rgb.b;
  const isDarkColor = luminance < 128; // Threshold for considering a color "dark"

  // Add/remove dark-theme class based on the color's darkness
  if (isDarkColor) {
    document.body.classList.add("dark-theme");
    // Define dark theme CSS variables based on the chosen color
    document.documentElement.style.setProperty(
      "--theme-color-dark",
      getDarkerShade(themeColor, 0.4)
    ); // Darker background shade
    document.documentElement.style.setProperty(
      "--theme-color-light",
      getDarkerShade(themeColor, 0.1)
    ); // Slightly lighter background shade
  } else {
    document.body.classList.remove("dark-theme");
    // Define light theme CSS variables based on the chosen color
    document.documentElement.style.setProperty(
      "--theme-color-dark",
      getDarkerShade(themeColor, 0.2)
    ); // Slightly darker shade for gradient
    document.documentElement.style.setProperty(
      "--theme-color-light",
      getLighterShade(themeColor, 0.3)
    ); // Lighter shade for gradient
  }

  // Set primary color variables used throughout the CSS
  document.documentElement.style.setProperty("--primary-color", themeColor);
  document.documentElement.style.setProperty(
    "--primary-hover-color",
    isDarkColor
      ? getLighterShade(themeColor, 0.2)
      : getDarkerShade(themeColor, 0.2)
  ); // Adjust hover based on theme
  document.documentElement.style.setProperty(
    "--progress-bar-start",
    themeColor
  );
  document.documentElement.style.setProperty(
    "--progress-bar-end",
    getLighterShade(themeColor, 0.3)
  );
  document.documentElement.style.setProperty(
    "--button-shadow",
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`
  );
  document.documentElement.style.setProperty(
    "--primary-rgb",
    `${rgb.r}, ${rgb.g}, ${rgb.b}`
  ); // Store RGB for use in rgba()
}

// Helper function to get a darker shade of a hex color
function getDarkerShade(color, factor) {
  const { r, g, b } = hexToRgb(color);
  const newR = Math.max(0, Math.round(r * (1 - factor)));
  const newG = Math.max(0, Math.round(g * (1 - factor)));
  const newB = Math.max(0, Math.round(b * (1 - factor)));
  return rgbToHex(newR, newG, newB);
}

// Helper function to get a lighter shade of a hex color
function getLighterShade(color, factor) {
  const { r, g, b } = hexToRgb(color);
  const newR = Math.min(255, Math.round(r + (255 - r) * factor));
  const newG = Math.min(255, Math.round(g + (255 - g) * factor));
  const newB = Math.min(255, Math.round(b + (255 - b) * factor));
  return rgbToHex(newR, newG, newB);
}

// Helper function to convert hex color to RGB object
function hexToRgb(hex) {
  if (typeof hex !== "string" || !hex) return { r: 0, g: 0, b: 0 }; // Basic validation
  hex = hex.replace("#", "");
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

// Helper function to convert RGB values to hex color string
function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex; // Ensure two digits
      })
      .join("")
  );
}

// --- Speed Preference ---

// Shows the speed selection screen
function showSpeedSelection() {
  hideAllScreens();
  document.getElementById("speedSelection").style.display = "block";
}

// Sets the speed preference cookie and shows the menu
function setSpeedPreference(speedValue) {
  setCookie("speed", speedValue); // Save speed preference (0, 1, or 2)
  showMenu(); // Go back to the main menu
}

// Gets the speed adjustment in minutes based on the saved preference
function getSpeedAdjustmentMinutes() {
  const speedPref = getCookie("speed") || "0"; // Default to 0 if not set
  if (speedPref === "1") return 5; // 5 minutes early
  if (speedPref === "2") return 10; // 10 minutes early
  return 0; // Right on time
}

// --- Timer Logic ---

// Starts a timer for a specific section
function startTimer(section, timeMinutes, questions) {
  isFullTest = false; // Not a full test
  currentSection = section;
  totalQuestions = questions;
  const adjustmentMinutes = getSpeedAdjustmentMinutes();
  initialDurationSeconds = Math.max(1, (timeMinutes - adjustmentMinutes) * 60); // Ensure at least 1 second

  // Calculate the end time based on the current time and duration
  endTime = Date.now() + initialDurationSeconds * 1000;
  pausedTime = 0; // Reset paused time

  setupTimerUI(); // Configure the timer display
  startInterval(); // Start the timer interval
}

// Starts a full ACT test sequence
function startFullTest() {
  isFullTest = true;
  currentFullTestSectionIndex = 0; // Start with the first section
  startNextFullTestSection(); // Begin the sequence
}

// Starts the next section in a full test or ends the test
function startNextFullTestSection() {
  if (currentFullTestSectionIndex >= fullTestSections.length) {
    // If all sections are completed
    stopTimer(); // Stop everything
    alert("Full ACT Test Completed!"); // Notify user (consider a modal later)
    showMenu(); // Go back to menu
    return;
  }

  // Get the current section details from the array
  const section = fullTestSections[currentFullTestSectionIndex];
  currentSection = section.name;
  totalQuestions = section.questions;
  const adjustmentMinutes =
    section.name === "Break" ? 0 : getSpeedAdjustmentMinutes(); // No adjustment for breaks
  initialDurationSeconds = Math.max(1, (section.time - adjustmentMinutes) * 60);

  // Calculate end time and reset pause state
  endTime = Date.now() + initialDurationSeconds * 1000;
  pausedTime = 0;

  setupTimerUI(); // Set up the display for the new section
  // Update the full test progress indicator
  fullTestProgressDisplay.textContent = `Section ${
    currentFullTestSectionIndex + 1
  } of ${fullTestSections.length}: ${currentSection}`;
  fullTestProgressDisplay.style.display = "block"; // Make sure it's visible

  startInterval(); // Start the timer for this section
}

// Starts a timer with custom time and optional questions
function startCustomTimer() {
  const timeInput = document.getElementById("customTime");
  const questionsInput = document.getElementById("customQuestions");
  const timeMinutes = parseInt(timeInput.value, 10);
  const questions = parseInt(questionsInput.value, 10) || 0; // Default to 0 questions if blank

  // Validate input
  if (isNaN(timeMinutes) || timeMinutes <= 0) {
    alert("Please enter a valid time in minutes.");
    return;
  }

  isFullTest = false; // Not a full test
  currentSection = "Custom Timer";
  totalQuestions = questions;
  // No speed adjustment for custom timers
  initialDurationSeconds = timeMinutes * 60;
  endTime = Date.now() + initialDurationSeconds * 1000;
  pausedTime = 0;

  setupTimerUI();
  startInterval();
}

// Sets up the Timer UI elements
function setupTimerUI() {
  hideAllScreens(); // Hide menu, custom input, etc.
  document.getElementById("timerScreen").style.display = "block"; // Show timer screen
  document.body.classList.add("timer-active"); // Add class to body for potential styling hooks (like hiding settings)
  backArrow.style.display = "block"; // Show back arrow
  settingsButton.style.display = "none"; // Hide settings gear icon
  fullscreenButton.style.display = "block"; // Ensure fullscreen is visible

  sectionTitle.textContent = currentSection; // Display section name
  pauseResumeButton.textContent = "Pause"; // Set button text to "Pause"
  updateTimerDisplay(); // Initial display update
}

// Starts the timer interval and requests wake lock
function startInterval() {
  clearInterval(timerInterval); // Clear any existing interval
  isRunning = true;
  // Update timer every 100ms for smoother progress bar/display
  timerInterval = setInterval(updateTimer, 100);
  requestWakeLock(); // Attempt to prevent screen sleep
  updateTimer(); // Immediate update
}

// Main function called by setInterval to update the timer
function updateTimer() {
  if (!isRunning) return; // Don't run if paused

  const now = Date.now();
  // Calculate remaining seconds based on endTime and current time
  const remainingSeconds = Math.max(0, Math.round((endTime - now) / 1000));

  updateTimerDisplay(remainingSeconds); // Update visual display

  // Check if timer has finished
  if (remainingSeconds <= 0) {
    handleTimerEnd();
  }
}

// Updates the time display, progress bar, and question pace
function updateTimerDisplay(seconds = null) {
  let remainingSeconds;
  if (seconds !== null) {
    remainingSeconds = seconds;
  } else {
    // If called without specific seconds (e.g., on setup), calculate from endTime
    remainingSeconds = isRunning
      ? Math.max(0, Math.round((endTime - Date.now()) / 1000))
      : Math.max(0, Math.round(pausedTime / 1000)); // Use pausedTime if paused
  }

  // Format time as MM:SS
  const minutes = Math.floor(remainingSeconds / 60);
  const displaySeconds = remainingSeconds % 60;
  timeDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(
    displaySeconds
  ).padStart(2, "0")}`;

  // Update progress bar width
  const progressPercent =
    initialDurationSeconds > 0
      ? (remainingSeconds / initialDurationSeconds) * 100
      : 0;
  progressBar.style.width = `${progressPercent}%`;

  // Update question counter and pace
  if (totalQuestions > 0) {
    const secondsPerQuestion =
      initialDurationSeconds > 0
        ? (initialDurationSeconds / totalQuestions).toFixed(1)
        : 0;
    questionCounter.textContent = `Questions: ${totalQuestions} | Pace: ${secondsPerQuestion}s/q`;
    questionCounter.style.display = "inline-block"; // Ensure visible
  } else {
    questionCounter.style.display = "none"; // Hide if no questions
  }

  // Add warning class if time is low (e.g., last 10 seconds)
  if (remainingSeconds <= 10 && remainingSeconds > 0) {
    timeDisplay.classList.add("warning");
  } else {
    timeDisplay.classList.remove("warning");
  }
}

// Handles the logic when the timer reaches zero
function handleTimerEnd() {
  clearInterval(timerInterval); // Stop the interval
  isRunning = false;
  releaseWakeLock(); // Release the screen lock

  // Play the alarm sound
  if (alarmSound) {
    alarmSound.currentTime = 0; // Rewind to start
    alarmSound.play().catch((e) => console.error("Error playing sound:", e)); // Play and catch errors
  }

  // Flash the display or give some visual indication
  timeDisplay.classList.add("warning"); // Ensure warning style is applied
  // Consider adding a more prominent visual cue here

  // If it's part of a full test, move to the next section
  if (isFullTest) {
    currentFullTestSectionIndex++;
    // Add a short delay before starting the next section (e.g., 2 seconds)
    setTimeout(() => {
      timeDisplay.classList.remove("warning"); // Remove warning before next section
      startNextFullTestSection();
    }, 2000); // 2-second delay
  } else {
    // For single timers, maybe show a "Done!" message briefly
    // sectionTitle.textContent = "Time's Up!"; // Example
    // Keep the final time displayed (00:00)
  }
}

// Pauses or resumes the timer
function pauseResumeTimer() {
  if (isRunning) {
    // --- Pause ---
    clearInterval(timerInterval); // Stop interval
    // Store remaining time in milliseconds
    pausedTime = endTime - Date.now();
    isRunning = false;
    pauseResumeButton.textContent = "Resume"; // Change button text
    releaseWakeLock(); // Release lock when paused
  } else {
    // --- Resume ---
    if (pausedTime > 0) {
      // Recalculate endTime based on when it's resumed + remaining paused time
      endTime = Date.now() + pausedTime;
      pausedTime = 0; // Clear paused time
      startInterval(); // Restart interval and request wake lock
      pauseResumeButton.textContent = "Pause"; // Change button text back
    }
  }
}

// Stops the timer completely and returns to the menu
function stopTimer() {
  clearInterval(timerInterval); // Stop interval
  isRunning = false;
  isFullTest = false; // Ensure full test flag is reset
  currentFullTestSectionIndex = 0; // Reset index
  pausedTime = 0; // Reset paused time
  endTime = 0; // Reset end time
  releaseWakeLock(); // Release screen lock
  showMenu(); // Display the main menu
  resetTimerUI(); // Reset timer display elements
}

// Resets timer UI elements to default state
function resetTimerUI() {
  timeDisplay.textContent = "00:00";
  progressBar.style.width = "100%"; // Reset progress bar
  timeDisplay.classList.remove("warning");
  questionCounter.style.display = "none"; // Hide counter
  fullTestProgressDisplay.style.display = "none"; // Hide full test progress
  document.body.classList.remove("timer-active"); // Remove body class
  backArrow.style.display = "none"; // Hide back arrow
  settingsButton.style.display = "block"; // Show settings gear
  fullscreenButton.style.display = "block"; // Show fullscreen button
}

// --- Screen Wake Lock API ---

// Attempts to acquire a screen wake lock
async function requestWakeLock() {
  // Check if the API is supported
  if ("wakeLock" in navigator) {
    try {
      // Request a 'screen' wake lock
      wakeLock = await navigator.wakeLock.request("screen");
      console.log("Screen Wake Lock acquired.");

      // Add listener for when the lock is released unexpectedly (e.g., tab hidden)
      wakeLock.addEventListener("release", () => {
        console.log("Screen Wake Lock released.");
        // Check if the timer should still be running when lock is released
        if (isRunning && document.visibilityState === "visible") {
          // If timer is running and tab is visible, re-acquire the lock
          console.log("Re-acquiring wake lock due to release while visible.");
          requestWakeLock();
        } else {
          // Otherwise, ensure wakeLock variable is nullified
          wakeLock = null;
        }
      });
    } catch (err) {
      // Handle errors, e.g., user denied permission, or system doesn't support it
      console.error(`${err.name}, ${err.message}`);
      wakeLock = null; // Ensure wakeLock is null if request fails
    }
  } else {
    console.warn("Screen Wake Lock API not supported.");
  }
}

// Releases the screen wake lock if it's active
function releaseWakeLock() {
  if (wakeLock !== null) {
    wakeLock
      .release()
      .then(() => {
        wakeLock = null; // Set to null after successful release
        console.log("Screen Wake Lock released by function call.");
      })
      .catch((err) => {
        console.error("Error releasing wake lock:", err);
        // Even if release fails, setting wakeLock to null might be appropriate
        // depending on how you want to handle potential race conditions or errors.
        // For robustness, keep it as is, or potentially retry release later.
        // wakeLock = null; // Consider if needed even on error
      });
  }
}

// Handles visibility changes (tab hidden/shown)
function handleVisibilityChange() {
  // If the tab becomes visible AND the timer should be running AND no lock is active
  if (
    document.visibilityState === "visible" &&
    isRunning &&
    wakeLock === null
  ) {
    console.log("Tab became visible, re-acquiring wake lock.");
    requestWakeLock(); // Re-request the lock
  }
  // Wake locks are often automatically released by the browser when the tab is hidden.
  // The 'release' event listener on the wakeLock object handles this scenario.
}

// --- UI Navigation and Display ---

// Hides all main screen divs
function hideAllScreens() {
  document.getElementById("menu").style.display = "none";
  document.getElementById("timerScreen").style.display = "none";
  document.getElementById("customInput").style.display = "none";
  document.getElementById("speedSelection").style.display = "none";
  document.getElementById("settingsPage").style.display = "none"; // Hide settings overlay
  // Keep body class and back arrow state managed by timer functions
}

// Shows the main menu
function showMenu() {
  hideAllScreens();
  resetTimerUI(); // Ensure timer UI is fully reset when going to menu
  document.getElementById("menu").style.display = "flex"; // Use flex for column layout
  document.body.classList.remove("timer-active"); // Remove timer active class
  backArrow.style.display = "none"; // Hide back arrow
  settingsButton.style.display = "block"; // Show settings gear
  fullscreenButton.style.display = "block"; // Show fullscreen button
}

// Shows the custom timer input screen
function showCustomInput() {
  hideAllScreens();
  document.getElementById("customInput").style.display = "block";
  backArrow.style.display = "none"; // Hide back arrow on custom input screen
  settingsButton.style.display = "block"; // Show settings gear
}

// Alias for showMenu, used by cancel/back buttons
function backToMenu() {
  showMenu();
}

// --- Fullscreen API ---

// Toggles fullscreen mode for the entire page
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    // If not currently in fullscreen
    document.documentElement
      .requestFullscreen()
      .catch((err) =>
        console.error(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        )
      );
  } else {
    // If currently in fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

// --- Settings Page ---

// Opens the settings overlay
function openSettings() {
  document.getElementById("settingsPage").style.display = "flex"; // Show overlay
  document.body.classList.add("settings-open"); // Add class for potential styling
  initializeSettingsPage(); // Populate settings with current values
}

// Closes the settings overlay
function closeSettings() {
  document.getElementById("settingsPage").style.display = "none";
  document.body.classList.remove("settings-open");
  // Decide whether to go back to menu or timer if it was running
  // For simplicity, always go back to menu for now.
  // If timer needs to persist visually behind settings, more complex state management is needed.
  if (!isRunning) {
    showMenu(); // Or could potentially show timer if isRunning was true before opening settings
  } else {
    // If timer IS running, just hide settings, don't change the main view
  }
}

// Initializes the settings page controls with saved values
function initializeSettingsPage() {
  populatePaceSettings();
  populateThemeSettings();
}

// Sets the value of the pace dropdown based on cookie
function populatePaceSettings() {
  const savedSpeed = getCookie("speed") || "0"; // Default to '0'
  const paceSelect = document.getElementById("paceSelect");
  paceSelect.value = savedSpeed;
}

// Updates the selected theme button in the settings UI
function populateThemeSettings() {
  const savedTheme = getCookie("theme");
  if (savedTheme) {
    updateSelectedThemeUI(savedTheme);
  }
}

// Updates the pace setting cookie when dropdown changes
function updatePaceSetting(value) {
  setCookie("speed", value);
}

// Updates the visual selection state of theme buttons
function updateSelectedThemeUI(selectedColor) {
  const themeOptions = document.querySelectorAll(".theme-color-option");
  themeOptions.forEach((option) => {
    if (option.getAttribute("data-color") === selectedColor) {
      option.classList.add("selected-theme"); // Add class to selected
    } else {
      option.classList.remove("selected-theme"); // Remove from others
    }
  });
}

// --- Run Initialization ---
initialize(); // Call the main initialization function when the script loads
