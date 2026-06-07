// ==========================================
// METEORGUARD CHAT API (SERVERLESS)
// Keeps Groq credentials on the server side only.
// ==========================================

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQ_PER_WINDOW = 30;
const MAX_QUERY_LENGTH = 280;
const MAX_DAILY_DAYS = 14;

function getAllowedOrigins() {
    const configured = (process.env.ALLOWED_ORIGIN || 'https://meteorguard.vercel.app')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);

    const productionOrigins = [
        ...configured,
        'https://meteorguard1.vercel.app',
        'https://meteorguard1-gabriela19288427-ais-projects.vercel.app'
    ];

    if (process.env.NODE_ENV !== 'production') {
        productionOrigins.push('http://localhost:5179', 'http://127.0.0.1:5179', 'http://localhost:5500', 'http://127.0.0.1:5500');
    }

    return productionOrigins;
}

function applyCors(req, res) {
    const origin = req.headers.origin;
    const allowedOrigins = getAllowedOrigins();

    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin && process.env.NODE_ENV !== 'production') {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    } else if (!origin) {
        res.status(403).json({ error: 'Origem obrigatória em produção.' });
        return false;
    } else if (origin) {
        res.status(403).json({ error: 'Origem não autorizada.' });
        return false;
    }

    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return true;
}

function getIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    return forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    for (const [key, timestamps] of rateLimitMap.entries()) {
        const active = timestamps.filter(timestamp => timestamp > windowStart);
        if (active.length === 0) rateLimitMap.delete(key);
        else rateLimitMap.set(key, active);
    }

    const timestamps = (rateLimitMap.get(ip) || []).filter(timestamp => timestamp > windowStart);
    if (timestamps.length >= MAX_REQ_PER_WINDOW) return false;

    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);
    return true;
}

function asNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function sanitizeWeatherData(raw = {}) {
    return {
        temperature: asNumber(raw.temperature, 20),
        feelsLike: asNumber(raw.feelsLike ?? raw.temperature, 20),
        humidity: Math.max(0, Math.min(100, asNumber(raw.humidity, 50))),
        windSpeed: Math.max(0, Math.min(250, asNumber(raw.windSpeed, 0))),
        windGusts: Math.max(0, Math.min(300, asNumber(raw.windGusts, 0))),
        precipitation: Math.max(0, Math.min(300, asNumber(raw.precipitation, 0))),
        uvIndex: Math.max(0, Math.min(15, asNumber(raw.uvIndex, 0))),
        regionalState: Math.max(0, Math.min(1, asNumber(raw.regionalState, 0))),
        name: String(raw.name || '').slice(0, 80),
        type: String(raw.type || 'PPL').slice(0, 12),
        daily: Array.isArray(raw.daily) ? raw.daily.slice(0, MAX_DAILY_DAYS).map(day => ({
            date: String(day.date || '').slice(0, 16),
            maxTemp: asNumber(day.maxTemp, 0),
            minTemp: asNumber(day.minTemp, 0),
            rainSum: asNumber(day.rainSum, 0),
            rainProb: Math.max(0, Math.min(100, asNumber(day.rainProb, 0)))
        })) : []
    };
}

function buildAnalysisPrompt(data) {
    return `Você é o MeteorGuard AI. Escreva uma análise climática curta e objetiva, com 1 ou 2 frases, para o alerta da dashboard.
Dados em tempo real: Sensação térmica: ${Math.round(data.feelsLike)}°C; termômetro: ${Math.round(data.temperature)}°C; umidade: ${data.humidity}%; vento: ${data.windSpeed} km/h; chuva: ${data.precipitation} mm/h.
Regras:
1. Fale como um assistente meteorológico amigável, natural e focado em segurança.
2. Se a sensação térmica for menor que 27°C, não use "abafado", "calor intenso", "clima pesado" ou recomendações de calor. Descreva como seguro, ameno ou estável quando os outros dados também estiverem baixos.
3. Se a sensação térmica for maior que 29°C, demonstre atenção ao calor e use linguagem natural como "bastante abafado", "calor intenso" ou "clima pesado".
4. Não use markdown, rótulos ou marcações robóticas.`;
}

function buildChatPrompt(query, data) {
    const name = data.name || 'Localização desconhecida';
    const type = data.type || 'PPL';
    const normalizedName = name.toLowerCase();
    const explicitlyBeach = query.includes('praia') || query.includes('mar');
    const explicitlyPark = query.includes('parque');
    const isBeach = type === 'BECH' || normalizedName.includes('praia') || explicitlyBeach;
    const isPark = type === 'PARK' || normalizedName.includes('parque') || explicitlyPark;
    const explicitlyOutdoor = explicitlyBeach || explicitlyPark;
    const today = new Date().toLocaleDateString('pt-BR');
    const daily = data.daily.map(day => `- ${day.date}: Máx ${day.maxTemp}°C, Mín ${day.minTemp}°C, chuva ${day.rainSum}mm (${day.rainProb}%)`).join('\n');

    return `Você é o MeteorGuard AI, um assistente meteorológico virtual educado e focado na segurança do usuário.
Data de hoje: ${today}
Pergunta do usuário: "${query}"

Contexto local: ${name} ${isBeach ? '(praia/litoral)' : isPark ? '(parque)' : ''}
Contexto externo pedido explicitamente: ${explicitlyOutdoor ? 'sim' : 'não'}
Dados climáticos:
- Sensação térmica: ${Math.round(data.feelsLike)}°C
- Termômetro: ${Math.round(data.temperature)}°C
- Umidade: ${data.humidity}%
- Vento: ${data.windSpeed} km/h; rajadas: ${data.windGusts} km/h
- Chuva: ${data.precipitation} mm/h
- UV: ${data.uvIndex}
- Risco calculado atual: ${Math.round(data.regionalState * 100)}%

Previsão disponível:
${daily || 'Sem previsão diária disponível.'}

Instruções obrigatórias:
1. Responda diretamente à pergunta usando as métricas e segurança humana.
2. Não culpe apenas a umidade; considere temperatura, sensação térmica, chuva, vento e previsão.
3. Não mencione praia, parque ou mar se o usuário não perguntou sobre isso e se a localização não for explicitamente desse tipo.
4. Não recomende protetor solar quando a sensação térmica for menor que 27°C, a menos que o UV esteja alto (8 ou mais) ou o usuário tenha perguntado sobre sol.
5. Se a sensação térmica for menor que 24°C, descreva como frio/ameno. Não chame de calor, abafado ou clima de praia.
6. Se houver alta chance de chuva, priorize guarda-chuva/capa e planejamento de deslocamento.
7. Seja conciso: 2 ou 3 frases naturais.
8. Não use markdown; responda em Português do Brasil.`;
}
async function callGroq(prompt, maxTokens) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        const error = new Error('GROQ_API_KEY não configurada.');
        error.statusCode = 503;
        throw error;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
            max_tokens: maxTokens
        })
    });

    if (!response.ok) {
        const error = new Error(`Groq retornou HTTP ${response.status}.`);
        error.statusCode = response.status;
        throw error;
    }

    const result = await response.json();
    return (result.choices?.[0]?.message?.content || '').trim();
}

export default async function handler(req, res) {
    if (!applyCors(req, res)) return;

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const ip = getIp(req);
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Limite de uso atingido. Aguarde um momento.' });
    }

    const mode = String(req.body?.mode || '').toLowerCase();
    const data = sanitizeWeatherData(req.body?.data || {});
    const rawQuery = String(req.body?.query || '').trim();
    const query = rawQuery.slice(0, MAX_QUERY_LENGTH).toLowerCase();

    try {
        let prompt;
        let maxTokens;

        if (mode === 'analysis') {
            prompt = buildAnalysisPrompt(data);
            maxTokens = 90;
        } else if (mode === 'chat') {
            if (!query) return res.status(400).json({ error: 'Pergunta vazia.' });
            prompt = buildChatPrompt(query, data);
            maxTokens = 170;
        } else {
            return res.status(400).json({ error: 'Modo inválido.' });
        }

        const text = await callGroq(prompt, maxTokens);
        if (!text) return res.status(502).json({ error: 'Resposta vazia da IA.' });

        return res.status(200).json({ success: true, text });
    } catch (error) {
        const status = error.statusCode && error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500;
        return res.status(status).json({ error: status === 503 ? error.message : 'IA temporariamente indisponível.' });
    }
}
