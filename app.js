// app.js — Tell The Time! game logic
(function () {
    "use strict";

    const STORAGE_KEY = "tellTheTimeProgress_v1";
    const QUESTIONS_PER_LEVEL = 8;
    const SET_QUESTIONS = 2; // how many of the 8 are "Set the Clock" drag questions

    const LEVELS = [
        {
            id: 1, emoji: "🕐", title: "O'Clock", desc: "Hour hand only",
            minuteSet: [0],
            teachTitle: "The hour hand tells us the hour",
            teachHour: 3, teachMinute: 0,
            teachPoints: [
                "The <b>short, fat hand</b> is the hour hand.",
                "At o'clock times, the <b>long hand points straight up</b> at the 12.",
                "The short hand points right at the number — that's the hour!"
            ]
        },
        {
            id: 2, emoji: "🕡", title: "Half Past", desc: "Halfway round",
            minuteSet: [0, 30],
            teachTitle: "Half past means halfway to the next hour",
            teachHour: 3, teachMinute: 30,
            teachPoints: [
                "When the <b>long minute hand</b> points straight <b>down</b> at the 6, that's 30 minutes — half past!",
                "The short hour hand creeps <b>halfway</b> between two numbers.",
                "This clock shows <b>half past 3</b> — written 3:30."
            ]
        },
        {
            id: 3, emoji: "🕒", title: "Quarter Past & To", desc: "Quarter turns",
            minuteSet: [0, 15, 30, 45],
            teachTitle: "Quarter past and quarter to",
            teachHour: 3, teachMinute: 15,
            teachPoints: [
                "The minute hand at the <b>3</b> means <b>quarter past</b> — 15 minutes.",
                "The minute hand at the <b>9</b> means <b>quarter to</b> the next hour — 45 minutes.",
                "This clock shows <b>quarter past 3</b> — written 3:15."
            ]
        },
        {
            id: 4, emoji: "🕔", title: "Five Minutes", desc: "Every 5-minute mark",
            minuteSet: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
            teachTitle: "Counting in 5s around the clock",
            teachHour: 3, teachMinute: 20,
            teachPoints: [
                "Each number on the clock is <b>5 minutes</b> apart.",
                "Count by 5s from the 12: 5, 10, 15, 20&hellip; all the way round to 60.",
                "This clock's minute hand is on the 4 &mdash; that's <b>20 minutes</b>, so it's 3:20."
            ]
        },
        {
            id: 5, emoji: "🕓", title: "Any Minute", desc: "Exact minutes",
            minuteSet: Array.from({ length: 60 }, (_, i) => i),
            teachTitle: "Reading every single minute",
            teachHour: 3, teachMinute: 23,
            teachPoints: [
                "Now we read the <b>small ticks</b> between the numbers too.",
                "Each small tick is <b>1 minute</b>.",
                "This clock shows 3 hours and 23 minutes &mdash; written 3:23."
            ]
        },
        {
            id: 6, emoji: "🏆", title: "Time Master", desc: "Mixed challenge",
            minuteSet: "mixed",
            teachTitle: "Time to show what you know!",
            teachHour: 7, teachMinute: 45,
            teachPoints: [
                "This round mixes up <b>every kind</b> of time you've learned.",
                "Take your time and look carefully at both hands.",
                "Finish this and you're a true <b>Time Master</b>! 🏆"
            ]
        }
    ];

    const ENCOURAGE_CORRECT = [
        "Brilliant! 🌟", "You've got it!", "Yes! Great reading!", "Nailed it! 🎉",
        "Awesome work!", "That's exactly right!", "Super job!", "You're getting so good at this!"
    ];
    const ENCOURAGE_RETRY = [
        "Not quite — look at the minute hand again!", "Close! Have another look and try again.",
        "Almost! Check where each hand is pointing.", "Good try — give it one more look!",
        "Nearly there — you can do this!"
    ];

    // ---------- State ----------
    let progress = loadProgress();
    let session = null; // current practice session state

    function loadProgress() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) { /* ignore */ }
        return { levels: {}, totalStars: 0, seenTeach: {} };
    }
    function saveProgress() {
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

    function showScreen(id) {
        $$(".screen").forEach(s => s.classList.remove("active"));
        $("#" + id).classList.add("active");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function speak(text) {
        try {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 0.9;
            u.pitch = 1.1;
            window.speechSynthesis.speak(u);
        } catch (e) { /* ignore */ }
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

    // ---------- Home / level select ----------
    function renderHome() {
        $("#stars-total").textContent = totalStars();
        const grid = $("#level-grid");
        grid.innerHTML = "";
        LEVELS.forEach(level => {
            const unlocked = isUnlocked(level.id);
            const stars = starsFor(level.id);
            const card = document.createElement("div");
            card.className = "level-card" + (unlocked ? "" : " locked");
            card.innerHTML = `
                <div class="level-num">${unlocked ? level.emoji : "🔒"}</div>
                <h3>${level.title}</h3>
                <div class="level-desc">${level.desc}</div>
                <div class="level-stars">
                    ${[1, 2, 3].map(n => `<span class="${n <= stars ? "" : "dim"}">⭐</span>`).join("")}
                </div>`;
            if (unlocked) card.addEventListener("click", () => enterLevel(level.id));
            grid.appendChild(card);
        });
    }

    // ---------- Teach screen ----------
    function enterLevel(levelId) {
        const level = LEVELS.find(l => l.id === levelId);
        renderTeach(level);
        showScreen("screen-teach");
    }

    function renderTeach(level) {
        $("#teach-title").textContent = `${level.emoji} ${level.title}`;
        $("#teach-subtitle").textContent = level.teachTitle;
        const clockEl = $("#teach-clock");
        clockEl.innerHTML = "";
        renderClock(clockEl, level.teachHour, level.teachMinute);
        $("#teach-points").innerHTML = level.teachPoints.map(p => `<p>👉 ${p}</p>`).join("");
        $("#teach-digital").textContent = formatDigital(level.teachHour, level.teachMinute);
        $("#btn-start-practice").onclick = () => startPractice(level.id);
        $("#btn-teach-back").onclick = () => { renderHome(); showScreen("screen-home"); };
        $("#btn-teach-speak").onclick = () => speak(`This clock shows ${spokenTime(level.teachHour, level.teachMinute)}.`);
    }

    // ---------- Practice / quiz ----------
    function buildQuestionList(levelId) {
        const level = LEVELS.find(l => l.id === levelId);
        const types = shuffle([
            ...Array(QUESTIONS_PER_LEVEL - SET_QUESTIONS).fill("mcq"),
            ...Array(SET_QUESTIONS).fill("set")
        ]);
        return types.map(type => ({ type, ...generateTime(level) }));
    }

    function generateTime(level) {
        let minuteSet = level.minuteSet;
        if (minuteSet === "mixed") {
            // Time Master: sample from a random earlier level's minute set for variety
            const pool = LEVELS.slice(0, 5);
            minuteSet = pick(pool).minuteSet;
        }
        const hour = randInt(1, 12);
        const minute = pick(minuteSet);
        return { hour, minute, minuteSet };
    }

    function generateDistractors(hour, minute, minuteSet, count = 3) {
        const seen = new Set([`${hour}:${minute}`]);
        const results = [];
        let attempts = 0;
        while (results.length < count && attempts < 200) {
            attempts++;
            let h = hour, m = minute;
            const mode = randInt(0, 2);
            if (mode === 0) {
                // same hour, different minute
                m = pick(minuteSet);
            } else if (mode === 1) {
                // adjacent hour, same minute
                h = ((hour - 1 + randInt(0, 1) * 2 + 12) % 12) || 12;
                if (h === hour) h = (hour % 12) + 1;
            } else {
                // adjacent hour AND different minute (classic quarter-to/past mix-up)
                h = ((hour % 12) + 1);
                m = pick(minuteSet);
            }
            const key = `${h}:${m}`;
            if (!seen.has(key)) { seen.add(key); results.push({ hour: h, minute: m }); }
        }
        // Fallback fill (extremely unlikely to be needed)
        while (results.length < count) {
            const h = randInt(1, 12), m = pick(minuteSet);
            const key = `${h}:${m}`;
            if (!seen.has(key)) { seen.add(key); results.push({ hour: h, minute: m }); }
        }
        return results;
    }

    function startPractice(levelId) {
        session = {
            levelId,
            questions: buildQuestionList(levelId),
            index: 0,
            correctFirstTry: 0,
            missedThisQuestion: false
        };
        renderQuestion();
        showScreen("screen-practice");
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

        const clockEl = $("#quiz-clock");
        clockEl.innerHTML = "";

        if (q.type === "mcq") {
            $("#mcq-area").style.display = "";
            $("#set-area").style.display = "none";
            $("#quiz-question").textContent = "What time is it?";
            renderClock(clockEl, q.hour, q.minute);

            const distractors = generateDistractors(q.hour, q.minute, q.minuteSet);
            const options = shuffle([{ hour: q.hour, minute: q.minute }, ...distractors]);
            const answerGrid = $("#answer-grid");
            answerGrid.innerHTML = "";
            options.forEach(opt => {
                const btn = document.createElement("button");
                btn.className = "answer-btn";
                btn.textContent = formatDigital(opt.hour, opt.minute);
                btn.addEventListener("click", () => handleMcqAnswer(btn, opt, q));
                answerGrid.appendChild(btn);
            });
        } else {
            $("#mcq-area").style.display = "none";
            $("#set-area").style.display = "";
            $("#quiz-question").textContent = "Set the clock to match!";
            $("#set-target").textContent = formatDigital(q.hour, q.minute);

            // Start the draggable clock on a different hour so it isn't already "solved"
            let startHour = q.hour;
            while (startHour === q.hour) startHour = randInt(1, 12);
            const state = { hour: startHour, minute: pick(q.minuteSet) };
            renderClock(clockEl, state.hour, state.minute);
            $("#hour-display").textContent = state.hour;

            $("#hour-minus").onclick = () => { state.hour = state.hour === 1 ? 12 : state.hour - 1; $("#hour-display").textContent = state.hour; setClockHands(clockEl, state.hour, state.minute); };
            $("#hour-plus").onclick = () => { state.hour = state.hour === 12 ? 1 : state.hour + 1; $("#hour-display").textContent = state.hour; setClockHands(clockEl, state.hour, state.minute); };

            makeClockDraggable(clockEl, () => state.hour, (m) => { state.minute = m; }, q.minuteSet);

            const checkBtn = $("#btn-check-set");
            checkBtn.disabled = false;
            checkBtn.onclick = () => handleSetAnswer(state, q);
        }
    }

    function handleMcqAnswer(btn, chosen, q) {
        const correct = chosen.hour === q.hour && chosen.minute === q.minute;
        const buttons = $$("#answer-grid .answer-btn");
        if (correct) {
            buttons.forEach(b => b.disabled = true);
            btn.classList.add("correct", "bounce");
            const msg = $("#feedback-msg");
            msg.textContent = pick(ENCOURAGE_CORRECT);
            msg.classList.add("correct");
            speak(pick(ENCOURAGE_CORRECT) + ` It's ${spokenTime(q.hour, q.minute)}.`);
            if (!session.missedThisQuestion) session.correctFirstTry++;
            setTimeout(nextQuestion, 1300);
        } else {
            session.missedThisQuestion = true;
            btn.classList.add("wrong", "shake");
            btn.disabled = true;
            const msg = $("#feedback-msg");
            msg.textContent = pick(ENCOURAGE_RETRY);
            msg.classList.add("wrong");
        }
    }

    function handleSetAnswer(state, q) {
        const correct = state.hour === q.hour && state.minute === q.minute;
        const msg = $("#feedback-msg");
        if (correct) {
            msg.textContent = pick(ENCOURAGE_CORRECT);
            msg.className = "feedback-msg correct";
            speak(pick(ENCOURAGE_CORRECT) + ` That's ${spokenTime(q.hour, q.minute)}.`);
            if (!session.missedThisQuestion) session.correctFirstTry++;
            $("#btn-check-set").disabled = true;
            setTimeout(nextQuestion, 1300);
        } else {
            session.missedThisQuestion = true;
            msg.textContent = pick(ENCOURAGE_RETRY);
            msg.className = "feedback-msg wrong shake";
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

        $("#complete-title").textContent = `${level.emoji} ${level.title} complete!`;
        const finalStars = Math.max(stars, prevStars);
        $("#complete-stars").innerHTML = [1, 2, 3].map(n => `<span>${n <= finalStars ? "⭐" : "☆"}</span>`).join("");
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

        showScreen("screen-complete");
        confettiBurst(finalStars >= 3 ? 60 : 35);
    }

    // ---------- Init ----------
    document.addEventListener("DOMContentLoaded", () => {
        renderHome();
        $("#btn-home-logo").addEventListener("click", () => { renderHome(); showScreen("screen-home"); });
        showScreen("screen-home");
    });
})();
