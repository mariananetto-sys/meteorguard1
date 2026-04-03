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
        // Open-Meteo API endpoint
        // Fetching current, hourly (for today's rain), and daily forecast
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation_probability,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Falha ao buscar dados climáticos');
            
            const data = await response.json();
            
            // Map Open-Meteo response to our App's standard format
            return {
                current: {
                    temp: data.current.temperature_2m,
                    feelsLike: data.current.apparent_temperature,
                    humidity: data.current.relative_humidity_2m,
                    windSpeed: data.current.wind_speed_10m,
                    precipitation: data.current.precipitation || 0,
                    weatherCode: data.current.weather_code
                },
                daily: data.daily.time.map((time, index) => ({
                    date: time,
                    maxTemp: data.daily.temperature_2m_max[index],
                    minTemp: data.daily.temperature_2m_min[index],
                    rainSum: data.daily.precipitation_sum[index],
                    rainProb: data.daily.precipitation_probability_max[index],
                    weatherCode: data.daily.weather_code[index]
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
