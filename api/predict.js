// ==========================================
// METEORGUARD BACKEND API (SERVERLESS)
// Arquitetura Modular, Rate Limited & Sanitizada
// ==========================================

// 1. Rate limiting simples em memória (Zera no cold start do serverless, mas previne bursts)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minuto
const MAX_REQ_PER_WINDOW = 100; // Máximo 100 requests por minuto por IP

function checkRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    
    // Limpar tokens antigos (garbage collection simples para memória)
    for (const [key, timestamp] of rateLimitMap.entries()) {
        if (timestamp < windowStart) rateLimitMap.delete(key);
    }

    const timestamps = rateLimitMap.get(ip) || [];
    const validTimestamps = timestamps.filter(t => t > windowStart);
    
    if (validTimestamps.length >= MAX_REQ_PER_WINDOW) {
        return false;
    }
    
    validTimestamps.push(now);
    rateLimitMap.set(ip, validTimestamps);
    return true;
}

// 2. Validação Exaustiva e Higienização (Sanitization)
function validateInput(body) {
    if (!body || typeof body !== 'object') return { isValid: false, error: "Payload inválido ou vazio." };
    
    // Converte e higieniza contra ataques XSS ou Typecasting
    // Adicionado coalescência nula (??) para prover valores default se o frontend omitir alguma key
    const safeData = {
        temperature: Number(body.temperature ?? 25),
        humidity: Number(body.humidity ?? 50),
        windSpeed: Number(body.windSpeed ?? 0),
        precipitation: Number(body.precipitation ?? 0),
        pressureMsl: Number(body.pressureMsl ?? 1013),
        pm25: Number(body.pm25 ?? 10)
    };

    // Validar se qualquer parâmetro falhou ao virar número (NaN)
    for (const [key, value] of Object.entries(safeData)) {
        if (isNaN(value)) return { isValid: false, error: `Parâmetro '${key}' vazio ou inválido.` };
    }

    // Limits Cap: Proteção matemática (ninguém vai mandar ventos de 999999km/h)
    if (safeData.temperature > 65) safeData.temperature = 65;
    if (safeData.temperature < -50) safeData.temperature = -50;
    if (safeData.humidity > 100) safeData.humidity = 100;
    if (safeData.humidity < 0) safeData.humidity = 0;
    if (safeData.windSpeed > 300) safeData.windSpeed = 300;
    if (safeData.precipitation > 500) safeData.precipitation = 500;
    if (safeData.pressureMsl < 800) safeData.pressureMsl = 800;
    if (safeData.pressureMsl > 1100) safeData.pressureMsl = 1100;

    return { isValid: true, safeData };
}

// 3. Engenharia de Features
function computeFeatures(safeData) {
    const stormIndex = Math.log1p(safeData.windSpeed * safeData.precipitation);
    const instability = Math.max(0, (1000 - safeData.pressureMsl) * (safeData.humidity / 100));
    return { stormIndex, instability };
}

// 4. Mecanismo de Score (Escala Contínua)
function calculateRisk(safeData, features) {
    let riskScore = 0.05; // Base safe
    
    // Normalização Contínua em vez de if-elses engessados
    if (safeData.temperature >= 40) riskScore += ((safeData.temperature - 35) / 25) * 0.4;
    else if (safeData.temperature <= -5) riskScore += ((Math.abs(safeData.temperature) - 5) / 45) * 0.4;

    if (features.stormIndex > 3) riskScore += (features.stormIndex / 10) * 0.5;
    if (safeData.windSpeed > 60) riskScore += (safeData.windSpeed / 300) * 0.4;
    
    if (features.instability > 10) riskScore += (features.instability / 60) * 0.3;
    if (safeData.pm25 > 50) riskScore += (Math.min(safeData.pm25, 500) / 500) * 0.2;

    return Math.min(1.0, Math.max(0.0, riskScore));
}

// 5. Motor Natural Language Generation
function generateNLG(percentage, safeData) {
    let riskLevel = "safe";
    let riskTitle = "";
    let interpretationText = "";

    if (percentage > 85) {
        riskLevel = "critical";
        riskTitle = `🚨 Tempo Extremo — Busque Abrigo`;
        interpretationText = `ALERTA: Níveis críticos de instabilidade identificados. (PM2.5: ${safeData.pm25} µg/m³). Condições extremamente perigosas. Evite áreas de risco e busque abrigo.`;
    } else if (percentage > 50) {
        riskLevel = "danger";
        riskTitle = `🔴 Condições Severas — Evite Exposição`;
        interpretationText = `Condições climáticas severas detectadas. Nível de poluentes (PM2.5: ${safeData.pm25} µg/m³). Fique em segurança e acompanhe o radar.`;
    } else if (percentage > 25) {
        riskLevel = "warning";
        riskTitle = `🟡 Leve Instabilidade — Fique Atento`;
        interpretationText = `Existem leves indícios de instabilidade (vento, chuva ou níveis térmicos). Ar registrado em (PM2.5: ${safeData.pm25} µg/m³). Tenha precaução em atividades ao ar livre.`;
    } else {
        riskLevel = "safe";
        riskTitle = `🟢 Clima Estável — Condições Favoráveis`;
        interpretationText = `Condições climáticas favoráveis no momento. Ar limpo e saudável (PM2.5: ${safeData.pm25} µg/m³). Clima estável. Aproveite o dia!`;
    }
    
    return {
        riskLevel,
        riskPercentage: percentage,
        analysis: `${riskTitle}\n${interpretationText}`
    };
}

// ==========================================
// ENTRY POINT (Vercel Handler)
// ==========================================
export default function handler(req, res) {
    // 1. Setup CORS Restrito e Seguro (Whitelist)
    // O domínio oficial ou o de testes se permitido local
    const allowedOrigins = [
        process.env.ALLOWED_ORIGIN || 'https://meteorguard.vercel.app',
        'http://127.0.0.1:5500', 
        'http://localhost:5500',   // Libera pra desenvolvimento local via VSCode Live Server
        'null'                     // Libera pra desenvolvimento puro de arquivo duplo-click (file:///)
    ];
    
    // O Chrome manda origin como a string literal "null" se for file:///
    const origin = req.headers.origin;
    
    // Tratamento estrito de CORS
    if (allowedOrigins.includes(origin) || !origin) {
         res.setHeader('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
    } else {
        return res.status(403).json({ error: 'CORS bloqueou esta origem. Acesso não suportado.' });
    }
    
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
    // Só permite o X-API-KEY ou coisas comuns
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key')

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
    }

    // 2. Proteção Antispam / DDoS In-Memory
    let forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress;
    
    if (!checkRateLimit(ip)) {
        console.warn({ event: 'rate_limit_exceeded', ip, time: new Date() });
        return res.status(429).json({ error: 'Too Many Requests. Limite (100req/min) atingido. Aguarde.' });
    }

    // 3. Autenticação Isolada
    // Se não tiver ENV setada na Vercel, o fallback continua rodando para você, mas de forma ciente
    const SECURE_API_KEY = process.env.API_KEY || "pessoadeelneuroniobatata";
    const userApiKey = req.headers['x-api-key'];

    if (!userApiKey || userApiKey !== SECURE_API_KEY) {
        console.warn({ event: 'unauthorized_access', ip, reason: 'Invalid API KEY' });
        return res.status(401).json({ error: "Acesso Negado! API Key inválida." });
    }

    // 4. Fluxo Orientado a Serviços
    const validation = validateInput(req.body);
    if (!validation.isValid) {
        console.error({ event: 'bad_request', ip, error: validation.error, body: req.body });
        return res.status(400).json({ error: validation.error });
    }

    const { safeData } = validation;
    const features = computeFeatures(safeData);
    const riskScore = calculateRisk(safeData, features);
    const percentage = Math.round(riskScore * 100);
    const predictionObj = generateNLG(percentage, safeData);

    // 5. Log Estruturado Observability (Fácil leitura em painéis como Datadog / Vercel Logs)
    console.log({
        event: 'risk_analysis_success',
        ip,
        input: safeData,
        score: riskScore,
        level: predictionObj.riskLevel
    });

    // 6. Resposta Padrão
    return res.status(200).json({
        success: true,
        auth: "success",
        computedFeatures: {
            stormIndex: features.stormIndex.toFixed(2),
            instability: features.instability.toFixed(2)
        },
        prediction: predictionObj
    });
}
