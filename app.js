// ==========================================
// METEORGUARD MAIN APP LOGIC
// v2.0 — Com Rede Neural TensorFlow.js
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------
    // State & DOM Elements
    // -----------------------------------
    let currentMap = null;
    let currentChart = null;
    let searchTimeout = null;
    let lastWeatherData = null; // Armazena para re-análise da IA

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
        pressure: document.getElementById('pressure'),
        uvIndex: document.getElementById('uvIndex'),
        pm25: document.getElementById('pm25'),
        visibilityVal: document.getElementById('visibilityVal'),
        
        // AI
        aiBadge: document.getElementById('aiBadge'),
        aiTrainingBox: document.getElementById('aiTrainingBox'),
        aiProgressFill: document.getElementById('aiProgressFill'),
        aiTrainingStatus: document.getElementById('aiTrainingStatus'),
        riskIndicator: document.getElementById('riskIndicator'),
        riskIcon: document.getElementById('riskIconHtml'),
        riskTitle: document.getElementById('riskLevelTitle'),
        riskMessage: document.getElementById('riskMessage'),
        aiAnalysisSection: document.getElementById('aiAnalysisSection'),
        aiAlerts: document.getElementById('aiAlerts'),
        aiSuggestions: document.getElementById('aiSuggestions'),
        aiDetails: document.getElementById('aiDetails'),
        aiTimestamp: document.getElementById('aiTimestamp'),
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

    async function init() {
        setupEventListeners();
        
        // Boot AI Neural Network in parallel with location detection
        bootAI();
        getUserLocation();
    }

    // -----------------------------------
    // AI Neural Network Boot
    // -----------------------------------
    async function bootAI() {
        console.log('[METEORGUARD] Inicializando motor de IA...');
        
        // Build the model architecture
        meteorGuardAI.buildModel();
        
        // Train with progress callback
        await meteorGuardAI.train((epoch, total, logs) => {
            const percent = Math.round((epoch / total) * 100);
            DOM.aiProgressFill.style.width = `${percent}%`;
            DOM.aiTrainingStatus.textContent = `Época ${epoch}/${total} — Precisão: ${(logs.acc * 100).toFixed(1)}% | Perda: ${logs.loss.toFixed(4)}`;
        });

        // Training complete! Update UI
        DOM.aiTrainingBox.style.display = 'none';
        DOM.aiBadge.textContent = 'ONLINE';
        DOM.aiBadge.classList.add('active');

        console.log('[METEORGUARD] ✅ IA Neural operacional!');

        // If weather data was already loaded, re-run AI analysis
        if (lastWeatherData) {
            runAIAnalysis(lastWeatherData);
        }
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
            }, 500);
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
            loadCity(-22.9068, -43.1729, "Rio de Janeiro", "Brasil");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                loadCity(lat, lon, "Localização Atual", "Coordenadas GPS");
            },
            (error) => {
                console.warn('Geolocation permission denied or failed.', error);
                loadCity(-22.9068, -43.1729, "Rio de Janeiro", "Brasil");
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
            resetAnimations();
            const weatherData = await WeatherService.getWeather(lat, lon);
            
            // Store for AI re-analysis
            lastWeatherData = weatherData;
            
            updateUI(weatherData, name, country);
            updateMap(lat, lon, weatherData.current.precipitation);
            updateChart(weatherData.daily);
            
            // Run AI analysis
            runAIAnalysis(weatherData);
            
        } catch (error) {
            console.error("Failed to load city data:", error);
            alert("Erro ao conectar com satélites ambientais. Tente novamente.");
        } finally {
            showLoading(false);
        }
    }

    // -----------------------------------
    // AI Analysis Engine
    // -----------------------------------
    async function runAIAnalysis(weatherData) {
        const current = weatherData.current;
        const interpretation = WeatherService.getWeatherInterpretation(current.weatherCode);

        // Build input for the neural network
        const aiInput = {
            temperature: current.temp,
            humidity: current.humidity,
            windSpeed: current.windSpeed,
            windGusts: current.windGusts || current.windSpeed * 1.3,
            precipitation: current.precipitation,
            pressureMsl: current.pressureMsl || 1013,
            cloudCover: current.cloudCover || 0,
            visibility: current.visibility || 20000,
            uvIndex: current.uvIndex || 3,
            pm25: current.pm25 || 10,
            dangerContext: interpretation.dangerContext,
            weatherCode: current.weatherCode
        };

        // Get neural network risk prediction
        const prediction = meteorGuardAI.predict(aiInput);

        // Update Risk Indicator
        DOM.riskIndicator.className = `risk-indicator ${prediction.level} transition-all`;
        DOM.riskIcon.className = `fa-solid ${prediction.icon}`;
        DOM.riskTitle.textContent = prediction.title;

        // Call REAL Gemini AI for the text
        DOM.riskMessage.textContent = '';
        DOM.riskMessage.classList.add('typing');
        
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...aiInput,
                    feelsLike: current.feelsLike,
                    weatherDescription: interpretation.desc,
                    riskPercentage: prediction.percentage
                })
            });

            if (response.ok) {
                const data = await response.json();
                typewriterEffect(DOM.riskMessage, data.analysis, 20);
            } else {
                throw new Error('API indisponível');
            }
        } catch (err) {
            // Fallback: usar gerador local
            console.warn('[METEORGUARD AI] Gemini indisponível, usando análise local:', err);
            const localMessage = generateAIMessage(prediction, aiInput);
            typewriterEffect(DOM.riskMessage, localMessage, 25);
        }

        // Render detailed analysis (from neural network)
        renderAIAnalysis(prediction.analysis);

        // Timestamp
        DOM.aiTimestamp.textContent = `Última análise neural: ${prediction.timestamp}`;
    }

    function renderAIAnalysis(analysis) {
        DOM.aiAnalysisSection.classList.remove('hidden');
        
        // Alerts (red)
        DOM.aiAlerts.innerHTML = '';
        analysis.alerts.forEach(alert => {
            DOM.aiAlerts.innerHTML += `<div class="ai-alert-item">${alert}</div>`;
        });

        // Suggestions (blue)
        DOM.aiSuggestions.innerHTML = '';
        analysis.suggestions.forEach(sug => {
            DOM.aiSuggestions.innerHTML += `<div class="ai-suggestion-item">${sug}</div>`;
        });

        // Details (gray)
        DOM.aiDetails.innerHTML = '';
        analysis.details.forEach(det => {
            DOM.aiDetails.innerHTML += `<div class="ai-detail-item">${det}</div>`;
        });
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

        // Extended environmental data
        DOM.pressure.textContent = current.pressureMsl ? current.pressureMsl.toFixed(0) : '--';
        DOM.uvIndex.textContent = current.uvIndex ? current.uvIndex.toFixed(1) : '--';
        DOM.pm25.textContent = current.pm25 ? current.pm25.toFixed(0) : '--';
        DOM.visibilityVal.textContent = current.visibility ? (current.visibility / 1000).toFixed(1) : '--';

        // Icon update
        DOM.mainIcon.className = `fa-solid ${interpretation.icon} fa-4x mb-icon float-anim neon-text-blue`;

        // Rain stats
        DOM.currentRain.textContent = `${current.precipitation} mm/h`;
        const todayRain = data.daily[0].rainSum;
        DOM.dailyRain.textContent = `${todayRain} mm`;

        // Forecast List
        renderForecastList(data.daily);
    }

    function renderForecastList(dailyData) {
        DOM.forecastList.innerHTML = '';
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        for (let i = 1; i < dailyData.length; i++) {
            const dayData = dailyData[i];
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
        if (currentMap) {
            currentMap.setView([lat, lon], 10);
            drawRadarSim(lat, lon, currentPrecipitation);
            return;
        }

        currentMap = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([lat, lon], 10);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(currentMap);
        
        L.control.zoom({ position: 'bottomright' }).addTo(currentMap);
        drawRadarSim(lat, lon, currentPrecipitation);
    }

    let radarCircle = null;
    function drawRadarSim(lat, lon, rainMm) {
        if (radarCircle) currentMap.removeLayer(radarCircle);

        let color = '#00ff88';
        let radius = 10000;

        if (rainMm > 0 && rainMm <= 2) {
            color = '#00f0ff';
            radius = 15000;
        } else if (rainMm > 2 && rainMm <= 10) {
            color = '#b026ff';
            radius = 25000;
        } else if (rainMm > 10) {
            color = '#ff3366';
            radius = 40000;
        }

        radarCircle = L.circle([lat, lon], {
            color: color,
            fillColor: color,
            fillOpacity: 0.2,
            radius: radius
        }).addTo(currentMap);
    }

    // -----------------------------------
    // Chart Engine (Chart.js)
    // -----------------------------------
    function updateChart(dailyData) {
        const ctx = document.getElementById('forecastChart').getContext('2d');
        
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
            p.offsetHeight;
            p.style.animation = null; 
        });
    }

    // -----------------------------------
    // Typewriter Effect
    // -----------------------------------
    let typewriterTimer = null;
    function typewriterEffect(element, text, speed = 30) {
        // Clear previous animation
        if (typewriterTimer) clearInterval(typewriterTimer);
        element.textContent = '';
        element.classList.add('typing');

        let index = 0;
        typewriterTimer = setInterval(() => {
            element.textContent += text.charAt(index);
            index++;
            if (index >= text.length) {
                clearInterval(typewriterTimer);
                typewriterTimer = null;
                // Remove cursor after a short delay
                setTimeout(() => element.classList.remove('typing'), 1500);
            }
        }, speed);
    }

    // -----------------------------------
    // AI Message Generator
    // -----------------------------------
    function generateAIMessage(prediction, data) {
        const messages = {
            safe: [
                `Analisei ${Math.round(data.humidity)}% de umidade, ventos de ${data.windSpeed?.toFixed(1)} km/h e pressão de ${data.pressureMsl?.toFixed(0)} hPa. Tudo dentro dos padrões seguros. Probabilidade de risco: ${prediction.percentage}%.`,
                `Varredura concluída. Atmosfera estável com visibilidade de ${(data.visibility / 1000).toFixed(1)} km. Nenhuma anomalia detectada pelo radar neural. Risco: ${prediction.percentage}%.`,
                `Processamento finalizado. Condições atmosféricas dentro da normalidade. Índice UV em ${data.uvIndex?.toFixed(1)} e qualidade do ar em PM2.5 ${data.pm25?.toFixed(0)} µg/m³. Probabilidade de risco: ${prediction.percentage}%.`
            ],
            'low-warning': [
                `Detectei sinais de instabilidade leve. Umidade em ${Math.round(data.humidity)}% com precipitação de ${data.precipitation?.toFixed(1)} mm/h. Recomendo levar guarda-chuva por precaução. Risco calculado: ${prediction.percentage}%.`,
                `Meus sensores indicam possibilidade de garoa. Pressão em ${data.pressureMsl?.toFixed(0)} hPa com tendência de queda. Fique atento às próximas horas. Risco: ${prediction.percentage}%.`
            ],
            warning: [
                `Atenção. Identifiquei condições adversas: ventos de ${data.windSpeed?.toFixed(1)} km/h com rajadas de até ${data.windGusts?.toFixed(1)} km/h e precipitação de ${data.precipitation?.toFixed(1)} mm/h. Evite áreas de risco. Probabilidade: ${prediction.percentage}%.`,
                `Alerta processado. A pressão caiu para ${data.pressureMsl?.toFixed(0)} hPa e a cobertura de nuvens está em ${data.cloudCover}%. Chuva moderada a forte esperada. Risco: ${prediction.percentage}%.`
            ],
            danger: [
                `ALERTA CRÍTICO. Minha rede neural detectou condições severas: ventos de ${data.windSpeed?.toFixed(1)} km/h, precipitação intensa de ${data.precipitation?.toFixed(1)} mm/h e pressão em ${data.pressureMsl?.toFixed(0)} hPa. Permaneça em local seguro. Risco: ${prediction.percentage}%.`,
            ],
            critical: [
                `EMERGÊNCIA. Todos os 11 indicadores ambientais apontam para risco extremo. Ventos destrutivos de ${data.windSpeed?.toFixed(1)} km/h, chuva torrencial e visibilidade quase zero (${(data.visibility / 1000).toFixed(1)} km). NÃO SAIA DE CASA. Risco calculado: ${prediction.percentage}%.`,
            ]
        };

        const pool = messages[prediction.level] || messages.safe;
        return pool[Math.floor(Math.random() * pool.length)];
    }
});
