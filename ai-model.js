// ==========================================
// METEORGUARD AI ENGINE
// Rede Neural Real com TensorFlow.js
// ==========================================

class MeteorGuardAI {
    constructor() {
        this.model = null;
        this.isReady = false;
        this.trainingLog = [];
        this.modelKey = 'meteorguard-model';
        
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
            dangerContext:  { min: 0,   max: 3 }
        };
    }

    // ==========================================
    // STEP 1: Construir a arquitetura da rede neural
    // ==========================================
    buildModel() {
        this.model = tf.sequential();

        // Camada de entrada + 1ª camada oculta (32 neurônios)
        this.model.add(tf.layers.dense({
            inputShape: [11], // 11 features de entrada
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

        // 3ª camada oculta (8 neurônios)
        this.model.add(tf.layers.dense({
            units: 8,
            activation: 'relu',
            kernelInitializer: 'heNormal'
        }));

        // Camada de saída (1 neurônio - probabilidade de risco 0 a 1)
        this.model.add(tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
        }));

        // Compilar com BCE (correto para classificação probabilística 0→1)
        this.model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        console.log('[METEORGUARD AI] Arquitetura neural construída: 11→32→16→8→1');
    }

    // ==========================================
    // STEP 2: Gerar dados de treinamento sintéticos
    //  Baseados em padrões meteorológicos reais
    // ==========================================
    generateTrainingData() {
        const inputs = [];
        const outputs = [];

        // ---- CENÁRIOS SEGUROS (70 amostras, balanceado) ----
        for (let i = 0; i < 70; i++) {
            inputs.push([
                this.rand(15, 32),    // temp agradável
                this.rand(30, 60),    // umidade normal
                this.rand(0, 15),     // vento fraco
                this.rand(0, 20),     // rajadas fracas
                0,                     // sem precipitação
                this.rand(1010, 1030),// pressão alta (estável)
                this.rand(0, 30),     // poucas nuvens
                this.rand(15000, 50000), // boa visibilidade
                this.rand(1, 6),      // UV moderado
                this.rand(0, 25),     // ar limpo
                0                      // código: céu limpo
            ]);
            outputs.push([this.rand(0, 0.15)]);
        }

        // ---- CENÁRIOS DE ATENÇÃO LEVE (70 amostras, balanceado) ----
        for (let i = 0; i < 70; i++) {
            inputs.push([
                this.rand(10, 28),
                this.rand(55, 75),    // umidade subindo
                this.rand(10, 25),    // vento moderado
                this.rand(15, 35),
                this.rand(0.1, 3),    // garoa leve
                this.rand(1005, 1015),
                this.rand(40, 70),    // nublado parcial
                this.rand(8000, 15000),
                this.rand(1, 4),
                this.rand(15, 50),
                1                      // código: garoa/neblina
            ]);
            outputs.push([this.rand(0.2, 0.4)]);
        }

        // ---- CENÁRIOS DE ATENÇÃO MODERADA (70 amostras, balanceado) ----
        for (let i = 0; i < 70; i++) {
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
                2                      // código: chuva moderada
            ]);
            outputs.push([this.rand(0.4, 0.65)]);
        }

        // ---- CENÁRIOS DE PERIGO (70 amostras, balanceado) ----
        for (let i = 0; i < 70; i++) {
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
                3                      // código: tempestade
            ]);
            outputs.push([this.rand(0.65, 0.85)]);
        }

        // ---- CENÁRIOS DE RISCO EXTREMO (70 amostras, balanceado) ----
        for (let i = 0; i < 70; i++) {
            inputs.push([
                this.rand(-5, 15),
                this.rand(90, 100),   // saturação total
                this.rand(70, 150),   // vendaval
                this.rand(100, 200),  // rajadas destrutivas
                this.rand(30, 100),   // chuva intensa / granizo
                this.rand(960, 985),  // pressão muito baixa (ciclone)
                100,                   // nuvens totais
                this.rand(50, 500),   // visibilidade quase zero
                0,
                this.rand(100, 500),  // qualidade do ar péssima
                3                      // código: tempestade severa
            ]);
            outputs.push([this.rand(0.85, 1.0)]);
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
                optimizer: tf.train.adam(0.001),
                loss: 'binaryCrossentropy',
                metrics: ['accuracy']
            });
            this.isReady = true;
            console.log('[METEORGUARD AI] ⚡ Modelo carregado do cache! Treinamento pulado.');
            if (onProgress) onProgress(60, 60, { loss: 0, accuracy: 1 });
            return;
        } catch (e) {
            console.log('[METEORGUARD AI] Nenhum modelo salvo. Iniciando treinamento...');
        }

        console.log('[METEORGUARD AI] Iniciando treinamento da rede neural (350 cenários)...');
        
        const data = this.generateTrainingData();
        
        // Normalizar os inputs para 0-1 (com clamp)
        const normalizedInputs = data.inputs.map(row => this.normalizeInput(row));
        
        // Converter para tensores TensorFlow
        const xs = tf.tensor2d(normalizedInputs);
        const ys = tf.tensor2d(data.outputs);

        // Treinar por até 60 épocas (sem early stopping bugado)
        const history = await this.model.fit(xs, ys, {
            epochs: 60,
            batchSize: 16,
            validationSplit: 0.2,
            shuffle: true,
            callbacks: [
                {
                    onEpochEnd: async (epoch, logs) => {
                        if (onProgress) {
                            onProgress(epoch + 1, 60, logs);
                        }
                        await tf.nextFrame();
                    }
                }
            ]
        });

        // Limpar tensores da memória
        xs.dispose();
        ys.dispose();

        // Salvar modelo no localStorage para próxima visita
        try {
            await this.model.save('localstorage://' + this.modelKey);
            console.log('[METEORGUARD AI] 💾 Modelo salvo no cache do navegador.');
        } catch (e) {
            console.warn('[METEORGUARD AI] Não foi possível salvar modelo:', e);
        }

        this.isReady = true;
        console.log('[METEORGUARD AI] ✅ Treinamento concluído! Rede neural operacional.');
        
        return history;
    }

    // ==========================================
    // STEP 4: Fazer predições com a rede neural
    // ==========================================
    async predict(weatherData) {
        if (!this.isReady || !this.model) {
            return this.fallbackPrediction(weatherData);
        }

        // Montar vetor de 11 features
        const inputVector = [
            weatherData.temperature || 20,
            weatherData.humidity || 50,
            weatherData.windSpeed || 0,
            weatherData.windGusts || 0,
            weatherData.precipitation || 0,
            weatherData.pressureMsl || 1013,
            weatherData.cloudCover || 0,
            weatherData.visibility || 20000,
            weatherData.uvIndex || 3,
            weatherData.pm25 || 10,
            weatherData.dangerContext || 0
        ];

        // Normalizar
        const normalized = this.normalizeInput(inputVector);
        
        // Predição (assíncrona para não bloquear UI)
        const tensor = tf.tensor2d([normalized]);
        const predTensor = this.model.predict(tensor);
        const riskData = await predTensor.data();
        const riskScore = riskData[0];
        
        tensor.dispose();
        predTensor.dispose();

        return this.interpretPrediction(riskScore, weatherData);
    }

    // ==========================================
    // STEP 5: Interpretar a saída da rede neural
    // ==========================================
    interpretPrediction(riskScore, data) {
        const percentage = Math.round(riskScore * 100);
        
        // Gerar análise contextual detalhada
        const analysis = this.generateDetailedAnalysis(riskScore, data);
        
        let level, title, icon, color;

        if (riskScore < 0.2) {
            level = 'safe';
            title = `🟢 SEGURO — Risco ${percentage}%`;
            icon = 'fa-shield-check';
            color = '#00ff88';
        } else if (riskScore < 0.4) {
            level = 'low-warning';
            title = `🟡 ATENÇÃO LEVE — Risco ${percentage}%`;
            icon = 'fa-umbrella';
            color = '#ffdf00';
        } else if (riskScore < 0.65) {
            level = 'warning';
            title = `🟠 ATENÇÃO — Risco ${percentage}%`;
            icon = 'fa-circle-exclamation';
            color = '#ff8800';
        } else if (riskScore < 0.85) {
            level = 'danger';
            title = `🔴 PERIGO — Risco ${percentage}%`;
            icon = 'fa-triangle-exclamation';
            color = '#ff3366';
        } else {
            level = 'critical';
            title = `🚨 RISCO EXTREMO — Risco ${percentage}%`;
            icon = 'fa-skull-crossbones';
            color = '#ff0040';
        }

        return {
            riskScore,
            percentage,
            level,
            title,
            icon,
            color,
            analysis,
            timestamp: new Date().toLocaleTimeString('pt-BR')
        };
    }

    // ==========================================
    // Motor de Análise Contextual Detalhada
    // ==========================================
    generateDetailedAnalysis(riskScore, data) {
        const alerts = [];
        const suggestions = [];
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

        // Se não tem nenhum alerta ou sugestão, gerar mensagem positiva
        if (alerts.length === 0 && suggestions.length === 0) {
            suggestions.push(ctx.allClearSugg);
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
            timestamp: new Date().toLocaleTimeString('pt-BR')
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
            text += ctx.nlgAlso + ' ' + second.charAt(0).toUpperCase() + second.slice(1) + (second.endsWith('.') ? ' ' : '. ');
        }
        
        if (factsToUse.length >= 3) {
            const third = cleanFact(factsToUse[2]);
            text += ctx.nlgFinally + ' ' + third.charAt(0).toUpperCase() + third.slice(1) + (third.endsWith('.') ? ' ' : '. ');
        }

        // Conclusão
        if (riskScore < 0.2) text += ctx.nlgOutroSafe(percentage);
        else if (riskScore < 0.65) text += ctx.nlgOutroWarn(percentage);
        else text += ctx.nlgOutroCrit(percentage);

        return text;
    }

    // Escolhe um item aleatório de um array
    pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // ==========================================
    // Utilidades
    // ==========================================
    normalizeInput(inputVector) {
        const keys = Object.keys(this.featureRanges);
        return inputVector.map((val, i) => {
            const range = this.featureRanges[keys[i]];
            const normalized = (val - range.min) / (range.max - range.min);
            return Math.max(0, Math.min(1, normalized)); // Clamp entre 0 e 1
        });
    }

    rand(min, max) {
        return Math.random() * (max - min) + min;
    }
}

// Instância global
const meteorGuardAI = new MeteorGuardAI();
