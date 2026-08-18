// clock.js — SVG analog clock renderer + optional drag-to-set interaction
// Reusable across screens: teach examples, quiz clocks, and the "Set the Clock" mode.

const CLOCK_CX = 110, CLOCK_CY = 110, CLOCK_R = 100;

const NUM_WORDS = ["zero","one","two","three","four","five","six","seven","eight","nine","ten",
    "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen",
    "twenty","twenty-one","twenty-two","twenty-three","twenty-four","twenty-five","twenty-six",
    "twenty-seven","twenty-eight","twenty-nine","thirty"];

function numberWord(n) {
    if (n <= 30) return NUM_WORDS[n];
    return n.toString();
}

// Build the static SVG markup for a clock face (numbers + ticks + two hands).
function clockFaceSVG() {
    let ticks = "";
    for (let m = 0; m < 60; m++) {
        const angle = m * 6;
        const rad = angle * Math.PI / 180;
        const isHour = m % 5 === 0;
        const outerR = CLOCK_R - 4;
        const innerR = isHour ? CLOCK_R - 14 : CLOCK_R - 9;
        const x1 = CLOCK_CX + outerR * Math.sin(rad);
        const y1 = CLOCK_CY - outerR * Math.cos(rad);
        const x2 = CLOCK_CX + innerR * Math.sin(rad);
        const y2 = CLOCK_CY - innerR * Math.cos(rad);
        ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${isHour ? '#4453D6' : '#C7CBF5'}" stroke-width="${isHour ? 3 : 1.5}" stroke-linecap="round"/>`;
    }
    let numbers = "";
    for (let i = 1; i <= 12; i++) {
        const angle = i * 30;
        const rad = angle * Math.PI / 180;
        const r = CLOCK_R - 26;
        const x = CLOCK_CX + r * Math.sin(rad);
        const y = CLOCK_CY - r * Math.cos(rad);
        numbers += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="20" font-weight="800" fill="#33344A">${i}</text>`;
    }
    return `
    <svg viewBox="0 0 220 220" width="100%" height="100%" class="clock-svg">
        <circle cx="${CLOCK_CX}" cy="${CLOCK_CY}" r="${CLOCK_R}" fill="#FFFFFF" stroke="#DFE1FA" stroke-width="4"/>
        ${ticks}
        ${numbers}
        <line class="hour-hand" x1="${CLOCK_CX}" y1="${CLOCK_CY}" x2="${CLOCK_CX}" y2="${CLOCK_CY - 48}" stroke="#33344A" stroke-width="7" stroke-linecap="round" transform="rotate(0 ${CLOCK_CX} ${CLOCK_CY})"/>
        <line class="minute-hand" x1="${CLOCK_CX}" y1="${CLOCK_CY}" x2="${CLOCK_CX}" y2="${CLOCK_CY - 78}" stroke="#5B6EF5" stroke-width="5" stroke-linecap="round" transform="rotate(0 ${CLOCK_CX} ${CLOCK_CY})"/>
        <circle cx="${CLOCK_CX}" cy="${CLOCK_CY}" r="7" fill="#FF9F1C"/>
        <circle class="drag-target" cx="${CLOCK_CX}" cy="${CLOCK_CY - 78}" r="12" fill="transparent"/>
    </svg>`;
}

function hourAngle(hour, minute) { return (hour % 12) * 30 + minute * 0.5; }
function minuteAngle(minute) { return minute * 6; }

// Render (or re-render) a clock into a container element.
function renderClock(container, hour, minute) {
    if (!container.querySelector(".clock-svg")) {
        container.innerHTML = clockFaceSVG();
    }
    setClockHands(container, hour, minute);
}

function setClockHands(container, hour, minute, animate = true) {
    const hourHand = container.querySelector(".hour-hand");
    const minuteHand = container.querySelector(".minute-hand");
    if (!hourHand || !minuteHand) return;
    hourHand.style.transition = animate ? "transform 0.3s ease" : "none";
    minuteHand.style.transition = animate ? "transform 0.3s ease" : "none";
    hourHand.setAttribute("transform", `rotate(${hourAngle(hour, minute)} ${CLOCK_CX} ${CLOCK_CY})`);
    minuteHand.setAttribute("transform", `rotate(${minuteAngle(minute)} ${CLOCK_CX} ${CLOCK_CY})`);
}

// Snap a raw minute value (0-59.99) to the nearest value in an allowed set (circular).
function snapMinuteToSet(raw, allowedSet) {
    let best = allowedSet[0], bestDiff = Infinity;
    for (const m of allowedSet) {
        const diff = Math.min(Math.abs(raw - m), 60 - Math.abs(raw - m));
        if (diff < bestDiff) { bestDiff = diff; best = m; }
    }
    return best;
}

// Make a clock draggable (minute hand only — the hour is chosen separately via stepper
// buttons, and the hour hand's angle is derived automatically so it always looks correct).
function makeClockDraggable(container, getHour, onMinuteChange, allowedMinuteSet) {
    const svg = container.querySelector(".clock-svg");
    let dragging = false;

    function pointToAngle(clientX, clientY) {
        const rect = svg.getBoundingClientRect();
        const scale = 220 / rect.width;
        const px = (clientX - rect.left) * scale;
        const py = (clientY - rect.top) * scale;
        const dx = px - CLOCK_CX, dy = py - CLOCK_CY;
        let deg = Math.atan2(dx, -dy) * 180 / Math.PI;
        if (deg < 0) deg += 360;
        return deg;
    }

    function handleMove(clientX, clientY, snap) {
        const deg = pointToAngle(clientX, clientY);
        let rawMinute = deg / 6;
        const minute = snap ? snapMinuteToSet(rawMinute, allowedMinuteSet) : rawMinute;
        setClockHands(container, getHour(), minute, false);
        return minute;
    }

    function onDown(e) {
        dragging = true;
        svg.setPointerCapture && e.pointerId != null && svg.setPointerCapture(e.pointerId);
        handleMove(e.clientX, e.clientY, false);
        e.preventDefault();
    }
    function onMove(e) {
        if (!dragging) return;
        handleMove(e.clientX, e.clientY, false);
        e.preventDefault();
    }
    function onUp(e) {
        if (!dragging) return;
        dragging = false;
        const minute = handleMove(e.clientX, e.clientY, true);
        setClockHands(container, getHour(), minute, true);
        onMinuteChange(minute);
    }
    function onCancel() {
        // Interaction was interrupted (e.g. a browser gesture) — just stop dragging
        // rather than guessing a minute, so the hand never snaps to a wrong position.
        dragging = false;
    }

    svg.style.touchAction = "none";
    svg.style.cursor = "grab";
    // Pointer Events alone cover mouse, touch, and pen — adding separate Touch
    // Event listeners on top of these double-fires the down/move/up handlers on
    // touchscreens, which is what caused the hand to snap to a wrong minute on release.
    svg.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);

    return function destroy() {
        svg.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
    };
}

function formatDigital(hour, minute) {
    const h12 = ((hour % 12) === 0) ? 12 : (hour % 12);
    return `${h12}:${String(minute).padStart(2, "0")}`;
}

function spokenTime(hour, minute) {
    const h12 = ((hour % 12) === 0) ? 12 : (hour % 12);
    const nextH12 = (h12 % 12) + 1;
    const hourWord = numberWord(h12);
    const nextHourWord = numberWord(nextH12);
    if (minute === 0) return `${hourWord} o'clock`;
    if (minute === 30) return `half past ${hourWord}`;
    if (minute === 15) return `quarter past ${hourWord}`;
    if (minute === 45) return `quarter to ${nextHourWord}`;
    if (minute < 30) return `${numberWord(minute)} minutes past ${hourWord}`;
    return `${numberWord(60 - minute)} minutes to ${nextHourWord}`;
}
