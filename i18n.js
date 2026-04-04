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
            myLocation: 'Localização Atual',
            loadingCity: 'Carregando...',
            locating: 'Localizando coordenadas...',
            geoCoords: 'Coordenadas GPS',
            waitingData: 'Aguardando dados ambientais...',

            // Hero Panel
            feelsLike: 'Sensação',
            precipitation: 'Precipitação',
            humidity: 'Umidade',
            wind: 'Vento',
            pressure: 'Pressão',
            uv: 'UV',
            pm25: 'PM2.5',
            visibility: 'Visibilidade',

            // AI Panel
            aiTitle: 'MeteorGuard AI',
            aiProcessing: 'ANALISANDO...',
            aiOnline: 'Monitoramento Ativo',
            aiTraining: 'Sincronizando Inteligência Regional...',
            aiDisclaimer: '<b>Nota:</b> Análise baseada em IA para apoio à decisão. Foco no estado atual.',
            aiEpoch: (e, t) => `Processando dados ${e}/${t}...`,
            aiLastAnalysis: 'Última análise da IA',
            currentRain: 'Precipitação Atual',
            dailyRain: 'Precipitação Total (Hoje)',

            riskSafe: 'Nível: Seguro',
            riskWarning: 'Atenção: Clima Adverso',
            riskDanger: 'Risco Alto: Condições Severas',
            riskCritical: 'EMERGÊNCIA: Risco Extremo',
            
            aiRiskTitleSafe: (v) => `🟢 SEGURO`,
            aiRiskTitleWarningLow: (v) => `🟡 ATENÇÃO LEVE`,
            aiRiskTitleWarning: (v) => `🟠 ATENÇÃO`,
            aiRiskTitleDanger: (v) => `🔴 PERIGO`,
            aiRiskTitleCritical: (v) => `🚨 RISCO EXTREMO`,
            physicsUnstable: ' (TENDÊNCIA INSTÁVEL)',
            physicsStable: ' (ESTABILIZANDO)',

            // Alerts
            alertsTitle: 'ALERTAS METEOROLÓGICOS ATIVOS',
            govAlertTitle: 'ALERTA GOVERNAMENTAL EXTREMO',
            govAlertMsg: 'Condições climáticas na sua região apresentam risco severo e imediato. Proteja-se e siga orientações da Defesa Civil.',
            closeAlertWait: (s) => `FECHAR ALERTA (${s}s)`,
            closeAlertReady: 'FECHAR ALERTA',
            alertWind: (v) => `Ventos fortes de ${v} km/h — objetos podem ser arremessados`,
            alertWindCrit: (v) => `Rajadas destrutivas de ${v} km/h — risco de destelhamento`,

            // AI v4.0 MAX Features
            featTemperature: 'Temperatura',
            featHumidity: 'Umidade',
            featWindSpeed: 'Vel. do Vento',
            featWindGusts: 'Rajadas',
            featPrecipitation: 'Precipitação',
            featPressure: 'Pressão',
            featCloudCover: 'Nuvens',
            featVisibility: 'Visibilidade',
            featUVIndex: 'Índice UV',
            featPM25: 'PM2.5',
            featContext: 'Contexto Geog.',
            featStormIndex: 'Índice de Tempestade',
            featInstability: 'Instabilidade',
            featDewpoint: 'Ponto de Orvalho',
            featFeelsLike: 'Sensação Térmica',
            featWindPower: 'Potencial do Vento',

            // AI v4.0 Causal Messages
            aiPrimaryDriver: (f, p) => `🎯 Fator principal: ${f} (contribuição: ${p}%)`,
            aiMomentumPressDrop: (v) => `⬇ Queda rápida de pressão (${v} hPa) indica instabilidade chegando.`,
            aiMomentumPressDown: '⬇ Pressão em declínio, tempo deteriorando.',
            aiMomentumPressUp: '⬆ Pressão subindo, condições estabilizando.',
            aiMomentumTempDelta: (v) => `🌡 Mudança térmica rápida (${v}°C) sugere passagem de frente.`,
            aiMomentumWindUp: (v) => `💨 Vento acelerando rápido (+${v} km/h).`,
            aiMomentumMoisture: '💧 Onda de umidade detectada.',
            aiMomentumStormLikely: '⚠ Pressão em queda + vento acelerando = formação de tempestade provável.',
            aiAnomalyDetected: '⚠ Padrão atmosférico incomum detectado.',
            aiUncertaintyHigh: (v) => `⚠ Incerteza elevada (${v}%). Monitore as condições de perto.`,
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

            // AI Context Analysis Strings
            aiContext: {
                tempHighAlert: '🌡️ Temperatura extremamente alta detectada. Risco de desidratação e insolação.',
                tempHighSugg: 'Hidrate-se a cada 30 minutos. Evite exposição direta ao sol entre 10h-16h.',
                tempLowAlert: '❄️ Temperatura muito baixa. Risco de hipotermia em exposição prolongada.',
                tempLowSugg: 'Use roupas em camadas. Proteja extremidades (mãos, pés, orelhas).',
                windCritAlert: '🌪️ ALERTA DEFESA CIVIL: Rajadas destrutivas acima de 90 km/h. Risco de destelhamento e queda de árvores.',
                windCritSugg: 'Permaneça em abrigo seguro. Afaste-se de janelas e estruturas frágeis.',
                windHighAlert: '💨 Ventos fortes detectados. Objetos soltos podem ser arremessados.',
                windHighSugg: 'Recolha objetos leves de varandas e áreas externas.',
                windModSugg: 'Vento moderado. Cuidado com guarda-chuvas — podem inverter.',
                rainCritAlert: (v) => `🌊 ALERTA MÁXIMO: Precipitação intensa (>${v}mm/h). Risco imediato de alagamentos e deslizamentos.`,
                rainCritSugg: 'NÃO tente atravessar vias alagadas a pé ou de carro. Procure terreno elevado.',
                rainHighAlert: (v) => `🌧️ Chuva forte em andamento (${v}mm). Bueiros podem transbordar em áreas urbanas.`,
                rainHighSugg: 'Evite áreas de encosta e margem de rios. Leve guarda-chuva reforçado.',
                rainModSugg: (v) => `☂️ Chuva moderada (${v}mm). Leve guarda-chuva hoje.`,
                rainLowSugg: (v) => `🌦️ Garoa detectada (${v}mm). Um casaco impermeável é suficiente.`,
                pressLowAlert: (v) => `📉 Pressão atmosférica muito baixa (${v} hPa). Indica formação de sistema ciclônico próximo.`,
                pressLowDet: 'Sistemas de baixa pressão geralmente trazem instabilidade severa nas próximas horas.',
                pressDropDet: (v) => `📊 Pressão em queda (${v} hPa). Tendência de piora no tempo.`,
                pressHighDet: (v) => `📊 Pressão alta e estável (${v} hPa). Bom indicador de tempo firme.`,
                visCritAlert: '🌫️ Visibilidade crítica abaixo de 500m. Risco extremo para motoristas.',
                visCritSugg: 'Ligue faróis baixos (nunca o alto na neblina). Reduza velocidade drasticamente.',
                visLowSugg: '🌫️ Visibilidade reduzida. Dirija com atenção redobrada.',
                airCritAlert: (v) => `😷 Qualidade do ar PÉSSIMA (PM2.5: ${v} µg/m³). Nocivo para todos os grupos.`,
                airCritSugg: 'Use máscara N95/PFF2 ao sair. Evite atividade física ao ar livre.',
                airWarnDet: (v) => `🏭 Qualidade do ar insatisfatória (PM2.5: ${v} µg/m³). Grupos sensíveis devem ter cautela.`,
                airGoodDet: (v) => `🍃 Ar limpo e saudável (PM2.5: ${v} µg/m³).`,
                uvCritAlert: (v) => `☀️ Índice UV EXTREMO (${v}). Queimaduras em menos de 10 minutos.`,
                uvCritSugg: 'Aplique protetor solar FPS 50+. Use chapéu de aba larga e óculos escuros.',
                uvWarnSugg: (v) => `☀️ UV muito alto (${v}). Protetor solar é essencial hoje.`,
                cloudHighDet: (v) => `☁️ Céu totalmente encoberto (${v}%). Sem aberturas de sol previstas.`,
                cloudLowDet: (v) => `☀️ Céu predominantemente limpo (${v}% de nuvens).`,
                allClearSugg: [
                    '✅ Condições estáveis no momento.',
                    '✅ Clima sem riscos significativos.',
                    '✅ Situação meteorológica tranquila.'
                ],
                nlgIntroSafe: 'Condições climáticas favoráveis no momento.',
                nlgIntroWarn: 'Algumas condições merecem atenção.',
                nlgIntroDanger: 'Atenção: condições climáticas adversas na região.',
                nlgIntroCrit: 'ALERTA: condições climáticas perigosas na região.',
                nlgAlso: 'Além disso,',
                nlgFinally: 'Para completar,',
                nlgOutroSafe: (v) => `Clima estável no momento. Aproveite o dia!`,
                nlgOutroWarn: (v) => `Fique atento às mudanças e tome precauções.`,
                nlgOutroCrit: (v) => `ALERTA: Condições críticas detectadas. Procure abrigo e evite sair.`
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
            myLocation: 'Current Location',
            loadingCity: 'Loading...',
            locating: 'Locating coordinates...',
            geoCoords: 'GPS Coordinates',
            waitingData: 'Waiting for environmental data...',

            feelsLike: 'Feels Like',
            precipitation: 'Precipitation',
            humidity: 'Humidity',
            wind: 'Wind',
            pressure: 'Pressure',
            uv: 'UV',
            pm25: 'PM2.5',
            visibility: 'Visibility',

            // AI Panel
            aiTitle: 'MeteorGuard AI',
            aiProcessing: 'ANALYZING...',
            aiOnline: 'Smart Monitoring Active',
            aiTraining: 'Syncing Regional Intelligence...',
            aiDisclaimer: '<b>Note:</b> AI-based decision support. Focus on current state.',
            aiEpoch: (e, t) => `Processing data ${e}/${t}...`,
            aiLastAnalysis: 'Last AI update',
            currentRain: 'Current Precipitation',
            dailyRain: 'Forecast for Today',

            riskSafe: 'Level: Safe',
            riskWarning: 'Warning: Adverse Weather',
            riskDanger: 'High Risk: Severe Conditions',
            riskCritical: 'EMERGENCY: Extreme Risk',
            
            aiRiskTitleSafe: (v) => `🟢 SAFE`,
            aiRiskTitleWarningLow: (v) => `🟡 MINOR WARNING`,
            aiRiskTitleWarning: (v) => `🟠 WARNING`,
            aiRiskTitleDanger: (v) => `🔴 DANGER`,
            aiRiskTitleCritical: (v) => `🚨 EXTREME RISK`,
            physicsUnstable: ' (UNSTABLE TREND)',
            physicsStable: ' (STABILIZING)',

            alertsTitle: 'ACTIVE WEATHER ALERTS',
            govAlertTitle: 'EXTREME GOVERNMENT ALERT',
            govAlertMsg: 'Weather conditions in your area present severe and immediate risk. Take shelter and follow official guidance.',
            closeAlertWait: (s) => `CLOSE ALERT (${s}s)`,
            closeAlertReady: 'CLOSE ALERT',
            alertWind: (v) => `Strong winds at ${v} km/h — flying debris possible`,
            alertWindCrit: (v) => `Destructive gusts at ${v} km/h — structural damage risk`,

            // AI v4.0 MAX Features
            featTemperature: 'Temperature',
            featHumidity: 'Humidity',
            featWindSpeed: 'Wind Speed',
            featWindGusts: 'Wind Gusts',
            featPrecipitation: 'Precipitation',
            featPressure: 'Pressure',
            featCloudCover: 'Cloud Cover',
            featVisibility: 'Visibility',
            featUVIndex: 'UV Index',
            featPM25: 'PM2.5',
            featContext: 'Geog. Context',
            featStormIndex: 'Storm Index',
            featInstability: 'Instability',
            featDewpoint: 'Dewpoint',
            featFeelsLike: 'Feels Like',
            featWindPower: 'Wind Power',

            // AI v4.0 Causal Messages
            aiPrimaryDriver: (f, p) => `🎯 Primary factor: ${f} (contribution: ${p}%)`,
            aiMomentumPressDrop: (v) => `⬇ Rapid pressure drop (${v} hPa) indicates instability.`,
            aiMomentumPressDown: '⬇ Pressure declining, weather deteriorating.',
            aiMomentumPressUp: '⬆ Pressure rising, conditions stabilizing.',
            aiMomentumTempDelta: (v) => `🌡 Rapid temperature change (${v}°C) suggests front.`,
            aiMomentumWindUp: (v) => `💨 Wind rapidly increasing (+${v} km/h).`,
            aiMomentumMoisture: '💧 Moisture surge detected.',
            aiMomentumStormLikely: '⚠ Pressure drop + wind acceleration = storm development likely.',
            aiAnomalyDetected: '⚠ Unusual atmospheric pattern detected.',
            aiUncertaintyHigh: (v) => `⚠ High uncertainty (${v}%). Monitor closely.`,
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

            // Weather descriptions
            weather: {
                0: 'Clear Sky', 1: 'Mostly Clear', 2: 'Partly Cloudy',
                3: 'Overcast', 45: 'Fog', 48: 'Rime Fog',
                51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
                61: 'Light Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
                71: 'Light Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
                80: 'Light Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
                95: 'Thunderstorm', 96: 'Hailstorm', 99: 'Severe Hailstorm'
            },

            // AI Context Analysis Strings
            aiContext: {
                tempHighAlert: '🌡️ Extremely high temperature detected. Risk of dehydration and heatstroke.',
                tempHighSugg: 'Hydrate every 30 minutes. Avoid direct sun exposure between 10am-4pm.',
                tempLowAlert: '❄️ Very low temperature. Risk of hypothermia upon prolonged exposure.',
                tempLowSugg: 'Wear layered clothing. Protect extremities (hands, feet, ears).',
                windCritAlert: '🌪️ CIVIL DEFENSE ALERT: Destructive gusts over 90 km/h. Risk of unroofing and falling trees.',
                windCritSugg: 'Stay in a safe shelter. Keep away from windows and fragile structures.',
                windHighAlert: '💨 Strong winds detected. Loose objects may be thrown.',
                windHighSugg: 'Collect light objects from balconies and outdoors.',
                windModSugg: 'Moderate wind. Watch out for umbrellas — they might invert.',
                rainCritAlert: (v) => `🌊 MAXIMUM ALERT: Intense precipitation (>${v}mm/h). Immediate risk of flooding and landslides.`,
                rainCritSugg: 'DO NOT attempt to cross flooded roads on foot or by car. Seek high ground.',
                rainHighAlert: (v) => `🌧️ Heavy rain in progress (${v}mm). Drains may overflow in urban areas.`,
                rainHighSugg: 'Avoid slope areas and riverbanks. Bring a heavy-duty umbrella.',
                rainModSugg: (v) => `☂️ Moderate rain (${v}mm). Bring an umbrella today.`,
                rainLowSugg: (v) => `🌦️ Drizzle detected (${v}mm). A waterproof jacket is enough.`,
                pressLowAlert: (v) => `📉 Very low atmospheric pressure (${v} hPa). Indicates cyclonic system formation nearby.`,
                pressLowDet: 'Low pressure systems often bring severe instability in the coming hours.',
                pressDropDet: (v) => `📊 Falling pressure (${v} hPa). Weather expected to worsen.`,
                pressHighDet: (v) => `📊 High and stable pressure (${v} hPa). Good indicator of steady weather.`,
                visCritAlert: '🌫️ Critical visibility below 500m. Extreme risk for drivers.',
                visCritSugg: 'Turn on low beam headlights (never high beams in fog). Reduce speed drastically.',
                visLowSugg: '🌫️ Reduced visibility. Drive with extra caution.',
                airCritAlert: (v) => `😷 TERRIBLE air quality (PM2.5: ${v} µg/m³). Harmful to all groups.`,
                airCritSugg: 'Wear N95/FFP2 mask when going out. Avoid outdoor physical activity.',
                airWarnDet: (v) => `🏭 Unsatisfactory air quality (PM2.5: ${v} µg/m³). Sensitive groups should take caution.`,
                airGoodDet: (v) => `🍃 Clean and healthy air (PM2.5: ${v} µg/m³).`,
                uvCritAlert: (v) => `☀️ EXTREME UV Index (${v}). Burns in less than 10 minutes.`,
                uvCritSugg: 'Apply SPF 50+ sunscreen. Wear wide-brimmed hat and sunglasses.',
                uvWarnSugg: (v) => `☀️ Very high UV (${v}). Sunscreen is essential today.`,
                cloudHighDet: (v) => `☁️ Completely overcast sky (${v}%). No predicted sun breaks.`,
                cloudLowDet: (v) => `☀️ Mostly clear sky (${v}% clouds).`,
                allClearSugg: [
                    '✅ Stable conditions at the moment.',
                    '✅ Weather without significant risks.',
                    '✅ Calm meteorological situation.'
                ],
                nlgIntroSafe: 'Favorable weather conditions at the moment.',
                nlgIntroWarn: 'Some conditions require your attention.',
                nlgIntroDanger: 'Warning: adverse weather conditions in the area.',
                nlgIntroCrit: 'ALERT: dangerous weather conditions in the area.',
                nlgAlso: 'Additionally,',
                nlgFinally: 'Furthermore,',
                nlgOutroSafe: (v) => `Stable weather conditions right now. Enjoy your day!`,
                nlgOutroWarn: (v) => `Stay alert to weather changes and take precautions.`,
                nlgOutroCrit: (v) => `ALERT: Critical conditions detected. Seek shelter and avoid going out.`
            },

            apiError: 'Failed to connect to weather satellites. Try again.',
            geoFallback: 'Current Location',
            geoCoords: 'GPS Coordinates'
        },

        es: {
            searchPlaceholder: 'Buscar ciudad...',
            savedCities: 'Ciudades Guardadas',
            noSavedCities: 'Ninguna ciudad guardada',
            myLocation: 'Ubicación Actual',
            loadingCity: 'Cargando...',
            locating: 'Localizando coordenadas...',
            geoCoords: 'Coordenadas GPS',
            waitingData: 'Esperando datos ambientales...',

            feelsLike: 'Sensación',
            precipitation: 'Precipitación',
            humidity: 'Humedad',
            wind: 'Viento',
            pressure: 'Presión',
            uv: 'UV',
            pm25: 'PM2.5',
            visibility: 'Visibilidad',

            // AI Panel
            aiTitle: 'MeteorGuard AI',
            aiProcessing: 'ANALIZANDO...',
            aiOnline: 'Monitoreo Inteligente',
            aiTraining: 'Sincronizando IA Regional...',
            aiDisclaimer: '<b>Nota:</b> Apoyo a la decisión basado en IA. Enfoque en estado actual.',
            aiEpoch: (e, t) => `Procesando datos ${e}/${t}...`,
            aiLastAnalysis: 'Última actualización de IA',
            currentRain: 'Precipitación Actual',
            dailyRain: 'Previsión p/ Hoy',

            riskSafe: 'Nivel: Seguro',
            riskWarning: 'Atención: Clima Adverso',
            riskDanger: 'Riesgo Alto: Condiciones Severas',
            riskCritical: 'EMERGENCIA: Riesgo Extremo',
            
            aiRiskTitleSafe: (v) => `🟢 SEGURO`,
            aiRiskTitleWarningLow: (v) => `🟡 ATENCIÓN LEVE`,
            aiRiskTitleWarning: (v) => `🟠 ATENCIÓN`,
            aiRiskTitleDanger: (v) => `🔴 PELIGRO`,
            aiRiskTitleCritical: (v) => `🚨 RIESGO EXTREMO`,
            physicsUnstable: ' (TENDENCIA INESTABLE)',
            physicsStable: ' (ESTABILIZANDO)',

            alertsTitle: 'ALERTAS METEOROLÓGICAS ACTIVAS',
            govAlertTitle: 'ALERTA GUBERNAMENTAL EXTREMA',
            govAlertMsg: 'Las condiciones climáticas en su área presentan un riesgo severo e inmediato. Protéjase y siga las instrucciones oficiales.',
            closeAlertWait: (s) => `CERRAR ALERTA (${s}s)`,
            closeAlertReady: 'CERRAR ALERTA',
            alertWind: (v) => `Vientos fuertes de ${v} km/h — objetos pueden salir volando`,
            alertWindCrit: (v) => `Ráfagas destructivas de ${v} km/h — riesgo de daños`,

            // AI v4.0 MAX Features
            featTemperature: 'Temperatura',
            featHumidity: 'Humedad',
            featWindSpeed: 'Vel. del Viento',
            featWindGusts: 'Ráfagas',
            featPrecipitation: 'Precipitación',
            featPressure: 'Presión',
            featCloudCover: 'Nubes',
            featVisibility: 'Visibilidad',
            featUVIndex: 'Índice UV',
            featPM25: 'PM2.5',
            featContext: 'Contexto Geog.',
            featStormIndex: 'Índice de Tormenta',
            featInstability: 'Inestabilidad',
            featDewpoint: 'Punto de Rocío',
            featFeelsLike: 'Sensación',
            featWindPower: 'Potencial de Viento',

            // AI v4.0 Causal Messages
            aiPrimaryDriver: (f, p) => `🎯 Factor principal: ${f} (contribución: ${p}%)`,
            aiMomentumPressDrop: (v) => `⬇ Caída rápida de presión (${v} hPa) indica inestabilidad.`,
            aiMomentumPressDown: '⬇ Presión en descenso, tiempo deteriorando.',
            aiMomentumPressUp: '⬆ Presión subiendo, condiciones estabilizando.',
            aiMomentumTempDelta: (v) => `🌡 Cambio térmico rápido (${v}°C) sugiere frente.`,
            aiMomentumWindUp: (v) => `💨 Viento acelerando rápido (+${v} km/h).`,
            aiMomentumMoisture: '💧 Oleada de humedad detectada.',
            aiMomentumStormLikely: '⚠ Caída de presión + viento acelerando = formación de tormenta probable.',
            aiAnomalyDetected: '⚠ Patrón atmosférico inusual detectado.',
            aiUncertaintyHigh: (v) => `⚠ Incertidumbre elevada (${v}%). Monitoree de cerca.`,
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

            // Weather descriptions
            weather: {
                0: 'Cielo Despejado', 1: 'Mayormente Despejado', 2: 'Parcialmente Nublado',
                3: 'Nublado', 45: 'Niebla', 48: 'Niebla de Escarcha',
                51: 'Llovizna Leve', 53: 'Llovizna Moderada', 55: 'Llovizna Densa',
                61: 'Lluvia Leve', 63: 'Lluvia Moderada', 65: 'Lluvia Fuerte',
                71: 'Nieve Leve', 73: 'Nieve Moderada', 75: 'Nieve Densa',
                80: 'Chubasco Leve', 81: 'Chubasco Moderado', 82: 'Chubasco Violento',
                95: 'Tormenta Eléctrica', 96: 'Tormenta de Granizo', 99: 'Tormenta Severa de Granizo'
            },

            // AI Context Analysis Strings
            aiContext: {
                tempHighAlert: '🌡️ Temperatura extremadamente alta detectada. Riesgo de deshidratación e insolación.',
                tempHighSugg: 'Hidrátese cada 30 minutos. Evite la exposición directa al sol entre las 10h-16h.',
                tempLowAlert: '❄️ Temperatura muy baja. Riesgo de hipotermia en exposición prolongada.',
                tempLowSugg: 'Use ropa en capas. Proteja las extremidades (manos, pies, orejas).',
                windCritAlert: '🌪️ ALERTA DE DEFENSA CIVIL: Ráfagas destructivas por encima de 90 km/h. Riesgo de voladuras de techos y caída de árboles.',
                windCritSugg: 'Permanezca en un refugio seguro. Aléjese de ventanas y estructuras frágiles.',
                windHighAlert: '💨 Vientos fuertes detectados. Objetos sueltos pueden ser arrojados.',
                windHighSugg: 'Recoja objetos ligeros de balcones y exteriores.',
                windModSugg: 'Viento moderado. Cuidado con los paraguas — pueden invertirse.',
                rainCritAlert: (v) => `🌊 ALERTA MÁXIMA: Precipitación intensa (>${v}mm/h). Riesgo inmediato de inundaciones y deslizamientos.`,
                rainCritSugg: 'NO intente cruzar vías inundadas a pie o en automóvil. Busque terrenos elevados.',
                rainHighAlert: (v) => `🌧️ Lluvia fuerte en curso (${v}mm). Los desagües pueden desbordarse en áreas urbanas.`,
                rainHighSugg: 'Evite áreas de laderas y márgenes de ríos. Lleve paraguas resistente.',
                rainModSugg: (v) => `☂️ Lluvia moderada (${v}mm). Lleve paraguas hoy.`,
                rainLowSugg: (v) => `🌦️ Llovizna detectada (${v}mm). Una chaqueta impermeable es suficiente.`,
                pressLowAlert: (v) => `📉 Presión atmosférica muy baja (${v} hPa). Indica formación de sistema ciclónico cercano.`,
                pressLowDet: 'Sistemas de baja presión generalmente traen inestabilidad severa en las próximas horas.',
                pressDropDet: (v) => `📊 Presión en caída (${v} hPa). Tendencia a empeorar el tiempo.`,
                pressHighDet: (v) => `📊 Presión alta y estable (${v} hPa). Buen indicador de tiempo firme.`,
                visCritAlert: '🌫️ Visibilidad crítica por debajo de 500m. Riesgo extremo para conductores.',
                visCritSugg: 'Encienda las luces bajas (nunca las altas en la niebla). Reduzca la velocidad drásticamente.',
                visLowSugg: '🌫️ Visibilidad reducida. Conduzca con mucha precaución.',
                airCritAlert: (v) => `😷 Calidad del aire PÉSIMA (PM2.5: ${v} µg/m³). Nocivo para todos los grupos.`,
                airCritSugg: 'Use mascarilla N95/FFP2 al salir. Evite la actividad física al aire libre.',
                airWarnDet: (v) => `🏭 Calidad del aire insatisfactoria (PM2.5: ${v} µg/m³). Grupos sensibles deben tener precaución.`,
                airGoodDet: (v) => `🍃 Aire limpio y saludable (PM2.5: ${v} µg/m³).`,
                uvCritAlert: (v) => `☀️ Índice UV EXTREMO (${v}). Quemaduras en menos de 10 minutos.`,
                uvCritSugg: 'Aplique protector solar FPS 50+. Use sombrero de ala ancha y gafas de sol.',
                uvWarnSugg: (v) => `☀️ UV muy alto (${v}). El protector solar es esencial hoy.`,
                cloudHighDet: (v) => `☁️ Cielo totalmente cubierto (${v}%). No se prevén aperturas de sol.`,
                cloudLowDet: (v) => `☀️ Cielo mayormente despejado (${v}% de nubes).`,
                allClearSugg: [
                    '✅ Condiciones estables en este momento.',
                    '✅ Clima sin riesgos significativos.',
                    '✅ Situación meteorológica tranquila.'
                ],
                nlgIntroSafe: 'Condiciones climáticas favorables en este momento.',
                nlgIntroWarn: 'Algunas condiciones merecen atención.',
                nlgIntroDanger: 'Atención: condiciones climáticas adversas en la zona.',
                nlgIntroCrit: 'ALERTA: condiciones climáticas peligrosas en la zona.',
                nlgAlso: 'Además,',
                nlgFinally: 'Para completar,',
                nlgOutroSafe: (v) => `Clima estable en este momento. ¡Disfruta el día!`,
                nlgOutroWarn: (v) => `Manténte atento a los cambios y toma precauciones.`,
                nlgOutroCrit: (v) => `ALERTA: Condiciones críticas detectadas. Busca refugio y evita salir.`
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
