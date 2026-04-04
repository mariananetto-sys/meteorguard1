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

    // 4. Engenharia de Features Climáticas da nossa IA
    const stormIndex = windSpeed * precipitation;
    const instability = Math.max(0, (1000 - pressureMsl) * humidity);

    // Algoritmo de Avaliação de Risco (Pipeline Backend Fast-Inference)
    let riskScore = 0.05; // Base safe

    if (temperature >= 45 || temperature <= -15) riskScore += 0.85;
    else if (temperature > 38 || temperature < 0) riskScore += 0.3;
    if (stormIndex > 5000) riskScore += 0.9;
    else if (stormIndex > 2000) riskScore += 0.6;
    else if (stormIndex > 500) riskScore += 0.4;
    else if (stormIndex > 200) riskScore += 0.2;
    
    if (windSpeed > 100) riskScore += 0.3;

    if (instability > 2000) riskScore += 0.6;
    else if (instability > 1000) riskScore += 0.3;
    if (pm25 > 100) riskScore += 0.15;

    // Calibração de limite simulando a regressão que fizemos no Front-end (0.0 a 1.0)
    riskScore = Math.min(1.0, Math.max(0.0, Math.pow(riskScore, 1.2)));
    const percentage = Math.round(riskScore * 100);

    // Geração de Linguagem Natural Básica
    let interpretationText = `Análise MeteorGuard Concluída. Risco calculado em ${percentage}%. `;
    let riskLevel = "safe";

    if (percentage > 85) {
        riskLevel = "critical";
        interpretationText += "ALERTA MÁXIMO: Níveis críticos de instabilidade ou tempestade identificados. Evite áreas de risco.";
    } else if (percentage > 50) {
        riskLevel = "danger";
        interpretationText += "PERIGO: Condições climáticas prejudiciais detectadas através da engenharia de dados. Tome cuidado.";
    } else if (percentage > 25) {
        riskLevel = "warning";
        interpretationText += "ATENÇÃO: Existem leves indícios de instabilidade (vento/chuva ou calor). Fique alerta.";
    } else {
        interpretationText += "Condições estruturais do clima estão excelentes e estáveis para o ecossistema e saúde humana.";
    }

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
            analysis: interpretationText
        }
    });
}
