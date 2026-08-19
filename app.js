// app.js — Tell The Time! game logic
(function () {
    "use strict";

    const STORAGE_KEY = "tellTheTimeProgress_v1";
    const QUESTIONS_PER_LEVEL = 8;
    const SET_QUESTIONS = 2; // how many of the 8 are "Set the Clock" drag questions
    const FIVE_MINUTE_MARKS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    const LEVELS = [
        {
            id: 1, emoji: "👉", title: "Just the Hour Hand", desc: "Meet the short hand!",
            badge: { icon: "🔎", name: "Hand Spotter", color: "#F97316" },
            minuteSet: [0], curriculum: "Year 1",
            hourHandOnly: true,
            teachTitle: "The hour hand lives in a space! 👉",
            teachHour: 3, teachMinute: 40,
            teachShowHourSpace: true,
            teachPoints: [
                "We've hidden the long hand — let's meet the <b>short hour hand</b> on its own.",
                "The hour hand doesn't jump. It <b>creeps slowly</b> across the green space all hour long.",
                "Look! It's nearly at the 4 — but it's still in the <b>3's space</b>, so it's still 3 o'clock. Sneaky! 🤫"
            ]
        },
        {
            id: 2, emoji: "🕐", title: "O'Clock", desc: "Both hands together!",
            badge: { icon: "🕐", name: "O'Clock Ace", color: "#7C4DFF" },
            minuteSet: [0], curriculum: "Year 1",
            teachTitle: "Now the long hand joins in! 🕐",
            teachHour: 3, teachMinute: 0,
            teachPoints: [
                "The <b>short</b> hand is the hour. The <b>long</b> hand is the minutes.",
                "At o'clock times, the <b>long hand points straight up</b> at the 12, like a rocket! 🚀",
                "Read the short hand first — that's the hour. This says <b>3 o'clock</b>."
            ]
        },
        {
            id: 3, emoji: "🕡", title: "Half Past", desc: "Halfway there!",
            badge: { icon: "🌗", name: "Half Past Hero", color: "#0EA5E9" },
            minuteSet: [0, 30], curriculum: "Year 1",
            // Mostly half past, with o'clock kept in as review — drawing evenly from
            // the legal set would make half the questions o'clock ones.
            targetWeights: [30, 30, 30, 0],
            teachTitle: "Half past means halfway round! 🕡",
            teachHour: 3, teachMinute: 30,
            teachPoints: [
                "When the <b>long minute hand</b> points straight <b>down</b> at the 6, it's half past!",
                "The short hour hand sneaks <b>halfway</b> between two numbers — sneaky! 🤫",
                "We say <b>half past 3</b>, and we write it 3:30."
            ]
        },
        {
            id: 4, emoji: "🕒", title: "Quarter Past & To", desc: "Say it with words!",
            badge: { icon: "🍕", name: "Quarter Champ", color: "#EC4899" },
            minuteSet: [0, 15, 30, 45], curriculum: "Year 2",
            // Mostly quarters, with o'clock and half past kept in as light review.
            targetWeights: [15, 15, 15, 45, 45, 45, 0, 30],
            // Ease in: the first few questions leave out quarter-to, which is the
            // part children get stuck on — but they're still quarter questions.
            scaffoldEarly: { count: 3, targetWeights: [15, 15, 15, 15, 0, 30] },
            teachTitle: "Quarter past and quarter to! 🕒",
            teachHour: 3, teachMinute: 15,
            teachPoints: [
                "The clock is like a pizza cut into 4 quarters! 🍕",
                "The minute hand on the <b>3</b> has gone <b>one quarter</b> of the way round — that's 15 minutes.",
                "We say <b>quarter past 3</b>, and we write it 3:15."
            ],
            // Quarter-to is the sticking point, so it gets its own worked example
            // with the "minutes still to go" arc drawn on the clock.
            teachExtra: {
                hour: 7, minute: 45, showToArc: true,
                title: "Now the tricky one — quarter TO! 🤔",
                points: [
                    "Once the minute hand goes <b>past the 6</b>, we stop counting <b>past</b> and start counting <b>to</b>.",
                    "The blue arc shows the minutes <b>still to go</b> — just 15 left, one quarter of the way round.",
                    "Here's the sneaky bit: we name the hour we're heading <b>to</b>, not the one we're in. The short hand is nearly at the <b>8</b>&hellip;",
                    "&hellip;so this is <b>quarter to 8</b> — even though it's written <b>7:45</b>!"
                ]
            }
        },
        {
            id: 5, emoji: "🕔", title: "Five Minutes", desc: "Count by 5s!",
            badge: { icon: "🖐️", name: "High Five Counter", color: "#2FBF71" },
            minuteSet: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], curriculum: "Year 3",
            teachTitle: "Let's count by 5s around the clock! 🕔",
            teachHour: 3, teachMinute: 20,
            teachPoints: [
                "Each number on the clock is <b>5 minutes</b> apart — easy peasy!",
                "Count with me: 5, 10, 15, 20&hellip; all the way round to 60!",
                "The minute hand's on the 4? That's <b>20 past 3</b> — written 3:20."
            ]
        },
        {
            id: 6, emoji: "🕓", title: "Any Minute", desc: "Every tick counts!",
            badge: { icon: "🔬", name: "Minute Detective", color: "#F59E0B" },
            minuteSet: Array.from({ length: 60 }, (_, i) => i), curriculum: "Year 3",
            teachTitle: "Time to read every single minute! 🕓",
            teachHour: 3, teachMinute: 23,
            teachPoints: [
                "Now we read the <b>tiny ticks</b> between the numbers too.",
                "Each little tick is just <b>1 minute</b>.",
                "This clock shows <b>23 past 3</b> &mdash; written 3:23!"
            ]
        },
        {
            id: 7, emoji: "🏆", title: "Time Master", desc: "The big challenge!",
            badge: { icon: "👑", name: "Time Master", color: "#EAB308" },
            minuteSet: "mixed", curriculum: "Year 3",
            teachTitle: "You're ready — show us what you know! 🏆",
            teachHour: 7, teachMinute: 45,
            teachPoints: [
                "This round mixes up <b>everything</b> you've learned!",
                "Look carefully at both hands — you've got this!",
                "Finish this and you're an official <b>Time Master</b>! 🏆⭐"
            ]
        }
    ];

    // Wrong answers built from documented clock-reading errors, so a wrong tap tells
    // you which misunderstanding is behind it (and the child gets a targeted hint).
    const MISCONCEPTION_HINTS = {
        hourProximity: "Look again at the <b>short</b> hand — it's nearly at the next number, but it hasn't got there yet! It's still in the hour before.",
        handSwap: "Careful — check which hand is which. The <b>short</b> hand is the hour, the <b>long</b> one is the minutes.",
        minuteAsNumber: "The minute hand points at a number, but that's not the minutes! Count in <b>5s</b> from the 12.",
        countOffByFive: "So close! Count the 5s around from the 12 again — you're one number out.",
        quarterMixUp: "Past the 6, we count the minutes <b>still to go</b> — that's the blue arc. And we name the hour we're heading <b>to</b>, which is the <b>next</b> one, not the one the short hand just left."
    };

    const ENCOURAGE_CORRECT = [
        "Brilliant! 🌟", "You've got it!", "Yes! Great reading!", "Nailed it! 🎉",
        "Awesome work!", "That's exactly right!", "Super job!", "You're getting so good at this!",
        "Woohoo! 🎉", "You're on fire! 🔥", "Clock master move! 🕐", "High five! 🙌"
    ];
    // Kept free of any mention of a particular hand — the hour-hand level hides the
    // minute hand, and the targeted hint below already says what to look at.
    const ENCOURAGE_RETRY = [
        "Not quite — have another go!", "Close! Take another look and try again.",
        "Almost there — try once more!", "Good try — give it one more look!",
        "Nearly there — you can do this!", "So close! You've got this — try again! 💪"
    ];

    // ---------- State ----------
    let progress = loadProgress();
    let session = null; // current practice session state

    function loadProgress() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return migrateProgress(JSON.parse(raw));
        } catch (e) { /* ignore */ }
        return { levels: {}, totalStars: 0, seenTeach: {}, schema: 2 };
    }

    // "Just the Hour Hand" was inserted at the front of the level list, so every
    // level saved before that shifted up by one. Without this, stars earned on the
    // old O'Clock level would show against the new hour-hand level, and so on.
    function migrateProgress(saved) {
        if (!saved || saved.schema >= 2) return saved;
        const shifted = {};
        Object.keys(saved.levels || {}).forEach(oldId => {
            const n = parseInt(oldId, 10);
            if (!isNaN(n)) shifted[n + 1] = saved.levels[oldId];
        });
        // The new first level covers ground they had already passed, so credit it.
        if (Object.keys(shifted).length) shifted[1] = shifted[1] || { stars: 3 };
        return { ...saved, levels: shifted, schema: 2 };
    }
    function saveProgress() {
        progress.schema = 2;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }

    function starsFor(levelId) {
        return (progress.levels[levelId] && progress.levels[levelId].stars) || 0;
    }
    function isUnlocked(levelId) {
        if (levelId === 1) return true;
        return starsFor(levelId - 1) >= 1;
    }
    function totalStars() {
        return Object.values(progress.levels).reduce((s, l) => s + (l.stars || 0), 0);
    }

    // ---------- DOM helpers ----------
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    // Screens are ordered, so moving to a later one slides in from the right and
    // going back slides in from the left — the direction tells the child whether
    // they're going deeper or coming back out.
    const SCREEN_ORDER = ["screen-home", "screen-teach", "screen-practice", "screen-complete"];
    let currentScreen = "screen-home";

    function showScreen(id) {
        const from = SCREEN_ORDER.indexOf(currentScreen);
        const to = SCREEN_ORDER.indexOf(id);
        const back = to < from;
        $$(".screen").forEach(s => s.classList.remove("active", "from-right", "from-left"));
        const el = $("#" + id);
        el.classList.add("active", back ? "from-left" : "from-right");
        currentScreen = id;
        document.body.dataset.screen = id;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Tints the current level with its own colour so each one feels distinct.
    function applyLevelColour(level) {
        document.documentElement.style.setProperty(
            "--level-color", (level && level.badge && level.badge.color) || "#7C4DFF"
        );
    }

    // Prefer a warmer, more natural-sounding voice over the default robotic one.
    let cachedVoice = null;
    function pickVoice() {
        if (!window.speechSynthesis) return null;
        const voices = window.speechSynthesis.getVoices();
        if (!voices.length) return null;
        const preferredNames = [
            "Google UK English Female", "Samantha", "Karen", "Moira", "Tessa",
            "Victoria", "Fiona", "Kate", "Serena", "Google US English"
        ];
        for (const name of preferredNames) {
            const v = voices.find(v => v.name === name);
            if (v) return v;
        }
        const female = voices.find(v => /^en/i.test(v.lang) && /female/i.test(v.name));
        if (female) return female;
        const enLocal = voices.find(v => /^en/i.test(v.lang) && v.localService);
        if (enLocal) return enLocal;
        return voices.find(v => /^en/i.test(v.lang)) || voices[0];
    }
    if (window.speechSynthesis) {
        cachedVoice = pickVoice();
        window.speechSynthesis.onvoiceschanged = () => { cachedVoice = pickVoice(); };
    }

    function speak(text) {
        try {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 1.0;
            u.pitch = 1.05;
            const voice = cachedVoice || pickVoice();
            if (voice) u.voice = voice;
            window.speechSynthesis.speak(u);
        } catch (e) { /* ignore */ }
    }

    // Playful chime sounds for instant feedback, instead of leaning on speech synthesis.
    let audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) audioCtx = new AC();
        }
        return audioCtx;
    }
    function playCorrectSound() {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;
            const start = now + i * 0.09;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.32);
        });
    }
    function playTryAgainSound() {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }
    function playVictorySound() {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.value = freq;
            const start = now + i * 0.12;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.22, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
            osc.connect(gain).connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.42);
        });
    }

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    function confettiBurst(count = 40) {
        const colors = ["#5B6EF5", "#FFB84D", "#35D0BA", "#FF8A3D", "#4CAF50", "#FFC93C"];
        for (let i = 0; i < count; i++) {
            const el = document.createElement("div");
            el.className = "confetti-piece";
            el.style.left = Math.random() * 100 + "vw";
            el.style.background = pick(colors);
            el.style.animationDuration = (2 + Math.random() * 1.5) + "s";
            el.style.transform = `rotate(${Math.random() * 360}deg)`;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 3800);
        }
    }

    function rewardPopup() {
        const stage = $(".clock-stage");
        if (!stage) return;
        const el = document.createElement("div");
        el.className = "reward-pop";
        el.textContent = pick(["⭐", "🎉", "🌟", "✨", "👏", "💫"]);
        stage.appendChild(el);
        setTimeout(() => el.remove(), 900);
    }

    function updateNavStars() {
        const el = $("#stars-total");
        if (!el) return;
        const newTotal = String(totalStars());
        const changed = el.textContent !== newTotal;
        el.textContent = newTotal;
        if (changed) {
            el.classList.remove("star-bump");
            void el.offsetWidth;
            el.classList.add("star-bump");
        }
    }

    // ---------- Home / level select ----------
    // ---------- Journey map ----------
    // Levels sit along a winding path instead of in a grid, so progress reads as a
    // journey. Node positions live in the same coordinate space as the SVG path and
    // are converted to percentages, so the buttons stay glued to the path at any width.
    const MAP_W = 320, MAP_H = 800;
    const MAP_NODES = [
        { x: 84, y: 66 }, { x: 232, y: 172 }, { x: 86, y: 278 },
        { x: 236, y: 384 }, { x: 84, y: 490 }, { x: 232, y: 596 },
        { x: 160, y: 712 }
    ];

    function journeyPathD() {
        let d = `M ${MAP_NODES[0].x} ${MAP_NODES[0].y}`;
        for (let i = 1; i < MAP_NODES.length; i++) {
            const a = MAP_NODES[i - 1], b = MAP_NODES[i];
            const bend = (b.y - a.y) * 0.55;
            d += ` C ${a.x} ${a.y + bend}, ${b.x} ${b.y - bend}, ${b.x} ${b.y}`;
        }
        return d;
    }

    function renderJourneyMap() {
        const wrap = $("#journey");
        if (!wrap) return;

        const nextUp = LEVELS.find(l => isUnlocked(l.id) && starsFor(l.id) === 0);

        const nodes = LEVELS.map((level, i) => {
            const pos = MAP_NODES[i] || MAP_NODES[MAP_NODES.length - 1];
            const unlocked = isUnlocked(level.id);
            const stars = starsFor(level.id);
            const isNext = nextUp && nextUp.id === level.id;
            const label = unlocked ? level.title : "Locked";
            return `
                <button class="journey-node ${unlocked ? "" : "locked"} ${isNext ? "is-next" : ""}"
                        data-level="${level.id}"
                        style="left:${(pos.x / MAP_W) * 100}%; top:${(pos.y / MAP_H) * 100}%; --node-color:${level.badge.color}"
                        ${unlocked ? "" : "disabled"}
                        aria-label="${label}${unlocked ? `, ${stars} of 3 stars` : ""}">
                    <span class="journey-disc">${unlocked ? (stars >= 1 ? level.badge.icon : level.emoji) : "🔒"}</span>
                    <span class="journey-label">${unlocked ? level.title : "???"}</span>
                    <span class="journey-stars">
                        ${[1, 2, 3].map(n => `<i class="${n <= stars ? "" : "dim"}">⭐</i>`).join("")}
                    </span>
                </button>`;
        }).join("");

        wrap.innerHTML = `
            <div class="journey-inner">
                <svg class="journey-path" viewBox="0 0 ${MAP_W} ${MAP_H}" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
                    <path d="${journeyPathD()}" fill="none" stroke="#DCD2FA" stroke-width="16"
                          stroke-linecap="round" stroke-dasharray="2 26"/>
                </svg>
                ${nodes}
            </div>`;

        wrap.querySelectorAll(".journey-node:not(.locked)").forEach(btn => {
            btn.addEventListener("click", () => enterLevel(parseInt(btn.dataset.level, 10)));
        });
    }

    function resetProgress() {
        const ok = window.confirm(
            "Start over?\n\nThis clears all stars and badges so you can begin again from the very first level."
        );
        if (!ok) return;
        progress = { levels: {}, totalStars: 0, seenTeach: {}, schema: 2 };
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
        renderHome();
        showScreen("screen-home");
    }

    function renderHome() {
        updateNavStars();
        renderJourneyMap();
        const badges = LEVELS.filter(l => starsFor(l.id) >= 1).length;
        const sub = $("#home-sub");
        if (sub) {
            sub.textContent = badges === 0
                ? "Start at the bottom of the path and work your way up!"
                : `${badges} of ${LEVELS.length} badges won — keep going!`;
        }
        const resetBtn = $("#btn-reset");
        if (resetBtn) resetBtn.onclick = resetProgress;
    }

    // ---------- Teach screen ----------
    function enterLevel(levelId) {
        const level = LEVELS.find(l => l.id === levelId);
        applyLevelColour(level);
        renderTeach(level);
        showScreen("screen-teach");
    }

    // Lines Tick says on the lesson screen, so the character introduces the level
    // rather than the page just presenting it.
    const MASCOT_INTROS = [
        "Hi! I'm Tick. Let's learn this one together!",
        "Ooh, my favourite! Watch my arms…",
        "Ready? I'll show you how this one works!",
        "This one's fun — follow my arms!"
    ];

    function renderTeach(level) {
        $("#teach-title").innerHTML = `${level.emoji} ${level.title}` +
            (level.curriculum ? ` <span class="teach-year">${level.curriculum}</span>` : "");
        $("#teach-subtitle").textContent = level.teachTitle;

        const teachMascot = $("#teach-mascot");
        renderMascot(teachMascot, "idle");
        setMascotPose(teachMascot, "wave");
        $("#teach-say").textContent = pick(MASCOT_INTROS);
        const clockEl = $("#teach-clock");
        clockEl.innerHTML = "";
        renderClock(clockEl, level.teachHour, level.teachMinute, {
            hideMinuteHand: !!level.hourHandOnly,
            showHourSpace: !!level.teachShowHourSpace
        });
        $("#teach-points").innerHTML = level.teachPoints.map(p => `<p>👉 ${p}</p>`).join("");

        const extraWrap = $("#teach-extra");
        if (level.teachExtra) {
            const ex = level.teachExtra;
            extraWrap.style.display = "";
            $("#teach-extra-title").textContent = ex.title;
            $("#teach-extra-points").innerHTML = ex.points.map(p => `<p>👉 ${p}</p>`).join("");
            const clock2 = $("#teach-clock-2");
            clock2.innerHTML = "";
            renderClock(clock2, ex.hour, ex.minute, {
                showToArc: ex.showToArc ? { minute: ex.minute } : null
            });
        } else {
            extraWrap.style.display = "none";
        }
        $("#teach-digital").textContent = level.hourHandOnly
            ? formatWords(level.teachHour, 0)
            : `${formatWords(level.teachHour, level.teachMinute)} (${formatDigital(level.teachHour, level.teachMinute)})`;
        $("#btn-start-practice").onclick = () => startPractice(level.id);
        $("#btn-teach-back").onclick = () => { renderHome(); showScreen("screen-home"); };
        $("#btn-teach-speak").onclick = () => speak(`This clock shows ${spokenTime(level.teachHour, level.teachMinute)}.`);
    }

    // ---------- Practice / quiz ----------
    // Question mixes per level. Words-based answers carry the Year 2 curriculum
    // requirement to use the language of "past" and "to", so they lead from level 4.
    function questionMixFor(level) {
        if (level.hourHandOnly) return Array(QUESTIONS_PER_LEVEL).fill("hourspace");
        if (level.id <= 3) {
            return ["mcqWords", "mcqWords", "mcqDigital", "whichClock",
                    "set", "mcqWords", "mcqDigital", "set"];
        }
        if (level.curriculum === "Year 2") {
            return ["mcqWords", "mcqWords", "whichClock", "setWords",
                    "mcqDigital", "mcqWords", "set", "mcqWords"];
        }
        return ["mcqDigital", "mcqWords", "whichClock", "set",
                "mcqWords", "mcqDigital", "setWords", "mcqWords"];
    }

    function buildQuestionList(levelId) {
        const level = LEVELS.find(l => l.id === levelId);
        const types = shuffle(questionMixFor(level));
        return types.map((type, i) => ({ type, ...generateTime(level, type, i) }));
    }

    function generateTime(level, type, index) {
        let minuteSet = level.minuteSet;
        let inherited = null;
        if (minuteSet === "mixed") {
            // Time Master: sample from a random earlier level, taking that level's
            // weighting too so the mix stays representative of what it taught.
            const pool = LEVELS.filter(l => !l.hourHandOnly && l.minuteSet !== "mixed");
            const chosen = pick(pool);
            minuteSet = chosen.minuteSet;
            inherited = chosen.targetWeights || null;
        }

        // The set of *legal* minutes (minuteSet) and the pool a question is actually
        // drawn from are different things. Drawing uniformly from the legal set meant
        // a level called "Quarter Past & To" served questions with no quarter in them
        // at all. targetWeights lets a level make its own subject the common case,
        // with repeats standing in for weighting.
        let targetPool = inherited || level.targetWeights || minuteSet;
        // Scaffolded levels hold back their hardest minutes for the first few
        // questions, so the child gets a run of wins before the tricky part.
        if (level.scaffoldEarly && index < level.scaffoldEarly.count) {
            targetPool = level.scaffoldEarly.targetWeights;
        }

        const hour = randInt(1, 12);
        if (type === "hourspace") {
            // Drift the hour hand through its hour. Late positions are the ones
            // children misread, so they earn their place — but past ~40 minutes the
            // hand sits within a few degrees of the next number and nobody, adult or
            // child, can fairly call it. Capped so every question is actually decidable.
            return { hour, minute: pick([0, 5, 15, 20, 30, 35, 40]), minuteSet: [0] };
        }
        // Reading to the exact minute is fair, but *dragging* to one minute out of 60
        // is far too fiddly for small fingers — so questions that ask the child to set
        // the clock stay on the 5-minute marks.
        if ((type === "set" || type === "setWords") && minuteSet.length > 12) {
            minuteSet = FIVE_MINUTE_MARKS;
            targetPool = FIVE_MINUTE_MARKS;
        }
        return { hour, minute: pick(targetPool), minuteSet };
    }

    // Distractors built from documented clock-reading errors rather than at random.
    // Each carries the misconception it represents so a wrong tap can be answered
    // with a hint aimed at that specific confusion.
    function generateDistractors(hour, minute, minuteSet, count = 3) {
        const norm = (h) => ((h - 1 + 12) % 12) + 1;
        const seen = new Set([`${hour}:${minute}`]);
        const candidates = [];
        const add = (h, m, why) => {
            h = norm(h);
            m = ((m % 60) + 60) % 60;
            const key = `${h}:${m}`;
            if (seen.has(key)) return;
            seen.add(key);
            candidates.push({ hour: h, minute: m, why });
        };

        // The single most common documented error: the hour hand sits close to the
        // next number late in the hour, so 2:50 gets read as 3:50.
        if (minute >= 30) add(hour + 1, minute, "hourProximity");
        else if (minute > 0) add(hour - 1, minute, "hourProximity");

        // Reading the hour hand as the minute hand and vice versa.
        add(Math.round(minute / 5) || 12, (hour % 12) * 5, "handSwap");

        // Minute hand read as the number it points at (on the 4 → "4", not 20).
        if (minute % 5 === 0 && minute >= 10) add(hour, minute / 5, "minuteAsNumber");

        // Quarter past / quarter to swapped.
        if (minute === 15) add(hour, 45, "quarterMixUp");
        if (minute === 45) add(hour, 15, "quarterMixUp");

        // Counting the 5s from the wrong place — one number out either way.
        add(hour, minute + 5, "countOffByFive");
        add(hour, minute - 5, "countOffByFive");

        // On the tightly-constrained early levels, only offer times that could
        // actually occur there, or the wrong answers look obviously silly.
        const constrained = minuteSet.length <= 4;
        let pool = constrained
            ? candidates.filter(c => minuteSet.indexOf(c.minute) !== -1)
            : candidates;

        pool = shuffle(pool);
        const results = pool.slice(0, count);

        // Top up with plausible random times if the misconception set came up short.
        let guard = 0;
        while (results.length < count && guard++ < 200) {
            const h = randInt(1, 12), m = pick(minuteSet);
            const key = `${h}:${m}`;
            if (seen.has(key)) continue;
            seen.add(key);
            results.push({ hour: h, minute: m, why: null });
        }
        return results;
    }

    function startPractice(levelId) {
        session = {
            levelId,
            questions: buildQuestionList(levelId),
            index: 0,
            correctFirstTry: 0,
            missedThisQuestion: false,
            streak: 0
        };
        updateStreakBadge();
        renderMascot($("#quiz-mascot"), "idle");
        renderQuestion();
        showScreen("screen-practice");
    }

    function registerStreak(correctFirstTry) {
        session.streak = correctFirstTry ? (session.streak || 0) + 1 : 0;
        updateStreakBadge();
    }

    function updateStreakBadge() {
        const badge = $("#streak-badge");
        if (!badge) return;
        if (session && session.streak >= 2) {
            badge.textContent = `🔥 ${session.streak} in a row!`;
            badge.classList.add("show");
        } else {
            badge.classList.remove("show");
        }
    }

    function renderQuestion() {
        const level = LEVELS.find(l => l.id === session.levelId);
        const q = session.questions[session.index];
        session.missedThisQuestion = false;

        $("#practice-title").textContent = `${level.emoji} ${level.title}`;
        const pct = Math.round((session.index / session.questions.length) * 100);
        $("#progress-fill").style.width = pct + "%";
        $("#feedback-msg").textContent = "";
        $("#feedback-msg").className = "feedback-msg";
        showMisconceptionHint(null);

        const clockEl = $("#quiz-clock");
        clockEl.innerHTML = "";

        const speakBtn = $("#btn-quiz-speak");
        if (speakBtn) {
            speakBtn.onclick = () => speak(q.type === "hourspace"
                ? `Which hour are we in? Look at the short hand.`
                : spokenTime(q.hour, q.minute));
        }

        const showArea = (name) => {
            $("#mcq-area").style.display = name === "mcq" ? "" : "none";
            $("#set-area").style.display = name === "set" ? "" : "none";
            $("#choice-area").style.display = name === "choice" ? "" : "none";
            $(".clock-stage").style.display = name === "choice" ? "none" : "flex";
            $("#set-target").style.display = name === "set" ? "" : "none";
        };

        // Year 2 is the "past / to" language level, so its prompts are worded there too.
        const isWords = q.type === "mcqWords" || q.type === "setWords"
            || (q.type === "whichClock" && level.curriculum === "Year 2");
        const label = (h, m) => isWords ? formatWords(h, m) : formatDigital(h, m);

        if (q.type === "hourspace") {
            // One-handed clock: which hour's space is the hand in?
            showArea("mcq");
            $("#quiz-question").textContent = "Which hour are we in?";
            renderClock(clockEl, q.hour, q.minute, { hideMinuteHand: true });

            const options = shuffle([
                { hour: q.hour, minute: 0 },
                { hour: (q.hour % 12) + 1, minute: 0, why: "hourProximity" },
                { hour: ((q.hour - 2 + 12) % 12) + 1, minute: 0 },
                { hour: ((q.hour + 1) % 12) + 1, minute: 0 }
            ]);
            buildAnswerButtons(options, q, (h) => `${((h % 12) === 0 ? 12 : h % 12)} o'clock`);

        } else if (q.type === "whichClock") {
            // Reverse direction: given a time, pick the clock that shows it.
            showArea("choice");
            $("#quiz-question").textContent = "Which clock shows this time?";
            $("#choice-target").innerHTML = formatPairedHTML(q.hour, q.minute);

            const distractors = generateDistractors(q.hour, q.minute, q.minuteSet);
            const options = shuffle([{ hour: q.hour, minute: q.minute, why: null }, ...distractors]);
            const grid = $("#clock-choice-grid");
            grid.innerHTML = "";
            options.forEach(opt => {
                const cell = document.createElement("button");
                cell.className = "clock-choice";
                const face = document.createElement("div");
                face.className = "clock-wrap";
                cell.appendChild(face);
                grid.appendChild(cell);
                renderClock(face, opt.hour, opt.minute);
                cell.addEventListener("click", () => handleChoiceAnswer(cell, opt, q));
            });

        } else if (q.type === "mcqWords" || q.type === "mcqDigital") {
            showArea("mcq");
            $("#quiz-question").textContent = isWords ? "How do we say this time?" : "What time is it?";
            renderClock(clockEl, q.hour, q.minute);

            const distractors = generateDistractors(q.hour, q.minute, q.minuteSet);
            const options = shuffle([{ hour: q.hour, minute: q.minute, why: null }, ...distractors]);
            buildAnswerButtons(options, q, null, isWords);

        } else {
            showArea("set");
            $("#quiz-question").textContent = "Set the clock to match!";
            $("#set-target").innerHTML = formatPairedHTML(q.hour, q.minute);

            // The hand always snaps to the 5-minute marks while dragging, whatever the
            // level allows as an answer. Snapping to the level's own set would leave
            // o'clock levels with a single legal position, so every drag pinged the
            // hand straight back to the 12 and looked broken.
            const dragSet = FIVE_MINUTE_MARKS;

            // Start away from the answer on both hands, so there's something to do.
            let startHour = q.hour;
            while (startHour === q.hour) startHour = randInt(1, 12);
            let startMinute = q.minute;
            while (startMinute === q.minute) startMinute = pick(dragSet);
            const state = { hour: startHour, minute: startMinute };
            renderClock(clockEl, state.hour, state.minute);
            $("#hour-display").textContent = state.hour;

            $("#hour-minus").onclick = () => { state.hour = state.hour === 1 ? 12 : state.hour - 1; $("#hour-display").textContent = state.hour; setClockHands(clockEl, state.hour, state.minute); };
            $("#hour-plus").onclick = () => { state.hour = state.hour === 12 ? 1 : state.hour + 1; $("#hour-display").textContent = state.hour; setClockHands(clockEl, state.hour, state.minute); };

            makeClockDraggable(clockEl, () => state.hour, (m) => { state.minute = m; }, dragSet);

            const checkBtn = $("#btn-check-set");
            checkBtn.disabled = false;
            checkBtn.onclick = () => handleSetAnswer(state, q);
        }
    }

    function buildAnswerButtons(options, q, customLabel, useWords) {
        const answerGrid = $("#answer-grid");
        answerGrid.innerHTML = "";
        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "answer-btn";
            if (customLabel) {
                btn.textContent = customLabel(opt.hour);
            } else {
                btn.innerHTML = formatPairedHTML(opt.hour, opt.minute);
            }
            btn.addEventListener("click", () => handleMcqAnswer(btn, opt, q));
            answerGrid.appendChild(btn);
        });
    }

    // Shows a hint aimed at the specific misconception behind a wrong answer.
    function showMisconceptionHint(why) {
        const el = $("#misconception-hint");
        if (!el) return;
        if (why && MISCONCEPTION_HINTS[why]) {
            el.innerHTML = `💡 ${MISCONCEPTION_HINTS[why]}`;
            el.classList.add("show");
            // It opens below the answers and can land under the browser chrome,
            // so bring it into view once it has finished expanding.
            setTimeout(() => {
                el.scrollIntoView({ behavior: "smooth", block: "end" });
            }, 320);
        } else {
            el.classList.remove("show");
            el.innerHTML = "";
        }
    }

    // Hour-space questions are judged on the hour alone — the minute value is just
    // how far the hand has drifted through that hour.
    function isAnswerCorrect(chosen, q) {
        if (q.type === "hourspace") return chosen.hour === q.hour;
        return chosen.hour === q.hour && chosen.minute === q.minute;
    }

    function markCorrect() {
        playCorrectSound();
        confettiBurst(10);
        rewardPopup();
        flashMascotMood($("#quiz-mascot"), "happy", "idle", 1200);
        showMisconceptionHint(null);
        const firstTry = !session.missedThisQuestion;
        if (firstTry) session.correctFirstTry++;
        registerStreak(firstTry);
        setTimeout(nextQuestion, 1300);
    }

    function markWrong(chosen, q) {
        session.missedThisQuestion = true;
        playTryAgainSound();
        flashMascotMood($("#quiz-mascot"), "oops", "thinking", 1400);
        registerStreak(false);
        showMisconceptionHint(chosen && chosen.why);

        // Draw the explanation onto the clock itself, not just in words.
        const clockEl = $("#quiz-clock");
        if (!chosen || !clockEl || !clockEl.querySelector(".clock-svg")) return;
        if (chosen.why === "hourProximity") {
            // Light the hour's space so they can see the hand is still in it.
            applyClockOptions(clockEl, q.hour, {
                hideMinuteHand: q.type === "hourspace",
                showHourSpace: true
            });
        } else if (chosen.why === "quarterMixUp" || (q.minute > 30 && chosen.minute <= 30)) {
            // Show the minutes still to go, which is what "to" is counting.
            applyClockOptions(clockEl, q.hour, { showToArc: { minute: q.minute } });
        }
    }

    function handleMcqAnswer(btn, chosen, q) {
        const buttons = $$("#answer-grid .answer-btn");
        if (isAnswerCorrect(chosen, q)) {
            buttons.forEach(b => b.disabled = true);
            btn.classList.add("correct", "bounce");
            const msg = $("#feedback-msg");
            msg.textContent = pick(ENCOURAGE_CORRECT);
            msg.classList.add("correct");
            markCorrect();
        } else {
            btn.classList.add("wrong", "shake");
            btn.disabled = true;
            const msg = $("#feedback-msg");
            msg.textContent = pick(ENCOURAGE_RETRY);
            msg.classList.add("wrong");
            markWrong(chosen, q);
        }
    }

    function handleChoiceAnswer(cell, chosen, q) {
        const cells = $$("#clock-choice-grid .clock-choice");
        const msg = $("#feedback-msg");
        if (isAnswerCorrect(chosen, q)) {
            cells.forEach(c => c.disabled = true);
            cell.classList.add("correct", "bounce");
            msg.textContent = pick(ENCOURAGE_CORRECT);
            msg.className = "feedback-msg correct";
            markCorrect();
        } else {
            cell.classList.add("wrong", "shake");
            cell.disabled = true;
            msg.textContent = pick(ENCOURAGE_RETRY);
            msg.className = "feedback-msg wrong";
            markWrong(chosen, q);
        }
    }

    function handleSetAnswer(state, q) {
        const msg = $("#feedback-msg");
        if (state.hour === q.hour && state.minute === q.minute) {
            msg.textContent = pick(ENCOURAGE_CORRECT);
            msg.className = "feedback-msg correct";
            $("#btn-check-set").disabled = true;
            markCorrect();
        } else {
            msg.textContent = pick(ENCOURAGE_RETRY);
            msg.className = "feedback-msg wrong shake";
            // Diagnose what they actually set, so the hint matches their slip.
            let why = null;
            if (state.minute === q.minute && state.hour !== q.hour) why = "hourProximity";
            else if (q.minute === 15 && state.minute === 45) why = "quarterMixUp";
            else if (q.minute === 45 && state.minute === 15) why = "quarterMixUp";
            else if (Math.abs(state.minute - q.minute) === 5) why = "countOffByFive";
            markWrong({ why }, q);
        }
    }

    function nextQuestion() {
        session.index++;
        if (session.index >= session.questions.length) {
            finishLevel();
        } else {
            renderQuestion();
        }
    }

    function finishLevel() {
        const level = LEVELS.find(l => l.id === session.levelId);
        const ratio = session.correctFirstTry / session.questions.length;
        let stars = 1;
        if (ratio >= 0.9) stars = 3;
        else if (ratio >= 0.6) stars = 2;

        const prevStars = starsFor(level.id);
        if (stars > prevStars) {
            progress.levels[level.id] = { stars };
            saveProgress();
        }
        updateNavStars();

        // The badge is the keepsake for finishing a level — it lands on the home shelf.
        const isNewBadge = prevStars === 0;
        const disc = $("#badge-won-disc");
        disc.textContent = level.badge.icon;
        disc.style.background = level.badge.color;
        $("#badge-won-label").textContent = isNewBadge
            ? `${level.badge.name} badge won!`
            : `${level.badge.name}`;
        $("#badge-won").classList.toggle("is-new", isNewBadge);

        $("#complete-title").textContent = `${level.title} complete!`;
        const finalStars = Math.max(stars, prevStars);
        $("#complete-stars").innerHTML = [1, 2, 3]
            .map(n => `<span class="${n <= finalStars ? "" : "dim"}">⭐</span>`).join("");
        const messages = [
            "You're doing brilliantly!", "Look at you go!", "So proud of that effort!",
            "You're really getting the hang of clocks!"
        ];
        $("#complete-msg").textContent = pick(messages);

        const nextLevel = LEVELS.find(l => l.id === level.id + 1);
        const nextBtn = $("#btn-next-level");
        if (nextLevel) {
            nextBtn.style.display = "";
            nextBtn.textContent = `Next: ${nextLevel.title} ➜`;
            nextBtn.onclick = () => enterLevel(nextLevel.id);
        } else {
            nextBtn.style.display = "none";
        }
        $("#btn-retry-level").onclick = () => startPractice(level.id);
        $("#btn-complete-home").onclick = () => { renderHome(); showScreen("screen-home"); };

        const completeMascot = $("#complete-mascot");
        renderMascot(completeMascot, "cheer");
        setMascotPose(completeMascot, "cheer");

        showScreen("screen-complete");
        // Staggered so the moment builds — badge lands, then the fanfare, then the
        // confetti — instead of everything firing at once and reading as noise.
        setTimeout(() => playVictorySound(), 180);
        setTimeout(() => confettiBurst(finalStars >= 3 ? 60 : 35), 420);
        if (finalStars >= 3) setTimeout(() => confettiBurst(30), 900);
    }

    // ---------- Init ----------
    document.addEventListener("DOMContentLoaded", () => {
        renderHome();
        $("#btn-home-logo").addEventListener("click", () => { renderHome(); showScreen("screen-home"); });
        showScreen("screen-home");
    });
})();
