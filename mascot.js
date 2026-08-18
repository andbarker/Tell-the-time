// mascot.js — "Tick", the clock character who keeps the child company.
//
// Deliberately separate from clock.js: the clock the child has to READ stays plain,
// because decoration on the thing being studied competes with the reading task.
// Tick lives beside the question and carries the personality instead.

const M_CX = 100, M_CY = 96, M_R = 62;

const MASCOT_MOODS = ["idle", "thinking", "happy", "oops", "cheer"];

// Arms hang from fixed shoulders and swing as a whole, the way a character's arms
// do. An earlier attempt rotated them around the body centre like clock hands, but
// they read as stray dots poking out from behind the body rather than as limbs —
// the real clock does the teaching, so the mascot just needs to emote.
const SHOULDER = { left: { x: 44, y: 112 }, right: { x: 156, y: 112 } };

function mascotArm(side) {
    const s = SHOULDER[side];
    const dir = side === "left" ? -1 : 1;
    const tipX = s.x + dir * 19;
    const tipY = s.y + 52;
    return `
        <g class="mascot-arm mascot-arm-${side}" transform="rotate(0 ${s.x} ${s.y})">
            <line x1="${s.x}" y1="${s.y}" x2="${tipX}" y2="${tipY}"
                  stroke="#5B2EDB" stroke-width="10" stroke-linecap="round"/>
            <circle cx="${tipX}" cy="${tipY}" r="9" fill="#7C4DFF"
                    stroke="#5B2EDB" stroke-width="2.5"/>
        </g>`;
}

// How far each arm swings from hanging, per pose.
const ARM_POSES = {
    rest:  { left: 0,    right: 0 },
    wave:  { left: 12,   right: -132 },
    cheer: { left: 135,  right: -135 }
};

function mascotSVG() {
    // Small dots at 12/3/6/9 — enough to read as a clock without becoming a face
    // busy enough to distract.
    let pips = "";
    [0, 90, 180, 270].forEach(deg => {
        const rad = deg * Math.PI / 180;
        const r = M_R - 12;
        const x = M_CX + r * Math.sin(rad);
        const y = M_CY - r * Math.cos(rad);
        pips += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#C9BCF0"/>`;
    });

    return `
    <svg viewBox="0 0 200 208" class="mascot mood-idle" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <!-- feet -->
        <ellipse cx="76" cy="178" rx="17" ry="11" fill="#5B2EDB"/>
        <ellipse cx="124" cy="178" rx="17" ry="11" fill="#5B2EDB"/>

        <!-- alarm bells -->
        <circle cx="58" cy="44" r="15" fill="#FFD166" stroke="#F0A500" stroke-width="3"/>
        <circle cx="142" cy="44" r="15" fill="#FFD166" stroke="#F0A500" stroke-width="3"/>

        ${mascotArm("left")}
        ${mascotArm("right")}

        <!-- body -->
        <circle cx="${M_CX}" cy="${M_CY}" r="${M_R + 6}" fill="#FFD166"/>
        <circle cx="${M_CX}" cy="${M_CY}" r="${M_R}" fill="#FFFDF7"/>
        ${pips}

        <!-- eyes: one set per mood, toggled by the class on the root svg -->
        <g class="mascot-eyes mascot-eyes-open">
            <circle cx="79" cy="86" r="15" fill="#FFFFFF" stroke="#3B2E5A" stroke-width="2.5"/>
            <circle cx="121" cy="86" r="15" fill="#FFFFFF" stroke="#3B2E5A" stroke-width="2.5"/>
            <circle class="mascot-pupil" cx="79" cy="88" r="6.5" fill="#3B2E5A"/>
            <circle class="mascot-pupil" cx="121" cy="88" r="6.5" fill="#3B2E5A"/>
            <circle cx="82" cy="84" r="2.2" fill="#FFFFFF"/>
            <circle cx="124" cy="84" r="2.2" fill="#FFFFFF"/>
        </g>
        <g class="mascot-eyes mascot-eyes-glad">
            <path d="M 66 90 Q 79 76 92 90" fill="none" stroke="#3B2E5A" stroke-width="5" stroke-linecap="round"/>
            <path d="M 108 90 Q 121 76 134 90" fill="none" stroke="#3B2E5A" stroke-width="5" stroke-linecap="round"/>
        </g>
        <g class="mascot-eyes mascot-eyes-wide">
            <circle cx="79" cy="86" r="16" fill="#FFFFFF" stroke="#3B2E5A" stroke-width="2.5"/>
            <circle cx="121" cy="86" r="16" fill="#FFFFFF" stroke="#3B2E5A" stroke-width="2.5"/>
            <circle cx="79" cy="87" r="5" fill="#3B2E5A"/>
            <circle cx="121" cy="87" r="5" fill="#3B2E5A"/>
        </g>

        <!-- brows, used by thinking / oops -->
        <g class="mascot-brows">
            <path class="mascot-brow-l" d="M 66 66 L 90 62" stroke="#3B2E5A" stroke-width="4.5" stroke-linecap="round"/>
            <path class="mascot-brow-r" d="M 110 62 L 134 66" stroke="#3B2E5A" stroke-width="4.5" stroke-linecap="round"/>
        </g>

        <!-- mouths -->
        <path class="mascot-mouth mascot-mouth-idle" d="M 86 122 Q 100 134 114 122"
              fill="none" stroke="#3B2E5A" stroke-width="4.5" stroke-linecap="round"/>
        <path class="mascot-mouth mascot-mouth-thinking" d="M 88 126 L 108 122"
              fill="none" stroke="#3B2E5A" stroke-width="4.5" stroke-linecap="round"/>
        <path class="mascot-mouth mascot-mouth-happy" d="M 78 118 Q 100 142 122 118 Z"
              fill="#E5484D" stroke="#3B2E5A" stroke-width="3" stroke-linejoin="round"/>
        <path class="mascot-mouth mascot-mouth-oops" d="M 86 130 Q 100 119 114 130"
              fill="none" stroke="#3B2E5A" stroke-width="4.5" stroke-linecap="round"/>
        <ellipse class="mascot-mouth mascot-mouth-cheer" cx="100" cy="126" rx="16" ry="14"
                 fill="#E5484D" stroke="#3B2E5A" stroke-width="3"/>
    </svg>`;
}

function renderMascot(container, mood) {
    if (!container.querySelector(".mascot")) {
        container.innerHTML = mascotSVG();
    }
    setMascotMood(container, mood || "idle");
}

function setMascotMood(container, mood) {
    const svg = container && container.querySelector(".mascot");
    if (!svg) return;
    MASCOT_MOODS.forEach(m => svg.classList.remove("mood-" + m));
    svg.classList.add("mood-" + (MASCOT_MOODS.indexOf(mood) === -1 ? "idle" : mood));
}

// Briefly show a reaction, then settle back — so the mascot is never frozen
// mid-grimace while the child is reading the next question.
function flashMascotMood(container, mood, settleTo, ms) {
    setMascotMood(container, mood);
    const svg = container && container.querySelector(".mascot");
    if (!svg) return;
    clearTimeout(svg._moodTimer);
    svg._moodTimer = setTimeout(() => setMascotMood(container, settleTo || "idle"), ms || 1200);
}

function setMascotPose(container, pose) {
    const svg = container && container.querySelector(".mascot");
    if (!svg) return;
    const angles = ARM_POSES[pose] || ARM_POSES.rest;
    [["left", ".mascot-arm-left"], ["right", ".mascot-arm-right"]].forEach(([side, sel]) => {
        const arm = svg.querySelector(sel);
        if (!arm) return;
        const s = SHOULDER[side];
        arm.setAttribute("transform", `rotate(${angles[side]} ${s.x} ${s.y})`);
    });
}
