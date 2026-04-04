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

        // --- Análise de Temperatura ---
        if (data.temperature > 40) {
            alerts.push('🌡️ Temperatura extremamente alta detectada. Risco de desidratação e insolação.');
            suggestions.push('Hidrate-se a cada 30 minutos. Evite exposição direta ao sol entre 10h-16h.');
        } else if (data.temperature < 5) {
            alerts.push('❄️ Temperatura muito baixa. Risco de hipotermia em exposição prolongada.');
            suggestions.push('Use roupas em camadas. Proteja extremidades (mãos, pés, orelhas).');
        }

        // --- Análise de Vento ---
        if (data.windGusts > 90) {
            alerts.push('🌪️ ALERTA DEFESA CIVIL: Rajadas destrutivas acima de 90 km/h. Risco de destelhamento e queda de árvores.');
            suggestions.push('Permaneça em abrigo seguro. Afaste-se de janelas e estruturas frágeis.');
        } else if (data.windSpeed > 50) {
            alerts.push('💨 Ventos fortes detectados. Objetos soltos podem ser arremessados.');
            suggestions.push('Recolha objetos leves de varandas e áreas externas.');
        } else if (data.windSpeed > 30) {
            suggestions.push('Vento moderado. Cuidado com guarda-chuvas — podem inverter.');
        }

        // --- Análise de Chuva ---
        if (data.precipitation > 30) {
            alerts.push('🌊 ALERTA MÁXIMO: Precipitação intensa (>' + data.precipitation.toFixed(1) + 'mm/h). Risco imediato de alagamentos e deslizamentos.');
            suggestions.push('NÃO tente atravessar vias alagadas a pé ou de carro. Procure terreno elevado.');
        } else if (data.precipitation > 10) {
            alerts.push('🌧️ Chuva forte em andamento. Bueiros podem transbordar em áreas urbanas.');
            suggestions.push('Evite áreas de encosta e margem de rios. Leve guarda-chuva reforçado.');
        } else if (data.precipitation > 2) {
            suggestions.push('☂️ Chuva moderada. Leve guarda-chuva hoje.');
        } else if (data.precipitation > 0) {
            suggestions.push('🌦️ Garoa detectada. Um casaco impermeável é suficiente.');
        }

        // --- Análise de Pressão Atmosférica ---
        if (data.pressureMsl < 990) {
            alerts.push('📉 Pressão atmosférica muito baixa (' + data.pressureMsl?.toFixed(0) + ' hPa). Indica formação de sistema ciclônico próximo.');
            details.push('Sistemas de baixa pressão geralmente trazem instabilidade severa nas próximas horas.');
        } else if (data.pressureMsl < 1005) {
            details.push('📊 Pressão em queda (' + data.pressureMsl?.toFixed(0) + ' hPa). Tendência de piora no tempo.');
        } else if (data.pressureMsl > 1020) {
            details.push('📊 Pressão alta e estável (' + data.pressureMsl?.toFixed(0) + ' hPa). Bom indicador de tempo firme.');
        }

        // --- Análise de Visibilidade ---
        if (data.visibility < 500) {
            alerts.push('🌫️ Visibilidade crítica abaixo de 500m. Risco extremo para motoristas.');
            suggestions.push('Ligue faróis baixos (nunca o alto na neblina). Reduza velocidade drasticamente.');
        } else if (data.visibility < 2000) {
            suggestions.push('🌫️ Visibilidade reduzida. Dirija com atenção redobrada.');
        }

        // --- Análise de Qualidade do Ar ---
        if (data.pm25 > 150) {
            alerts.push('😷 Qualidade do ar PÉSSIMA (PM2.5: ' + data.pm25?.toFixed(0) + ' µg/m³). Nocivo para todos os grupos.');
            suggestions.push('Use máscara N95/PFF2 ao sair. Evite atividade física ao ar livre.');
        } else if (data.pm25 > 55) {
            details.push('🏭 Qualidade do ar insatisfatória (PM2.5: ' + data.pm25?.toFixed(0) + ' µg/m³). Grupos sensíveis devem ter cautela.');
        } else if (data.pm25 <= 25) {
            details.push('🍃 Ar limpo e saudável (PM2.5: ' + data.pm25?.toFixed(0) + ' µg/m³).');
        }

        // --- Análise UV ---
        if (data.uvIndex >= 11) {
            alerts.push('☀️ Índice UV EXTREMO (' + data.uvIndex + '). Queimaduras em menos de 10 minutos.');
            suggestions.push('Aplique protetor solar FPS 50+. Use chapéu de aba larga e óculos escuros.');
        } else if (data.uvIndex >= 8) {
            suggestions.push('☀️ UV muito alto (' + data.uvIndex + '). Protetor solar é essencial hoje.');
        }

        // --- Cobertura de Nuvens ---
        if (data.cloudCover > 90) {
            details.push('☁️ Céu totalmente encoberto (' + data.cloudCover + '%). Sem aberturas de sol previstas.');
        } else if (data.cloudCover < 20) {
            details.push('☀️ Céu predominantemente limpo (' + data.cloudCover + '% de nuvens).');
        }

        // Se não tem nenhum alerta ou sugestão, gerar mensagem positiva
        if (alerts.length === 0 && suggestions.length === 0) {
            suggestions.push('✅ Condições ideais para atividades ao ar livre. Aproveite o dia!');
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
    generateText(data, riskScore) {
        const percentage = Math.round(riskScore * 100);
        const observations = [];

        // --- FASE 1: Analisar cada parâmetro e gerar observações ---

        // Temperatura
        const temp = data.temperature || 20;
        if (temp > 38) {
            observations.push({ weight: 9, text: this.pick([
                `a temperatura chegou a ${temp.toFixed(1)}°C, nível perigoso para a saúde`,
                `com ${temp.toFixed(1)}°C, o calor extremo exige atenção redobrada`,
                `os ${temp.toFixed(1)}°C registrados representam risco de desidratação e insolação`
            ])});
        } else if (temp > 32) {
            observations.push({ weight: 5, text: this.pick([
                `a temperatura está em ${temp.toFixed(1)}°C, acima do confortável`,
                `faz calor com ${temp.toFixed(1)}°C no momento`,
                `os termômetros marcam ${temp.toFixed(1)}°C na região`
            ])});
        } else if (temp < 5) {
            observations.push({ weight: 8, text: this.pick([
                `a temperatura caiu para ${temp.toFixed(1)}°C, frio intenso na região`,
                `com apenas ${temp.toFixed(1)}°C, o frio pode ser perigoso para quem ficar exposto`
            ])});
        } else if (temp < 15) {
            observations.push({ weight: 4, text: this.pick([
                `a temperatura está em ${temp.toFixed(1)}°C, um pouco fria para a época`,
                `com ${temp.toFixed(1)}°C, vale a pena levar um agasalho`
            ])});
        } else {
            observations.push({ weight: 2, text: this.pick([
                `a temperatura está agradável em ${temp.toFixed(1)}°C`,
                `com ${temp.toFixed(1)}°C, o clima está confortável`,
                `a temperatura de ${temp.toFixed(1)}°C é ideal para o dia`
            ])});
        }

        // Umidade
        const hum = data.humidity || 50;
        if (hum > 90) {
            observations.push({ weight: 6, text: this.pick([
                `a umidade do ar está em ${hum}%, deixando o ambiente muito abafado`,
                `com ${hum}% de umidade, a sensação de calor aumenta bastante`
            ])});
        } else if (hum < 30) {
            observations.push({ weight: 6, text: this.pick([
                `a umidade do ar está em apenas ${hum}%, o que pode causar desconforto respiratório`,
                `com ${hum}% de umidade, o ar seco pode provocar sangramento nasal e irritação na garganta`
            ])});
        } else {
            observations.push({ weight: 1, text: this.pick([
                `a umidade está em ${hum}%, normal para o período`,
                `a umidade do ar marca ${hum}%`
            ])});
        }

        // Vento
        const wind = data.windSpeed || 0;
        const gusts = data.windGusts || 0;
        if (gusts > 90) {
            observations.push({ weight: 10, text: this.pick([
                `as rajadas de vento chegam a ${gusts.toFixed(1)} km/h, podendo derrubar árvores e arrancar telhas`,
                `rajadas de ${gusts.toFixed(1)} km/h foram registradas — vento com potencial destrutivo`
            ])});
        } else if (wind > 50) {
            observations.push({ weight: 8, text: this.pick([
                `o vento está forte em ${wind.toFixed(1)} km/h com rajadas de ${gusts.toFixed(1)} km/h`,
                `ventos de ${wind.toFixed(1)} km/h estão varrendo a região com força`
            ])});
        } else if (wind > 25) {
            observations.push({ weight: 4, text: this.pick([
                `sopram ventos de ${wind.toFixed(1)} km/h, moderados mas perceptíveis`,
                `o vento está em ${wind.toFixed(1)} km/h — cuidado com guarda-chuvas`
            ])});
        } else {
            observations.push({ weight: 1, text: this.pick([
                `o vento está calmo em ${wind.toFixed(1)} km/h`,
                `pouco vento na região, apenas ${wind.toFixed(1)} km/h`
            ])});
        }

        // Precipitação
        const rain = data.precipitation || 0;
        if (rain > 30) {
            observations.push({ weight: 10, text: this.pick([
                `a chuva está torrencial com ${rain.toFixed(1)} mm/h — risco real de alagamentos e deslizamentos`,
                `chove ${rain.toFixed(1)} mm/h, nível de emergência segundo a Defesa Civil`
            ])});
        } else if (rain > 10) {
            observations.push({ weight: 7, text: this.pick([
                `a chuva é forte com ${rain.toFixed(1)} mm/h, podendo causar alagamentos pontuais`,
                `está chovendo ${rain.toFixed(1)} mm/h — evite áreas de encosta e margens de rio`
            ])});
        } else if (rain > 2) {
            observations.push({ weight: 5, text: this.pick([
                `está chovendo moderadamente, ${rain.toFixed(1)} mm/h`,
                `a chuva marca ${rain.toFixed(1)} mm/h — leve guarda-chuva se for sair`
            ])});
        } else if (rain > 0) {
            observations.push({ weight: 3, text: this.pick([
                `há uma garoa leve de ${rain.toFixed(1)} mm/h na região`,
                `chove fino, apenas ${rain.toFixed(1)} mm/h por enquanto`
            ])});
        }

        // Pressão
        const pressure = data.pressureMsl || 1013;
        if (pressure < 990) {
            observations.push({ weight: 8, text: this.pick([
                `a pressão atmosférica despencou para ${pressure.toFixed(0)} hPa, sinal de tempestade se formando`,
                `com ${pressure.toFixed(0)} hPa de pressão, há forte instabilidade no ar`
            ])});
        } else if (pressure < 1005) {
            observations.push({ weight: 4, text: this.pick([
                `a pressão está em queda (${pressure.toFixed(0)} hPa), o que pode indicar chuva nas próximas horas`,
                `o barômetro marca ${pressure.toFixed(0)} hPa — tendência de piora`
            ])});
        } else if (pressure > 1025) {
            observations.push({ weight: 2, text: this.pick([
                `a pressão está estável em ${pressure.toFixed(0)} hPa, indicando tempo firme`,
                `com ${pressure.toFixed(0)} hPa, a atmosfera está bem estável`
            ])});
        }

        // Visibilidade
        const vis = data.visibility || 20000;
        if (vis < 500) {
            observations.push({ weight: 9, text: this.pick([
                `a visibilidade é de apenas ${(vis / 1000).toFixed(1)} km — neblina densa ou chuva forte impedem a visão`,
                `com ${(vis / 1000).toFixed(1)} km de visibilidade, dirigir é extremamente perigoso`
            ])});
        } else if (vis < 3000) {
            observations.push({ weight: 5, text: this.pick([
                `a visibilidade está reduzida para ${(vis / 1000).toFixed(1)} km — atenção no trânsito`,
                `há neblina reduzindo a visibilidade para ${(vis / 1000).toFixed(1)} km`
            ])});
        }

        // UV
        const uv = data.uvIndex || 0;
        if (uv >= 11) {
            observations.push({ weight: 7, text: this.pick([
                `o índice UV está extremo em ${uv.toFixed(1)} — é possível se queimar em menos de 10 minutos`,
                `UV em ${uv.toFixed(1)}: protetor solar FPS 50+ e chapéu são indispensáveis`
            ])});
        } else if (uv >= 8) {
            observations.push({ weight: 5, text: this.pick([
                `o UV está muito alto em ${uv.toFixed(1)} — use protetor solar`,
                `com UV ${uv.toFixed(1)}, a radiação solar pode causar danos à pele em poucos minutos`
            ])});
        }

        // PM2.5
        const pm = data.pm25 || 10;
        if (pm > 150) {
            observations.push({ weight: 8, text: this.pick([
                `a qualidade do ar é péssima, com PM2.5 em ${pm.toFixed(0)} µg/m³ — prejudicial para todos`,
                `o ar está poluído com ${pm.toFixed(0)} µg/m³ de partículas finas — use máscara ao sair`
            ])});
        } else if (pm > 55) {
            observations.push({ weight: 5, text: this.pick([
                `a qualidade do ar não está boa (PM2.5: ${pm.toFixed(0)} µg/m³)`,
                `o nível de poluição está elevado com PM2.5 em ${pm.toFixed(0)} µg/m³`
            ])});
        } else if (pm <= 25) {
            observations.push({ weight: 1, text: this.pick([
                `o ar está limpo e saudável (PM2.5: ${pm.toFixed(0)} µg/m³)`,
                `a qualidade do ar é boa com PM2.5 em ${pm.toFixed(0)} µg/m³`
            ])});
        }

        // Nuvens
        const clouds = data.cloudCover || 0;
        if (clouds > 90) {
            observations.push({ weight: 2, text: this.pick([
                `o céu está totalmente encoberto, ${clouds}% coberto por nuvens`,
                `não há aberturas no céu — ${clouds}% de cobertura de nuvens`
            ])});
        } else if (clouds < 15) {
            observations.push({ weight: 1, text: this.pick([
                `o céu está limpo e aberto com apenas ${clouds}% de nuvens`,
                `praticamente sem nuvens (${clouds}%), sol predominante`
            ])});
        }

        // --- FASE 2: Ordenar por relevância ---
        observations.sort((a, b) => b.weight - a.weight);

        // --- FASE 3: Compor o texto ---
        const topObs = observations.slice(0, 3);

        let intro;
        if (riskScore < 0.2) {
            intro = this.pick([
                'Condições climáticas favoráveis no momento.',
                'O tempo está bom e estável na região.',
                'Sem alertas meteorológicos para agora.',
                'Boletim climático: tudo tranquilo.'
            ]);
        } else if (riskScore < 0.4) {
            intro = this.pick([
                'Algumas condições merecem atenção.',
                'O tempo apresenta leve instabilidade.',
                'Há pontos de atenção no clima da região.',
                'Boletim com ressalvas para as próximas horas.'
            ]);
        } else if (riskScore < 0.65) {
            intro = this.pick([
                'Atenção: condições climáticas adversas na região.',
                'O tempo está instável e requer cautela.',
                'Alerta meteorológico moderado em vigor.'
            ]);
        } else {
            intro = this.pick([
                'ALERTA: condições climáticas perigosas na região.',
                'Situação meteorológica crítica em andamento.',
                'Alerta de emergência climática ativo.'
            ]);
        }

        const connectors = [' Além disso, ', ' Também, ', ' No mais, ', ' E ainda, '];

        let text = intro + ' ';
        
        if (topObs.length >= 1) {
            const first = topObs[0].text;
            text += first.charAt(0).toUpperCase() + first.slice(1) + '.';
        }
        
        if (topObs.length >= 2) {
            text += this.pick(connectors) + topObs[1].text + '.';
        }
        
        if (topObs.length >= 3) {
            text += ' ' + this.pick(['', 'Quanto ao resto, ', 'Para completar, ']) + topObs[2].text + '.';
        }

        // Conclusão
        if (riskScore < 0.2) {
            text += this.pick([
                ` Risco geral: ${percentage}%. Aproveite o dia!`,
                ` Avaliação: ${percentage}% de risco. Boas condições para sair.`,
                ` Nível de risco: ${percentage}%. Dia favorável.`
            ]);
        } else if (riskScore < 0.65) {
            text += this.pick([
                ` Risco geral: ${percentage}%. Fique atento e tome precauções.`,
                ` Avaliação: ${percentage}% de risco. Monitore as condições.`,
                ` Nível de risco: ${percentage}%. Cuidado redobrado.`
            ]);
        } else {
            text += this.pick([
                ` Risco geral: ${percentage}%. Procure abrigo imediatamente.`,
                ` NÍVEL CRÍTICO: ${percentage}% de risco. Evite sair de casa.`,
                ` Risco: ${percentage}%. Siga as orientações de segurança.`
            ]);
        }

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
