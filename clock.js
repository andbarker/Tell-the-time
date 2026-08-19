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
        ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${isHour ? '#7C4DFF' : '#CFC3FF'}" stroke-width="${isHour ? 3.5 : 1.5}" stroke-linecap="round"/>`;
    }
    let numbers = "";
    for (let i = 1; i <= 12; i++) {
        const angle = i * 30;
        const rad = angle * Math.PI / 180;
        const r = CLOCK_R - 27;
        const x = CLOCK_CX + r * Math.sin(rad);
        const y = CLOCK_CY - r * Math.cos(rad);
        numbers += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="23" font-weight="700" fill="#3B2E5A" class="clock-num">${i}</text>`;
    }
    // The two hands differ by colour AND by shape — the hour hand is a stubby
    // tapered wedge, the minute hand a long thin pointer — so they stay tellable
    // apart at small sizes and for colour-blind children.
    const hourHand = `M ${CLOCK_CX - 7} ${CLOCK_CY + 10}
                      L ${CLOCK_CX - 4.5} ${CLOCK_CY - 46}
                      L ${CLOCK_CX} ${CLOCK_CY - 52}
                      L ${CLOCK_CX + 4.5} ${CLOCK_CY - 46}
                      L ${CLOCK_CX + 7} ${CLOCK_CY + 10} Z`;
    return `
    <svg viewBox="0 0 220 220" width="100%" height="100%" class="clock-svg">
        <circle cx="${CLOCK_CX}" cy="${CLOCK_CY}" r="${CLOCK_R + 6}" fill="#FFD166"/>
        <circle cx="${CLOCK_CX}" cy="${CLOCK_CY}" r="${CLOCK_R + 2}" fill="#FFF9EC"/>
        <circle cx="${CLOCK_CX}" cy="${CLOCK_CY}" r="${CLOCK_R}" fill="#FFFFFF"/>
        <path class="hour-space" d="" fill="#8ED9A0" opacity="0"/>
        <path class="to-arc" d="" fill="none" stroke="#38BDF8" stroke-width="9"
              stroke-linecap="round" opacity="0"/>
        ${ticks}
        ${numbers}
        <path class="hour-hand" d="${hourHand}" fill="#E5484D" stroke="#B4262B" stroke-width="2" stroke-linejoin="round" transform="rotate(0 ${CLOCK_CX} ${CLOCK_CY})"/>
        <line class="minute-hand" x1="${CLOCK_CX}" y1="${CLOCK_CY + 14}" x2="${CLOCK_CX}" y2="${CLOCK_CY - 84}" stroke="#2563EB" stroke-width="4.5" stroke-linecap="round" transform="rotate(0 ${CLOCK_CX} ${CLOCK_CY})"/>
        <circle cx="${CLOCK_CX}" cy="${CLOCK_CY}" r="8" fill="#3B2E5A"/>
        <circle cx="${CLOCK_CX}" cy="${CLOCK_CY}" r="3.5" fill="#FFD166"/>
        <circle class="drag-target" cx="${CLOCK_CX}" cy="${CLOCK_CY - 84}" r="14" fill="transparent"/>
    </svg>`;
}

function hourAngle(hour, minute) { return (hour % 12) * 30 + minute * 0.5; }
function minuteAngle(minute) { return minute * 6; }

// Wedge covering the "space of the hour" — the slice the hour hand travels through
// during one hour. Showing it is what stops kids reading 2:50 as 3:50: the hand is
// nearly touching the 3, but it is still inside the 2 o'clock space.
function hourSpacePath(hour) {
    const r = CLOCK_R - 6;
    const start = (hour % 12) * 30;
    const point = (deg) => {
        const rad = deg * Math.PI / 180;
        return [
            (CLOCK_CX + r * Math.sin(rad)).toFixed(1),
            (CLOCK_CY - r * Math.cos(rad)).toFixed(1)
        ];
    };
    const [x1, y1] = point(start);
    const [x2, y2] = point(start + 30);
    return `M ${CLOCK_CX} ${CLOCK_CY} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}

// An arc round the rim between two angles, used to make "past" and "to" visible:
// how far the minute hand has come, or how far it still has to go.
function rimArcPath(fromDeg, toDeg) {
    const r = CLOCK_R - 9;
    const point = (deg) => {
        const rad = deg * Math.PI / 180;
        return [
            (CLOCK_CX + r * Math.sin(rad)).toFixed(1),
            (CLOCK_CY - r * Math.cos(rad)).toFixed(1)
        ];
    };
    const [x1, y1] = point(fromDeg);
    const [x2, y2] = point(toDeg);
    const largeArc = (toDeg - fromDeg) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

// Minutes still to go before the next hour — what "quarter TO eight" counts.
function minutesToGoPath(minute) {
    return rimArcPath(minute * 6, 359.99);
}

// Minutes gone since the hour — what "quarter PAST seven" counts.
function minutesPastPath(minute) {
    return rimArcPath(0.01, minute * 6);
}

// opts: { hideMinuteHand, showHourSpace, showToArc }
function applyClockOptions(container, hour, opts = {}) {
    const svg = container.querySelector(".clock-svg");
    if (!svg) return;
    const minuteHand = svg.querySelector(".minute-hand");
    const dragTarget = svg.querySelector(".drag-target");
    if (minuteHand) minuteHand.style.display = opts.hideMinuteHand ? "none" : "";
    if (dragTarget) dragTarget.style.display = opts.hideMinuteHand ? "none" : "";
    const space = svg.querySelector(".hour-space");
    if (space) {
        if (opts.showHourSpace) {
            space.setAttribute("d", hourSpacePath(hour));
            space.style.opacity = "1";
        } else {
            space.style.opacity = "0";
        }
    }
    const toArc = svg.querySelector(".to-arc");
    if (toArc) {
        if (opts.showToArc && opts.showToArc.minute != null) {
            toArc.setAttribute("d", minutesToGoPath(opts.showToArc.minute));
            toArc.setAttribute("stroke", "#38BDF8");
            toArc.style.opacity = "1";
        } else if (opts.showPastArc && opts.showPastArc.minute != null) {
            toArc.setAttribute("d", minutesPastPath(opts.showPastArc.minute));
            toArc.setAttribute("stroke", "#2FBF71");
            toArc.style.opacity = "1";
        } else {
            toArc.style.opacity = "0";
        }
    }
}

// Render (or re-render) a clock into a container element.
function renderClock(container, hour, minute, opts = {}) {
    if (!container.querySelector(".clock-svg")) {
        container.innerHTML = clockFaceSVG();
    }
    applyClockOptions(container, hour, opts);
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

// Every time is shown both ways, words first. A child still learning to read a
// clock hasn't met digital time yet, so the wording leads and the digits sit
// underneath — which also builds the analogue/digital link the curriculum wants.
function formatPairedHTML(hour, minute) {
    return `<span class="t-words">${formatWords(hour, minute)}</span>` +
           `<span class="t-digits">${formatDigital(hour, minute)}</span>`;
}

// "Past / to" wording — the language the Year 2 curriculum asks children to use.
function formatWords(hour, minute) {
    const h12 = ((hour % 12) === 0) ? 12 : (hour % 12);
    const next = (h12 % 12) + 1;
    if (minute === 0) return `${h12} o'clock`;
    if (minute === 15) return `quarter past ${h12}`;
    if (minute === 30) return `half past ${h12}`;
    if (minute === 45) return `quarter to ${next}`;
    if (minute < 30) return `${minute} past ${h12}`;
    return `${60 - minute} to ${next}`;
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
