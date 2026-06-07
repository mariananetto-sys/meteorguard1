// ==========================================
// METEORGUARD BACKEND API (SERVERLESS)
// Risk scoring endpoint with API-key auth and bounded inputs.
// ==========================================

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQ_PER_WINDOW = 100;

function checkRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    for (const [key, timestamps] of rateLimitMap.entries()) {
        const active = timestamps.filter(t => t > windowStart);
        if (active.length === 0) rateLimitMap.delete(key);
        else rateLimitMap.set(key, active);
    }

    const timestamps = (rateLimitMap.get(ip) || []).filter(t => t > windowStart);
    if (timestamps.length >= MAX_REQ_PER_WINDOW) return false;

    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);
    return true;
}

function getAllowedOrigins() {
    const allowedOrigins = [
        ...(process.env.ALLOWED_ORIGIN || 'https://meteorguard.vercel.app').split(',').map(origin => origin.trim()).filter(Boolean),
        'https://meteorguard1.vercel.app',
        'https://meteorguard1-gabriela19288427-ais-projects.vercel.app'
    ];

    if (process.env.NODE_ENV !== 'production') {
        allowedOrigins.push('http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:5179', 'http://localhost:5179');
    }

    return allowedOrigins;
}

function applyCors(req, res) {
    const origin = req.headers.origin;
    const allowedOrigins = getAllowedOrigins();

    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin && process.env.NODE_ENV !== 'production') {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    } else if (origin) {
        res.status(403).json({ error: 'CORS bloqueou esta origem. Acesso não suportado.' });
        return false;
    }

    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
    return true;
}

function getIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    return forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';
}

function validateInput(body) {
    if (!body || typeof body !== 'object') return { isValid: false, error: 'Payload inválido ou vazio.' };

    const safeData = {
        temperature: Number(body.temperature ?? 25),
        humidity: Number(body.humidity ?? 50),
        windSpeed: Number(body.windSpeed ?? 0),
        precipitation: Number(body.precipitation ?? 0),
        pressureMsl: Number(body.pressureMsl ?? 1013),
        pm25: Number(body.pm25 ?? 10)
    };

    for (const [key, value] of Object.entries(safeData)) {
        if (!Number.isFinite(value)) return { isValid: false, error: `Parâmetro '${key}' vazio ou inválido.` };
    }

    safeData.temperature = Math.max(-50, Math.min(65, safeData.temperature));
    safeData.humidity = Math.max(0, Math.min(100, safeData.humidity));
    safeData.windSpeed = Math.max(0, Math.min(300, safeData.windSpeed));
    safeData.precipitation = Math.max(0, Math.min(500, safeData.precipitation));
    safeData.pressureMsl = Math.max(800, Math.min(1100, safeData.pressureMsl));
    safeData.pm25 = Math.max(0, Math.min(500, safeData.pm25));

    return { isValid: true, safeData };
}

function computeFeatures(safeData) {
    const stormIndex = Math.log1p(safeData.windSpeed * safeData.precipitation);
    const instability = Math.max(0, (1000 - safeData.pressureMsl) * (safeData.humidity / 100));
    return { stormIndex, instability };
}

function calculateRisk(safeData, features) {
    let riskScore = 0.05;

    if (safeData.temperature >= 40) riskScore += ((safeData.temperature - 35) / 25) * 0.4;
    else if (safeData.temperature <= -5) riskScore += ((Math.abs(safeData.temperature) - 5) / 45) * 0.4;

    if (features.stormIndex > 3) riskScore += (features.stormIndex / 10) * 0.5;
    if (safeData.windSpeed > 60) riskScore += (safeData.windSpeed / 300) * 0.4;
    if (features.instability > 10) riskScore += (features.instability / 60) * 0.3;
    if (safeData.pm25 > 50) riskScore += (Math.min(safeData.pm25, 500) / 500) * 0.2;

    return Math.min(1.0, Math.max(0.0, riskScore));
}

function generateNLG(percentage, safeData) {
    let riskLevel = 'safe';
    let riskTitle = '';
    let interpretationText = '';

    const rainStr = `(Chuva estimada: ${safeData.precipitation.toFixed(1)}mm)`;

    if (percentage > 85) {
        riskLevel = 'critical';
        riskTitle = 'Tempo Extremo - Busque Abrigo';
        interpretationText = `ALERTA: níveis críticos de instabilidade identificados ${rainStr}. PM2.5: ${safeData.pm25} µg/m³. Condições extremamente perigosas. Evite áreas de risco e busque abrigo.`;
    } else if (percentage > 50) {
        riskLevel = 'danger';
        riskTitle = 'Condições Severas - Evite Exposição';
        interpretationText = `Condições climáticas severas detectadas ${rainStr}. PM2.5: ${safeData.pm25} µg/m³. Fique em segurança e acompanhe o radar.`;
    } else if (percentage > 25) {
        riskLevel = 'warning';
        riskTitle = 'Leve Instabilidade - Fique Atento';
        interpretationText = `Existem leves indícios de instabilidade como vento forte ou ${rainStr}. PM2.5: ${safeData.pm25} µg/m³. Tenha precaução em atividades ao ar livre.`;
    } else {
        riskLevel = 'safe';
        riskTitle = 'Clima Estável - Condições Favoráveis';
        interpretationText = `Condições climáticas favoráveis no momento ${rainStr}. PM2.5: ${safeData.pm25} µg/m³. Clima estável. Aproveite o dia.`;
    }

    return {
        riskLevel,
        riskPercentage: percentage,
        analysis: `${riskTitle}\n${interpretationText}`
    };
}

export default function handler(req, res) {
    if (!applyCors(req, res)) return;

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });

    const ip = getIp(req);
    if (!checkRateLimit(ip)) {
        console.warn({ event: 'rate_limit_exceeded', time: new Date().toISOString() });
        return res.status(429).json({ error: 'Too Many Requests. Limite atingido. Aguarde.' });
    }

    const secureApiKey = process.env.API_KEY;
    const userApiKey = req.headers['x-api-key'];

    if (!secureApiKey) {
        console.error({ event: 'missing_api_key_env' });
        return res.status(500).json({ error: 'API_KEY não configurada no ambiente.' });
    }

    if (!userApiKey || userApiKey !== secureApiKey) {
        console.warn({ event: 'unauthorized_access', reason: 'Invalid API KEY' });
        return res.status(401).json({ error: 'Acesso negado. API Key inválida.' });
    }

    const validation = validateInput(req.body);
    if (!validation.isValid) {
        console.error({ event: 'bad_request', error: validation.error });
        return res.status(400).json({ error: validation.error });
    }

    const { safeData } = validation;
    const features = computeFeatures(safeData);
    const riskScore = calculateRisk(safeData, features);
    const percentage = Math.round(riskScore * 100);
    const predictionObj = generateNLG(percentage, safeData);

    console.log({
        event: 'risk_analysis_success',
        score: riskScore,
        level: predictionObj.riskLevel
    });

    return res.status(200).json({
        success: true,
        auth: 'success',
        computedFeatures: {
            stormIndex: features.stormIndex.toFixed(2),
            instability: features.instability.toFixed(2)
        },
        prediction: predictionObj
    });
}
