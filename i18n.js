// ==========================================
// METEORGUARD i18n — Internationalization
// Supports: PT-BR, EN, ES
// ==========================================

const i18n = {
    current: 'pt',

    translations: {
        pt: {
            // Header
            searchPlaceholder: 'Buscar cidade...',
            savedCities: 'Cidades Salvas',
            noSavedCities: 'Nenhuma cidade salva ainda',
            myLocation: 'Usar minha localização',

            // Loading
            loading: 'Sincronizando satélites...',
            locating: 'Localizando coordenadas',
            loadingCity: 'Carregando...',

            // Hero Panel
            feelsLike: 'Sensação',
            humidity: 'Umidade',
            wind: 'Vento',
            pressure: 'Pressão',
            uv: 'UV',
            pm25: 'PM2.5',
            visibility: 'Visibilidade',

            // AI Panel
            aiTitle: 'MeteorGuard AI',
            aiProcessing: 'PROCESSANDO',
            aiOnline: 'ONLINE',
            aiTraining: 'Treinando inteligência artificial...',
            aiLastAnalysis: 'Última análise neural',
            currentRain: 'Precipitação Atual',
            dailyRain: 'Chuva Acumulada Dia',

            // Risk Levels
            riskSafe: 'Nível: Seguro',
            riskWarning: 'Atenção: Clima Adverso',
            riskDanger: 'Risco Alto: Condições Severas',
            riskCritical: 'EMERGÊNCIA: Risco Extremo',

            // Alerts
            alertsTitle: 'ALERTAS METEOROLÓGICOS ATIVOS',
            govAlertTitle: 'ALERTA GOVERNAMENTAL EXTREMO',
            govAlertMsg: 'Condições climáticas na sua região apresentam risco severo e imediato. Proteja-se e siga orientações da Defesa Civil.',
            closeAlertWait: (s) => `FECHAR ALERTA (${s}s)`,
            closeAlertReady: 'FECHAR ALERTA',
            alertWind: (v) => `Ventos fortes de ${v} km/h — objetos podem ser arremessados`,
            alertWindCrit: (v) => `Rajadas destrutivas de ${v} km/h — risco de destelhamento`,
            alertRain: (v) => `Chuva forte de ${v} mm/h — evite áreas de risco`,
            alertRainCrit: (v) => `Chuva torrencial de ${v} mm/h — risco de alagamento`,
            alertUV: (v) => `UV muito alto (${v}) — use protetor solar`,
            alertUVCrit: (v) => `UV extremo (${v}) — queimaduras em minutos`,
            alertVis: (v) => `Visibilidade reduzida (${v} km) — dirija com cuidado`,
            alertVisCrit: (v) => `Visibilidade crítica (${v} km) — perigo no trânsito`,
            alertAir: (v) => `Ar poluído — PM2.5 em ${v} µg/m³`,
            alertAirCrit: (v) => `Ar insalubre — PM2.5 em ${v} µg/m³. Use máscara`,
            alertHeat: (v) => `Calor extremo de ${v}°C — risco à saúde`,
            alertCold: (v) => `Temperatura negativa (${v}°C) — risco de geada`,
            alertPressure: (v) => `Pressão muito baixa (${v} hPa) — tempestade possível`,

            // Hourly
            hourlyTitle: 'Previsão 24 Horas',
            hourlyBadge: 'HORA A HORA',
            now: 'Agora',

            // Radar
            radarTitle: 'Radar de Precipitação',
            radarLive: 'AO VIVO',

            // Chart
            chartTitle: 'Tendência 7 Dias',
            chartMax: 'Máxima °C',
            chartMin: 'Mínima °C',
            chartRain: 'Chuva (%)',

            // Daily Cards
            weeklyTitle: 'Previsão Semanal',
            weeklyBadge: 'CLIQUE PARA DETALHES',
            days: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            daysLong: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
            months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],

            // Modal
            modalMax: 'Máxima',
            modalMin: 'Mínima',
            modalRain: 'Chuva',
            modalUV: 'UV Máx',
            modalAITitle: 'Análise MeteorGuard AI',
            verdictYes: 'Ótimo dia para sair!',
            verdictCaution: 'Saia com precaução',
            verdictNo: 'Evite sair se possível',
            tipRain: (v) => `💧 ${v}% de chance de chuva — leve guarda-chuva`,
            tipRainSum: (v) => `🌧️ Previsão de ${v}mm de chuva acumulada`,
            tipHeat: (v) => `🌡️ Calor forte de ${v}°C — hidrate-se bastante`,
            tipCold: (v) => `❄️ Mínima de ${v}°C — leve agasalho`,
            tipUV: (v) => `☀️ UV alto (${v}) — use protetor solar`,
            tipUVExtreme: '🔥 UV extremo — evite exposição entre 10h-16h',
            tipStorm: (d) => `⚡ ${d} prevista — risco meteorológico`,
            tipAllClear: '✅ Sem alertas para este dia. Condições favoráveis!',

            // Weather descriptions
            weather: {
                0: 'Céu Limpo', 1: 'Predominantemente Limpo', 2: 'Parcialmente Nublado',
                3: 'Nublado', 45: 'Neblina', 48: 'Névoa de Geada',
                51: 'Garoa Leve', 53: 'Garoa Moderada', 55: 'Garoa Densa',
                61: 'Chuva Leve', 63: 'Chuva Moderada', 65: 'Chuva Forte',
                71: 'Neve Leve', 73: 'Neve Moderada', 75: 'Neve Densa',
                80: 'Pancada de Chuva Leve', 81: 'Pancada de Chuva Moderada', 82: 'Pancada de Chuva Violenta',
                95: 'Tempestade de Raios', 96: 'Tempestade de Granizo', 99: 'Tempestade Severa de Granizo'
            },

            // Error
            apiError: 'Erro ao conectar com satélites ambientais. Tente novamente.',
            geoFallback: 'Localização Atual',
            geoCoords: 'Coordenadas GPS'
        },

        en: {
            searchPlaceholder: 'Search city...',
            savedCities: 'Saved Cities',
            noSavedCities: 'No saved cities yet',
            myLocation: 'Use my location',

            loading: 'Syncing satellites...',
            locating: 'Locating coordinates',
            loadingCity: 'Loading...',

            feelsLike: 'Feels Like',
            humidity: 'Humidity',
            wind: 'Wind',
            pressure: 'Pressure',
            uv: 'UV',
            pm25: 'PM2.5',
            visibility: 'Visibility',

            aiTitle: 'MeteorGuard AI',
            aiProcessing: 'PROCESSING',
            aiOnline: 'ONLINE',
            aiTraining: 'Training Artificial Intelligence...',
            aiLastAnalysis: 'Latest neural analysis',
            currentRain: 'Current Precipitation',
            dailyRain: 'Daily Rainfall',

            riskSafe: 'Level: Safe',
            riskWarning: 'Warning: Adverse Weather',
            riskDanger: 'High Risk: Severe Conditions',
            riskCritical: 'EMERGENCY: Extreme Risk',

            alertsTitle: 'ACTIVE WEATHER ALERTS',
            govAlertTitle: 'EXTREME GOVERNMENT ALERT',
            govAlertMsg: 'Weather conditions in your area present severe and immediate risk. Take shelter and follow official guidance.',
            closeAlertWait: (s) => `CLOSE ALERT (${s}s)`,
            closeAlertReady: 'CLOSE ALERT',
            alertWind: (v) => `Strong winds at ${v} km/h — flying debris possible`,
            alertWindCrit: (v) => `Destructive gusts at ${v} km/h — structural damage risk`,
            alertRain: (v) => `Heavy rain at ${v} mm/h — avoid risk areas`,
            alertRainCrit: (v) => `Torrential rain at ${v} mm/h — flood risk`,
            alertUV: (v) => `Very high UV (${v}) — use sunscreen`,
            alertUVCrit: (v) => `Extreme UV (${v}) — burns in minutes`,
            alertVis: (v) => `Reduced visibility (${v} km) — drive carefully`,
            alertVisCrit: (v) => `Critical visibility (${v} km) — traffic danger`,
            alertAir: (v) => `Polluted air — PM2.5 at ${v} µg/m³`,
            alertAirCrit: (v) => `Unhealthy air — PM2.5 at ${v} µg/m³. Wear a mask`,
            alertHeat: (v) => `Extreme heat at ${v}°C — health risk`,
            alertCold: (v) => `Below-zero temperature (${v}°C) — frost risk`,
            alertPressure: (v) => `Very low pressure (${v} hPa) — storm possible`,

            hourlyTitle: '24-Hour Forecast',
            hourlyBadge: 'HOURLY',
            now: 'Now',

            radarTitle: 'Precipitation Radar',
            radarLive: 'LIVE',

            chartTitle: '7-Day Trend',
            chartMax: 'Max °C',
            chartMin: 'Min °C',
            chartRain: 'Rain (%)',

            weeklyTitle: 'Weekly Forecast',
            weeklyBadge: 'CLICK FOR DETAILS',
            days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            daysLong: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

            modalMax: 'High',
            modalMin: 'Low',
            modalRain: 'Rain',
            modalUV: 'UV Max',
            modalAITitle: 'MeteorGuard AI Analysis',
            verdictYes: 'Great day to go out!',
            verdictCaution: 'Go out with caution',
            verdictNo: 'Avoid going out if possible',
            tipRain: (v) => `💧 ${v}% chance of rain — bring an umbrella`,
            tipRainSum: (v) => `🌧️ Forecast of ${v}mm of accumulated rain`,
            tipHeat: (v) => `🌡️ Strong heat at ${v}°C — stay hydrated`,
            tipCold: (v) => `❄️ Low of ${v}°C — bring a jacket`,
            tipUV: (v) => `☀️ High UV (${v}) — use sunscreen`,
            tipUVExtreme: '🔥 Extreme UV — avoid exposure between 10am-4pm',
            tipStorm: (d) => `⚡ ${d} forecast — meteorological risk`,
            tipAllClear: '✅ No alerts for this day. Favorable conditions!',

            weather: {
                0: 'Clear Sky', 1: 'Mostly Clear', 2: 'Partly Cloudy',
                3: 'Overcast', 45: 'Fog', 48: 'Rime Fog',
                51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
                61: 'Light Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
                71: 'Light Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
                80: 'Light Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
                95: 'Thunderstorm', 96: 'Hailstorm', 99: 'Severe Hailstorm'
            },

            apiError: 'Failed to connect to weather satellites. Try again.',
            geoFallback: 'Current Location',
            geoCoords: 'GPS Coordinates'
        },

        es: {
            searchPlaceholder: 'Buscar ciudad...',
            savedCities: 'Ciudades Guardadas',
            noSavedCities: 'Ninguna ciudad guardada',
            myLocation: 'Usar mi ubicación',

            loading: 'Sincronizando satélites...',
            locating: 'Localizando coordenadas',
            loadingCity: 'Cargando...',

            feelsLike: 'Sensación',
            humidity: 'Humedad',
            wind: 'Viento',
            pressure: 'Presión',
            uv: 'UV',
            pm25: 'PM2.5',
            visibility: 'Visibilidad',

            aiTitle: 'MeteorGuard AI',
            aiProcessing: 'PROCESANDO',
            aiOnline: 'EN LÍNEA',
            aiTraining: 'Entrenando inteligencia artificial...',
            aiLastAnalysis: 'Último análisis neuronal',
            currentRain: 'Precipitación Actual',
            dailyRain: 'Lluvia Acumulada Día',

            riskSafe: 'Nivel: Seguro',
            riskWarning: 'Atención: Clima Adverso',
            riskDanger: 'Riesgo Alto: Condiciones Severas',
            riskCritical: 'EMERGENCIA: Riesgo Extremo',

            alertsTitle: 'ALERTAS METEOROLÓGICAS ACTIVAS',
            govAlertTitle: 'ALERTA GUBERNAMENTAL EXTREMA',
            govAlertMsg: 'Las condiciones climáticas en su área presentan un riesgo severo e inmediato. Protéjase y siga las instrucciones oficiales.',
            closeAlertWait: (s) => `CERRAR ALERTA (${s}s)`,
            closeAlertReady: 'CERRAR ALERTA',
            alertWind: (v) => `Vientos fuertes de ${v} km/h — objetos pueden salir volando`,
            alertWindCrit: (v) => `Ráfagas destructivas de ${v} km/h — riesgo de daños`,
            alertRain: (v) => `Lluvia fuerte de ${v} mm/h — evite zonas de riesgo`,
            alertRainCrit: (v) => `Lluvia torrencial de ${v} mm/h — riesgo de inundación`,
            alertUV: (v) => `UV muy alto (${v}) — use protector solar`,
            alertUVCrit: (v) => `UV extremo (${v}) — quemaduras en minutos`,
            alertVis: (v) => `Visibilidad reducida (${v} km) — conduzca con cuidado`,
            alertVisCrit: (v) => `Visibilidad crítica (${v} km) — peligro en el tránsito`,
            alertAir: (v) => `Aire contaminado — PM2.5 en ${v} µg/m³`,
            alertAirCrit: (v) => `Aire insalubre — PM2.5 en ${v} µg/m³. Use mascarilla`,
            alertHeat: (v) => `Calor extremo de ${v}°C — riesgo para la salud`,
            alertCold: (v) => `Temperatura negativa (${v}°C) — riesgo de helada`,
            alertPressure: (v) => `Presión muy baja (${v} hPa) — tormenta posible`,

            hourlyTitle: 'Pronóstico 24 Horas',
            hourlyBadge: 'HORA A HORA',
            now: 'Ahora',

            radarTitle: 'Radar de Precipitación',
            radarLive: 'EN VIVO',

            chartTitle: 'Tendencia 7 Días',
            chartMax: 'Máxima °C',
            chartMin: 'Mínima °C',
            chartRain: 'Lluvia (%)',

            weeklyTitle: 'Pronóstico Semanal',
            weeklyBadge: 'CLIC PARA DETALLES',
            days: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
            daysLong: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
            months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],

            modalMax: 'Máxima',
            modalMin: 'Mínima',
            modalRain: 'Lluvia',
            modalUV: 'UV Máx',
            modalAITitle: 'Análisis MeteorGuard AI',
            verdictYes: '¡Gran día para salir!',
            verdictCaution: 'Sal con precaución',
            verdictNo: 'Evita salir si es posible',
            tipRain: (v) => `💧 ${v}% de probabilidad de lluvia — lleva paraguas`,
            tipRainSum: (v) => `🌧️ Pronóstico de ${v}mm de lluvia acumulada`,
            tipHeat: (v) => `🌡️ Calor fuerte de ${v}°C — hidrátate`,
            tipCold: (v) => `❄️ Mínima de ${v}°C — lleva abrigo`,
            tipUV: (v) => `☀️ UV alto (${v}) — usa protector solar`,
            tipUVExtreme: '🔥 UV extremo — evita exposición entre 10h-16h',
            tipStorm: (d) => `⚡ ${d} prevista — riesgo meteorológico`,
            tipAllClear: '✅ Sin alertas para este día. ¡Condiciones favorables!',

            weather: {
                0: 'Cielo Despejado', 1: 'Mayormente Despejado', 2: 'Parcialmente Nublado',
                3: 'Nublado', 45: 'Niebla', 48: 'Niebla de Escarcha',
                51: 'Llovizna Leve', 53: 'Llovizna Moderada', 55: 'Llovizna Densa',
                61: 'Lluvia Leve', 63: 'Lluvia Moderada', 65: 'Lluvia Fuerte',
                71: 'Nieve Leve', 73: 'Nieve Moderada', 75: 'Nieve Densa',
                80: 'Chubasco Leve', 81: 'Chubasco Moderado', 82: 'Chubasco Violento',
                95: 'Tormenta Eléctrica', 96: 'Tormenta de Granizo', 99: 'Tormenta Severa de Granizo'
            },

            apiError: 'Error al conectar con satélites meteorológicos. Inténtalo de nuevo.',
            geoFallback: 'Ubicación Actual',
            geoCoords: 'Coordenadas GPS'
        }
    },

    t(key) {
        return this.translations[this.current]?.[key] || this.translations.pt[key] || key;
    },

    setLang(lang) {
        if (this.translations[lang]) {
            this.current = lang;
            localStorage.setItem('meteorguard_lang', lang);
        }
    },

    init() {
        const saved = localStorage.getItem('meteorguard_lang');
        if (saved && this.translations[saved]) {
            this.current = saved;
        } else {
            // Auto-detect from browser
            const browserLang = navigator.language.slice(0, 2);
            if (this.translations[browserLang]) {
                this.current = browserLang;
            }
        }
    }
};

// Auto-init
i18n.init();
