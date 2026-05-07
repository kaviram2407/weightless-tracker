# Weightless Tracker - Developer Prompt Context

This document is designed to be fed into any LLM or AI assistant to instantly provide the full context, architecture, and constraints of the Weightless Daily Tracker project.

## 1. Project Overview
The "Weightless Daily Tracker" is a glassmorphic, space-themed daily task manager. It focuses on a frictionless UI with a unique psychological timer mechanic:
- Users input a task and estimated time in minutes.
- The timer counts down.
- **The 10-Minute Crunch**: `Pause` and `+5m` (Extend) buttons only appear in the last 10 minutes of the task.
- **Math Verification**: Clicking Pause or Extend triggers a custom modal requiring the user to solve a random addition problem (e.g. 7+4) to proceed. This creates friction to discourage distraction.
- **Stats Badges**: On completion, the app calculates if time was `Saved`, `Extra`, or `On Time` relative to the *initial* estimated time, ignoring mid-task extensions for the final calculation.

## 2. Technical Stack & Rules
- **Core**: Pure HTML5, CSS3, and ES6+ JavaScript. (No React, Vue, jQuery, Tailwind, etc.)
- **Aesthetic**: Deep space background with animated blurred orbs, glassmorphic container (`backdrop-filter: blur`), and glowing accent colors (`#00e5ff`).
- **No Native Modals**: Browser `alert()`, `prompt()`, and `confirm()` are strictly forbidden. The UI utilizes a custom async `.modal-overlay` system (`showModal()` returning a Promise) to keep the UI elegant.
- **Data Persistence**: Uses `window.localStorage` keyed by date (e.g., `YYYY-MM-DD`).
- **Screenshot Exporting**: Uses `html2canvas` (loaded via CDN) to capture PNG screenshots of the `.glass-container`.

## 3. Application State (LocalStorage Schema)
Activities are stored as JSON arrays under a `YYYY-MM-DD` key:
```json
[
  {
    "name": "Write Documentation",
    "initialTime": 45,
    "extendedTime": 5,
    "status": "Completed", 
    "endTime": 1714902345000,
    "remainingWhenPaused": 0,
    "savedTime": 0,
    "extraTime": 5
  }
]
```
*(Valid Statuses: `To Do`, `In Progress`, `Paused`, `Completed`)*

## 4. Key Functions in `script.js`
- `showModal({ title, message, type, expectedAnswer })`: Handles custom async alerts, confirmations, and math inputs.
- `createActivityElement(activity, index)`: The core rendering engine for each row. Handles its own independent `setInterval` for the countdown and binds event listeners for state transitions.
- `syncDOM()`: The internal function called every second by an active task to recalculate time remaining, reveal action buttons if `<= 10 mins`, and auto-trigger completion.
- `renderActivities()`: Wipes the DOM, clears all active intervals, and rebuilds the list from LocalStorage.
