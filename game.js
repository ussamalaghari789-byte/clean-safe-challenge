/* =============================================================
   CLEAN & SAFE CHALLENGE — EHS AWARENESS GAME
   Complete Game JavaScript
   Includes:
   - Player registration
   - Name / Department / Designation
   - 60 second timer
   - Drag & Drop waste
   - Score
   - Pause / Resume
   - Restart
   - Success / Time Up
   - Google Sheets data submission
============================================================= */

(function () {

    "use strict";


    /* =========================================================
       GOOGLE SHEETS CONFIGURATION
    ========================================================== */

    /*
        IMPORTANT:
        Replace the URL below with your Google Apps Script
        Web App URL.

        Example:

        const GOOGLE_SHEET_URL =
            "https://script.google.com/macros/s/XXXXXXXXXXXX/exec";
    */

    const GOOGLE_SHEET_URL =
        "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";


    /* =========================================================
       GAME CONFIGURATION
    ========================================================== */

    const GAME_CONFIG = {

        startingTime: 60,

        pointsPerWaste: 10,

        feedbackDuration: 1200,

        dustbinSuccessDuration: 500,

        collectedAnimationDuration: 400,

        timerWarningThreshold: 20,

        timerCriticalThreshold: 10,

        minOverlapRatio: 0.3

    };


    /* =========================================================
       GAME STATE
    ========================================================== */

    const gameState = {

        score: 0,

        timeRemaining: GAME_CONFIG.startingTime,

        wasteCollected: 0,

        totalWaste: 0,

        isRunning: false,

        isPaused: false,

        draggedWaste: null,

        timerId: null,

        feedbackTimeoutId: null,

        dustbinSuccessTimeoutId: null,

        timerElapsedBeforePause: 0,


        /* ================= PLAYER DATA ================= */

        playerName: "",

        playerDepartment: "",

        playerDesignation: "",

        gameStartTime: null,

        gameEndTime: null,

        resultSubmitted: false

    };


    /* =========================================================
       DOM ELEMENTS
    ========================================================== */

    const startScreen =
        document.getElementById("startScreen");

    const startButton =
        document.getElementById("startButton");

    const gameArea =
        document.getElementById("gameArea");

    const dustbin =
        document.getElementById("dustbin");

    const wasteContainer =
        document.getElementById("wasteContainer");

    const feedbackMessage =
        document.getElementById("feedbackMessage");

    const pauseButton =
        document.getElementById("pauseButton");

    const pauseScreen =
        document.getElementById("pauseScreen");

    const resumeButton =
        document.getElementById("resumeButton");

    const pauseRestartButton =
        document.getElementById("pauseRestartButton");

    const gameOverScreen =
        document.getElementById("gameOverScreen");

    const restartButton =
        document.getElementById("restartButton");

    const successScreen =
        document.getElementById("successScreen");

    const playAgainButton =
        document.getElementById("playAgainButton");

    const homeButton =
        document.getElementById("homeButton");


    /* =========================================================
       PLAYER REGISTRATION ELEMENTS
    ========================================================== */

    const playerName =
        document.getElementById("playerName");

    const playerDepartment =
        document.getElementById("playerDepartment");

    const playerDesignation =
        document.getElementById("playerDesignation");

    const registrationMessage =
        document.getElementById("registrationMessage");


    /* =========================================================
       GAME DISPLAY ELEMENTS
    ========================================================== */

    const scoreElement =
        document.getElementById("score");

    const timerElement =
        document.getElementById("timer");

    const wasteRemainingElement =
        document.getElementById("wasteRemaining");

    const finalScoreElement =
        document.getElementById("finalScore");

    const successScoreElement =
        document.getElementById("successScore");


    /* =========================================================
       WASTE ITEMS
    ========================================================== */

    let wasteItems = [];


    /* =========================================================
       INITIALIZE GAME
    ========================================================== */

    function initializeGame() {

        wasteItems = Array.from(
            document.querySelectorAll(".waste-item")
        );

        gameState.totalWaste = wasteItems.length;

        updateScoreDisplay();

        updateTimerDisplay();

        updateWasteRemainingDisplay();

        hideScreen(gameArea);

        hideScreen(pauseScreen);

        hideScreen(gameOverScreen);

        hideScreen(successScreen);

        showScreen(startScreen);


        setupEventListeners();

        setupDragAndDrop();

        resetWastePositions();

    }


    /* =========================================================
       EVENT LISTENERS
    ========================================================== */

    function setupEventListeners() {


        /* START GAME */

        if (startButton) {

            startButton.addEventListener(
                "click",
                startGame
            );

        }


        /* PAUSE */

        if (pauseButton) {

            pauseButton.addEventListener(
                "click",
                pauseGame
            );

        }


        /* RESUME */

        if (resumeButton) {

            resumeButton.addEventListener(
                "click",
                resumeGame
            );

        }


        /* PAUSE RESTART */

        if (pauseRestartButton) {

            pauseRestartButton.addEventListener(
                "click",
                restartGame
            );

        }


        /* GAME OVER RESTART */

        if (restartButton) {

            restartButton.addEventListener(
                "click",
                restartGame
            );

        }


        /* SUCCESS PLAY AGAIN */

        if (playAgainButton) {

            playAgainButton.addEventListener(
                "click",
                restartGame
            );

        }


        /* HOME */

        if (homeButton) {

            homeButton.addEventListener(
                "click",
                goHome
            );

        }


        /* REGISTRATION INPUTS */

        const registrationFields = [

            playerName,

            playerDepartment,

            playerDesignation

        ];


        registrationFields.forEach(function (field) {

            if (!field) return;


            field.addEventListener(
                "input",
                function () {

                    field.classList.remove(
                        "input-error"
                    );

                    clearRegistrationMessage();

                }
            );


            field.addEventListener(
                "change",
                function () {

                    field.classList.remove(
                        "input-error"
                    );

                    clearRegistrationMessage();

                }
            );

        });


        /* ENTER KEY */

        if (playerName) {

            playerName.addEventListener(
                "keydown",
                function (event) {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        startGame();

                    }

                }
            );

        }


        if (playerDesignation) {

            playerDesignation.addEventListener(
                "keydown",
                function (event) {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        startGame();

                    }

                }
            );

        }

    }


    /* =========================================================
       PLAYER VALIDATION
    ========================================================== */

    function validatePlayerDetails() {

        const name =
            playerName
                ? playerName.value.trim()
                : "";

        const department =
            playerDepartment
                ? playerDepartment.value.trim()
                : "";

        const designation =
            playerDesignation
                ? playerDesignation.value.trim()
                : "";


        let valid = true;


        /* NAME */

        if (!name) {

            valid = false;

            if (playerName) {

                playerName.classList.add(
                    "input-error"
                );

            }

        }


        /* DEPARTMENT */

        if (!department) {

            valid = false;

            if (playerDepartment) {

                playerDepartment.classList.add(
                    "input-error"
                );

            }

        }


        /* DESIGNATION */

        if (!designation) {

            valid = false;

            if (playerDesignation) {

                playerDesignation.classList.add(
                    "input-error"
                );

            }

        }


        if (!valid) {

            showRegistrationMessage(
                "Please enter your Name, Department and Designation."
            );

            return null;

        }


        clearRegistrationMessage();


        return {

            name: name,

            department: department,

            designation: designation

        };

    }


    /* =========================================================
       REGISTRATION MESSAGE
    ========================================================== */

    function showRegistrationMessage(message) {

        if (registrationMessage) {

            registrationMessage.textContent =
                message;

        }

    }


    function clearRegistrationMessage() {

        if (registrationMessage) {

            registrationMessage.textContent = "";

        }

    }


    /* =========================================================
       START GAME
    ========================================================== */

    function startGame() {

        const player =
            validatePlayerDetails();


        if (!player) {

            return;

        }


        /* SAVE PLAYER DATA */

        gameState.playerName =
            player.name;

        gameState.playerDepartment =
            player.department;

        gameState.playerDesignation =
            player.designation;


        /* SAVE START TIME */

        gameState.gameStartTime =
            new Date();


        gameState.gameEndTime =
            null;


        gameState.resultSubmitted =
            false;


        /* RESET GAME */

        resetGame();


        /* SHOW GAME */

        hideScreen(startScreen);

        hideScreen(pauseScreen);

        hideScreen(gameOverScreen);

        hideScreen(successScreen);

        showScreen(gameArea);


        gameState.isRunning = true;

        gameState.isPaused = false;


        startTimer();

        showFeedback(
            "GAME STARTED! CLEAN THE WORKPLACE!",
            "success"
        );

    }


    /* =========================================================
       RESET GAME
    ========================================================== */

    function resetGame() {

        stopTimer();


        gameState.score = 0;

        gameState.timeRemaining =
            GAME_CONFIG.startingTime;

        gameState.wasteCollected = 0;

        gameState.totalWaste =
            wasteItems.length;

        gameState.isRunning = false;

        gameState.isPaused = false;

        gameState.draggedWaste = null;

        gameState.timerElapsedBeforePause = 0;

        gameState.resultSubmitted = false;


        updateScoreDisplay();

        updateTimerDisplay();

        updateWasteRemainingDisplay();


        resetWasteItems();


        hideScreen(pauseScreen);

        hideScreen(gameOverScreen);

        hideScreen(successScreen);


        if (dustbin) {

            dustbin.classList.remove(
                "dustbin--success"
            );

        }

    }


    /* =========================================================
       RESET WASTE ITEMS
    ========================================================== */

    function resetWasteItems() {

        wasteItems.forEach(
            function (item) {

                item.classList.remove(
                    "collected"
                );

                item.classList.remove(
                    "dragging"
                );

                item.style.opacity = "1";

                item.style.pointerEvents =
                    "auto";

                item.draggable = true;

            }
        );


        resetWastePositions();

    }


    /* =========================================================
       RANDOM WASTE POSITIONS
    ========================================================== */

    function resetWastePositions() {

        if (!gameArea) return;


        const areaWidth =
            gameArea.clientWidth;

        const areaHeight =
            gameArea.clientHeight;


        wasteItems.forEach(
            function (item, index) {

                const maxX =
                    Math.max(
                        20,
                        areaWidth - 120
                    );

                const maxY =
                    Math.max(
                        20,
                        areaHeight - 160
                    );


                const x =
                    40 +
                    Math.random() *
                    Math.max(40, maxX - 80);


                const y =
                    40 +
                    Math.random() *
                    Math.max(40, maxY - 80);


                item.style.left =
                    Math.round(x) + "px";


                item.style.top =
                    Math.round(y) + "px";

            }
        );

    }


    /* =========================================================
       TIMER
    ========================================================== */

    function startTimer() {

        stopTimer();


        gameState.timerId =
            setInterval(
                function () {

                    if (
                        !gameState.isRunning ||
                        gameState.isPaused
                    ) {

                        return;

                    }


                    gameState.timeRemaining--;


                    updateTimerDisplay();


                    if (
                        gameState.timeRemaining <=
                        GAME_CONFIG.timerCriticalThreshold
                    ) {

                        timerElement.classList.add(
                            "timer-critical"
                        );

                    }

                    else if (
                        gameState.timeRemaining <=
                        GAME_CONFIG.timerWarningThreshold
                    ) {

                        timerElement.classList.add(
                            "timer-warning"
                        );

                    }


                    if (
                        gameState.timeRemaining <= 0
                    ) {

                        gameState.timeRemaining = 0;

                        updateTimerDisplay();

                        handleGameOver();

                    }

                },
                1000
            );

    }


    function stopTimer() {

        if (gameState.timerId) {

            clearInterval(
                gameState.timerId
            );

            gameState.timerId = null;

        }

    }


    /* =========================================================
       PAUSE GAME
    ========================================================== */

    function pauseGame() {

        if (!gameState.isRunning) {

            return;

        }


        if (gameState.isPaused) {

            return;

        }


        gameState.isPaused = true;


        stopTimer();


        showScreen(pauseScreen);

    }


    /* =========================================================
       RESUME GAME
    ========================================================== */

    function resumeGame() {

        if (!gameState.isRunning) {

            return;

        }


        gameState.isPaused = false;


        hideScreen(pauseScreen);


        startTimer();

    }


    /* =========================================================
       RESTART GAME
    ========================================================== */

    function restartGame() {

        stopTimer();


        hideScreen(pauseScreen);

        hideScreen(gameOverScreen);

        hideScreen(successScreen);

        hideScreen(startScreen);

        showScreen(gameArea);


        gameState.score = 0;

        gameState.timeRemaining =
            GAME_CONFIG.startingTime;

        gameState.wasteCollected = 0;

        gameState.totalWaste =
            wasteItems.length;

        gameState.isRunning = true;

        gameState.isPaused = false;

        gameState.resultSubmitted = false;


        /* NEW ATTEMPT START TIME */

        gameState.gameStartTime =
            new Date();

        gameState.gameEndTime =
            null;


        updateScoreDisplay();

        updateTimerDisplay();

        updateWasteRemainingDisplay();


        resetWasteItems();


        startTimer();


        showFeedback(
            "NEW GAME STARTED!",
            "success"
        );

    }


    /* =========================================================
       GO HOME
    ========================================================== */

    function goHome() {

        stopTimer();


        gameState.isRunning = false;

        gameState.isPaused = false;


        hideScreen(gameArea);

        hideScreen(pauseScreen);

        hideScreen(gameOverScreen);

        hideScreen(successScreen);


        showScreen(startScreen);


        /* CLEAR PLAYER INFORMATION */

        gameState.playerName = "";

        gameState.playerDepartment = "";

        gameState.playerDesignation = "";

        gameState.gameStartTime = null;

        gameState.gameEndTime = null;

        gameState.resultSubmitted = false;


        if (playerName) {

            playerName.value = "";

        }


        if (playerDepartment) {

            playerDepartment.value = "";

        }


        if (playerDesignation) {

            playerDesignation.value = "";

        }


        clearRegistrationMessage();

    }


    /* =========================================================
       GAME OVER
    ========================================================== */

    function handleGameOver() {

        if (!gameState.isRunning) {

            return;

        }


        gameState.isRunning = false;

        gameState.isPaused = false;


        stopTimer();


        gameState.gameEndTime =
            new Date();


        if (finalScoreElement) {

            finalScoreElement.textContent =
                gameState.score;

        }


        hideScreen(gameArea);

        hideScreen(pauseScreen);

        showScreen(gameOverScreen);


        showFeedback(
            "TIME'S UP!",
            "error"
        );


        submitGameResult(
            "Time Up"
        );

    }


    /* =========================================================
       GAME SUCCESS
    ========================================================== */

    function handleGameSuccess() {

        if (!gameState.isRunning) {

            return;

        }


        gameState.isRunning = false;

        gameState.isPaused = false;


        stopTimer();


        gameState.gameEndTime =
            new Date();


        if (successScoreElement) {

            successScoreElement.textContent =
                gameState.score;

        }


        hideScreen(gameArea);

        hideScreen(pauseScreen);

        showScreen(successScreen);


        showFeedback(
            "WELL DONE!",
            "success"
        );


        submitGameResult(
            "Completed"
        );

    }


    /* =========================================================
       DRAG & DROP SETUP
    ========================================================== */

    function setupDragAndDrop() {

        if (!wasteItems.length) {

            return;

        }


        wasteItems.forEach(
            function (item) {


                /* DRAG START */

                item.addEventListener(
                    "dragstart",
                    function (event) {

                        if (
                            !gameState.isRunning ||
                            gameState.isPaused ||
                            item.classList.contains("collected")
                        ) {

                            event.preventDefault();

                            return;

                        }


                        gameState.draggedWaste =
                            item;


                        item.classList.add(
                            "dragging"
                        );


                        if (
                            event.dataTransfer
                        ) {

                            event.dataTransfer.effectAllowed =
                                "move";


                            event.dataTransfer.setData(
                                "text/plain",
                                item.id
                            );

                        }

                    }
                );


                /* DRAG END */

                item.addEventListener(
                    "dragend",
                    function () {

                        item.classList.remove(
                            "dragging"
                        );

                        gameState.draggedWaste =
                            null;

                    }
                );


                /* TOUCH SUPPORT */

                item.addEventListener(
                    "touchstart",
                    handleTouchStart,
                    {
                        passive: false
                    }
                );

            }
        );


        /* DUSTBIN DRAG OVER */

        if (dustbin) {

            dustbin.addEventListener(
                "dragover",
                function (event) {

                    if (
                        !gameState.isRunning ||
                        gameState.isPaused
                    ) {

                        return;

                    }


                    event.preventDefault();


                    dustbin.classList.add(
                        "dustbin--active"
                    );

                }
            );


            dustbin.addEventListener(
                "dragleave",
                function () {

                    dustbin.classList.remove(
                        "dustbin--active"
                    );

                }
            );


            dustbin.addEventListener(
                "drop",
                function (event) {

                    event.preventDefault();


                    dustbin.classList.remove(
                        "dustbin--active"
                    );


                    if (
                        !gameState.isRunning ||
                        gameState.isPaused
                    ) {

                        return;

                    }


                    let item =
                        gameState.draggedWaste;


                    if (
                        !item &&
                        event.dataTransfer
                    ) {

                        const id =
                            event.dataTransfer.getData(
                                "text/plain"
                            );


                        if (id) {

                            item =
                                document.getElementById(
                                    id
                                );

                        }

                    }


                    if (item) {

                        collectWaste(
                            item
                        );

                    }

                }
            );

        }

    }


    /* =========================================================
       TOUCH SUPPORT
    ========================================================== */

    let touchItem = null;

    let touchOffsetX = 0;

    let touchOffsetY = 0;


    function handleTouchStart(event) {

        if (
            !gameState.isRunning ||
            gameState.isPaused
        ) {

            return;

        }


        const item =
            event.currentTarget;


        if (
            item.classList.contains(
                "collected"
            )
        ) {

            return;

        }


        const touch =
            event.touches[0];


        const rect =
            item.getBoundingClientRect();


        const parentRect =
            gameArea.getBoundingClientRect();


        touchItem = item;


        touchOffsetX =
            touch.clientX -
            rect.left;


        touchOffsetY =
            touch.clientY -
            rect.top;


        item.classList.add(
            "dragging"
        );


        function move(eventMove) {

            if (!touchItem) {

                return;

            }


            eventMove.preventDefault();


            const currentTouch =
                eventMove.touches[0];


            const x =
                currentTouch.clientX -
                parentRect.left -
                touchOffsetX;


            const y =
                currentTouch.clientY -
                parentRect.top -
                touchOffsetY;


            item.style.left =
                x + "px";


            item.style.top =
                y + "px";

        }


        function end(eventEnd) {

            if (!touchItem) {

                return;

            }


            const currentTouch =
                eventEnd.changedTouches[0];


            const dustbinRect =
                dustbin.getBoundingClientRect();


            const itemRect =
                item.getBoundingClientRect();


            const overlap =
                calculateOverlapRatio(
                    itemRect,
                    dustbinRect
                );


            if (
                overlap >=
                GAME_CONFIG.minOverlapRatio
            ) {

                collectWaste(item);

            }


            item.classList.remove(
                "dragging"
            );


            document.removeEventListener(
                "touchmove",
                move
            );


            document.removeEventListener(
                "touchend",
                end
            );


            touchItem = null;

        }


        document.addEventListener(
            "touchmove",
            move,
            {
                passive: false
            }
        );


        document.addEventListener(
            "touchend",
            end,
            {
                passive: false
            }
        );

    }


    /* =========================================================
       CALCULATE OVERLAP
    ========================================================== */

    function calculateOverlapRatio(
        itemRect,
        targetRect
    ) {

        const left =
            Math.max(
                itemRect.left,
                targetRect.left
            );


        const right =
            Math.min(
                itemRect.right,
                targetRect.right
            );


        const top =
            Math.max(
                itemRect.top,
                targetRect.top
            );


        const bottom =
            Math.min(
                itemRect.bottom,
                targetRect.bottom
            );


        if (
            right <= left ||
            bottom <= top
        ) {

            return 0;

        }


        const overlapArea =
            (right - left) *
            (bottom - top);


        const itemArea =
            itemRect.width *
            itemRect.height;


        if (itemArea <= 0) {

            return 0;

        }


        return overlapArea /
            itemArea;

    }


    /* =========================================================
       COLLECT WASTE
    ========================================================== */

    function collectWaste(item) {

        if (
            !item ||
            item.classList.contains("collected") ||
            !gameState.isRunning ||
            gameState.isPaused
        ) {

            return;

        }


        const points =
            parseInt(
                item.dataset.points,
                10
            ) ||
            GAME_CONFIG.pointsPerWaste;


        gameState.score += points;

        gameState.wasteCollected++;


        item.classList.add(
            "collected"
        );


        item.style.pointerEvents =
            "none";


        item.draggable = false;


        updateScoreDisplay();

        updateWasteRemainingDisplay();


        showFeedback(
            "+" + points + " POINTS!",
            "success"
        );


        if (dustbin) {

            dustbin.classList.add(
                "dustbin--success"
            );


            if (
                gameState.dustbinSuccessTimeoutId
            ) {

                clearTimeout(
                    gameState.dustbinSuccessTimeoutId
                );

            }


            gameState.dustbinSuccessTimeoutId =
                setTimeout(
                    function () {

                        dustbin.classList.remove(
                            "dustbin--success"
                        );

                    },
                    GAME_CONFIG.dustbinSuccessDuration
                );

        }


        setTimeout(
            function () {

                item.style.opacity = "0";

            },
            GAME_CONFIG.collectedAnimationDuration
        );


        if (
            gameState.wasteCollected >=
            gameState.totalWaste
        ) {

            setTimeout(
                function () {

                    handleGameSuccess();

                },
                GAME_CONFIG.collectedAnimationDuration
            );

        }

    }


    /* =========================================================
       UPDATE SCORE
    ========================================================== */

    function updateScoreDisplay() {

        if (scoreElement) {

            scoreElement.textContent =
                gameState.score;

        }

    }


    /* =========================================================
       UPDATE TIMER
    ========================================================== */

    function updateTimerDisplay() {

        if (!timerElement) {

            return;

        }


        const minutes =
            Math.floor(
                gameState.timeRemaining /
                60
            );


        const seconds =
            gameState.timeRemaining %
            60;


        timerElement.textContent =

            String(minutes).padStart(
                2,
                "0"
            )

            +

            ":"

            +

            String(seconds).padStart(
                2,
                "0"
            );


        timerElement.classList.remove(
            "timer-warning",
            "timer-critical"
        );


        if (
            gameState.timeRemaining <=
            GAME_CONFIG.timerCriticalThreshold
        ) {

            timerElement.classList.add(
                "timer-critical"
            );

        }

        else if (
            gameState.timeRemaining <=
            GAME_CONFIG.timerWarningThreshold
        ) {

            timerElement.classList.add(
                "timer-warning"
            );

        }

    }


    /* =========================================================
       UPDATE WASTE REMAINING
    ========================================================== */

    function updateWasteRemainingDisplay() {

        if (wasteRemainingElement) {

            wasteRemainingElement.textContent =

                Math.max(
                    0,
                    gameState.totalWaste -
                    gameState.wasteCollected
                );

        }

    }


    /* =========================================================
       FEEDBACK
    ========================================================== */

    function showFeedback(
        message,
        type
    ) {

        if (!feedbackMessage) {

            return;

        }


        if (
            gameState.feedbackTimeoutId
        ) {

            clearTimeout(
                gameState.feedbackTimeoutId
            );

        }


        feedbackMessage.textContent =
            message;


        feedbackMessage.classList.remove(
            "feedback-success",
            "feedback-error",
            "feedback-warning"
        );


        if (type === "success") {

            feedbackMessage.classList.add(
                "feedback-success"
            );

        }

        else if (type === "error") {

            feedbackMessage.classList.add(
                "feedback-error"
            );

        }

        else {

            feedbackMessage.classList.add(
                "feedback-warning"
            );

        }


        feedbackMessage.classList.add(
            "feedback-visible"
        );


        gameState.feedbackTimeoutId =
            setTimeout(
                function () {

                    feedbackMessage.classList.remove(
                        "feedback-visible"
                    );

                },
                GAME_CONFIG.feedbackDuration
            );

    }


    /* =========================================================
       SCREEN HELPERS
    ========================================================== */

    function showScreen(element) {

        if (!element) {

            return;

        }


        element.classList.remove(
            "hidden"
        );

        element.style.display = "";

    }


    function hideScreen(element) {

        if (!element) {

            return;

        }


        element.classList.add(
            "hidden"
        );

    }


    /* =========================================================
       CALCULATE TIME USED
    ========================================================== */

    function getTimeUsedSeconds() {

        return Math.max(
            0,
            GAME_CONFIG.startingTime -
            gameState.timeRemaining
        );

    }


    /* =========================================================
       GOOGLE SHEETS SUBMISSION
    ========================================================== */

    function submitGameResult(
        result
    ) {

        /* Prevent duplicate submission */

        if (
            gameState.resultSubmitted
        ) {

            return;

        }


        gameState.resultSubmitted =
            true;


        /* Make sure URL is configured */

        if (
            !GOOGLE_SHEET_URL ||

            GOOGLE_SHEET_URL ===
            "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE"
        ) {

            console.warn(
                "Google Sheets URL is not configured."
            );

            return;

        }


        /* Save end time */

        gameState.gameEndTime =
            new Date();


        const startTime =
            gameState.gameStartTime ||
            gameState.gameEndTime;


        const endTime =
            gameState.gameEndTime;


        /* Create form data */

        const data =
            new URLSearchParams();


        data.append(
            "timestamp",
            endTime.toISOString()
        );


        data.append(
            "name",
            gameState.playerName
        );


        data.append(
            "department",
            gameState.playerDepartment
        );


        data.append(
            "designation",
            gameState.playerDesignation
        );


        data.append(
            "startTime",
            startTime.toISOString()
        );


        data.append(
            "endTime",
            endTime.toISOString()
        );


        data.append(
            "score",
            String(
                gameState.score
            )
        );


        data.append(
            "totalWaste",
            String(
                gameState.totalWaste
            )
        );


        data.append(
            "wasteCollected",
            String(
                gameState.wasteCollected
            )
        );


        data.append(
            "timeUsed",
            String(
                getTimeUsedSeconds()
            )
        );


        data.append(
            "result",
            result
        );


        /*
            Send data to Google Apps Script.

            no-cors is used because Google Apps Script
            does not need to return data to the game.
        */

        fetch(
            GOOGLE_SHEET_URL,
            {

                method: "POST",

                mode: "no-cors",

                headers: {

                    "Content-Type":
                        "application/x-www-form-urlencoded;charset=UTF-8"

                },

                body:
                    data.toString(),

                keepalive: true

            }

        )

        .then(
            function () {

                console.log(
                    "Game result submitted."
                );

            }
        )

        .catch(
            function (error) {

                console.error(
                    "Google Sheets submission failed:",
                    error
                );

            }
        );

    }


    /* =========================================================
       KEYBOARD ACCESSIBILITY
    ========================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                gameState.isRunning
            ) {

                if (gameState.isPaused) {

                    resumeGame();

                }

                else {

                    pauseGame();

                }

            }

        }
    );


    /* =========================================================
       WINDOW RESIZE
    ========================================================== */

    window.addEventListener(
        "resize",
        function () {

            if (
                !gameState.isRunning
            ) {

                resetWastePositions();

            }

        }
    );


    /* =========================================================
       START APPLICATION
    ========================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeGame
        );

    }

    else {

        initializeGame();

    }


})();
