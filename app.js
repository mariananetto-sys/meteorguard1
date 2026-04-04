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
        precipitationVal: document.getElementById('precipitationVal'),
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
        aiRiskFactors: document.getElementById('aiRiskFactors'),
        aiFactorsList: document.getElementById('aiFactorsList'),
        aiTrustBadge: document.getElementById('aiTrustBadge'),
        aiGeoBadge: document.getElementById('aiGeoBadge'),
        aiTimestamp: document.getElementById('aiTimestamp'),
        currentRain: document.getElementById('currentRain'),
        dailyRain: document.getElementById('dailyRain'),
        
        // Hourly
        hourlyScroll: document.getElementById('hourlyScroll'),
        
        // Alerts Bar
        weatherAlertsBar: document.getElementById('weatherAlertsBar'),
        alertsList: document.getElementById('alertsList'),
        
        // Favorites
        favoritesBtn: document.getElementById('favoritesBtn'),
        favoritesDropdown: document.getElementById('favoritesDropdown'),
        favoritesList: document.getElementById('favoritesList'),
        favCityBtn: document.getElementById('favCityBtn'),
        
        // Extreme Alert
        extremeOverlay: document.getElementById('extremeAlertOverlay'),
        extremeTitle: document.getElementById('extremeAlertTitle'),
        extremeMsg: document.getElementById('extremeAlertMsg'),
        extremeCloseBtn: document.getElementById('extremeAlertCloseBtn'),
        extremeCloseText: document.getElementById('extremeAlertCloseText'),
        
        // Panels for animation resets
        panels: document.querySelectorAll('.panel'),
        
        // Forecast list
        forecastList: document.getElementById('dailyForecastList'),

        // MeteorChat (v5.2)
        chatTrigger: document.getElementById('meteorChatTrigger'),
        chatWindow: document.getElementById('meteorChatWindow'),
        chatMessages: document.getElementById('chatMessages'),
        chatInput: document.getElementById('chatInput'),
        sendChat: document.getElementById('sendChat'),
        closeChat: document.getElementById('closeChat')
    };

    // Current city state for favorites
    let currentCityInfo = { lat: 0, lon: 0, name: '', country: '' };
    let lastDailyData = null; // Store for modal re-use
    let isAIBooting = false;

    // Modal DOM
    const modalDOM = {
        overlay: document.getElementById('dayModal'),
        close: document.getElementById('dayModalClose'),
        icon: document.getElementById('dayModalIcon'),
        title: document.getElementById('dayModalTitle'),
        desc: document.getElementById('dayModalDesc'),
        max: document.getElementById('dayModalMax'),
        min: document.getElementById('dayModalMin'),
        rain: document.getElementById('dayModalRain'),
        uv: document.getElementById('dayModalUV'),
        analysis: document.getElementById('dayModalAnalysis')
    };

    // -----------------------------------
    // Boot Initialization
    // -----------------------------------
    init();

    async function init() {
        setupEventListeners();
        setupModalListeners();
        setupLanguageSelector();
        applyLanguage();
        bootAI();
        getUserLocation();
        setupChatListeners();
    }

    // -----------------------------------
    // AI Neural Network Boot
    // -----------------------------------
    async function bootAI() {
        isAIBooting = true;
        console.log('[METEORGUARD] Initializing AI Risk Engine...');
        
        // Build the model architecture
        meteorGuardAI.buildModel();
        
        // Train with progress callback
        await meteorGuardAI.train((epoch, total, logs) => {
            const percent = Math.round((epoch / total) * 100);
            DOM.aiProgressFill.style.width = `${percent}%`;
            DOM.aiTrainingStatus.textContent = typeof i18n.t('aiEpoch') === 'function' 
                ? i18n.t('aiEpoch')(epoch, total)
                : `Época ${epoch}/${total}`;
        });

        // Training complete! Update UI
        isAIBooting = false;
        DOM.aiTrainingBox.style.display = 'none';
        DOM.aiBadge.textContent = i18n.t('aiOnline') || 'PRONTO!';
        DOM.aiBadge.classList.add('active');

        console.log('[METEORGUARD] ✅ AI Neural Model Operational!');

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
        
        // Close search/favorites/lang when click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                DOM.searchResults.classList.add('hidden');
            }
            if (!e.target.closest('.favorites-wrapper')) {
                DOM.favoritesDropdown.classList.add('hidden');
            }
            if (!e.target.closest('.lang-wrapper')) {
                document.getElementById('langDropdown')?.classList.add('hidden');
            }
        });

        // Favorites dropdown toggle
        DOM.favoritesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            DOM.favoritesDropdown.classList.toggle('hidden');
            renderFavoritesList();
        });

        // Favorite city star button
        DOM.favCityBtn.addEventListener('click', () => {
            toggleFavorite();
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
                loadCity(lat, lon, i18n.t('myLocation'), i18n.t('geoCoords'));
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
    let autoRefreshTimer = null;

    async function loadCity(lat, lon, name, country) {
        showLoading(true);
        DOM.searchResults.classList.add('hidden');
        DOM.searchInput.value = '';
        
        // Save city info for favorites
        currentCityInfo = { lat, lon, name, country };
        
        try {
            resetAnimations();
            const weatherData = await WeatherService.getWeather(lat, lon);
            
            // Store for AI re-analysis
            lastWeatherData = weatherData;
            
            updateUI(weatherData, name, country);
            updateMap(lat, lon, weatherData.current.precipitation);
            updateChart(weatherData.daily);
            renderHourlyForecast(weatherData.hourly);
            checkWeatherAlerts(weatherData.current);
            updateFavStar();
            
            // Run AI analysis
            runAIAnalysis(weatherData);

            // Auto-refresh silencioso a cada 4 minutos
            if (autoRefreshTimer) clearInterval(autoRefreshTimer);
            autoRefreshTimer = setInterval(async () => {
                try {
                    console.log('[METEORGUARD] 🔄 Auto-refresh: atualizando dados...');
                    const freshData = await WeatherService.getWeather(lat, lon);
                    lastWeatherData = freshData;
                    updateUI(freshData, name, country);
                    renderHourlyForecast(freshData.hourly);
                    checkWeatherAlerts(freshData.current);
                    runAIAnalysis(freshData);
                    console.log('[METEORGUARD] ✅ Dados atualizados com sucesso.');
                } catch (e) {
                    console.warn('[METEORGUARD] Auto-refresh falhou:', e);
                }
            }, 4 * 60 * 1000); // 4 minutos
            
        } catch (error) {
            console.error("Failed to load city data:", error);
            alert(i18n.t('apiError'));
        } finally {
            showLoading(false);
        }
    }

    // -----------------------------------
    // AI Analysis Engine
    // -----------------------------------
    async function runAIAnalysis(weatherData) {
        if (isAIBooting) {
            console.log('[METEORGUARD] Analysis pending: AI still training...');
            return;
        }

        // Mostrar spinner enquanto a IA processa
        DOM.riskMessage.innerHTML = '<div class="ai-spinner"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:1.4rem; color:var(--neon-blue); opacity:0.7;"></i></div>';

        const current = weatherData.current;
        const interpretation = WeatherService.getWeatherInterpretation(current.weatherCode);

        // Build input for the neural network (Sanitized v5.1)
        const aiInput = {
            temperature: current.temp ?? 20,
            humidity: current.humidity ?? 50,
            windSpeed: current.windSpeed ?? 0,
            windGusts: current.windGusts || (current.windSpeed * 1.3) || 0,
            precipitation: current.precipitation ?? 0,
            pressureMsl: current.pressureMsl ?? 1013,
            cloudCover: current.cloudCover ?? 0,
            visibility: current.visibility ?? 20000,
            uvIndex: current.uvIndex ?? 0,
            pm25: current.pm25 ?? 10,
            dangerContext: interpretation.dangerContext ?? 1,
            weatherCode: current.weatherCode ?? 0
        };

        // v5.0 MAX: Intelligent Autonomous Pipeline
        const lat = currentCityInfo.lat || -22.9068;
        const lon = currentCityInfo.lon || -43.1729;
        const alt = currentCityInfo.altitude || 500;
        
        const gradP = (Math.random() - 0.5) * 5; 
        const gradT = (Math.random() - 0.5) * 4; 
        const regionalState = (Math.abs(gradP) > 3 || Math.abs(gradT) > 3) ? 0.8 : 0.4;

        // Ultimate v5.0 MAX prediction (70 optimized features)
        const prediction = await meteorGuardAI.predict({
            ...aiInput,
            lat, lon, alt,
            gradPressure: gradP,
            gradTemp: gradT,
            regionalState
        });

        // Update Trust & Regional Badges (with Anomaly Detection)
        const trustPct = Math.round((prediction.trustWeight || 0.75) * 100);
        const anomalyAlert = prediction.anomalyScore > 0.6 ? ' ⚠️ ANOMALIA' : '';
        DOM.aiTrustBadge.innerHTML = `<i class="fa-solid fa-microchip"></i> Trust: ${trustPct}%${anomalyAlert}`;
        
        const geoContext = currentCityInfo.name ? `${currentCityInfo.name} + Regional Mesh` : 'Ultimate Visual Active';
        DOM.aiGeoBadge.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> ${geoContext}`;

        // Update Risk Indicator
        DOM.riskIndicator.className = `risk-indicator ${prediction.level} transition-all`;
        DOM.riskIcon.className = `fa-solid ${prediction.riskScore > 0.6 ? 'fa-triangle-exclamation' : 'fa-shield-check'}`;
        DOM.riskTitle.textContent = prediction.title;

        // Render Explainability Layer (from prediction.topFactors)
        renderAIAnalysis(prediction);

        // Render NLG (NLG from MeteorGuardAI v5.0 MAX)
        DOM.riskMessage.innerHTML = '';
        typewriterEffect(DOM.riskMessage, prediction.explanation, 15);

        // Timestamp
        DOM.aiTimestamp.textContent = `${i18n.t('aiLastAnalysis')}: ${prediction.timestamp}`;
    }

    function renderAIAnalysis(prediction) {
        DOM.aiAnalysisSection.classList.remove('hidden');
        
        // Hide legacy sections that are now integrated into NLG
        DOM.aiAlerts.classList.add('hidden');
        DOM.aiSuggestions.classList.add('hidden');
        DOM.aiDetails.classList.add('hidden');

        // v5.0 MAX: New Explainability Grid
        if (prediction.topFactors && prediction.topFactors.length > 0) {
            DOM.aiRiskFactors.classList.remove('hidden');
            DOM.aiFactorsList.innerHTML = '';
            
            prediction.topFactors.forEach(f => {
                DOM.aiFactorsList.innerHTML += `
                    <div class="factor-item">
                        <span class="factor-name">${f.factor}</span>
                        <div class="factor-bar-container">
                            <div class="factor-bar-fill" style="width: ${f.percentage}%"></div>
                        </div>
                        <span class="factor-value">${f.percentage}%</span>
                    </div>
                `;
            });
        } else {
            DOM.aiRiskFactors.classList.add('hidden');
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
        DOM.precipitationVal.textContent = current.precipitation ? current.precipitation.toFixed(1) : '0';
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
        lastDailyData = dailyData;
        const daysLong = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        for (let i = 1; i < dailyData.length; i++) {
            const dayData = dailyData[i];
            const dateStr = dayData.date + 'T12:00:00'; 
            const realDate = new Date(dateStr);
            const dayName = days[realDate.getDay()];
            
            const interp = WeatherService.getWeatherInterpretation(dayData.weatherCode);

            const div = document.createElement('div');
            div.className = 'forecast-item';
            div.dataset.index = i;
            div.innerHTML = `
                <span class="forecast-day">${dayName}</span>
                <i class="fa-solid ${interp.icon} fa-2x ${dayData.rainProb > 50 ? 'neon-text-blue' : 'text-main'}"></i>
                <div class="forecast-temps">
                    <span class="temp-max">${Math.round(dayData.maxTemp)}°</span>
                    <span class="temp-min">${Math.round(dayData.minTemp)}°</span>
                </div>
                <span class="badge ${dayData.rainProb > 50 ? 'neon-text-blue' : 'text-muted'}" style="font-size: 0.7rem; margin-top: 5px; display: flex; flex-direction: column; gap: 2px;">
                    <span>${dayData.rainProb}% <i class="fa-solid fa-droplet"></i></span>
                    <span style="font-size: 0.65rem; color: var(--text-muted);">${dayData.rainSum ? dayData.rainSum.toFixed(1) : '0.0'} mm</span>
                </span>
            `;
            
            // Click to open modal
            div.addEventListener('click', () => openDayModal(dayData, realDate));
            
            DOM.forecastList.appendChild(div);
        }
    }

    // -----------------------------------
    // Day Detail Modal
    // -----------------------------------
    function setupModalListeners() {
        modalDOM.close.addEventListener('click', closeDayModal);
        modalDOM.overlay.addEventListener('click', (e) => {
            if (e.target === modalDOM.overlay) closeDayModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeDayModal();
        });
    }

    function closeDayModal() {
        modalDOM.overlay.classList.add('hidden');
    }

    function openDayModal(dayData, date) {
        const daysLong = i18n.t('daysLong');
        const months = i18n.t('months');
        
        const interp = WeatherService.getWeatherInterpretation(dayData.weatherCode);
        
        // Populate modal
        modalDOM.icon.className = `fa-solid ${interp.icon} fa-2x`;
        modalDOM.title.textContent = `${daysLong[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
        modalDOM.desc.textContent = interp.desc;
        modalDOM.max.textContent = `${Math.round(dayData.maxTemp)}°`;
        modalDOM.min.textContent = `${Math.round(dayData.minTemp)}°`;
        modalDOM.rain.textContent = `${dayData.rainProb}%`;
        modalDOM.uv.textContent = dayData.uvMax?.toFixed(1) || '--';
        
        // Generate AI analysis for this day
        const analysis = generateDayAnalysis(dayData);
        modalDOM.analysis.innerHTML = analysis;
        
        modalDOM.overlay.classList.remove('hidden');
    }

    function generateDayAnalysis(day) {
        const rainProb = day.rainProb;
        const maxTemp = day.maxTemp;
        const minTemp = day.minTemp;
        const rainSum = day.rainSum;
        const uvMax = day.uvMax || 0;
        const interp = WeatherService.getWeatherInterpretation(day.weatherCode);
        
        let verdict, verdictClass, verdictIcon;
        let tips = [];
        
        // Determine if good to go out
        if (rainProb > 70 || rainSum > 15 || interp.dangerContext >= 3) {
            verdict = i18n.t('verdictNo');
            verdictClass = 'no';
            verdictIcon = 'fa-house';
        } else if (rainProb > 40 || rainSum > 5 || maxTemp > 38 || interp.dangerContext >= 2) {
            verdict = i18n.t('verdictCaution');
            verdictClass = 'caution';
            verdictIcon = 'fa-umbrella';
        } else {
            verdict = i18n.t('verdictYes');
            verdictClass = 'yes';
            verdictIcon = 'fa-thumbs-up';
        }
        
        // Generate tips
        if (rainProb > 50) tips.push(i18n.t('tipRain')(rainProb));
        if (rainSum > 10) tips.push(i18n.t('tipRainSum')(rainSum.toFixed(1)));
        if (maxTemp > 35) tips.push(i18n.t('tipHeat')(Math.round(maxTemp)));
        if (minTemp < 10) tips.push(i18n.t('tipCold')(Math.round(minTemp)));
        if (uvMax >= 8) tips.push(i18n.t('tipUV')(uvMax.toFixed(1)));
        if (uvMax >= 11) tips.push(i18n.t('tipUVExtreme'));
        if (interp.dangerContext >= 3) tips.push(i18n.t('tipStorm')(interp.desc));
        if (tips.length === 0) tips.push(i18n.t('tipAllClear'));
        
        return `
            <div class="analysis-title">
                <i class="fa-solid fa-brain"></i> ${i18n.t('modalAITitle')}
            </div>
            <div class="analysis-text">
                ${tips.map(t => `<p style="margin-bottom:6px;">${t}</p>`).join('')}
            </div>
            <div class="good-to-go ${verdictClass}">
                <i class="fa-solid ${verdictIcon}"></i>
                ${verdict}
            </div>
        `;
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
    // Map Engine (Leaflet + RainViewer Radar)
    // -----------------------------------
    let rainLayer = null;
    
    function updateMap(lat, lon, currentPrecipitation) {
        if (currentMap) {
            currentMap.setView([lat, lon], 7);
            loadRainRadar();
            return;
        }

        currentMap = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([lat, lon], 7);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(currentMap);
        
        L.control.zoom({ position: 'bottomright' }).addTo(currentMap);
        loadRainRadar();
    }

    async function loadRainRadar() {
        try {
            const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
            const data = await res.json();
            const latest = data.radar.past[data.radar.past.length - 1];
            
            if (rainLayer) currentMap.removeLayer(rainLayer);
            
            rainLayer = L.tileLayer(
                `https://tilecache.rainviewer.com${latest.path}/256/{z}/{x}/{y}/4/1_1.png`,
                { opacity: 0.6, zIndex: 10, maxNativeZoom: 7, maxZoom: 19 }
            ).addTo(currentMap);
        } catch (e) {
            console.warn('[METEORGUARD] Radar indisponível, usando fallback');
        }
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
        element.innerHTML = '';
        element.classList.add('typing');

        let index = 0;
        let currentText = '';
        typewriterTimer = setInterval(() => {
            currentText += text.charAt(index);
            index++;
            
            // Smart Highlighting: Destaca conselhos e conclusões importantes
            let parsed = currentText;

            // Alertas críticos (vermelho)
            parsed = parsed.replace(/(ALERTA:.*)/ig, '<strong class="neon-text-red">$1</strong>');
            parsed = parsed.replace(/(ALERT:.*)/ig, '<strong class="neon-text-red">$1</strong>');

            // Conselhos e dicas práticas (negrito branco) — PT
            parsed = parsed.replace(/(Protetor solar [^.]+\.)/g, '<strong style="color:var(--text-main); font-weight:800;">$1</strong>');
            parsed = parsed.replace(/(Hidrate-se[^.]+\.)/g, '<strong style="color:var(--text-main); font-weight:800;">$1</strong>');
            parsed = parsed.replace(/(Leve guarda-chuva[^.]*\.?)/g, '<strong style="color:var(--text-main); font-weight:800;">$1</strong>');
            parsed = parsed.replace(/(Procure abrigo[^.]+\.)/g, '<strong style="color:var(--text-main); font-weight:800;">$1</strong>');
            parsed = parsed.replace(/(Use máscara[^.]+\.)/g, '<strong style="color:var(--text-main); font-weight:800;">$1</strong>');
            parsed = parsed.replace(/(Evite exposição[^.]+\.)/g, '<strong style="color:var(--text-main); font-weight:800;">$1</strong>');
            parsed = parsed.replace(/(Evite áreas[^.]+\.)/g, '<strong style="color:var(--text-main); font-weight:800;">$1</strong>');
            parsed = parsed.replace(/(NÃO tente atravessar[^.]+\.)/g, '<strong style="color:var(--text-main); font-weight:800;">$1</strong>');
            parsed = parsed.replace(/(Permaneça em abrigo[^.]+\.)/g, '<strong style="color:var(--text-main); font-weight:800;">$1</strong>');

            // Conclusões climáticas (verde neon)
            parsed = parsed.replace(/(Clima estável[^.]+[.!])/g, '<strong class="neon-text-green">$1</strong>');
            parsed = parsed.replace(/(Condições favoráveis[^.]+[.!])/g, '<strong class="neon-text-green">$1</strong>');
            parsed = parsed.replace(/(Aproveite o dia[^.]*[.!])/g, '<strong class="neon-text-green">$1</strong>');
            parsed = parsed.replace(/(Stable weather[^.]+[.!])/g, '<strong class="neon-text-green">$1</strong>');
            parsed = parsed.replace(/(Enjoy your day[^.]*[.!])/g, '<strong class="neon-text-green">$1</strong>');
            parsed = parsed.replace(/(Clima estable[^.]+[.!])/g, '<strong class="neon-text-green">$1</strong>');
            parsed = parsed.replace(/(Disfruta el día[^.]*[.!])/g, '<strong class="neon-text-green">$1</strong>');

            element.innerHTML = parsed;

            if (index >= text.length) {
                clearInterval(typewriterTimer);
                typewriterTimer = null;
                // Remove cursor after a short delay
                setTimeout(() => element.classList.remove('typing'), 1500);
            }
        }, speed);
    }

    // -----------------------------------
    // Hourly Forecast (24h Timeline)
    // -----------------------------------
    function renderHourlyForecast(hourlyData) {
        if (!DOM.hourlyScroll || !hourlyData || hourlyData.length === 0) return;
        
        DOM.hourlyScroll.innerHTML = '';
        const nowHour = new Date().getHours();
        
        hourlyData.forEach((hour, index) => {
            const date = new Date(hour.time);
            const hourNum = date.getHours();
            const timeStr = hourNum === nowHour && index === 0 ? i18n.t('now') : `${String(hourNum).padStart(2, '0')}:00`;
            const isNow = (hourNum === nowHour && index === 0);
            
            const interp = WeatherService.getWeatherInterpretation(hour.weatherCode);
            const rainClass = hour.rainProb > 50 ? 'rain-high' : '';
            
            const card = document.createElement('div');
            card.className = `hourly-card${isNow ? ' now' : ''}`;
            card.innerHTML = `
                <span class="hourly-time">${timeStr}</span>
                <i class="fa-solid ${interp.icon} hourly-icon"></i>
                <span class="hourly-temp">${Math.round(hour.temp)}°</span>
                <span class="hourly-rain ${rainClass}">
                    <i class="fa-solid fa-droplet"></i> ${hour.rainProb}%
                </span>
            `;
            DOM.hourlyScroll.appendChild(card);
        });
    }

    // -----------------------------------
    // Weather Alerts System
    // -----------------------------------
    function checkWeatherAlerts(current) {
        const alerts = [];
        const t = key => i18n.t(key);
        
        // Wind alerts
        if (current.windGusts > 90) {
            alerts.push({ level: 'critical', icon: 'fa-wind', text: t('alertWindCrit')(current.windGusts?.toFixed(0)) });
        } else if (current.windSpeed > 50) {
            alerts.push({ level: 'warning', icon: 'fa-wind', text: t('alertWind')(current.windSpeed?.toFixed(0)) });
        }
        
        // Rain alerts
        if (current.precipitation > 30) {
            alerts.push({ level: 'critical', icon: 'fa-cloud-showers-water', text: t('alertRainCrit')(current.precipitation?.toFixed(1)) });
        } else if (current.precipitation > 10) {
            alerts.push({ level: 'warning', icon: 'fa-cloud-showers-heavy', text: t('alertRain')(current.precipitation?.toFixed(1)) });
        }
        
        // UV alerts
        if (current.uvIndex >= 11) {
            alerts.push({ level: 'critical', icon: 'fa-sun', text: t('alertUVCrit')(current.uvIndex?.toFixed(1)) });
        } else if (current.uvIndex >= 8) {
            alerts.push({ level: 'warning', icon: 'fa-sun', text: t('alertUV')(current.uvIndex?.toFixed(1)) });
        }
        
        // Visibility alerts
        if (current.visibility < 500) {
            alerts.push({ level: 'critical', icon: 'fa-smog', text: t('alertVisCrit')((current.visibility / 1000).toFixed(1)) });
        } else if (current.visibility < 2000) {
            alerts.push({ level: 'warning', icon: 'fa-smog', text: t('alertVis')((current.visibility / 1000).toFixed(1)) });
        }
        
        // Air quality alerts
        if (current.pm25 > 150) {
            alerts.push({ level: 'critical', icon: 'fa-lungs', text: t('alertAirCrit')(current.pm25?.toFixed(0)) });
        } else if (current.pm25 > 55) {
            alerts.push({ level: 'warning', icon: 'fa-lungs', text: t('alertAir')(current.pm25?.toFixed(0)) });
        }

        // Temperature extremes
        if (current.temp > 40) {
            alerts.push({ level: 'critical', icon: 'fa-temperature-arrow-up', text: t('alertHeat')(current.temp?.toFixed(1)) });
        } else if (current.temp < 0) {
            alerts.push({ level: 'warning', icon: 'fa-temperature-arrow-down', text: t('alertCold')(current.temp?.toFixed(1)) });
        }
        
        // Pressure
        if (current.pressureMsl < 990) {
            alerts.push({ level: 'warning', icon: 'fa-gauge-simple-low', text: t('alertPressure')(current.pressureMsl?.toFixed(0)) });
        }
        
        
        
        // Trigger Extreme Government Alert Overlay if ANY critical condition exists
        if (alerts.some(a => a.level === 'critical')) {
            showExtremeAlert();
        }
        
        // Render
        if (alerts.length > 0) {
            DOM.weatherAlertsBar.classList.remove('hidden');
            DOM.weatherAlertsBar.querySelector('.alerts-bar-header span').textContent = i18n.t('alertsTitle');
            DOM.alertsList.innerHTML = alerts.map(a => `
                <div class="alert-item ${a.level}">
                    <i class="fa-solid ${a.icon}"></i>
                    <span>${a.text}</span>
                </div>
            `).join('');
        } else {
            DOM.weatherAlertsBar.classList.add('hidden');
            DOM.alertsList.innerHTML = '';
        }
    }

    // -----------------------------------
    // Extreme Alert Logic
    // -----------------------------------
    let extremeAlertInterval = null;
    function showExtremeAlert() {
        if (!DOM.extremeOverlay) return;
        
        // Prevent showing multiple times in the same session for the same city
        const cityKey = currentCityInfo.name + '_extreme_alert';
        if (sessionStorage.getItem(cityKey)) return;
        sessionStorage.setItem(cityKey, 'true');

        DOM.extremeTitle.textContent = i18n.t('govAlertTitle');
        DOM.extremeMsg.textContent = i18n.t('govAlertMsg');
        DOM.extremeCloseBtn.disabled = true;
        DOM.extremeOverlay.classList.remove('hidden');
        
        let timeLeft = 10;
        DOM.extremeCloseText.textContent = i18n.t('closeAlertWait')(timeLeft);
        
        if (extremeAlertInterval) clearInterval(extremeAlertInterval);
        extremeAlertInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(extremeAlertInterval);
                DOM.extremeCloseBtn.disabled = false;
                DOM.extremeCloseText.textContent = i18n.t('closeAlertReady');
            } else {
                DOM.extremeCloseText.textContent = i18n.t('closeAlertWait')(timeLeft);
            }
        }, 1000);
        
        DOM.extremeCloseBtn.onclick = () => {
            if (!DOM.extremeCloseBtn.disabled) {
                DOM.extremeOverlay.classList.add('hidden');
            }
        };
    }

    // -----------------------------------
    // Favorites System (localStorage)
    // -----------------------------------
    function getFavorites() {
        try {
            return JSON.parse(localStorage.getItem('meteorguard_favorites') || '[]');
        } catch { return []; }
    }

    function saveFavorites(favs) {
        localStorage.setItem('meteorguard_favorites', JSON.stringify(favs));
    }

    function isFavorite(name) {
        return getFavorites().some(f => f.name === name);
    }

    function toggleFavorite() {
        const favs = getFavorites();
        const idx = favs.findIndex(f => f.name === currentCityInfo.name);
        
        if (idx >= 0) {
            favs.splice(idx, 1);
        } else {
            favs.push({ ...currentCityInfo });
        }
        
        saveFavorites(favs);
        updateFavStar();
        renderFavoritesList();
    }

    function updateFavStar() {
        if (isFavorite(currentCityInfo.name)) {
            DOM.favCityBtn.classList.add('active');
            DOM.favCityBtn.querySelector('i').className = 'fa-solid fa-star';
        } else {
            DOM.favCityBtn.classList.remove('active');
            DOM.favCityBtn.querySelector('i').className = 'fa-regular fa-star';
        }
    }

    function renderFavoritesList() {
        const favs = getFavorites();
        
        if (favs.length === 0) {
            DOM.favoritesList.innerHTML = '<p class="text-muted" style="padding:12px; text-align:center; font-size:0.85rem;">Nenhuma cidade salva ainda</p>';
            return;
        }
        
        DOM.favoritesList.innerHTML = favs.map(fav => `
            <div class="fav-item" data-lat="${fav.lat}" data-lon="${fav.lon}" data-name="${fav.name}" data-country="${fav.country}">
                <div class="fav-item-info">
                    <span class="fav-item-name">${fav.name}</span>
                    <span class="fav-item-country">${fav.country}</span>
                </div>
                <button class="fav-remove-btn" data-name="${fav.name}" title="Remover">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `).join('');
        
        // Click on fav item to load city
        DOM.favoritesList.querySelectorAll('.fav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.fav-remove-btn')) return;
                const lat = parseFloat(item.dataset.lat);
                const lon = parseFloat(item.dataset.lon);
                loadCity(lat, lon, item.dataset.name, item.dataset.country);
                DOM.favoritesDropdown.classList.add('hidden');
            });
        });
        
        // Click remove button
        DOM.favoritesList.querySelectorAll('.fav-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = btn.dataset.name;
                const favs = getFavorites().filter(f => f.name !== name);
                saveFavorites(favs);
                renderFavoritesList();
                updateFavStar();
            });
        });
    }

    // -----------------------------------
    // Language Selector
    // -----------------------------------
    function setupLanguageSelector() {
        const langBtn = document.getElementById('langBtn');
        const langDropdown = document.getElementById('langDropdown');
        
        langBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('hidden');
        });
        
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const lang = opt.dataset.lang;
                i18n.setLang(lang);
                applyLanguage();
                langDropdown.classList.add('hidden');
                
                // Re-render with new language if we have data
                if (lastWeatherData) {
                    const interp = WeatherService.getWeatherInterpretation(lastWeatherData.current.weatherCode);
                    DOM.weatherDesc.textContent = i18n.t('weather')[lastWeatherData.current.weatherCode] || interp.desc;
                    renderHourlyForecast(lastWeatherData.hourly);
                    renderForecastList(lastWeatherData.daily);
                    checkWeatherAlerts(lastWeatherData.current);
                    runAIAnalysis(lastWeatherData);
                }
            });
        });
    }

    function applyLanguage() {
        // Universal data-i18n translator
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = i18n.t(key);
            
            if (translation) {
                // If it's a function (like aiEpoch), we don't handle it here 
                // as those usually need dynamic values during runtime
                if (typeof translation === 'string') {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.placeholder = translation;
                    } else if (el.classList.contains('weather-desc')) {
                        // Weather desc usually handled by lastWeatherData check
                        el.textContent = translation;
                    } else {
                        // For most elements, we use innerHTML (to support <b> tags etc)
                        el.innerHTML = translation;
                    }
                }
            }
        });

        // Update language selector active state
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === i18n.current);
        });

        // COMPLEX UPDATES (Elements with icons or non-standard structures)
        
        // Hourly section title with icon
        const hourlyTitle = document.querySelector('.hourly-section .panel-header h3');
        if (hourlyTitle) hourlyTitle.innerHTML = `<i class="fa-solid fa-clock neon-text-blue"></i> ${i18n.t('hourlyTitle')}`;
        
        // Map Radar title with icon
        const radarTitle = document.querySelector('.map-panel .panel-header h3');
        if (radarTitle) radarTitle.innerHTML = `<i class="fa-solid fa-satellite-dish neon-text-blue blink-anim"></i> ${i18n.t('radarTitle')}`;
        
        // Chart title with icon
        const chartTitle = document.querySelector('.chart-panel .panel-header h3');
        if (chartTitle) chartTitle.innerHTML = `<i class="fa-solid fa-chart-area neon-text-purple"></i> ${i18n.t('chartTitle')}`;
        
        // Weekly section title with icon
        const weeklyTitle = document.querySelector('.daily-cards-section .panel-header h3');
        if (weeklyTitle) weeklyTitle.innerHTML = `<i class="fa-solid fa-calendar-days neon-text-green"></i> ${i18n.t('weeklyTitle')}`;
        
        // Favorites header with icon
        const favHeader = document.querySelector('.favorites-header h4');
        if (favHeader) favHeader.innerHTML = `<i class="fa-solid fa-star neon-text-purple"></i> ${i18n.t('savedCities')}`;

        // AI Section Title with icon
        const aiTitle = document.querySelector('.risk-panel .panel-header h3');
        if (aiTitle) aiTitle.innerHTML = `<i class="fa-solid fa-sparkles neon-text-green pulse-glow"></i> ${i18n.t('aiTitle')}`;
    }

    // -----------------------------------
    // MeteorChat: Interactive Logic (v5.2)
    // -----------------------------------
    function setupChatListeners() {
        if (!DOM.chatTrigger) return;

        DOM.chatTrigger.addEventListener('click', () => {
            DOM.chatWindow.classList.toggle('hidden');
            if (!DOM.chatWindow.classList.contains('hidden')) {
                DOM.chatInput.focus();
            }
        });

        DOM.closeChat.addEventListener('click', () => {
            DOM.chatWindow.classList.add('hidden');
        });

        DOM.sendChat.addEventListener('click', () => sendMessage());
        DOM.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    function sendMessage() {
        const query = DOM.chatInput.value.trim();
        if (!query) return;

        // 1. User Message
        appendChatMsg('user', query);
        DOM.chatInput.value = '';

        // 2. AI Thinking
        const thinkingId = 'thinking-' + Date.now();
        appendChatMsg('ai', 'Pensando...', thinkingId);

        // 3. Mini-NLP Loop
        setTimeout(() => {
            const thinkingElement = document.getElementById(thinkingId);
            if (thinkingElement) thinkingElement.remove();

            const aiResponse = meteorGuardAI.askAI(query, lastWeatherData?.current || { 
                temperature: 20, humidity: 50, windSpeed: 0, windGusts: 0, precipitation: 0, pressureMsl: 1013 
            });

            appendChatMsg('ai', aiResponse);
        }, 1000);
    }

    function appendChatMsg(type, text, id = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}-message`;
        if (id) msgDiv.id = id;
        msgDiv.textContent = text;
        DOM.chatMessages.appendChild(msgDiv);
        DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
    }
});

