// ==========================================
// METEORGUARD AI ENGINE
// Rede Neural Real com TensorFlow.js
// ==========================================

class MeteorGuardAI {
    constructor() {
        this.model = null;
        this.isReady = false;
        this.trainingLog = [];
        this.modelKey = 'meteorguard-model-v1';
        
        // Normalização dos inputs (min/max para cada feature)
        this.featureRanges = {
            temperature:    { min: -30, max: 55 },
            humidity:       { min: 0,   max: 100 },
            windSpeed:      { min: 0,   max: 150 },
            windGusts:      { min: 0,   max: 200 },
            precipitation:  { min: 0,   max: 100 },
            pressureMsl:    { min: 950, max: 1060 },
            cloudCover:     { min: 0,   max: 100 },
            visibility:     { min: 0,   max: 50000 },
            uvIndex:        { min: 0,   max: 12 },
            pm25:           { min: 0,   max: 500 },
            dangerContext:  { min: 0,   max: 3 },
            stormIndex:     { min: 0,   max: 25000 },
            instability:    { min: 0,   max: 2000 }
        };
    }

    // ==========================================
    // STEP 1: Construir a arquitetura da rede neural
    // ==========================================
    buildModel() {
        this.model = tf.sequential();

        // Camada de entrada + 1ª camada oculta (32 neurônios)
        this.model.add(tf.layers.dense({
            inputShape: [13], // 13 features de entrada
            units: 32,
            activation: 'relu',
            kernelInitializer: 'heNormal'
        }));

        // Dropout para prevenir overfitting
        this.model.add(tf.layers.dropout({ rate: 0.2 }));

        // 2ª camada oculta (16 neurônios)
        this.model.add(tf.layers.dense({
            units: 16,
            activation: 'relu',
            kernelInitializer: 'heNormal'
        }));
        this.model.add(tf.layers.dropout({ rate: 0.1 }));

        // 3ª camada oculta (8 neurônios)
        this.model.add(tf.layers.dense({
            units: 8,
            activation: 'relu',
            kernelInitializer: 'heNormal'
        }));
        this.model.add(tf.layers.dropout({ rate: 0.1 }));

        // Camada de saída (1 neurônio - probabilidade de risco 0 a 1)
        this.model.add(tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
        }));

        // Compilar com MSE (Correto para saída de riscos de regressão contínua 0→1)
        this.model.compile({
            optimizer: tf.train.adam(0.005),
            loss: 'meanSquaredError',
            metrics: ['mse']
        });

        console.log('[METEORGUARD AI] Arquitetura neural construída: 13→32→16(D)→8(D)→1');
    }

    // ==========================================
    // STEP 2: Gerar dados de treinamento sintéticos
    //  Baseados em padrões meteorológicos reais
    // ==========================================
    generateTrainingData() {
        const inputs = [];
        const outputs = [];

        // ---- CENÁRIOS SEGUROS (400 amostras, balanceado) ----
        for (let i = 0; i < 400; i++) {
            inputs.push([
                this.rand(18, 28),    // temp
                this.rand(40, 60),    // umidade
                this.rand(0, 15),     // vento
                this.rand(0, 20),     // rajada
                0,                    // chuva
                this.rand(1012, 1025),// pressão
                this.rand(0, 30),     // nuvens
                this.rand(10000, 20000), // visibilidade
                this.rand(0, 5),      // uv
                this.rand(0, 20),     // pm25
                0,                    // codigo clima (limpo)
                this.rand(0, 0),      // stormIndex
                this.rand(0, 0)       // instability
            ]);
            outputs.push([0.0]); // Risco minimo puro
        }

        // ---- CENÁRIOS DE ATENÇÃO LEVE (400 amostras, balanceado) ----
        for (let i = 0; i < 400; i++) {
            inputs.push([
                this.rand(10, 32),
                this.rand(50, 75),
                this.rand(10, 25),
                this.rand(15, 35),
                this.rand(0, 3),      // garoa
                this.rand(1005, 1015),
                this.rand(20, 60),
                this.rand(5000, 15000),
                this.rand(3, 7),
                this.rand(15, 40),
                1,                     // código: instabilidade
                this.rand(0, 75),      // stormIndex
                this.rand(0, 50)       // instability
            ]);
            outputs.push([0.25]); // Risco leve
        }

        // ---- CENÁRIOS DE ATENÇÃO MODERADA (400 amostras, balanceado) ----
        for (let i = 0; i < 400; i++) {
            inputs.push([
                this.rand(8, 25),
                this.rand(70, 90),    // umidade alta
                this.rand(20, 45),    // vento forte
                this.rand(30, 60),
                this.rand(2, 15),     // chuva moderada
                this.rand(995, 1010), // pressão caindo
                this.rand(60, 95),    // muito nublado
                this.rand(3000, 8000),// visibilidade reduzida
                this.rand(0, 3),
                this.rand(30, 80),
                2,                    // código: chuva moderada
                this.rand(40, 300),   // stormIndex
                this.rand(0, 150)     // instability
            ]);
            outputs.push([0.5]); // Risco moderado
        }

        // ---- CENÁRIOS DE PERIGO (400 amostras, balanceado) ----
        for (let i = 0; i < 400; i++) {
            inputs.push([
                this.rand(5, 20),
                this.rand(85, 98),    // umidade muito alta
                this.rand(40, 80),    // vento muito forte
                this.rand(60, 120),   // rajadas perigosas
                this.rand(10, 40),    // chuva forte
                this.rand(980, 1000), // pressão baixa
                this.rand(85, 100),   // céu totalmente coberto
                this.rand(500, 3000), // visibilidade ruim
                this.rand(0, 2),
                this.rand(50, 150),
                3,                    // código: tempestade
                this.rand(400, 2000), // stormIndex
                this.rand(100, 400)   // instability
            ]);
            outputs.push([0.85]); // Risco de perigo alto
        }

        // ---- CENÁRIOS DE RISCO EXTREMO RAROS (400 amostras, balanceado) ----
        for (let i = 0; i < 400; i++) {
            inputs.push([
                this.rand(-5, 45),
                this.rand(90, 100),   // saturação total
                this.rand(70, 200),   // vendaval extremo ou furacão
                this.rand(100, 250),  // rajadas destrutivas > 180
                this.rand(30, 150),   // chuva torrencial severa
                this.rand(940, 985),  // pressão raramente muito baixa (ciclone extratropical)
                100,                   // nuvens totais
                this.rand(10, 500),   // visibilidade quase zero
                0,
                this.rand(100, 500),  // qualidade do ar péssima
                3,                    // código: tempestade severa
                this.rand(2100, 15000), // stormIndex hiper elevado
                this.rand(300, 2000)  // instability violenta
            ]);
            outputs.push([1.0]); // Classificação pura 100% perigo
        }

        // --- Adição de Ruído Gaussiano para robustez (Generalização) ---
        for (let i = 0; i < inputs.length; i++) {
            for (let j = 0; j < inputs[i].length; j++) {
                // Adiciona ruído de ±1 a 5% dependendo do range da feature
                const noise = this.rand(-0.02, 0.02) * (inputs[i][j] || 1);
                inputs[i][j] += noise;
            }
        }

        return { inputs, outputs };
    }

    // ==========================================
    // STEP 3: Treinar a rede neural (ou carregar do cache)
    // ==========================================
    async train(onProgress) {
        // Tentar carregar modelo salvo do localStorage
        try {
            const savedModel = await tf.loadLayersModel('localstorage://' + this.modelKey);
            this.model = savedModel;
            this.model.compile({
                optimizer: tf.train.adam(0.005),
                loss: 'meanSquaredError',
                metrics: ['mse']
            });
            this.isReady = true;
            console.log('[METEORGUARD AI] ⚡ Modelo carregado do cache! Treinamento pulado.');
            if (onProgress) onProgress(15, 15, { loss: 0, accuracy: 1 });
            return;
        } catch (e) {
            console.log('[METEORGUARD AI] Nenhum modelo salvo. Iniciando treinamento...');
        }

        console.log('[METEORGUARD AI] Iniciando treinamento da rede neural (2000 cenários)...');
        
        const trainData = this.generateTrainingData();
        const inputs = tf.tensor2d(trainData.inputs.map(row => this.normalizeInput(row)));
        const outputs = tf.tensor2d(trainData.outputs);

        const epochs = 50;
        
        // Callbacks do TensorFlow.js
        const historyCallback = {
            onEpochEnd: (epoch, logs) => {
                const mse = logs.mse || 0;
                if (onProgress) {
                    onProgress(epoch + 1, epochs, logs.loss, mse);
                }
            }
        };

        // Early Stopping Real: Para o treinamento se o erro de validação parar de cair
        const earlyStop = tf.callbacks.earlyStopping({
            monitor: 'val_loss',
            patience: 5,
            minDelta: 0.0001
        });

        await this.model.fit(inputs, outputs, {
            epochs: epochs,
            batchSize: 32,
            validationSplit: 0.2,
            shuffle: true,
            callbacks: [historyCallback, earlyStop]
        });

        // Limpar tensores da memória
        inputs.dispose();
        outputs.dispose();

        // Salvar modelo no localStorage para próxima visita
        try {
            await this.model.save('localstorage://' + this.modelKey);
            console.log('[METEORGUARD AI] 💾 Modelo salvo no cache do navegador.');
        } catch (e) {
            console.warn('[METEORGUARD AI] Não foi possível salvar modelo:', e);
        }

        this.isReady = true;
        console.log('[METEORGUARD AI] ✅ Treinamento concluído! Rede neural operacional.');
    }

    // ==========================================
    // STEP 4: Fazer predições com a rede neural
    // ==========================================
    async predict(data) {
        if (!this.model) {
            console.warn('[METEORGUARD AI] Modelo neural ausente. Usando algoritmo clássico Híbrido de Fallback.');
            return this.fallbackPrediction(data);
        }

        // Engenharia de Features Dinâmica
        const stormIndex = (data.windSpeed || 0) * (data.precipitation || 0);
        const humidity = data.humidity || 50;
        const pressureMsl = data.pressureMsl || 1013;
        const instability = Math.max(0, (1000 - pressureMsl) * humidity);

        // Vector 1x13 format (mesma ordem do treinamento)
        const inputVector = [
            data.temperature || 20,
            humidity,
            data.windSpeed || 0,
            data.windGusts || 0,
            data.precipitation || 0,
            pressureMsl,
            data.cloudCover || 0,
            data.visibility || 20000,
            data.uvIndex || 0,
            data.pm25 || 10,
            data.dangerContext || 0,
            stormIndex,
            instability
        ];

        // Normalizar
        const normalized = this.normalizeInput(inputVector);
        
        // Predição (assíncrona para não bloquear UI)
        const tensor = tf.tensor2d([normalized]);
        const predTensor = this.model.predict(tensor);
        const riskData = await predTensor.data();
        const rawRisk = riskData[0];
        
        // Calibração de Risco: ajusta a sensibilidade assintótica p/ melhorar a IA em cenários moderados 
        const riskScore = Math.min(1.0, Math.max(0.0, Math.pow(rawRisk, 1.2)));
        
        tensor.dispose();
        predTensor.dispose();

        return this.interpretPrediction(riskScore, data);
    }

    // ==========================================
    // STEP 5: Interpretar a saída da rede neural
    // ==========================================
    interpretPrediction(riskScore, data) {
        const percentage = Math.round(riskScore * 100);
        
        // Build Contextual Analysis
        const analysis = this.generateDetailedAnalysis(riskScore, data);
        
        let level, title, icon, color;

        // Fetch translations for i18n dynamic string UI logic
        const langObj = typeof i18n !== 'undefined' ? i18n.translations[i18n.current] : null;

        if (riskScore < 0.2) {
            level = 'safe';
            title = langObj && langObj.aiRiskTitleSafe ? langObj.aiRiskTitleSafe(percentage) : `🟢 SEGURO — Risco ${percentage}%`;
            icon = 'fa-shield-check';
            color = '#00ff88';
        } else if (riskScore < 0.4) {
            level = 'low-warning';
            title = langObj && langObj.aiRiskTitleWarningLow ? langObj.aiRiskTitleWarningLow(percentage) : `🟡 ATENÇÃO LEVE — Risco ${percentage}%`;
            icon = 'fa-umbrella';
            color = '#ffdf00';
        } else if (riskScore < 0.65) {
            level = 'warning';
            title = langObj && langObj.aiRiskTitleWarning ? langObj.aiRiskTitleWarning(percentage) : `🟠 ATENÇÃO — Risco ${percentage}%`;
            icon = 'fa-circle-exclamation';
            color = '#ff8800';
        } else if (riskScore < 0.85) {
            level = 'danger';
            title = langObj && langObj.aiRiskTitleDanger ? langObj.aiRiskTitleDanger(percentage) : `🔴 PERIGO — Risco ${percentage}%`;
            icon = 'fa-triangle-exclamation';
            color = '#ff3366';
        } else {
            level = 'critical';
            title = langObj && langObj.aiRiskTitleCritical ? langObj.aiRiskTitleCritical(percentage) : `🚨 RISCO EXTREMO — Risco ${percentage}%`;
            icon = 'fa-skull-crossbones';
            color = '#ff0040';
        }

        const formattedTime = new Date().toLocaleTimeString(typeof i18n !== 'undefined' && i18n.current === 'en' ? 'en-US' : (typeof i18n !== 'undefined' && i18n.current === 'es' ? 'es-ES' : 'pt-BR'));

        return {
            riskScore,
            percentage,
            level,
            title,
            icon,
            color,
            analysis,
            timestamp: formattedTime
        };
    }

    // ==========================================
    // Motor de Análise Contextual Detalhada
    // ==========================================
    generateDetailedAnalysis(riskScore, data) {
        const alerts = [];
        let suggestions = [];
        const details = [];

        // Obter objeto de contexto atual do i18n
        const langObj = i18n.translations[i18n.current] || i18n.translations.pt;
        const ctx = langObj.aiContext || i18n.translations.pt.aiContext;

        // --- Análise de Temperatura ---
        if (data.temperature > 40) {
            alerts.push(ctx.tempHighAlert);
            suggestions.push(ctx.tempHighSugg);
        } else if (data.temperature < 5) {
            alerts.push(ctx.tempLowAlert);
            suggestions.push(ctx.tempLowSugg);
        }

        // --- Análise de Vento ---
        if (data.windGusts > 90) {
            alerts.push(ctx.windCritAlert);
            suggestions.push(ctx.windCritSugg);
        } else if (data.windSpeed > 50) {
            alerts.push(ctx.windHighAlert);
            suggestions.push(ctx.windHighSugg);
        } else if (data.windSpeed > 30) {
            suggestions.push(ctx.windModSugg);
        }

        // --- Análise de Chuva ---
        if (data.precipitation > 30) {
            alerts.push(ctx.rainCritAlert(data.precipitation.toFixed(1)));
            suggestions.push(ctx.rainCritSugg);
        } else if (data.precipitation > 10) {
            alerts.push(ctx.rainHighAlert);
            suggestions.push(ctx.rainHighSugg);
        } else if (data.precipitation > 2) {
            suggestions.push(ctx.rainModSugg);
        } else if (data.precipitation > 0) {
            suggestions.push(ctx.rainLowSugg);
        }

        // --- Análise de Pressão Atmosférica ---
        if (data.pressureMsl < 990) {
            alerts.push(ctx.pressLowAlert(data.pressureMsl?.toFixed(0)));
            details.push(ctx.pressLowDet);
        } else if (data.pressureMsl < 1005) {
            details.push(ctx.pressDropDet(data.pressureMsl?.toFixed(0)));
        } else if (data.pressureMsl > 1020) {
            details.push(ctx.pressHighDet(data.pressureMsl?.toFixed(0)));
        }

        // --- Análise de Visibilidade ---
        if (data.visibility < 500) {
            alerts.push(ctx.visCritAlert);
            suggestions.push(ctx.visCritSugg);
        } else if (data.visibility < 2000) {
            suggestions.push(ctx.visLowSugg);
        }

        // --- Análise de Qualidade do Ar ---
        if (data.pm25 > 150) {
            alerts.push(ctx.airCritAlert(data.pm25?.toFixed(0)));
            suggestions.push(ctx.airCritSugg);
        } else if (data.pm25 > 55) {
            details.push(ctx.airWarnDet(data.pm25?.toFixed(0)));
        } else if (data.pm25 <= 25) {
            details.push(ctx.airGoodDet(data.pm25?.toFixed(0)));
        }

        // --- Análise UV ---
        if (data.uvIndex >= 11) {
            alerts.push(ctx.uvCritAlert(data.uvIndex));
            suggestions.push(ctx.uvCritSugg);
        } else if (data.uvIndex >= 8) {
            suggestions.push(ctx.uvWarnSugg(data.uvIndex));
        }

        // --- Cobertura de Nuvens ---
        if (data.cloudCover > 90) {
            details.push(ctx.cloudHighDet(data.cloudCover));
        } else if (data.cloudCover < 20) {
            details.push(ctx.cloudLowDet(data.cloudCover));
        }

        // Filtrar sugestões inconsistentes (Céu nublado != Lindo dia para ar livre)
        if (data.cloudCover > 85) {
            suggestions = suggestions.filter(s => 
                !s.toLowerCase().includes('o ar livre') && 
                !s.toLowerCase().includes('outdoor') && 
                !s.toLowerCase().includes('al aire libre')
            );
        }

        // Se não tem nenhum alerta ou sugestão, gerar mensagem positiva
        if (alerts.length === 0 && suggestions.length === 0) {
            suggestions.push(this.pick(ctx.allClearSugg));
        }

        return { alerts, suggestions, details };
    }

    // ==========================================
    // Fallback caso a IA não tenha carregado
    // ==========================================
    fallbackPrediction(data) {
        const oldLogic = AILogicService.analyzeRisk(
            data.windSpeed || 0, 
            data.precipitation || 0, 
            data.weatherCode || 0
        );
        return {
            riskScore: oldLogic.level === 'danger' ? 0.8 : oldLogic.level === 'warning' ? 0.4 : 0.1,
            percentage: oldLogic.level === 'danger' ? 80 : oldLogic.level === 'warning' ? 40 : 10,
            level: oldLogic.level,
            title: oldLogic.title,
            icon: oldLogic.icon,
            color: '#00ff88',
            analysis: { alerts: [], suggestions: [oldLogic.message], details: [] },
            timestamp: new Date().toLocaleTimeString(typeof i18n !== 'undefined' && i18n.current === 'en' ? 'en-US' : (typeof i18n !== 'undefined' && i18n.current === 'es' ? 'es-ES' : 'pt-BR'))
        };
    }

    // ==========================================
    // MOTOR NLG — Geração de Texto Original
    // A IA compõe frases únicas analisando dados
    // ==========================================
    generateText(data, riskScore, analysis) {
        // Obter objeto de contexto atual do i18n
        const langObj = i18n.translations[i18n.current] || i18n.translations.pt;
        const ctx = langObj.aiContext || i18n.translations.pt.aiContext;
        const percentage = Math.round(riskScore * 100);

        let intro;
        if (riskScore < 0.2) intro = ctx.nlgIntroSafe;
        else if (riskScore < 0.4) intro = ctx.nlgIntroWarn;
        else if (riskScore < 0.65) intro = ctx.nlgIntroDanger;
        else intro = ctx.nlgIntroCrit;

        let text = intro + ' ';
        
        // Usar fatos traduzidos já gerados pela análise contextual
        const availableFacts = [];
        if (analysis) {
            availableFacts.push(...analysis.alerts);
            availableFacts.push(...analysis.details);
            availableFacts.push(...analysis.suggestions);
        }
        
        // Remove emoji prefix for better flow in paragraph
        const cleanFact = (str) => str.replace(/^[^\w\s]+\s*/, '').trim();

        const factsToUse = availableFacts.slice(0, 3);
        
        if (factsToUse.length >= 1) {
            const first = cleanFact(factsToUse[0]);
            text += first.charAt(0).toUpperCase() + first.slice(1) + (first.endsWith('.') ? ' ' : '. ');
        }
        
        if (factsToUse.length >= 2) {
            const second = cleanFact(factsToUse[1]);
            text += ctx.nlgAlso + ' ' + second.charAt(0).toLowerCase() + second.slice(1) + (second.endsWith('.') ? ' ' : '. ');
        }
        
        if (factsToUse.length >= 3) {
            const third = cleanFact(factsToUse[2]);
            text += ctx.nlgFinally + ' ' + third.charAt(0).toLowerCase() + third.slice(1) + (third.endsWith('.') ? ' ' : '. ');
        }

        // Conclusão
        if (riskScore < 0.2) text += ctx.nlgOutroSafe(percentage);
        else if (riskScore < 0.65) text += ctx.nlgOutroWarn(percentage);
        else text += ctx.nlgOutroCrit(percentage);

        // Remover repetições (usar Set) e garantir fluidez
        const uniqueSentences = new Set();
        text = text.split('. ')
            .map(s => s.trim())
            .filter(s => {
                const sClean = s.replace(/\.$/, ''); // Tira o ponto no final se tiver para comparar direito
                if (!sClean) return false;
                if (uniqueSentences.has(sClean)) return false;
                uniqueSentences.add(sClean);
                return true;
            })
            .join('. ');

        if (!text.endsWith('.')) text += '.';

        return text;
    }

    // Escolhe um item aleatório de um array
    pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // ==========================================
    // Utilidades
    // ==========================================
    normalizeInput(params) {
        const p = this.featureRanges;
        return [
            Math.max(0, Math.min(1, (params[0] - p.temperature.min) / (p.temperature.max - p.temperature.min))),
            Math.max(0, Math.min(1, (params[1] - p.humidity.min) / (p.humidity.max - p.humidity.min))),
            Math.max(0, Math.min(1, (params[2] - p.windSpeed.min) / (p.windSpeed.max - p.windSpeed.min))),
            Math.max(0, Math.min(1, (params[3] - p.windGusts.min) / (p.windGusts.max - p.windGusts.min))),
            Math.max(0, Math.min(1, (params[4] - p.precipitation.min) / (p.precipitation.max - p.precipitation.min))),
            Math.max(0, Math.min(1, (params[5] - p.pressureMsl.min) / (p.pressureMsl.max - p.pressureMsl.min))),
            Math.max(0, Math.min(1, (params[6] - p.cloudCover.min) / (p.cloudCover.max - p.cloudCover.min))),
            Math.max(0, Math.min(1, (params[7] - p.visibility.min) / (p.visibility.max - p.visibility.min))),
            Math.max(0, Math.min(1, (params[8] - p.uvIndex.min) / (p.uvIndex.max - p.uvIndex.min))),
            Math.max(0, Math.min(1, (params[9] - p.pm25.min) / (p.pm25.max - p.pm25.min))),
            Math.max(0, Math.min(1, (params[10] - p.dangerContext.min) / (p.dangerContext.max - p.dangerContext.min))),
            Math.max(0, Math.min(1, (params[11] - p.stormIndex.min) / (p.stormIndex.max - p.stormIndex.min))),
            Math.max(0, Math.min(1, (params[12] - p.instability.min) / (p.instability.max - p.instability.min)))
        ];
    }

    rand(min, max) {
        return Math.random() * (max - min) + min;
    }
}

// Instância global
const meteorGuardAI = new MeteorGuardAI();
