// ==========================================
// METEORGUARD AI ENGINE
// Rede Neural Real com TensorFlow.js
// ==========================================

class MeteorGuardAI {
    constructor() {
        this.model = null;
        this.isReady = false;
        this.trainingLog = [];
        
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

        // Compilar o modelo com otimizador Adam
        this.model.compile({
            optimizer: tf.train.adam(0.01),
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

        // ---- CENÁRIOS SEGUROS (output ≈ 0.0 a 0.2) ----
        for (let i = 0; i < 80; i++) {
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

        // ---- CENÁRIOS DE ATENÇÃO LEVE (output ≈ 0.2 a 0.4) ----
        for (let i = 0; i < 60; i++) {
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

        // ---- CENÁRIOS DE ATENÇÃO MODERADA (output ≈ 0.4 a 0.65) ----
        for (let i = 0; i < 60; i++) {
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

        // ---- CENÁRIOS DE PERIGO (output ≈ 0.65 a 0.85) ----
        for (let i = 0; i < 50; i++) {
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

        // ---- CENÁRIOS DE RISCO EXTREMO (output ≈ 0.85 a 1.0) ----
        for (let i = 0; i < 50; i++) {
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
    // STEP 3: Treinar a rede neural
    // ==========================================
    async train(onProgress) {
        console.log('[METEORGUARD AI] Iniciando treinamento da rede neural...');
        
        const data = this.generateTrainingData();
        
        // Normalizar os inputs para 0-1
        const normalizedInputs = data.inputs.map(row => this.normalizeInput(row));
        
        // Converter para tensores TensorFlow
        const xs = tf.tensor2d(normalizedInputs);
        const ys = tf.tensor2d(data.outputs);

        // Treinar por 50 épocas
        const history = await this.model.fit(xs, ys, {
            epochs: 50,
            batchSize: 16,
            validationSplit: 0.2,
            shuffle: true,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    this.trainingLog.push({
                        epoch: epoch + 1,
                        loss: logs.loss.toFixed(4),
                        accuracy: (logs.acc * 100).toFixed(1)
                    });
                    if (onProgress) {
                        onProgress(epoch + 1, 50, logs);
                    }
                }
            }
        });

        // Limpar tensores da memória
        xs.dispose();
        ys.dispose();

        this.isReady = true;
        console.log('[METEORGUARD AI] ✅ Treinamento concluído! Rede neural operacional.');
        
        return history;
    }

    // ==========================================
    // STEP 4: Fazer predições com a rede neural
    // ==========================================
    predict(weatherData) {
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
        
        // Predição
        const tensor = tf.tensor2d([normalized]);
        const prediction = this.model.predict(tensor);
        const riskScore = prediction.dataSync()[0];
        
        tensor.dispose();
        prediction.dispose();

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

        // --- FASE 1: Analisar cada sensor e gerar observações com peso ---

        // Temperatura
        const temp = data.temperature || 20;
        if (temp > 38) {
            observations.push({ weight: 9, text: this.pick([
                `A temperatura atingiu ${temp.toFixed(1)}°C, um nível considerado perigoso para a saúde humana`,
                `Registrei ${temp.toFixed(1)}°C nos sensores — estamos em uma zona de calor extremo`,
                `Com ${temp.toFixed(1)}°C, o risco de desidratação e insolação é real`
            ])});
        } else if (temp > 32) {
            observations.push({ weight: 5, text: this.pick([
                `a temperatura está em ${temp.toFixed(1)}°C, acima da média de conforto`,
                `os sensores registram ${temp.toFixed(1)}°C de temperatura ambiente`,
                `o termômetro marca ${temp.toFixed(1)}°C neste momento`
            ])});
        } else if (temp < 5) {
            observations.push({ weight: 8, text: this.pick([
                `A temperatura despencou para ${temp.toFixed(1)}°C — condições de frio intenso`,
                `Com apenas ${temp.toFixed(1)}°C, exposição prolongada pode causar hipotermia`
            ])});
        } else if (temp < 15) {
            observations.push({ weight: 4, text: this.pick([
                `a temperatura está em ${temp.toFixed(1)}°C, relativamente fria`,
                `os sensores indicam ${temp.toFixed(1)}°C — recomendo agasalho`
            ])});
        } else {
            observations.push({ weight: 2, text: this.pick([
                `a temperatura está em ${temp.toFixed(1)}°C, dentro da faixa de conforto`,
                `registrei ${temp.toFixed(1)}°C, temperatura agradável`,
                `os sensores marcam ${temp.toFixed(1)}°C no momento`
            ])});
        }

        // Umidade
        const hum = data.humidity || 50;
        if (hum > 90) {
            observations.push({ weight: 6, text: this.pick([
                `a umidade relativa está em ${hum}%, próximo da saturação total do ar`,
                `com ${hum}% de umidade, o ar está extremamente pesado e abafado`
            ])});
        } else if (hum < 30) {
            observations.push({ weight: 6, text: this.pick([
                `a umidade relativa caiu para ${hum}%, um nível preocupante para o sistema respiratório`,
                `com apenas ${hum}% de umidade, o ar está muito seco`
            ])});
        } else {
            observations.push({ weight: 1, text: this.pick([
                `umidade em ${hum}%`,
                `a umidade está estável em ${hum}%`
            ])});
        }

        // Vento
        const wind = data.windSpeed || 0;
        const gusts = data.windGusts || 0;
        if (gusts > 90) {
            observations.push({ weight: 10, text: this.pick([
                `Rajadas de vento atingiram ${gusts.toFixed(1)} km/h — ventos destrutivos que podem derrubar árvores e destelhamentos`,
                `ALERTA: rajadas de ${gusts.toFixed(1)} km/h detectadas, equivalente à intensidade de uma tempestade tropical`
            ])});
        } else if (wind > 50) {
            observations.push({ weight: 8, text: this.pick([
                `ventos fortes de ${wind.toFixed(1)} km/h com rajadas de ${gusts.toFixed(1)} km/h estão varrendo a região`,
                `o anemômetro registra ${wind.toFixed(1)} km/h de vento sustentado — objetos leves podem ser arremessados`
            ])});
        } else if (wind > 25) {
            observations.push({ weight: 4, text: this.pick([
                `ventos moderados de ${wind.toFixed(1)} km/h sopram na região`,
                `o vento está em ${wind.toFixed(1)} km/h, forte o suficiente para inverter guarda-chuvas`
            ])});
        } else {
            observations.push({ weight: 1, text: this.pick([
                `ventos calmos de ${wind.toFixed(1)} km/h`,
                `o vento está brando em ${wind.toFixed(1)} km/h`
            ])});
        }

        // Precipitação
        const rain = data.precipitation || 0;
        if (rain > 30) {
            observations.push({ weight: 10, text: this.pick([
                `A precipitação é de ${rain.toFixed(1)} mm/h — chuva torrencial com alto risco de alagamentos`,
                `Chovendo ${rain.toFixed(1)} mm/h, nível que a Defesa Civil classifica como emergência`
            ])});
        } else if (rain > 10) {
            observations.push({ weight: 7, text: this.pick([
                `a chuva é intensa com ${rain.toFixed(1)} mm/h — bueiros podem transbordar em áreas urbanas`,
                `precipitação de ${rain.toFixed(1)} mm/h detectada, classificada como chuva forte`
            ])});
        } else if (rain > 2) {
            observations.push({ weight: 5, text: this.pick([
                `está chovendo moderadamente (${rain.toFixed(1)} mm/h)`,
                `a precipitação está em ${rain.toFixed(1)} mm/h — recomendo guarda-chuva`
            ])});
        } else if (rain > 0) {
            observations.push({ weight: 3, text: this.pick([
                `há uma garoa leve de ${rain.toFixed(1)} mm/h`,
                `detectei precipitação fraca de ${rain.toFixed(1)} mm/h`
            ])});
        }

        // Pressão
        const pressure = data.pressureMsl || 1013;
        if (pressure < 990) {
            observations.push({ weight: 8, text: this.pick([
                `A pressão atmosférica está em ${pressure.toFixed(0)} hPa, um indicador de formação ciclônica ou tempestade severa se aproximando`,
                `Com ${pressure.toFixed(0)} hPa de pressão, meus algoritmos identificam instabilidade barométrica significativa`
            ])});
        } else if (pressure < 1005) {
            observations.push({ weight: 4, text: this.pick([
                `a pressão está em queda (${pressure.toFixed(0)} hPa), sinalizando possível piora nas próximas horas`,
                `barômetro em ${pressure.toFixed(0)} hPa — tendência de instabilidade`
            ])});
        } else if (pressure > 1025) {
            observations.push({ weight: 2, text: this.pick([
                `a pressão atmosférica está alta e estável em ${pressure.toFixed(0)} hPa, bom sinal de tempo firme`,
                `barômetro em ${pressure.toFixed(0)} hPa indica estabilidade atmosférica`
            ])});
        }

        // Visibilidade
        const vis = data.visibility || 20000;
        if (vis < 500) {
            observations.push({ weight: 9, text: this.pick([
                `A visibilidade é crítica: apenas ${(vis / 1000).toFixed(1)} km. Neblina densa ou chuva forte comprometem completamente a visão`,
                `Visibilidade em ${(vis / 1000).toFixed(1)} km — condições extremamente perigosas para motoristas`
            ])});
        } else if (vis < 3000) {
            observations.push({ weight: 5, text: this.pick([
                `a visibilidade está reduzida para ${(vis / 1000).toFixed(1)} km`,
                `neblina reduz a visibilidade para ${(vis / 1000).toFixed(1)} km`
            ])});
        }

        // UV
        const uv = data.uvIndex || 0;
        if (uv >= 11) {
            observations.push({ weight: 7, text: this.pick([
                `O índice UV está em ${uv.toFixed(1)}, nível extremo — queimaduras de pele em menos de 10 minutos sem proteção`,
                `UV extremo de ${uv.toFixed(1)} detectado. Protetor solar FPS 50+ é obrigatório`
            ])});
        } else if (uv >= 8) {
            observations.push({ weight: 5, text: this.pick([
                `o índice UV está muito alto em ${uv.toFixed(1)} — protetor solar é essencial`,
                `UV em ${uv.toFixed(1)}, nível considerado muito alto pela OMS`
            ])});
        }

        // PM2.5
        const pm = data.pm25 || 10;
        if (pm > 150) {
            observations.push({ weight: 8, text: this.pick([
                `A qualidade do ar é péssima com PM2.5 em ${pm.toFixed(0)} µg/m³ — nocivo para todos, especialmente crianças e idosos`,
                `Partículas finas PM2.5 em ${pm.toFixed(0)} µg/m³ — o ar é insalubre. Use máscara ao sair`
            ])});
        } else if (pm > 55) {
            observations.push({ weight: 5, text: this.pick([
                `a qualidade do ar está comprometida (PM2.5: ${pm.toFixed(0)} µg/m³)`,
                `PM2.5 em ${pm.toFixed(0)} µg/m³ — ar insatisfatório para grupos sensíveis`
            ])});
        } else if (pm <= 25) {
            observations.push({ weight: 1, text: this.pick([
                `o ar está limpo com PM2.5 em ${pm.toFixed(0)} µg/m³`,
                `qualidade do ar boa (PM2.5: ${pm.toFixed(0)} µg/m³)`
            ])});
        }

        // Nuvens
        const clouds = data.cloudCover || 0;
        if (clouds > 90) {
            observations.push({ weight: 2, text: this.pick([
                `o céu está completamente encoberto (${clouds}% de cobertura)`,
                `nuvens cobrem ${clouds}% do céu, sem previsão de aberturas de sol`
            ])});
        } else if (clouds < 15) {
            observations.push({ weight: 1, text: this.pick([
                `o céu está limpo com apenas ${clouds}% de nuvens`,
                `praticamente sem nuvens no céu (${clouds}%)`
            ])});
        }

        // --- FASE 2: Ordenar por peso (relevância) ---
        observations.sort((a, b) => b.weight - a.weight);

        // --- FASE 3: Compor o texto final ---
        const topObs = observations.slice(0, 3); // Pegar as 3 mais relevantes

        // Introdução baseada no risco
        let intro;
        if (riskScore < 0.2) {
            intro = this.pick([
                'Concluí minha varredura dos sensores ambientais.',
                'Análise dos 11 parâmetros atmosféricos finalizada.',
                'Processamento dos dados meteorológicos concluído.',
                'Minha rede neural processou todos os indicadores disponíveis.'
            ]);
        } else if (riskScore < 0.4) {
            intro = this.pick([
                'Identifiquei alguns pontos de atenção na minha análise.',
                'Meus sensores detectaram condições que merecem monitoramento.',
                'A varredura revelou parâmetros fora da zona ideal.'
            ]);
        } else if (riskScore < 0.65) {
            intro = this.pick([
                'Atenção. Minha análise identificou condições meteorológicas adversas.',
                'Alerta moderado emitido após processamento dos dados ambientais.',
                'Os dados analisados indicam deterioração significativa das condições.'
            ]);
        } else {
            intro = this.pick([
                'ALERTA CRÍTICO. Múltiplos sensores estão em zona de perigo.',
                'ATENÇÃO MÁXIMA. A análise neural indica risco elevado para a região.',
                'EMERGÊNCIA DETECTADA. Os parâmetros ambientais estão em níveis críticos.'
            ]);
        }

        // Conectores para unir observações
        const connectors = [' Além disso, ', ' Também observo que ', ' Adicionalmente, ', ' Complementando, '];

        // Montar o parágrafo
        let text = intro + ' ';
        
        if (topObs.length >= 1) {
            // Capitalizar primeira observação
            const first = topObs[0].text;
            text += first.charAt(0).toUpperCase() + first.slice(1) + '.';
        }
        
        if (topObs.length >= 2) {
            text += this.pick(connectors) + topObs[1].text + '.';
        }
        
        if (topObs.length >= 3) {
            text += ' ' + this.pick(['Por fim, ', 'Quanto ao restante, ', 'Nos demais indicadores, ', '']) + topObs[2].text + '.';
        }

        // Conclusão baseada no risco
        if (riskScore < 0.2) {
            text += this.pick([
                ` Conclusão: risco calculado em ${percentage}%. Condições favoráveis.`,
                ` Meu veredito: ${percentage}% de risco. Aproveite o dia com tranquilidade.`,
                ` Resultado da análise neural: ${percentage}% de probabilidade de risco. Tudo dentro da normalidade.`
            ]);
        } else if (riskScore < 0.65) {
            text += this.pick([
                ` Risco avaliado em ${percentage}%. Tome precauções.`,
                ` Minha rede neural calcula ${percentage}% de risco. Fique atento.`,
                ` Probabilidade de risco: ${percentage}%. Monitore as condições nas próximas horas.`
            ]);
        } else {
            text += this.pick([
                ` Risco avaliado em ${percentage}%. Procure abrigo seguro imediatamente.`,
                ` RISCO: ${percentage}%. Evite deslocamentos e permaneça em local seguro.`,
                ` Probabilidade de evento adverso: ${percentage}%. Siga as orientações de segurança.`
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
            return (val - range.min) / (range.max - range.min);
        });
    }

    rand(min, max) {
        return Math.random() * (max - min) + min;
    }
}

// Instância global
const meteorGuardAI = new MeteorGuardAI();
