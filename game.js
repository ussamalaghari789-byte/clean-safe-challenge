/* =============================================================
   CLEAN & SAFE CHALLENGE — EHS Awareness Game
   game.js
   Vanilla JavaScript. No frameworks, no external libraries.
   Wires up index.html + style.css using their existing
   IDs/classes exactly as defined.
   ============================================================= */

(function () {
    "use strict";

    // ==================== CONFIGURATION ====================

    const GAME_CONFIG = {
        startingTime: 60,      // seconds
        pointsPerWaste: 10,    // fallback points if data-points is missing
        feedbackDuration: 1200, // ms
        dustbinSuccessDuration: 500, // ms
        collectedAnimationDuration: 400, // ms
        timerWarningThreshold: 20, // seconds
        timerCriticalThreshold: 10, // seconds
        minOverlapRatio: 0.3 // fraction of waste area that must overlap the dustbin
    };

    // ==================== GAME STATE ====================

    const gameState = {
        score: 0,
        timeRemaining: GAME_CONFIG.startingTime,
        totalWaste: 0,
        wasteCollected: 0,
        isRunning: false,
        isPaused: false,
        activeWaste: null,     // element currently being dragged
        timerIntervalId: null,
        timerStartTimestamp: null,
        timerElapsedBeforePause: 0,
        feedbackTimeoutId: null,
        dustbinSuccessTimeoutId: null
    };

    // ==================== DOM ELEMENTS ====================

    const gameEl = document.getElementById("game");
    const gameArea = document.getElementById("gameArea");
    const dustbin = document.getElementById("dustbin");
    const wasteContainer = document.getElementById("wasteContainer");

    const scoreEl = document.getElementById("score");
    const timerEl = document.getElementById("timer");
    const timerDisplayEl = document.getElementById("timerDisplay");
    const wasteRemainingEl = document.getElementById("wasteRemaining");

    const startScreen = document.getElementById("startScreen");
    const startButton = document.getElementById("startButton");

    const gameOverScreen = document.getElementById("gameOverScreen");
    const finalScoreEl = document.getElementById("finalScore");
    const restartButton = document.getElementById("restartButton");

    const successScreen = document.getElementById("successScreen");
    const successScoreEl = document.getElementById("successScore");
    const playAgainButton = document.getElementById("playAgainButton");
    const homeButton = document.getElementById("homeButton");

    const pauseScreen = document.getElementById("pauseScreen");
    const pauseButton = document.getElementById("pauseButton");
    const resumeButton = document.getElementById("resumeButton");
    const pauseRestartButton = document.getElementById("pauseRestartButton");

    const feedbackMessage = document.getElementById("feedbackMessage");

    const pickupSound = document.getElementById("pickupSound");
    const dropSound = document.getElementById("dropSound");
    const successSound = document.getElementById("successSound");
    const gameOverSound = document.getElementById("gameOverSound");

    // Collected once, refreshed on every reset (in case items are added/removed later)
    let wasteItems = [];

    // ==================== INITIALIZATION ====================

    function init() {
        wasteItems = Array.from(document.querySelectorAll(".waste-item"));
        gameState.totalWaste = wasteItems.length;

        hideScreen(gameOverScreen);
        hideScreen(successScreen);
        hideScreen(pauseScreen);
        showScreen(startScreen);

        captureOriginalPositions();
        resetGame();
        attachEventListeners();
    }

    function showScreen(screenEl) {
        if (screenEl) {
            screenEl.classList.remove("hidden");
        }
    }

    function hideScreen(screenEl) {
        if (screenEl) {
            screenEl.classList.add("hidden");
        }
    }

    // ==================== WASTE ORIGINAL POSITIONS ====================

    function captureOriginalPositions() {
        wasteItems.forEach(function (item) {
            // Clear any inline position left over from a previous session
            item.style.left = "";
            item.style.top = "";

            // Snapshot the CSS-defined position (in px, relative to wasteContainer)
            item.dataset.originalLeft = item.offsetLeft;
            item.dataset.originalTop = item.offsetTop;
        });
    }

    function resetWasteItems() {
        wasteItems.forEach(function (item) {
            item.classList.remove("dragging", "collected");
            item.style.pointerEvents = "";
            item.style.transition = "";
            item.style.zIndex = "";

            const originalLeft = item.dataset.originalLeft;
            const originalTop = item.dataset.originalTop;

            if (originalLeft !== undefined && originalTop !== undefined) {
                item.style.left = originalLeft + "px";
                item.style.top = originalTop + "px";
            }
        });
    }

    // ==================== GAME START ====================

    function startGame() {
        hideScreen(startScreen);
        hideScreen(successScreen);
        hideScreen(gameOverScreen);
        hideScreen(pauseScreen);

        resetGame();

        gameState.isRunning = true;
        gameState.isPaused = false;

        startTimer();
    }

    // ==================== TIMER ====================

    function formatTime(totalSeconds) {
        const safeSeconds = Math.max(0, Math.floor(totalSeconds));
        const minutes = Math.floor(safeSeconds / 60);
        const seconds = safeSeconds % 60;
        return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    }

    function updateTimerDisplay() {
        if (!timerEl) return;

        timerEl.textContent = formatTime(gameState.timeRemaining);

        const isWarning = gameState.timeRemaining <= GAME_CONFIG.timerWarningThreshold &&
            gameState.timeRemaining > GAME_CONFIG.timerCriticalThreshold;
        const isCritical = gameState.timeRemaining <= GAME_CONFIG.timerCriticalThreshold &&
            gameState.timeRemaining > 0;

        timerEl.classList.toggle("timer-warning", isWarning);
        timerEl.classList.toggle("timer-critical", isCritical);

        if (timerDisplayEl) {
            timerDisplayEl.classList.toggle("timer-warning", isWarning);
            timerDisplayEl.classList.toggle("timer-critical", isCritical);
        }
    }

    function startTimer() {
        clearInterval(gameState.timerIntervalId);

        gameState.timerStartTimestamp = Date.now();
        gameState.timerElapsedBeforePause = 0;
        updateTimerDisplay();

        gameState.timerIntervalId = setInterval(function () {
            if (!gameState.isRunning || gameState.isPaused) return;

            const elapsedSeconds = (Date.now() - gameState.timerStartTimestamp) / 1000 +
                gameState.timerElapsedBeforePause;
            const remaining = GAME_CONFIG.startingTime - elapsedSeconds;

            gameState.timeRemaining = Math.max(0, Math.ceil(remaining));
            updateTimerDisplay();

            if (remaining <= 0) {
                handleGameOver();
            }
        }, 250);
    }

    function pauseTimerClock() {
        if (gameState.timerStartTimestamp !== null) {
            gameState.timerElapsedBeforePause += (Date.now() - gameState.timerStartTimestamp) / 1000;
            gameState.timerStartTimestamp = null;
        }
    }

    function resumeTimerClock() {
        gameState.timerStartTimestamp = Date.now();
    }

    function stopTimer() {
        clearInterval(gameState.timerIntervalId);
        gameState.timerIntervalId = null;
    }

    // ==================== SCORE ====================

    function updateScoreDisplay() {
        if (!scoreEl) return;
        scoreEl.textContent = String(gameState.score);

        scoreEl.classList.remove("score-pop");
        // Force reflow so the animation can restart reliably
        void scoreEl.offsetWidth;
        scoreEl.classList.add("score-pop");

        window.setTimeout(function () {
            scoreEl.classList.remove("score-pop");
        }, 400);
    }

    function updateWasteRemainingDisplay() {
        if (!wasteRemainingEl) return;
        const remaining = Math.max(0, gameState.totalWaste - gameState.wasteCollected);
        wasteRemainingEl.textContent = String(remaining);

        wasteRemainingEl.classList.remove("waste-counter-update");
        void wasteRemainingEl.offsetWidth;
        wasteRemainingEl.classList.add("waste-counter-update");

        window.setTimeout(function () {
            wasteRemainingEl.classList.remove("waste-counter-update");
        }, 350);
    }

    function updateHUD() {
        updateScoreDisplay();
        updateWasteRemainingDisplay();
        updateTimerDisplay();
    }

    // ==================== WASTE MANAGEMENT ====================

    function getWastePoints(item) {
        const points = parseInt(item.getAttribute("data-points"), 10);
        return Number.isFinite(points) ? points : GAME_CONFIG.pointsPerWaste;
    }

    function collectWaste(item) {
        if (!item || item.classList.contains("collected")) return;

        item.classList.remove("dragging");
        item.classList.add("collected");
        item.style.pointerEvents = "none";

        gameState.score += getWastePoints(item);
        gameState.wasteCollected += 1;

        updateHUD();
        showFeedback("Correct Disposal! +" + getWastePoints(item), "success");
        triggerDustbinSuccess();
        playSound(dropSound);

        window.setTimeout(function () {
            item.style.display = "none";
        }, GAME_CONFIG.collectedAnimationDuration);

        checkWinCondition();
    }

    function returnWasteToOrigin(item) {
        if (!item) return;

        const originalLeft = item.dataset.originalLeft;
        const originalTop = item.dataset.originalTop;

        item.classList.remove("dragging");
        item.style.transition = "left 0.3s ease, top 0.3s ease";

        if (originalLeft !== undefined && originalTop !== undefined) {
            item.style.left = originalLeft + "px";
            item.style.top = originalTop + "px";
        }

        window.setTimeout(function () {
            item.style.transition = "";
        }, 320);
    }

    function checkWinCondition() {
        if (gameState.wasteCollected >= gameState.totalWaste) {
            handleGameSuccess();
        }
    }

    // ==================== DRAG & DROP (Pointer Events) ====================

    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let pendingFrame = null;

    function isInteractionAllowed() {
        return gameState.isRunning && !gameState.isPaused;
    }

    function onPointerDown(event) {
        if (!isInteractionAllowed()) return;

        const item = event.currentTarget;
        if (item.classList.contains("collected")) return;

        gameState.activeWaste = item;

        const itemRect = item.getBoundingClientRect();
        dragOffsetX = event.clientX - itemRect.left;
        dragOffsetY = event.clientY - itemRect.top;

        item.classList.add("dragging");
        item.style.transition = "none";

        try {
            item.setPointerCapture(event.pointerId);
        } catch (err) {
            // Pointer capture not supported/available — safe to continue without it
        }

        playSound(pickupSound);

        event.preventDefault();
    }

    function onPointerMove(event) {
        if (!gameState.activeWaste || !isInteractionAllowed()) return;

        event.preventDefault();

        if (pendingFrame) return;

        pendingFrame = window.requestAnimationFrame(function () {
            pendingFrame = null;
            moveActiveWaste(event.clientX, event.clientY);
        });
    }

    function moveActiveWaste(clientX, clientY) {
        const item = gameState.activeWaste;
        if (!item) return;

        const containerRect = wasteContainer.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();

        let newLeft = clientX - containerRect.left - dragOffsetX;
        let newTop = clientY - containerRect.top - dragOffsetY;

        const maxLeft = containerRect.width - itemRect.width;
        const maxTop = containerRect.height - itemRect.height;

        newLeft = clamp(newLeft, 0, Math.max(0, maxLeft));
        newTop = clamp(newTop, 0, Math.max(0, maxTop));

        item.style.left = newLeft + "px";
        item.style.top = newTop + "px";

        toggleDustbinActiveState(item);
    }

    function onPointerUp(event) {
        const item = gameState.activeWaste;
        if (!item) return;

        try {
            item.releasePointerCapture(event.pointerId);
        } catch (err) {
            // Ignore if release fails or was never captured
        }

        finishDrag(item);
    }

    function onPointerCancel(event) {
        const item = gameState.activeWaste;
        if (!item) return;
        finishDrag(item);
    }

    function finishDrag(item) {
        item.classList.remove("dragging");
        dustbin.classList.remove("dustbin-active");

        if (isOverlappingDustbin(item)) {
            collectWaste(item);
        } else if (isInteractionAllowed()) {
            returnWasteToOrigin(item);
        } else {
            // Game ended mid-drag (paused/over) — snap back safely without side effects
            returnWasteToOrigin(item);
        }

        gameState.activeWaste = null;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // ==================== DUSTBIN COLLISION ====================

    function getOverlapRatio(rectA, rectB) {
        const overlapWidth = Math.max(
            0,
            Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left)
        );
        const overlapHeight = Math.max(
            0,
            Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top)
        );
        const overlapArea = overlapWidth * overlapHeight;
        const areaA = Math.max(1, rectA.width * rectA.height);

        return overlapArea / areaA;
    }

    function isOverlappingDustbin(item) {
        const itemRect = item.getBoundingClientRect();
        const dustbinRect = dustbin.getBoundingClientRect();
        return getOverlapRatio(itemRect, dustbinRect) >= GAME_CONFIG.minOverlapRatio;
    }

    function toggleDustbinActiveState(item) {
        if (isOverlappingDustbin(item)) {
            dustbin.classList.add("dustbin-active");
        } else {
            dustbin.classList.remove("dustbin-active");
        }
    }

    function triggerDustbinSuccess() {
        dustbin.classList.remove("dustbin-active");
        dustbin.classList.add("dustbin-success");

        clearTimeout(gameState.dustbinSuccessTimeoutId);
        gameState.dustbinSuccessTimeoutId = window.setTimeout(function () {
            dustbin.classList.remove("dustbin-success");
        }, GAME_CONFIG.dustbinSuccessDuration);
    }

    // ==================== FEEDBACK ====================

    function showFeedback(message, type) {
        if (!feedbackMessage) return;

        clearTimeout(gameState.feedbackTimeoutId);

        feedbackMessage.textContent = message;
        feedbackMessage.classList.remove("feedback-success", "feedback-warning", "feedback-error");

        const typeClassMap = {
            success: "feedback-success",
            warning: "feedback-warning",
            error: "feedback-error"
        };

        feedbackMessage.classList.add(typeClassMap[type] || "feedback-success");

        gameState.feedbackTimeoutId = window.setTimeout(function () {
            feedbackMessage.textContent = "";
            feedbackMessage.classList.remove("feedback-success", "feedback-warning", "feedback-error");
        }, GAME_CONFIG.feedbackDuration);
    }

    // ==================== SOUND ====================

    function playSound(audioElement) {
        if (!audioElement) return;

        try {
            audioElement.currentTime = 0;
            const playPromise = audioElement.play();

            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () {
                    // Autoplay/permission restrictions — fail silently, game continues normally
                });
            }
        } catch (err) {
            // Missing source or unsupported format — never let audio break gameplay
        }
    }

    // ==================== PAUSE ====================

    function pauseGame() {
        if (!gameState.isRunning || gameState.isPaused) return;

        gameState.isPaused = true;
        pauseTimerClock();

        if (gameState.activeWaste) {
            const item = gameState.activeWaste;
            item.classList.remove("dragging");
            dustbin.classList.remove("dustbin-active");
            returnWasteToOrigin(item);
            gameState.activeWaste = null;
        }

        showScreen(pauseScreen);
    }

    function resumeGame() {
        if (!gameState.isRunning || !gameState.isPaused) return;

        gameState.isPaused = false;
        resumeTimerClock();
        hideScreen(pauseScreen);
    }

    // ==================== SUCCESS ====================

    function handleGameSuccess() {
        gameState.isRunning = false;
        gameState.isPaused = false;
        stopTimer();

        if (successScoreEl) {
            successScoreEl.textContent = String(gameState.score);
        }

        hideScreen(pauseScreen);
        showScreen(successScreen);
        playSound(successSound);
    }

    // ==================== GAME OVER ====================

    function handleGameOver() {
        if (!gameState.isRunning) return;

        gameState.isRunning = false;
        gameState.isPaused = false;
        stopTimer();

        if (gameState.activeWaste) {
            gameState.activeWaste.classList.remove("dragging");
            gameState.activeWaste = null;
        }
        dustbin.classList.remove("dustbin-active");

        if (finalScoreEl) {
            finalScoreEl.textContent = String(gameState.score);
        }

        hideScreen(pauseScreen);
        showScreen(gameOverScreen);
        playSound(gameOverSound);
    }

    // ==================== RESET ====================

    function resetGame() {
        stopTimer();
        clearTimeout(gameState.feedbackTimeoutId);
        clearTimeout(gameState.dustbinSuccessTimeoutId);

        gameState.score = 0;
        gameState.timeRemaining = GAME_CONFIG.startingTime;
        gameState.wasteCollected = 0;
        gameState.isRunning = false;
        gameState.isPaused = false;
        gameState.activeWaste = null;
        gameState.timerStartTimestamp = null;
        gameState.timerElapsedBeforePause = 0;

        wasteItems = Array.from(document.querySelectorAll(".waste-item"));
        gameState.totalWaste = wasteItems.length;

        wasteItems.forEach(function (item) {
            item.style.display = "";
        });
        resetWasteItems();

        dustbin.classList.remove("dustbin-active", "dustbin-success");

        if (feedbackMessage) {
            feedbackMessage.textContent = "";
            feedbackMessage.classList.remove("feedback-success", "feedback-warning", "feedback-error");
        }

        if (timerEl) {
            timerEl.classList.remove("timer-warning", "timer-critical");
        }
        if (timerDisplayEl) {
            timerDisplayEl.classList.remove("timer-warning", "timer-critical");
        }

        updateHUD();
    }

    function restartGame() {
        hideScreen(startScreen);
        hideScreen(successScreen);
        hideScreen(gameOverScreen);
        hideScreen(pauseScreen);

        resetGame();

        gameState.isRunning = true;
        gameState.isPaused = false;

        startTimer();
    }

    function goHome() {
        stopTimer();
        resetGame();

        hideScreen(successScreen);
        hideScreen(gameOverScreen);
        hideScreen(pauseScreen);
        showScreen(startScreen);
    }

    // ==================== EVENT LISTENERS ====================

    function attachEventListeners() {
        if (startButton) {
            startButton.addEventListener("click", startGame);
        }

        if (pauseButton) {
            pauseButton.addEventListener("click", pauseGame);
        }

        if (resumeButton) {
            resumeButton.addEventListener("click", resumeGame);
        }

        if (restartButton) {
            restartButton.addEventListener("click", restartGame);
        }

        if (pauseRestartButton) {
            pauseRestartButton.addEventListener("click", restartGame);
        }

        if (playAgainButton) {
            playAgainButton.addEventListener("click", restartGame);
        }

        if (homeButton) {
            homeButton.addEventListener("click", goHome);
        }

        wasteItems.forEach(function (item) {
            item.addEventListener("pointerdown", onPointerDown);
        });

        // Global move/up listeners so dragging keeps working even if the
        // pointer leaves the boundaries of the waste item itself.
        document.addEventListener("pointermove", onPointerMove, { passive: false });
        document.addEventListener("pointerup", onPointerUp);
        document.addEventListener("pointercancel", onPointerCancel);

        // Prevent the browser from treating drags as native image drags.
        gameArea.addEventListener("dragstart", function (event) {
            event.preventDefault();
        });
    }

    // ==================== BOOTSTRAP ====================

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
