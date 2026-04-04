// ==========================================
// METEORGUARD SERVICES
// Abstraction layer for external APIs
// ==========================================

/**
 * Weather Service
 * Currently using Open-Meteo. Can be swapped to OpenWeatherMap later.
 */
class WeatherService {
    static async getWeather(lat, lon) {
        // Open-Meteo Forecast API — busca TODOS os dados ambientais disponíveis
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_gusts_10m,surface_pressure,cloud_cover,visibility&hourly=precipitation_probability,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,uv_index_max&timezone=auto`;

        // Open-Meteo Air Quality API — qualidade do ar em tempo real
        const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,uv_index`;
        
        try {
            // Buscar de AMBAS as fontes simultaneamente (paralelismo)
            const [weatherRes, airRes] = await Promise.all([
                fetch(weatherUrl),
                fetch(airQualityUrl).catch(() => null) // fallback se air quality falhar
            ]);

            if (!weatherRes.ok) throw new Error('Falha ao buscar dados climáticos');
            
            const weatherData = await weatherRes.json();
            
            // Air quality pode falhar em algumas regiões, então protegemos
            let airData = { current: { pm2_5: 10, pm10: 15, uv_index: 3 } };
            if (airRes && airRes.ok) {
                airData = await airRes.json();
            }
            
            // Mapa completo com TODAS as informações ambientais
            return {
                current: {
                    temp: weatherData.current.temperature_2m,
                    feelsLike: weatherData.current.apparent_temperature,
                    humidity: weatherData.current.relative_humidity_2m,
                    windSpeed: weatherData.current.wind_speed_10m,
                    windGusts: weatherData.current.wind_gusts_10m || 0,
                    precipitation: weatherData.current.precipitation || 0,
                    weatherCode: weatherData.current.weather_code,
                    pressureMsl: weatherData.current.surface_pressure || 1013,
                    cloudCover: weatherData.current.cloud_cover || 0,
                    visibility: weatherData.current.visibility || 20000,
                    // Dados de qualidade do ar
                    pm25: airData.current?.pm2_5 || 10,
                    pm10: airData.current?.pm10 || 15,
                    uvIndex: airData.current?.uv_index || weatherData.daily?.uv_index_max?.[0] || 3
                },
                daily: weatherData.daily.time.map((time, index) => ({
                    date: time,
                    maxTemp: weatherData.daily.temperature_2m_max[index],
                    minTemp: weatherData.daily.temperature_2m_min[index],
                    rainSum: weatherData.daily.precipitation_sum[index],
                    rainProb: weatherData.daily.precipitation_probability_max[index],
                    weatherCode: weatherData.daily.weather_code[index],
                    uvMax: weatherData.daily.uv_index_max?.[index] || 0
                }))
            };
        } catch (error) {
            console.error("WeatherService Error:", error);
            throw error;
        }
    }

    /**
     * Maps WMO weather codes to FontAwesome icons and descriptions
     */
    static getWeatherInterpretation(code) {
        const interpretation = {
            0: { desc: 'Céu Limpo', icon: 'fa-sun', dangerContext: 0 },
            1: { desc: 'Predominantemente Limpo', icon: 'fa-cloud-sun', dangerContext: 0 },
            2: { desc: 'Parcialmente Nublado', icon: 'fa-cloud-sun', dangerContext: 0 },
            3: { desc: 'Nublado', icon: 'fa-cloud', dangerContext: 0 },
            45: { desc: 'Neblina', icon: 'fa-smog', dangerContext: 1 },
            48: { desc: 'Névoa de Geada', icon: 'fa-smog', dangerContext: 1 },
            51: { desc: 'Garoa Leve', icon: 'fa-cloud-rain', dangerContext: 1 },
            53: { desc: 'Garoa Moderada', icon: 'fa-cloud-rain', dangerContext: 1 },
            55: { desc: 'Garoa Densa', icon: 'fa-cloud-showers-heavy', dangerContext: 2 },
            61: { desc: 'Chuva Leve', icon: 'fa-cloud-rain', dangerContext: 1 },
            63: { desc: 'Chuva Moderada', icon: 'fa-cloud-showers-heavy', dangerContext: 2 },
            65: { desc: 'Chuva Forte', icon: 'fa-cloud-showers-water', dangerContext: 3 },
            71: { desc: 'Neve Leve', icon: 'fa-snowflake', dangerContext: 1 },
            73: { desc: 'Neve Moderada', icon: 'fa-snowflake', dangerContext: 2 },
            75: { desc: 'Neve Densa', icon: 'fa-snowflake', dangerContext: 3 },
            80: { desc: 'Pancada de Chuva Leve', icon: 'fa-cloud-showers-heavy', dangerContext: 1 },
            81: { desc: 'Pancada de Chuva Moderada', icon: 'fa-cloud-showers-water', dangerContext: 2 },
            82: { desc: 'Pancada de Chuva Violenta', icon: 'fa-cloud-showers-water', dangerContext: 3 },
            95: { desc: 'Tempestade de Raios', icon: 'fa-cloud-bolt', dangerContext: 3 },
            96: { desc: 'Tempestade de Granizo', icon: 'fa-cloud-meatball', dangerContext: 3 },
            99: { desc: 'Tempestade Severa de Granizo', icon: 'fa-cloud-meatball', dangerContext: 3 }
        };
        
        return interpretation[code] || { desc: 'Desconhecido', icon: 'fa-cloud', dangerContext: 0 };
    }
}

/**
 * Geocoding Service
 * Used to translate city names to coordinates
 */
class GeocodingService {
    static async searchCity(query) {
        if (!query || query.length < 2) return [];
        
        // Open-Meteo Geocoding API (free, no key)
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=pt&format=json`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.results) return [];
            
            return data.results.map(city => ({
                id: city.id,
                name: city.name,
                country: city.country,
                admin1: city.admin1, // State/Province
                lat: city.latitude,
                lon: city.longitude
            }));
        } catch (error) {
            console.error("GeocodingService Error:", error);
            return [];
        }
    }
}

/**
 * AI Logic Service
 * Analyzes weather conditions to generate risk levels and suggestions
 */
class AILogicService {
    static analyzeRisk(windSpeed, precipitation, currentCode) {
        const info = WeatherService.getWeatherInterpretation(currentCode);
        
        // Rules Engine
        // Level 3 (Danger)
        if (info.dangerContext === 3 || windSpeed > 60 || precipitation > 15) {
            return {
                level: 'danger',
                title: 'Risco Alto: Condições Severas',
                message: 'Evite sair de casa. Possibilidade de alagamentos ou destelhamentos causados pela força da tempestade.',
                icon: 'fa-triangle-exclamation'
            };
        }
        
        // Level 2 (Warning)
        if (info.dangerContext === 2 || windSpeed > 40 || precipitation > 5) {
            return {
                level: 'warning',
                title: 'Atenção: Clima Adverso',
                message: 'Chuva moderada/forte ou vento intenso. Cuidado no trânsito e com objetos que possam voar. Leve guarda-chuva.',
                icon: 'fa-circle-exclamation'
            };
        }
        
        // Minor Warning (Umbrella suggestion)
        if (info.dangerContext === 1 || precipitation > 0.5 || windSpeed > 25) {
            return {
                level: 'warning',
                title: 'Dica: Leve guarda-chuva',
                message: 'Condições de chuva leve a garoa. Pode incomodar, mas não apresenta riscos severos.',
                icon: 'fa-umbrella'
            };
        }
        
        // Safe
        return {
            level: 'safe',
            title: 'Nível: Seguro',
            message: 'O espaço aéreo e atmosférico encontra-se estável. Nenhuma anomalia iminente detectada no momento.',
            icon: 'fa-shield-check'
        };
    }
}
