export default function handler(req, res) {
    // 1. CORS headers to allow requests from anywhere for testing
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key')

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
    }

    // 2. Sistema de Autenticação via API KEY
    const MINHA_API_KEY_SECRETA = "mg_key_teste_12345"; // A chave de segurança que você vai usar!
    
    const userApiKey = req.headers['x-api-key'];

    if (!userApiKey) {
        return res.status(401).json({ error: "Acesso Negado! Faltando o header 'x-api-key'." });
    }

    if (userApiKey !== MINHA_API_KEY_SECRETA) {
        return res.status(401).json({ error: "Acesso Negado! API Key inválida." });
    }

    // 3. Extrair as informações meteorológicas do corpo da requisição (JSON)
    const { 
        temperature = 25, 
        humidity = 50, 
        windSpeed = 0, 
        precipitation = 0, 
        pressureMsl = 1013, 
        pm25 = 10 
    } = req.body || {};

    // 4. Engenharia de Features Climáticas (log-scaled + normalizada)
    const stormIndex = Math.log1p(windSpeed * precipitation);
    const instability = Math.max(0, (1000 - pressureMsl) * (humidity / 100));

    // Algoritmo de Avaliação de Risco (Pipeline Backend Fast-Inference)
    let riskScore = 0.05; // Base safe

    if (temperature >= 45 || temperature <= -15) riskScore += 0.85;
    else if (temperature > 38 || temperature < 0) riskScore += 0.3;
    
    // stormIndex agora é log-scaled (max ~10.3 para 30000)
    if (stormIndex > 9) riskScore += 0.9;
    else if (stormIndex > 7) riskScore += 0.6;
    else if (stormIndex > 5) riskScore += 0.4;
    else if (stormIndex > 3) riskScore += 0.2;
    
    if (windSpeed > 100) riskScore += 0.3;

    // instability agora é normalizada (max ~60)
    if (instability > 40) riskScore += 0.6;
    else if (instability > 20) riskScore += 0.3;
    if (pm25 > 100) riskScore += 0.15;

    riskScore = Math.min(1.0, Math.max(0.0, riskScore));
    const percentage = Math.round(riskScore * 100);

    // Geração de Linguagem Natural (NLG) Clássica
    let interpretationText = "";
    let riskTitle = "";
    let riskLevel = "safe";

    if (percentage > 85) {
        riskLevel = "critical";
        riskTitle = `🚨 Tempo Extremo — Busque Abrigo`;
        interpretationText = `ALERTA: Níveis críticos de instabilidade identificados. (PM2.5: ${pm25} µg/m³). Condições extremamente perigosas. Evite áreas de risco e busque abrigo.`;
    } else if (percentage > 50) {
        riskLevel = "danger";
        riskTitle = `🔴 Condições Severas — Evite Exposição`;
        interpretationText = `Condições climáticas severas detectadas. Nível de poluentes (PM2.5: ${pm25} µg/m³). Fique em segurança e acompanhe o radar.`;
    } else if (percentage > 25) {
        riskLevel = "warning";
        riskTitle = `🟡 Leve Instabilidade — Fique Atento`;
        interpretationText = `Existem leves indícios de instabilidade (vento, chuva ou níveis térmicos). Ar registrado em (PM2.5: ${pm25} µg/m³). Tenha precaução em atividades ao ar livre.`;
    } else {
        riskLevel = "safe";
        riskTitle = `🟢 Clima Estável — Condições Favoráveis`;
        interpretationText = `Condições climáticas favoráveis no momento. Ar limpo e saudável (PM2.5: ${pm25} µg/m³). Clima estável. Aproveite o dia!`;
    }
    
    const finalNlgString = `${riskTitle}\n${interpretationText}`;

    // 5. Devolver os dados pela porta da API em JSON padrão RESTful
    return res.status(200).json({
        success: true,
        auth: "API Key Validada com Sucesso!",
        computedFeatures: {
            stormIndex: stormIndex.toFixed(2),
            instability: instability.toFixed(2)
        },
        prediction: {
            riskLevel: riskLevel,
            riskScore: riskScore,
            riskPercentage: percentage,
            analysis: finalNlgString
        }
    });
}
