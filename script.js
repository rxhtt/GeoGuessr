// Global State Initialization
let map;
let guessMarker = null;
let actualMarker = null;
let distanceLine = null;
const cities = [
    { "city": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777 },
    { "city": "Delhi", "state": "Delhi", "lat": 28.7041, "lon": 77.1025 },
    { "city": "Bangalore", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946 },
    { "city": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lon": 78.4867 },
    { "city": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707 },
    { "city": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lon": 88.3639 },
    { "city": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lon": 75.7873 },
    { "city": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lon": 80.9462 },
    { "city": "Bhopal", "state": "Madhya Pradesh", "lat": 23.2599, "lon": 77.4126 },
    { "city": "Ahmedabad", "state": "Gujarat", "lat": 23.0225, "lon": 72.5714 },
    { "city": "Pune", "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567 },
    { "city": "Surat", "state": "Gujarat", "lat": 21.1702, "lon": 72.8311 },
    { "city": "Kanpur", "state": "Uttar Pradesh", "lat": 26.4499, "lon": 80.3319 },
    { "city": "Indore", "state": "Madhya Pradesh", "lat": 22.7196, "lon": 75.8577 },
    { "city": "Thane", "state": "Maharashtra", "lat": 19.2183, "lon": 72.9781 }
];
let currentCity;
let round = 1;
let totalScore = 0;
let isGuessing = true;

// DOM Cache
const ui = {
    round: document.getElementById("round"),
    score: document.getElementById("score"),
    cityPrompt: document.getElementById("city-prompt"),
    submitBtn: document.getElementById("submitBtn"),
    resultDisplay: document.getElementById("result-display"),
    resultCity: document.getElementById("result-city"),
    resultDist: document.getElementById("result-dist"),
    resultScore: document.getElementById("result-score"),
    gameOverModal: document.getElementById("game-over-modal"),
    finalScore: document.getElementById("final-score"),
    restartBtn: document.getElementById("restartBtn")
};

// Initialize Leaflet Map Architecture
function initMap() {
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([22.5937, 78.9629], 5);

    // Dark-themed tiles WITHOUT LABELS for high-fidelity geoguessing
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    map.on("click", handleMapClick);
}

// Initialize Architecture immediately upon DOM loading
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    startRound();
});

function handleMapClick(e) {
    if (!isGuessing) return;

    if (guessMarker) {
        map.removeLayer(guessMarker);
    }

    guessMarker = L.marker(e.latlng, {
        draggable: false,
        icon: L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#3b82f6;width:24px;height:24px;border-radius:50%;border:4px solid white;box-shadow:0 0 10px rgba(0,0,0,0.5);'></div>",
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        })
    }).addTo(map);

    ui.submitBtn.disabled = false;
}

function startRound() {
    isGuessing = true;
    ui.submitBtn.disabled = true;
    ui.submitBtn.innerText = "SUBMIT COORDINATES";
    ui.resultDisplay.classList.add("hidden");

    currentCity = cities[Math.floor(Math.random() * cities.length)];

    ui.round.innerText = `${round} / 5`;
    ui.cityPrompt.innerText = `Find: ${currentCity.city}, ${currentCity.state}`;

    if (guessMarker) map.removeLayer(guessMarker);
    if (actualMarker) map.removeLayer(actualMarker);
    if (distanceLine) map.removeLayer(distanceLine);

    guessMarker = null;
    actualMarker = null;
    distanceLine = null;

    map.flyTo([22.5937, 78.9629], 5, { duration: 1.5 });
}

ui.submitBtn.onclick = function () {
    if (isGuessing) {
        processGuess();
    } else {
        if (round >= 5) {
            endSimulation();
        } else {
            round++;
            startRound();
        }
    }
}

function processGuess() {
    isGuessing = false;
    let guess = guessMarker.getLatLng();
    let distance = getDistance(guess.lat, guess.lng, currentCity.lat, currentCity.lon);
    let roundScore = calculateScore(distance);

    totalScore += roundScore;
    ui.score.innerText = totalScore;

    actualMarker = L.marker([currentCity.lat, currentCity.lon], {
        icon: L.divIcon({
            className: 'actual-div-icon',
            html: "<div style='background-color:#10b981;width:24px;height:24px;border-radius:50%;border:4px solid white;box-shadow:0 0 10px rgba(0,0,0,0.5);'></div>",
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        })
    }).addTo(map);

    distanceLine = L.polyline([
        [guess.lat, guess.lng],
        [currentCity.lat, currentCity.lon]
    ], {
        color: '#94a3b8',
        dashArray: '5, 10',
        weight: 2
    }).addTo(map);

    const bounds = L.latLngBounds([guess.lat, guess.lng], [currentCity.lat, currentCity.lon]);
    map.fitBounds(bounds, { padding: [100, 100], duration: 1 });

    ui.resultCity.innerText = `Actual: ${currentCity.city}, ${currentCity.state}`;
    ui.resultDist.innerText = `Distance: ${distance.toFixed(1)} km`;
    ui.resultScore.innerText = `+${roundScore} PTS`;
    ui.resultDisplay.classList.remove("hidden");

    ui.submitBtn.innerText = round >= 5 ? "VIEW FINAL RESULTS" : "NEXT ROUND";
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function calculateScore(distance) {
    if (distance > 2000) return 0;
    return Math.max(0, Math.floor(5000 * Math.exp(-distance / 500)));
}

function endSimulation() {
    ui.finalScore.innerText = totalScore;
    ui.gameOverModal.classList.remove("hidden");
}

ui.restartBtn.onclick = function () {
    round = 1;
    totalScore = 0;
    ui.score.innerText = "0";
    ui.gameOverModal.classList.add("hidden");
    startRound();
}
