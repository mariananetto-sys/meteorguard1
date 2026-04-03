// ==========================================
// METEORGUARD MAIN APP LOGIC
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------
    // State & DOM Elements
    // -----------------------------------
    let currentMap = null;
    let currentChart = null;
    let searchTimeout = null;

    const DOM = {
        overlay: document.getElementById('loadingOverlay'),
        searchInput: document.getElementById('searchInput'),
        searchResults: document.getElementById('searchResults'),
        searchBtn: document.getElementById('searchBtn'),
        locationBtn: document.getElementById('locationBtn'),
        
        // Hero
        cityName: document.getElementById('cityName'),
        countryName: document.getElementById('countryName'),
        mainIcon: document.getElementById('mainWeatherIcon'),
        currentTemp: document.getElementById('currentTemp'),
        feelsLike: document.getElementById('feelsLike'),
        weatherDesc: document.getElementById('weatherDescription'),
        humidity: document.getElementById('humidity'),
        windSpeed: document.getElementById('windSpeed'),
        
        // Risk
        riskIndicator: document.getElementById('riskIndicator'),
        riskIcon: document.getElementById('riskIconHtml'),
        riskTitle: document.getElementById('riskLevelTitle'),
        riskMessage: document.getElementById('riskMessage'),
        currentRain: document.getElementById('currentRain'),
        dailyRain: document.getElementById('dailyRain'),
        
        // Panels for animation resets
        panels: document.querySelectorAll('.panel'),
        
        // Forecast list
        forecastList: document.getElementById('dailyForecastList')
    };

    // -----------------------------------
    // Boot Initialization
    // -----------------------------------
    init();

    function init() {
        setupEventListeners();
        getUserLocation();
    }

    // -----------------------------------
    // Event Listeners
    // -----------------------------------
    function setupEventListeners() {
        // Location button
        DOM.locationBtn.addEventListener('click', () => {
            getUserLocation();
        });

        // Search Input (Debounced)
        DOM.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 3) {
                DOM.searchResults.classList.add('hidden');
                return;
            }

            searchTimeout = setTimeout(async () => {
                const results = await GeocodingService.searchCity(query);
                renderSearchResults(results);
            }, 500); // 500ms debounce
        });
        
        // Close search when click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                DOM.searchResults.classList.add('hidden');
            }
        });
    }

    // -----------------------------------
    // Geolocation Flow
    // -----------------------------------
    function getUserLocation() {
        showLoading(true);
        
        if (!navigator.geolocation) {
            console.warn('Geolocation not supported. Falling back to default.');
            loadCity(-22.9068, -43.1729, "Rio de Janeiro", "Brasil"); // Default: Rio
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Success
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                // Get city name roughly via reverse geocoding concept, but for simplicity, 
                // we'll just say "Localização Atual" and load data. 
                // Open-Meteo doesn't have a direct reverse geocode API right now, 
                // so we will label it as Localização Atual.
                loadCity(lat, lon, "Localização Atual", "Coordenadas GPS");
            },
            (error) => {
                // Denied or failed
                console.warn('Geolocation permission denied or failed. Falling back to default.', error);
                loadCity(-22.9068, -43.1729, "Rio de Janeiro", "Brasil"); // Default: Rio
            },
            { timeout: 10000 }
        );
    }

    // -----------------------------------
    // Main Data Loading
    // -----------------------------------
    async function loadCity(lat, lon, name, country) {
        showLoading(true);
        DOM.searchResults.classList.add('hidden');
        DOM.searchInput.value = '';
        
        try {
            // Re-trigger CSS animations
            resetAnimations();

            const weatherData = await WeatherService.getWeather(lat, lon);
            
            updateUI(weatherData, name, country);
            updateMap(lat, lon, weatherData.current.precipitation);
            updateChart(weatherData.daily);
            
        } catch (error) {
            console.error("Failed to load city data:", error);
            alert("Erro ao conectar com satélites ambientais. Tente novamente.");
        } finally {
            showLoading(false);
        }
    }

    // -----------------------------------
    // UI Updaters
    // -----------------------------------
    function updateUI(data, cityName, countryName) {
        const current = data.current;
        const interpretation = WeatherService.getWeatherInterpretation(current.weatherCode);

        // Header
        DOM.cityName.textContent = cityName;
        DOM.countryName.textContent = countryName;

        // Current weather
        DOM.currentTemp.textContent = `${Math.round(current.temp)}°`;
        DOM.feelsLike.textContent = `${Math.round(current.feelsLike)}°`;
        DOM.weatherDesc.textContent = interpretation.desc;
        DOM.humidity.textContent = current.humidity;
        DOM.windSpeed.textContent = current.windSpeed;

        // Icon update
        DOM.mainIcon.className = `fa-solid ${interpretation.icon} fa-4x mb-icon float-anim neon-text-blue`;

        // Rain stats
        DOM.currentRain.textContent = `${current.precipitation} mm/h`;
        const todayRain = data.daily[0].rainSum;
        DOM.dailyRain.textContent = `${todayRain} mm`;

        // AI Risk Logic
        const risk = AILogicService.analyzeRisk(current.windSpeed, current.precipitation, current.weatherCode);
        
        DOM.riskIndicator.className = `risk-indicator ${risk.level} transition-all`;
        DOM.riskIcon.className = `fa-solid ${risk.icon}`;
        DOM.riskTitle.textContent = risk.title;
        DOM.riskMessage.textContent = risk.message;

        // Forecast List
        renderForecastList(data.daily);
    }

    function renderForecastList(dailyData) {
        DOM.forecastList.innerHTML = '';
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        // Skip index 0 (today)
        for (let i = 1; i < dailyData.length; i++) {
            const dayData = dailyData[i];
            const dateObj = new Date(dayData.date);
            // Ensure local timezone bug doesn't shift day by doing simple split or UTC
            // But since Open-Meteo returns YYYY-MM-DD, a simple new Date("YYYY-MM-DDT00:00:00") is better
            const dateStr = dayData.date + 'T12:00:00'; 
            const realDate = new Date(dateStr);
            const dayName = days[realDate.getDay()];
            
            const interp = WeatherService.getWeatherInterpretation(dayData.weatherCode);

            const html = `
                <div class="forecast-item">
                    <span class="forecast-day">${dayName}</span>
                    <i class="fa-solid ${interp.icon} fa-lg ${dayData.rainProb > 50 ? 'neon-text-blue' : 'text-main'}"></i>
                    <div class="forecast-temps">
                        <span class="temp-max">${Math.round(dayData.maxTemp)}°</span>
                        <span class="temp-min">${Math.round(dayData.minTemp)}°</span>
                    </div>
                    <span class="badge ${dayData.rainProb > 50 ? 'neon-text-blue' : 'text-muted'}" style="font-size: 0.7rem; margin-top: 5px;">
                        ${dayData.rainProb}% <i class="fa-solid fa-droplet"></i>
                    </span>
                </div>
            `;
            DOM.forecastList.insertAdjacentHTML('beforeend', html);
        }
    }

    function renderSearchResults(results) {
        DOM.searchResults.innerHTML = '';
        
        if (results.length === 0) {
            DOM.searchResults.classList.add('hidden');
            return;
        }

        results.forEach(city => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerHTML = `
                <strong>${city.name}</strong> 
                <span class="text-muted" style="font-size: 0.9em;">
                    ${city.admin1 ? city.admin1 + ', ' : ''}${city.country}
                </span>
            `;
            
            div.addEventListener('click', () => {
                loadCity(city.lat, city.lon, city.name, city.country);
            });
            
            DOM.searchResults.appendChild(div);
        });

        DOM.searchResults.classList.remove('hidden');
    }

    // -----------------------------------
    // Map Engine (Leaflet / Simulated Radar)
    // -----------------------------------
    function updateMap(lat, lon, currentPrecipitation) {
        // If map exists, transition to new location
        if (currentMap) {
            currentMap.setView([lat, lon], 10);
            
            // Re-draw circle indicating rain intensity
            drawRadarSim(lat, lon, currentPrecipitation);
            return;
        }

        // Initialize Map
        currentMap = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([lat, lon], 10);

        // OpenStreetMap Dark/Standard tiles (stylized via CSS invert)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(currentMap);
        
        // Add zoom controls bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(currentMap);

        drawRadarSim(lat, lon, currentPrecipitation);
    }

    let radarCircle = null;
    function drawRadarSim(lat, lon, rainMm) {
        if (radarCircle) currentMap.removeLayer(radarCircle);

        // Simulate Radar heat bubble. If rain is 0, just show a safe zone.
        let color = '#00ff88'; // Safe green
        let radius = 10000; // 10km

        if (rainMm > 0 && rainMm <= 2) {
            color = '#00f0ff'; // Light rain blue
            radius = 15000;
        } else if (rainMm > 2 && rainMm <= 10) {
            color = '#b026ff'; // Adv rain purple
            radius = 25000;
        } else if (rainMm > 10) {
            color = '#ff3366'; // Heavy rain red
            radius = 40000;
        }

        radarCircle = L.circle([lat, lon], {
            color: color,
            fillColor: color,
            fillOpacity: 0.2,
            radius: radius
        }).addTo(currentMap);
        
        // Marker
        // currentMap.eachLayer((layer) => { if (layer instanceof L.Marker) currentMap.removeLayer(layer) });
        // L.marker([lat, lon]).addTo(currentMap);
    }

    // -----------------------------------
    // Chart Engine (Chart.js)
    // -----------------------------------
    function updateChart(dailyData) {
        const ctx = document.getElementById('forecastChart').getContext('2d');
        
        // Transform data
        const labels = dailyData.map(d => {
            const date = new Date(d.date + 'T12:00:00');
            return `${date.getDate()}/${date.getMonth()+1}`;
        });
        const maxTemps = dailyData.map(d => Math.round(d.maxTemp));
        const minTemps = dailyData.map(d => Math.round(d.minTemp));
        const rainProbs = dailyData.map(d => d.rainProb);

        if (currentChart) {
            currentChart.destroy();
        }

        // Dark theme configuration for Chart.js
        currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Máxima °C',
                        data: maxTemps,
                        borderColor: '#ff3366',
                        backgroundColor: 'rgba(255, 51, 102, 0.1)',
                        tension: 0.4,
                        borderWidth: 3,
                        pointBackgroundColor: '#0a0e17',
                        pointBorderColor: '#ff3366',
                        pointRadius: 4,
                        fill: true
                    },
                    {
                        label: 'Mínima °C',
                        data: minTemps,
                        borderColor: '#00f0ff',
                        backgroundColor: 'rgba(0, 240, 255, 0.0)',
                        tension: 0.4,
                        borderWidth: 2,
                        pointBackgroundColor: '#0a0e17',
                        pointBorderColor: '#00f0ff',
                        pointRadius: 3,
                        borderDash: [5, 5]
                    },
                    {
                        type: 'bar',
                        label: 'Chuva (%)',
                        data: rainProbs,
                        backgroundColor: 'rgba(176, 38, 255, 0.3)',
                        borderRadius: 4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        labels: { color: '#94a3b8', font: { family: "'Outfit', sans-serif" } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10, 14, 23, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: true,
                        boxPadding: 4
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                        ticks: { color: '#94a3b8', font: { family: "'Outfit', sans-serif" } }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                        ticks: { color: '#94a3b8', font: { family: "'Outfit', sans-serif" } }
                    },
                    y1: {
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#b026ff', callback: function(value) { return value + '%' } }
                    }
                }
            }
        });
    }

    // -----------------------------------
    // Utilities
    // -----------------------------------
    function showLoading(show) {
        if (show) {
            DOM.overlay.classList.remove('hidden');
        } else {
            DOM.overlay.classList.add('hidden');
        }
    }

    function resetAnimations() {
        DOM.panels.forEach(p => {
            p.style.animation = 'none';
            p.offsetHeight; // trigger reflow
            p.style.animation = null; 
        });
    }
});
