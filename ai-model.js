/**
 * @class MeteorGuardAI
 * @description Motor de Inteligência Artificial Local (TensorFlow.js) para análise de riscos climáticos.
 * Versão 2.0 — Upgrade de Regularização L2, Dados Extremos e Early Stopping Nativo.
 */
class MeteorGuardAI {
    /**
     * @constructor
     * Inicializa os parâmetros basais da IA e define os ranges de normalização das features.
     */
    constructor() {
        this.model = null;
        this.isReady = false;
        this.trainingLog = [];
        this.modelKey = 'meteorguard-model-v2.0'; // Upgrade de chave para forçar novo treino na v2.0
        this._seed = 42;

        // Normalização dos inputs (min/max para cada feature)
        this.featureRanges = {
            temperature: { min: -30, max: 55 },
            humidity: { min: 0, max: 100 },
            windSpeed: { min: 0, max: 150 },
            windGusts: { min: 0, max: 200 },
            precipitation: { min: 0, max: 100 },
            pressureMsl: { min: 950, max: 1060 },
            cloudCover: { min: 0, max: 100 },
            visibility: { min: 0, max: 50000 },
            uvIndex: { min: 0, max: 12 },
            pm25: { min: 0, max: 500 },
            dangerContext: { min: 0, max: 3 },
            stormIndex: { min: 0, max: 12 },
            instability: { min: 0, max: 60 }
        };
    }

    // PRNG com seed para reprodutibilidade (cada usuário treina o mesmo modelo)
    seededRand() {
        this._seed = (this._seed * 16807 + 0) % 2147483647;
        return (this._seed - 1) / 2147483646;
    }

    rand(min, max) {
        return this.seededRand() * (max - min) + min;
    }

    /**
     * Constrói a arquitetura da rede neural sequencial.
     * Implementa regularização L2 e ativações Leaky ReLU para evitar overfitting e gradientes nulos.
     */
    buildModel() {
        this.model = tf.sequential();

        // Camada de entrada + 1ª camada oculta (32 neurônios)
        this.model.add(tf.layers.dense({
            inputShape: [13],
            units: 32,
            kernelInitializer: 'heNormal',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }));
        this.model.add(tf.layers.leakyReLU({ alpha: 0.2 }));
        this.model.add(tf.layers.dropout({ rate: 0.2 }));

        // 2ª camada oculta (16 neurônios)
        this.model.add(tf.layers.dense({
            units: 16,
            kernelInitializer: 'heNormal',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
        }));
        this.model.add(tf.layers.leakyReLU({ alpha: 0.1 }));
        this.model.add(tf.layers.dropout({ rate: 0.1 }));

        // 3ª camada oculta (8 neurônios)
        this.model.add(tf.layers.dense({
            units: 8,
            kernelInitializer: 'heNormal'
        }));
        this.model.add(tf.layers.leakyReLU({ alpha: 0.1 }));

        // Camada de saída (1 neurônio - probabilidade de risco 0 a 1)
        this.model.add(tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
        }));

        // Compilar com MSE (Melhor para regressão de score 0→1)
        this.model.compile({
            optimizer: tf.train.adam(0.003), // Taxa de aprendizado levemente menor p/ L2
            loss: 'meanSquaredError',
            metrics: ['mse']
        });

        console.log('[METEORGUARD AI] Arquitetura v2.0 operacional (L2 + LeakyRelu).');
    }

    /**
     * Gera um dataset sintético balanceado com 3000 amostras.
     * Inclui "Black Swan Events" (Cenários Extremos Raros) para robustez.
     */
    generateTrainingData() {
        const inputs = [];
        const outputs = [];
        const samplesPerCategory = 600; // Aumento p/ 3000 amostras totais

        // ---- CENÁRIOS SEGUROS ----
        for (let i = 0; i < samplesPerCategory; i++) {
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
                0,                    // stormIndex (log1p)
                0                     // instability (normalizada)
            ]);
            outputs.push([0.0]);
        }

        // ---- CENÁRIOS DE ATENÇÃO LEVE ----
        for (let i = 0; i < samplesPerCategory; i++) {
            inputs.push([
                this.rand(10, 32),
                this.rand(50, 75) + this.rand(-5, 5),
                this.rand(10, 25),
                this.rand(15, 35),
                this.rand(0, 3),
                this.rand(1005, 1015),
                this.rand(20, 60),
                this.rand(5000, 15000),
                this.rand(3, 7),
                this.rand(15, 40),
                1,
                Math.log1p(this.rand(0, 75)),
                Math.max(0, (1000 - this.rand(1005, 1015)) * (this.rand(50, 75) / 100))
            ]);
            outputs.push([0.25]);
        }

        // ---- CENÁRIOS DE ATENÇÃO MODERADA ----
        for (let i = 0; i < samplesPerCategory; i++) {
            inputs.push([
                this.rand(8, 25),
                this.rand(70, 90),
                this.rand(20, 45),
                this.rand(30, 60),
                this.rand(2, 18),
                this.rand(995, 1010),
                this.rand(60, 95),
                this.rand(3000, 8000),
                this.rand(0, 3),
                this.rand(30, 80),
                2,
                Math.log1p(this.rand(40, 300)),
                Math.max(0, (1000 - this.rand(995, 1010)) * (this.rand(70, 90) / 100))
            ]);
            outputs.push([0.5]);
        }

        // ---- CENÁRIOS DE PERIGO ----
        for (let i = 0; i < samplesPerCategory; i++) {
            inputs.push([
                this.rand(5, 20),
                this.rand(85, 98),
                this.rand(40, 80),
                this.rand(60, 120),
                this.rand(15, 60),
                this.rand(980, 1000),
                this.rand(85, 100),
                this.rand(500, 3000),
                this.rand(0, 2),
                this.rand(50, 150),
                3,
                Math.log1p(this.rand(400, 2500)),
                Math.max(0, (1000 - this.rand(980, 1000)) * (this.rand(85, 98) / 100))
            ]);
            outputs.push([0.85]);
        }

        // ---- CENÁRIOS DE RISCO EXTREMO (BLACK SWAN EVENTS) ----
        for (let i = 0; i < samplesPerCategory; i++) {
            const isHeatwave = this.rand(0, 1) > 0.5;

            inputs.push([
                isHeatwave ? this.rand(45, 55) : this.rand(-15, 10),
                this.rand(90, 100),
                isHeatwave ? this.rand(10, 30) : this.rand(90, 250),
                isHeatwave ? this.rand(20, 50) : this.rand(120, 350),
                isHeatwave ? 0 : this.rand(40, 250),
                this.rand(930, 980),
                100,
                this.rand(10, 400),
                isHeatwave ? this.rand(10, 15) : 0,
                this.rand(150, 500),
                3,
                Math.log1p(this.rand(3000, 50000)),
                Math.max(0, (1000 - this.rand(930, 980)) * (this.rand(90, 100) / 100))
            ]);
            outputs.push([1.0]);
        }

        // --- Adição de Ruído Gaussiano Final ---
        for (let i = 0; i < inputs.length; i++) {
            for (let j = 0; j < inputs[i].length; j++) {
                const noise = this.rand(-0.02, 0.02) * (inputs[i][j] || 1);
                inputs[i][j] += noise;
            }
        }

        return { inputs, outputs };
    }

    /**
     * Treina a rede neural ou carrega do cache local do navegador.
     * Implementa Early Stopping nativo para parar o treino quando o erro de validação estagna.
     * @param {Function} onProgress Callback para atualizar a barra de progresso na UI.
     */
    async train(onProgress) {
        try {
            const savedModel = await tf.loadLayersModel('localstorage://' + this.modelKey);
            this.model = savedModel;
            this.model.compile({
                optimizer: tf.train.adam(0.003),
                loss: 'meanSquaredError',
                metrics: ['mse']
            });
            this.isReady = true;
            console.log('[METEORGUARD AI] ⚡ Modelo v2.0 carregado do cache!');
            if (onProgress) onProgress(20, 20, { loss: 0, accuracy: 1 });
            return;
        } catch (e) {
            console.log('[METEORGUARD AI] Treinando novo motor v2.0...');
        }

        const trainData = this.generateTrainingData();
        const inputs = tf.tensor2d(trainData.inputs.map(row => this.normalizeInput(row)));
        const outputs = tf.tensor2d(trainData.outputs);

        const epochs = 60;
        
        // Usando um único objeto de callback para evitar incompatibilidades de Array no TFJS 4.x
        const callbacks = {
            onEpochEnd: (epoch, logs) => {
                if (onProgress) {
                    onProgress(epoch + 1, epochs, logs);
                }
            }
        };

        await this.model.fit(inputs, outputs, {
            epochs: epochs,
            batchSize: 48,
            validationSplit: 0.15,
            shuffle: true,
            callbacks: callbacks
        });

        inputs.dispose();
        outputs.dispose();

        try {
            await this.model.save('localstorage://' + this.modelKey);
        } catch (e) {
            console.warn('[METEORGUARD AI] Erro ao cachear modelo:', e);
        }

        this.isReady = true;
    }

    // ==========================================
    // STEP 4: Fazer predições com a rede neural
    // ==========================================
    async predict(data) {
        if (!this.model) {
            console.warn('[METEORGUARD AI] Modelo neural ausente. Usando algoritmo clássico Híbrido de Fallback.');
            return this.fallbackPrediction(data);
        }

        // Engenharia de Features Dinâmica (com escala logarítmica e normalização)
        const stormIndex = Math.log1p((data.windSpeed || 0) * (data.precipitation || 0));
        const humidity = data.humidity || 50;
        const pressureMsl = data.pressureMsl || 1013;
        const instability = Math.max(0, (1000 - pressureMsl) * (humidity / 100));

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

        // Calibração Híbrida: mistura IA Neural (80%) + Heurística (20%) para robustez
        const heuristicScore = this.quickHeuristic(data);
        const riskScore = Math.min(1.0, Math.max(0.0, rawRisk * 0.8 + heuristicScore * 0.2));

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
            title = i18n.t('aiRiskTitleSafe')(percentage);
            icon = 'fa-shield-check';
            color = '#00ff88';
        } else if (riskScore < 0.4) {
            level = 'low-warning';
            title = i18n.t('aiRiskTitleWarningLow')(percentage);
            icon = 'fa-umbrella';
            color = '#ffdf00';
        } else if (riskScore < 0.65) {
            level = 'warning';
            title = i18n.t('aiRiskTitleWarning')(percentage);
            icon = 'fa-circle-exclamation';
            color = '#ff8800';
        } else if (riskScore < 0.85) {
            level = 'danger';
            title = i18n.t('aiRiskTitleDanger')(percentage);
            icon = 'fa-triangle-exclamation';
            color = '#ff3366';
        } else {
            level = 'critical';
            title = i18n.t('aiRiskTitleCritical')(percentage);
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

        // --- Análise de Chuva (Precisão de 2 casas amigável) ---
        const rainFixed = data.precipitation ? data.precipitation.toFixed(2) : '0.00';
        if (data.precipitation > 30) {
            alerts.push(ctx.rainCritAlert(rainFixed));
            suggestions.push(ctx.rainCritSugg);
        } else if (data.precipitation > 10) {
            alerts.push(ctx.rainHighAlert(rainFixed));
            suggestions.push(ctx.rainHighSugg);
        } else if (data.precipitation > 2) {
            suggestions.push(ctx.rainModSugg(rainFixed));
        } else if (data.precipitation > 0) {
            suggestions.push(ctx.rainLowSugg(rainFixed));
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

        // Intro inteligente: detecta contradição clima estável + risco ambiental (UV, PM2.5)
        let intro;
        const hasUVRisk = (data.uvIndex || 0) >= 8;
        const hasAirRisk = (data.pm25 || 0) > 55;

        if (riskScore < 0.2 && (hasUVRisk || hasAirRisk)) {
            // Clima estável MAS com risco ambiental — evita contradição
            const lang = i18n.current;
            if (hasUVRisk) {
                intro = lang === 'en' ? 'Stable weather, but high solar exposure risk.' :
                    lang === 'es' ? 'Clima estable, pero con riesgo elevado de exposición solar.' :
                        'Clima estável, porém com risco elevado de exposição solar.';
            } else {
                intro = lang === 'en' ? 'Stable weather, but air quality deserves attention.' :
                    lang === 'es' ? 'Clima estable, pero la calidad del aire merece atención.' :
                        'Clima estável, porém a qualidade do ar merece atenção.';
            }
        } else if (riskScore < 0.2) {
            intro = ctx.nlgIntroSafe;
        } else if (riskScore < 0.4) {
            intro = ctx.nlgIntroWarn;
        } else if (riskScore < 0.65) {
            intro = ctx.nlgIntroDanger;
        } else {
            intro = ctx.nlgIntroCrit;
        }

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

        // Conclusão com Rain mm formatado explicitamente (2 casas decimais)
        const rainValueStr = data.precipitation ? data.precipitation.toFixed(2) : '0.00';
        if (data.precipitation > 0 && !text.includes(rainValueStr)) {
            text += `Lembre-se que temos ${rainValueStr}mm de chuva esperados. `;
        }

        if (riskScore < 0.2) text += ctx.nlgOutroSafe(percentage);
        else if (riskScore < 0.65) text += ctx.nlgOutroWarn(percentage);
        else text += ctx.nlgOutroCrit(percentage);

        // Remover repetições por SIMILARIDADE (não só idênticas)
        const normalize = (s) => s.toLowerCase().replace(/[^a-záéíóúâêãõç\s]/g, '').trim();
        const uniqueSentences = [];
        text = text.split('. ')
            .map(s => s.trim())
            .filter(s => {
                const sClean = s.replace(/\.$/, '');
                if (!sClean) return false;
                const sNorm = normalize(sClean);
                // Rejeita se >60% das palavras já apareceram em outra frase
                for (const existing of uniqueSentences) {
                    const existWords = new Set(existing.split(' '));
                    const newWords = sNorm.split(' ');
                    const overlap = newWords.filter(w => w.length > 3 && existWords.has(w)).length;
                    if (newWords.length > 0 && overlap / newWords.length > 0.6) return false;
                }
                uniqueSentences.push(sNorm);
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

    // ==========================================
    // Heurística rápida para calibração híbrida
    // ==========================================
    quickHeuristic(data) {
        let score = 0;
        if ((data.temperature || 20) > 40 || (data.temperature || 20) < 0) score += 0.3;
        if ((data.windSpeed || 0) > 60) score += 0.25;
        if ((data.precipitation || 0) > 20) score += 0.25;
        if ((data.pressureMsl || 1013) < 995) score += 0.2;
        if ((data.pm25 || 10) > 100) score += 0.15;
        if ((data.visibility || 20000) < 1000) score += 0.1;
        return Math.min(1.0, score);
    }
}

// Instância global
const meteorGuardAI = new MeteorGuardAI();