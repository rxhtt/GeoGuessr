// GeoGuess India Premium - Intelligence Augmentation Architecture
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
const cities = [
    { city: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777, fact: "Home to the Gateway of India and the most expensive private residence, Antilia." },
    { city: "Delhi", state: "Delhi", lat: 28.7041, lng: 77.1025, fact: "Houses the world's tallest brick minaret, the Qutub Minar." },
    { city: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946, fact: "Known as the Garden City and Silicon Valley of India." },
    { city: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867, fact: "Home to the world's largest film studio complex, Ramoji Film City." },
    { city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, fact: "Marina Beach is the second longest natural urban beach in the world." },
    { city: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639, fact: "Home to India's first underground metro railway." },
    { city: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873, fact: "Known as the Pink City, it was India's first planned city." },
    { city: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, fact: "Renowned for its 'Chikan' embroidery and the Bara Imambara's architecture." },
    { city: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714, fact: "India's first UNESCO World Heritage City." },
    { city: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, fact: "Known as the 'Oxford of the East' for its educational institutions." }
];

const ui = {
    round: document.getElementById("round"),
    score: document.getElementById("score"),
    timer: document.getElementById("timer"),
    cityPrompt: document.getElementById("city-prompt"),
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

    // Core Geographic Engine
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([22.5937, 78.9629], 5);

    // Premium Dark Tile layer with Tile Error Recovery
    const mainLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19
    }).addTo(map);

    mainLayer.on('tileerror', function () {
        console.warn('Premium tiles failed. Deploying standard fallbacks.');
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    });

    map.on("click", (e) => {
        if (actualMarker) return; // Prevent clicking after submit

        if (guessMarker) map.removeLayer(guessMarker);
        guessMarker = L.marker(e.latlng, {
            icon: L.divIcon({
                className: 'guess-icon',
                html: `<div style="background:#3b82f6; width:20px; height:20px; border-radius:50%; border:3px solid #fff; box-shadow: 0 0 15px rgba(59,130,246,0.8)"></div>`,
                iconSize: [20, 20], iconAnchor: [10, 10]
            })
        }).addTo(map);
        ui.submitBtn.disabled = false;
        ui.resultPanel.classList.remove("hidden"); // Floating guess control
    });

    // Multi-Stage Synchronization Protocol
    [100, 500, 1500].forEach(ms => setTimeout(() => map.invalidateSize(), ms));
}

function startRound() {
    [guessMarker, actualMarker, distanceLine].forEach(l => l && map.removeLayer(l));
    guessMarker = actualMarker = distanceLine = null;

    ui.resultPanel.classList.add("hidden");
    ui.submitBtn.classList.remove("hidden");
    ui.nextBtn.classList.add("hidden");
    ui.submitBtn.disabled = true;
    ui.round.innerText = `${round}/${MAX_ROUNDS}`;

    currentCity = cities[Math.floor(Math.random() * cities.length)];
    ui.cityPrompt.innerText = `SEARCH: ${currentCity.city.toUpperCase()}`;

    timer = 20;
    ui.timer.innerText = `${timer}s`;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer--; ui.timer.innerText = `${timer}s`;
        if (timer <= 0) { clearInterval(timerInterval); processGuess(); }
    }, 1000);
}

function processGuess() {
    clearInterval(timerInterval);
    const guess = guessMarker ? guessMarker.getLatLng() : null;
    const actual = L.latLng(currentCity.lat, currentCity.lng); // lng fix

    let dist = guess ? getDistance(guess.lat, guess.lng, actual.lat, actual.lng) : 5000;
    let roundScore = Math.floor(Math.max(0, 5000 * Math.exp(-dist / 800)));

    score += roundScore;
    revealAnswer(guess, actual, dist, roundScore);
}

function revealAnswer(guess, actual, dist, roundScore) {
    actualMarker = L.marker(actual, {
        icon: L.divIcon({
            className: 'actual-icon',
            html: `<div style="background:#1fc98e; width:24px; height:24px; border-radius:50%; border:3px solid #fff; box-shadow: 0 0 20px #1fc98e;"></div>`,
            iconSize: [24, 24], iconAnchor: [12, 12]
        })
    }).addTo(map);

    if (guess) {
        // Vector Intelligence: Animated Guess Line
        distanceLine = L.polyline([[guess.lat, guess.lng], [guess.lat, guess.lng]], {
            color: '#fff', weight: 3, dashArray: '8, 12', opacity: 0.6
        }).addTo(map);

        let progress = 0;
        const animate = setInterval(() => {
            progress += 0.05;
            if (progress >= 1) {
                clearInterval(animate);
                distanceLine.setLatLngs([[guess.lat, guess.lng], [actual.lat, actual.lng]]);
            } else {
                const nLat = guess.lat + (actual.lat - guess.lat) * progress;
                const nLng = guess.lng + (actual.lng - guess.lng) * progress;
                distanceLine.setLatLngs([[guess.lat, guess.lng], [nLat, nLng]]);
            }
        }, 16);

        map.fitBounds(L.latLngBounds([guess, actual]), { padding: [100, 100], duration: 1.5 });
    } else {
        map.flyTo(actual, 7, { duration: 1.5 });
    }

    // Dynamic Fact Reveal
    ui.resultCity.innerText = currentCity.city;
    ui.resultDist.innerText = `${Math.round(dist)}km AWAY (+${roundScore})`;
    ui.pFact.innerText = currentCity.fact;
    ui.score.innerText = score;

    ui.submitBtn.classList.add("hidden");
    ui.nextBtn.classList.remove("hidden");
}

function getDistance(la1, lo1, la2, lo2) {
    const R = 6371; // km
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

// Global Initialization
window.onload = () => {
    initMap();
    startRound();
};
