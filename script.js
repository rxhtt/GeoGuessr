// GeoGuess India Premium - Intelligence Simulation System
let map = null;
let guessMarker = null;
let actualMarker = null;
let distanceLine = null;
let currentCity;
let round = 1;
let score = 0;
let streak = 0;
let timer = 20;
let timerInterval;
const MAX_ROUNDS = 5;

// Intelligence Augmented Database
const database = [
    // Tier 1 (Easy)
    { city: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777, tier: 1, fact: "Home to the Gateway of India and the most expensive private residence, Antilia." },
    { city: "Delhi", state: "Delhi", lat: 28.7041, lng: 77.1025, tier: 1, fact: "Houses the world's tallest brick minaret, the Qutub Minar." },
    { city: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946, tier: 1, fact: "Known as the Garden City and Silicon Valley of India." },
    { city: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867, tier: 1, fact: "Home to the world's largest film studio complex, Ramoji Film City." },
    { city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, tier: 1, fact: "The Marina Beach is the second longest natural urban beach in the world." },
    { city: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639, tier: 1, fact: "Home to India's first underground metro railway." },

    // Tier 2 (Medium)
    { city: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873, tier: 2, fact: "The Pink City was India's first planned city, founded in 1727." },
    { city: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714, tier: 2, fact: "India's first UNESCO World Heritage City." },
    { city: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, tier: 2, fact: "The 'Oxford of the East' due to its educational significance." },
    { city: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577, tier: 2, fact: "Consistently ranked as India's cleanest city." },
    { city: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126, tier: 2, fact: "Known as the City of Lakes for its various natural and artificial lakes." },
    { city: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558, tier: 2, fact: "Often called the Manchester of South India." },

    // Tier 3 / Specific (Hard)
    { city: "Guwahati", state: "Assam", lat: 26.1158, lng: 91.7086, tier: 3, fact: "The Gateway to Northeast India and home to Kamakhya Temple." },
    { city: "Dehradun", state: "Uttarakhand", lat: 30.3165, lng: 78.0322, tier: 3, fact: "Capital of Uttarakhand, nestled at the foothills of the Himalayas." },
    { city: "Shimla", state: "Himachal Pradesh", lat: 31.1048, lng: 77.1734, tier: 3, fact: "The former summer capital of British India." },
    { city: "Raipur", state: "Chhattisgarh", lat: 21.2514, lng: 81.6296, tier: 3, fact: "The capital of Chhattisgarh and a massive industrial hub." },
    { city: "Bhubaneswar", state: "Odisha", lat: 20.2961, lng: 85.8245, tier: 3, fact: "Famous as the Temple City of India." }
];

let sessionPool = [];

const ui = {
    screenDifficulty: document.getElementById("difficulty-screen"),
    labelToggle: document.getElementById("labelToggle"),
    round: document.getElementById("round"),
    score: document.getElementById("score"),
    timer: document.getElementById("timer"),
    cityPrompt: document.getElementById("city-prompt"),
    hintPanel: document.getElementById("hint-panel"),
    hintText: document.getElementById("hint-text"),
    submitBtn: document.getElementById("submitBtn"),
    nextBtn: document.getElementById("nextBtn"),
    resultPanel: document.getElementById("result-panel"),
    resultCity: document.getElementById("result-city"),
    resultDist: document.getElementById("result-dist"),
    pFact: document.getElementById("panel-fact-1"),
    gameOverModal: document.getElementById("game-over-modal")
};

function initMap() {
    if (map) map.remove();

    // Use Colored Map (Voyager)
    const showLabels = !ui.labelToggle.checked;
    const tileUrl = showLabels
        ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";

    map = L.map('map', { zoomControl: false, attributionControl: false }).setView([22.5, 78], 5);

    // Core Tile Layer
    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

    map.on("click", (e) => {
        if (actualMarker) return;
        if (guessMarker) map.removeLayer(guessMarker);
        guessMarker = L.marker(e.latlng, {
            icon: L.divIcon({
                className: 'guess-marker',
                html: `<div style="background:#3b82f6; width:20px; height:20px; border-radius:50%; border:3px solid #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.3)"></div>`,
                iconSize: [20, 20], iconAnchor: [10, 10]
            })
        }).addTo(map);
        ui.submitBtn.disabled = false;
        ui.resultPanel.classList.remove("hidden");
    });

    [100, 500, 1200].forEach(ms => setTimeout(() => map.invalidateSize(), ms));
}

function startGame(diff) {
    ui.screenDifficulty.classList.add("hidden");

    // Challenge Layer: Select session cities
    if (diff === 'easy') sessionPool = database.filter(c => c.tier === 1);
    else if (diff === 'medium') sessionPool = database.filter(c => c.tier <= 2);
    else sessionPool = [...database];

    sessionPool.sort(() => Math.random() - 0.5);
    round = 1; score = 0;
    initMap();
    startRound();
}

function startRound() {
    [guessMarker, actualMarker, distanceLine].forEach(l => l && map.removeLayer(l));
    guessMarker = actualMarker = distanceLine = null;

    ui.resultPanel.classList.add("hidden");
    ui.submitBtn.classList.remove("hidden");
    ui.nextBtn.classList.add("hidden");
    ui.submitBtn.disabled = true;
    ui.round.innerText = `${round}/${MAX_ROUNDS}`;

    currentCity = sessionPool[Math.floor(Math.random() * sessionPool.length)];
    ui.cityPrompt.innerText = currentCity.city.toUpperCase();

    // Hint System Logic
    ui.hintPanel.classList.add("hidden");
    ui.hintText.innerText = "Waiting for intelligence...";

    timer = 20;
    ui.timer.innerText = `${timer}s`;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer--; ui.timer.innerText = `${timer}s`;

        // Dynamic Hint Reveal: After 10 seconds
        if (timer === 10) showHint();
        if (timer <= 0) { clearInterval(timerInterval); processGuess(); }
    }, 1000);
}

function showHint() {
    ui.hintText.innerText = `Intelligence confirms target is in: ${currentCity.state}`;
    ui.hintPanel.classList.remove("hidden");
}

function processGuess() {
    clearInterval(timerInterval);
    const guess = guessMarker ? guessMarker.getLatLng() : null;
    const actual = L.latLng(currentCity.lat, currentCity.lng);

    let dist = guess ? getDistance(guess.lat, guess.lng, actual.lat, actual.lng) : 5000;
    let roundScore = Math.floor(Math.max(0, 5000 * Math.exp(-dist / 800)));

    score += roundScore;
    revealAnswer(guess, actual, dist, roundScore);
}

function revealAnswer(guess, actual, dist, roundScore) {
    actualMarker = L.marker(actual, {
        icon: L.divIcon({
            className: 'target-marker',
            html: `<div style="background:#1fc98e; width:24px; height:24px; border-radius:50%; border:3px solid #fff; box-shadow: 0 0 20px #1fc98e"></div>`,
            iconSize: [24, 24], iconAnchor: [12, 12]
        })
    }).addTo(map);

    if (guess) {
        // Vector Vector Intelligence: Guess Line
        distanceLine = L.polyline([[guess.lat, guess.lng], [guess.lat, guess.lng]], {
            color: '#fff', weight: 4, dashArray: '10, 10', opacity: 0.8
        }).addTo(map);

        let p = 0;
        const anim = setInterval(() => {
            p += 0.05;
            if (p >= 1) {
                clearInterval(anim);
                distanceLine.setLatLngs([[guess.lat, guess.lng], [actual.lat, actual.lng]]);
            } else {
                const nLat = guess.lat + (actual.lat - guess.lat) * p;
                const nLng = guess.lng + (actual.lng - guess.lng) * p;
                distanceLine.setLatLngs([[guess.lat, guess.lng], [nLat, nLng]]);
            }
        }, 20);
        map.fitBounds(L.latLngBounds([guess, actual]), { padding: [100, 100] });
    } else {
        map.flyTo(actual, 7, { duration: 1.5 });
    }

    ui.resultCity.innerText = currentCity.city;
    ui.resultDist.innerText = `${Math.round(dist)}km AWAY (+${roundScore})`;
    ui.pFact.innerText = currentCity.fact;
    ui.score.innerText = score;

    ui.submitBtn.classList.add("hidden");
    ui.nextBtn.classList.remove("hidden");
}

function getDistance(la1, lo1, la2, lo2) {
    const R = 6371;
    const dLa = (la2 - la1) * Math.PI / 180;
    const dLo = (lo2 - lo1) * Math.PI / 180;
    const a = Math.sin(dLa / 2) ** 2 + Math.cos(la1 * Math.PI / 180) * Math.cos(la2 * Math.PI / 180) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

ui.submitBtn.onclick = processGuess;
ui.nextBtn.onclick = () => {
    round++;
    if (round > MAX_ROUNDS) showGameOver(); else startRound();
};

function showGameOver() {
    document.getElementById("final-score").innerText = score.toLocaleString();
    document.getElementById("final-accuracy").innerText = `${Math.round((score / 25000) * 100)}%`;
    ui.gameOverModal.classList.remove("hidden");
}

function resetToMenu() { location.reload(); }
