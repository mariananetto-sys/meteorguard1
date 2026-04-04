// ==========================================
// METEORGUARD AI — Vercel Serverless Function
// Conecta com o Google Gemini (gratuito)
// ==========================================

export default async function handler(req, res) {
    // Apenas aceitar POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'API Key do Gemini não configurada.' });
    }

    try {
        const weatherData = req.body;

        // Construir o prompt para o Gemini
        const prompt = `Você é a MeteorGuard AI, uma inteligência artificial especializada em análise climática e meteorologia. Você faz parte de um sistema de monitoramento de clima em tempo real.

Analise os seguintes dados meteorológicos coletados agora de sensores reais e escreva uma análise curta (máximo 3 frases) em português brasileiro. Seja direto, técnico mas acessível, e dê conselhos práticos para o usuário. Use dados específicos dos sensores na sua resposta.

DADOS DOS SENSORES:
- Temperatura: ${weatherData.temperature}°C
- Sensação térmica: ${weatherData.feelsLike}°C
- Umidade relativa: ${weatherData.humidity}%
- Velocidade do vento: ${weatherData.windSpeed} km/h
- Rajadas de vento: ${weatherData.windGusts} km/h
- Precipitação atual: ${weatherData.precipitation} mm/h
- Pressão atmosférica: ${weatherData.pressureMsl} hPa
- Cobertura de nuvens: ${weatherData.cloudCover}%
- Visibilidade: ${(weatherData.visibility / 1000).toFixed(1)} km
- Índice UV: ${weatherData.uvIndex}
- Qualidade do ar (PM2.5): ${weatherData.pm25} µg/m³
- Condição: ${weatherData.weatherDescription}
- Nível de risco calculado pela rede neural: ${weatherData.riskPercentage}%

Responda APENAS com o texto da análise, sem títulos, sem bullet points, sem markdown. Apenas o parágrafo direto.`;

        // Chamar a API REST do Gemini
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 200
                }
            })
        });

        if (!geminiResponse.ok) {
            const errData = await geminiResponse.text();
            console.error('Gemini API error:', errData);
            return res.status(500).json({ error: 'Falha ao consultar o Gemini.' });
        }

        const geminiData = await geminiResponse.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Análise indisponível no momento.';

        return res.status(200).json({ analysis: text.trim() });

    } catch (error) {
        console.error('Serverless function error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
