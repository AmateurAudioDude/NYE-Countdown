/*
    NYE Countdown v1.0.2 by AAD
    ----------------------------
*/

'use strict';

(() => {
    //////////////////////////////////////////////////////
    const PLUGIN_ENABLED = true;                        // Threshold to show "days, hours, minutes, seconds", otherwise show "hours, minutes, seconds"
    const FORCE_DISPLAY_ON_LOAD = 'false';              // Ignore user preference and display countdown on page load
    const DAYS_THRESHOLD = 7;                           // Threshold to show "days, hours, minutes, seconds", otherwise show "hours, minutes, seconds"
    const DAYS_DIGITAL_FONT = false;                    // Days to be displayed with a digital font
    const DISPLAY_BORDER = false;                       // Displays a border around the element
    const EVENT_NAME = "NEW YEAR COUNTDOWN";            // Name of event
    //////////////////////////////////////////////////////

    let showOnLoad = (FORCE_DISPLAY_ON_LOAD === 'true' ? FORCE_DISPLAY_ON_LOAD : '') || localStorage.getItem("pluginNyeCountdown");
    let firstLoad = false;

    // Server time sync settings
    const RESYNC_INTERVAL = 60 * 1000;

    let initialServerTime = null;
    let fetchLocalTime = null;

    async function syncServerTime() {
        try {
            const response = await fetch('/server_time');
            const data = await response.json();

            initialServerTime = new Date(data.serverTime).getTime();
            fetchLocalTime = Date.now(); // Record local time of sync

            // console.log("Server resynced:", new Date(initialServerTime).toISOString());
        } catch (error) {
            console.error('Error syncing server time:', error);
        }
    }

    function getServerTime() {
        if (initialServerTime === null || fetchLocalTime === null) return null;

        const nowLocal = Date.now();
        const elapsed = nowLocal - fetchLocalTime;

        return initialServerTime + elapsed;
    }

    function formatTime(value) {
        return value.toString().padStart(2, '0');
    }

    function updateCountdown() {
        const countdownElement = document.getElementById('new-countdown-div');
        if (!countdownElement) return;

        const now = new Date();
        const currentYear = now.getFullYear();
        const nextYear = (now.getMonth() === 0) ? currentYear : currentYear + 1;

        const newYear = new Date(`${nextYear}-01-01T00:00:00.000Z`).getTime();
        const serverTime = getServerTime();

        if (!serverTime) return;

        const timeLeft = newYear - serverTime;

        const totalDays = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const totalHours = Math.floor(timeLeft / (1000 * 60 * 60));
        const hours = formatTime(Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
        const minutes = formatTime(Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));
        const seconds = formatTime(Math.floor((timeLeft % (1000 * 60)) / 1000));

        const fontSize = window.innerHeight < 860
          ? (window.innerHeight > window.innerWidth ? 56 : 64)
          : (window.innerHeight > window.innerWidth ? 64 : 72);

        let timeDisplay, timeDisplayDays;

        if (totalDays >= DAYS_THRESHOLD) {
            timeDisplayDays = `${totalDays}d&nbsp;`;
            timeDisplay = `${hours}:${minutes}:${seconds}`;
        } else {
            timeDisplay = `${totalHours}:${minutes}:${seconds}`;
        }

        const useDigitalFont = DAYS_DIGITAL_FONT ? 'Digital-font' : 'Titillium Web';

        countdownElement.innerHTML = `
          <span class="text-small" style="font-family: 'Titillium Web', sans-serif; font-size: ${fontSize / 3}px; color: var(--color-5); font-weight: 700; opacity: 0.9; line-height: ${window.innerHeight > window.innerWidth ? 1.2 : 1.6};">
            ${EVENT_NAME}
          </span>
          <span class="time-wrapper" style="display: inline-flex; align-items: center;">
            <span class="text-small" style="font-family: '${useDigitalFont}', 'Titillium Web', sans-serif; font-size: ${fontSize}px; color: var(--color-text-2); opacity: 0.8; margin: -14px 0 -14px 0;">
              ${timeDisplayDays || ''}
            </span>
            <span class="text-small" style="font-family: 'Digital-font', 'Titillium Web', sans-serif; font-size: ${fontSize}px; color: var(--color-text-2); opacity: 0.8; margin: 0;">
              ${timeDisplay}
            </span>
          </span>
        `;

        if (timeLeft < 0) {
            clearInterval(updateInterval);
            clearInterval(resyncInterval);
            countdownElement.innerHTML = `<span style="font-size: ${fontSize}px; color: var(--color-5);">Happy New Year!</span>`;
        }
    }

    let updateInterval = null;
    let resyncInterval = null;

    (async () => {
        await syncServerTime(); // Fetch on start

        updateInterval = setInterval(updateCountdown, 1000);
        updateCountdown();

        // Resync server time once per interval
        resyncInterval = setInterval(syncServerTime, RESYNC_INTERVAL);
    })();

    function loadFont(url) {
        const font = new FontFace('Digital-font', `url(${url})`);
        font.load().then((loadedFont) => {
            document.fonts.add(loadedFont);
        }).catch((error) => {
            console.error('Font loading failed:', error);
        });
    }

    // Create the countdown display
    const signalCanvas = document.getElementById('signal-canvas');
    let countdownDiv;
    if (signalCanvas) {
        if (showOnLoad === 'true') signalCanvas.style.visibility = 'hidden';

        countdownDiv = document.createElement('div');
        countdownDiv.id = 'new-countdown-div';
        countdownDiv.style.display = showOnLoad === 'true' ? 'flex' : 'none';
        countdownDiv.style.flexDirection = 'column';
        countdownDiv.style.justifyContent = 'center';
        countdownDiv.style.alignItems = 'center';
        countdownDiv.style.textAlign = 'center';
        countdownDiv.style.height = '98%';
        countdownDiv.style.width = '99%';
        countdownDiv.style.maxWidth = '1160px';
        countdownDiv.style.position = 'absolute';
        countdownDiv.style.top = '0';
        countdownDiv.style.left = '50%';
        countdownDiv.style.paddingTop = '12px';
        countdownDiv.style.paddingBottom = '20px';
        countdownDiv.style.lineHeight = '1.1';
        countdownDiv.style.transform = 'translateX(-50%)';
        if (DISPLAY_BORDER) countdownDiv.style.border = '1px solid var(--color-5)';
        countdownDiv.style.borderRadius = '14px';
        countdownDiv.style.backgroundColor = 'var(--color-1-transparent)';
        countdownDiv.style.boxSizing = 'border-box';
        countdownDiv.style.opacity = '0';
        countdownDiv.style.transition = 'opacity 0.4s ease';
        countdownDiv.style.userSelect = 'none';

        const parent = signalCanvas.parentNode;
        parent.style.position = 'relative';

        parent.appendChild(countdownDiv);
    }

    loadFont('./DSEG7Modern-Regular.ttf'); // https://github.com/keshikan/DSEG/releases
    //loadFont('./DSEG14Modern-Regular.ttf'); // https://github.com/keshikan/DSEG/releases
                                   
    const interval = setInterval(updateCountdown, 500);

    updateCountdown();



    // Create Countdown button
    function createButton(buttonId) {
        if (!PLUGIN_ENABLED) return;
        (function waitForFunction() {
            const maxWaitTime = 30000;
            let functionFound = false;

            const observer = new MutationObserver((mutationsList, observer) => {
                if (typeof addIconToPluginPanel === 'function') {
                    observer.disconnect();
                    addIconToPluginPanel(buttonId, "Countdown", "solid", "champagne-glasses", "NYE Countdown");
                    functionFound = true;

                    const buttonObserver = new MutationObserver(() => {
                        const $pluginButton = $(`#${buttonId}`);
                        if ($pluginButton.length > 0) {

                            buttonObserver.disconnect(); // Stop observing once button is found
                            // Additional code


                            startMutationObserver();
                            
                            const countdownButton = document.querySelector('#countdown-button');
                            if (countdownButton) {
                                countdownButton.addEventListener('click', toggleCountdownDisplay);
                            }


                        }
                    });

                    buttonObserver.observe(document.body, { childList: true, subtree: true });
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            setTimeout(() => {
                observer.disconnect();
                if (!functionFound) {
                    console.error(`[${pluginName}] Function addIconToPluginPanel not found after ${maxWaitTime / 1000} seconds.`);
                }
            }, maxWaitTime);
        })();

        const aSpectrumCss = `
    #${buttonId}:hover {
        color: var(--color-5);
        filter: brightness(120%);
    }
    `;

        $("<style>")
            .prop("type", "text/css")
            .html(aSpectrumCss)
            .appendTo("head");
    }

    if (document.querySelector('.dashboard-panel-plugin-list')) {
        createButton('countdown-button');

        document.head.appendChild(Object.assign(document.createElement('style'), {
          textContent: `
            #countdown-button.active {
                background-color: var(--color-2) !important;
                filter: brightness(120%);
            }
          `
        }));
    }



    function toggleCountdownDisplay() {
        if (signalCanvas && countdownDiv) {
            const isCountdownVisible = countdownDiv.style.display === 'flex';
            countdownDiv.style.display = isCountdownVisible ? 'none' : 'flex';
            signalCanvas.style.visibility = isCountdownVisible ? 'visible' : 'hidden';
        }
    }

    let isManuallyHidden = false;

    function isAnyElementVisible() {
        const sdrGraph = document.querySelector("#sdr-graph");
        const loggingCanvas = document.querySelector("#logging-canvas");

        const isSdrGraphVisible = sdrGraph && window.getComputedStyle(sdrGraph).display !== 'none';
        const isLoggingCanvasVisible = loggingCanvas && window.getComputedStyle(loggingCanvas).display !== 'none';

        return isSdrGraphVisible || isLoggingCanvasVisible;
    }

    function toggleVisibility() {
        const countdownDiv = document.querySelector("#new-countdown-div");
        const signalCanvas = document.querySelector("#signal-canvas");
        const countdownButton = document.querySelector("#countdown-button");

        if (!countdownDiv || !signalCanvas || !countdownButton) return;

        if (window.getComputedStyle(countdownDiv).display !== 'flex') {
            countdownButton.classList.remove('bg-color-4');  // Remove highlight
        }

        if (isManuallyHidden) {
            // If manually hidden, don't automatically show the countdown
            signalCanvas.style.visibility = 'visible';
            return;
        }

        // Check if the countdown div is visible
        const isCountdownVisible = window.getComputedStyle(countdownDiv).display === 'flex';

        if (isAnyElementVisible() && showOnLoad !== 'true') {
            countdownDiv.style.display = 'none';
        }

        if (showOnLoad === 'true' || firstLoad) {
            if (isAnyElementVisible()) {
                countdownDiv.style.display = 'none';
                signalCanvas.style.visibility = 'hidden';
            } else {
                countdownDiv.style.display = 'flex';  // Show countdown
                requestAnimationFrame(() => {
                    countdownDiv.style.opacity = 1;
                });
                signalCanvas.style.visibility = 'hidden';
            }
        }

        // Highlight button if countdown is visible
        if (isCountdownVisible) {
            const pluginButton = document.getElementById('countdown-button');
            pluginButton.classList.add('active');
        }
    }

    function startMutationObserver() {
        const countdownDiv = document.querySelector("#new-countdown-div");
        const sdrGraph = document.querySelector("#sdr-graph");
        const loggingCanvas = document.querySelector("#logging-canvas");

        const observer = new MutationObserver(() => {
            toggleVisibility();
        });

        if (!sdrGraph && !loggingCanvas) toggleVisibility();

        observer.observe(countdownDiv, {
            attributes: true,
            attributeFilter: ['style'],
        });

        if (sdrGraph) {
            observer.observe(sdrGraph, {
                attributes: true,
                attributeFilter: ['style'],
            });
        }

        if (loggingCanvas) {
            observer.observe(loggingCanvas, {
                attributes: true,
                attributeFilter: ['style'],
            });
        }
    }

    function toggleCountdownDisplay() {
        const countdownDiv = document.querySelector("#new-countdown-div");
        const signalCanvas = document.querySelector("#signal-canvas");
        const countdownButton = document.querySelector("#countdown-button");

        if (countdownDiv && signalCanvas && countdownButton) {
            const isCountdownVisible = window.getComputedStyle(countdownDiv).display === 'flex';
            const pluginButton = document.getElementById('countdown-button');

            if (isCountdownVisible) {
                requestAnimationFrame(() => {
                  countdownDiv.style.opacity = 0;
                });

                setTimeout(() => {
                    countdownDiv.style.display = 'none';
                }, 400);

                signalCanvas.style.visibility = 'visible';
                isManuallyHidden = true;
                countdownButton.classList.remove('bg-color-4');
                localStorage.setItem("pluginNyeCountdown", "false");
                pluginButton.classList.remove('active');
            } else if (window.getComputedStyle(signalCanvas).display !== 'none') {
                countdownDiv.style.display = 'flex';
                requestAnimationFrame(() => {
                  countdownDiv.style.opacity = 1;
                });
                signalCanvas.style.visibility = 'hidden';
                isManuallyHidden = false;
                countdownButton.classList.add('bg-color-4');
                localStorage.setItem("pluginNyeCountdown", "true");
                pluginButton.classList.add('active');
            }
        }
        firstLoad = true;
    }
})();
