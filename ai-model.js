/**
 * @class MeteorGuardAI
 * @version 3.1 Pro
 * @description Motor de Inteligência Artificial Local (TensorFlow.js) com Análise de Momentum Físico.
 */
class MeteorGuardAI {
    constructor() {
        this.model = null;
        this.isReady = false;
        this.trainingLog = [];
        this.modelKey = 'meteorguard-model-v3.1-pro';

        // Mulberry32 PRNG — muito melhor que LCG para datasets de treino
        this._prngState = 42;

        // ── Ranges de normalização para 16 features ──────────────────────
        this.featureRanges = {
            temperature:  { min: -30,   max: 55    },
            humidity:     { min: 0,     max: 100   },
            windSpeed:    { min: 0,     max: 150   },
            windGusts:    { min: 0,     max: 200   },
            precipitation:{ min: 0,     max: 100   },
            pressureMsl:  { min: 950,   max: 1060  },
            cloudCover:   { min: 0,     max: 100   },
            visibility:   { min: 0,     max: 50000 },
            uvIndex:      { min: 0,     max: 12    },
            pm25:         { min: 0,     max: 500   },
            dangerContext:{ min: 0,     max: 3     },
            stormIndex:   { min: 0,     max: 12    },
            instability:  { min: 0,     max: 70    },
            dewpoint:     { min: -50,   max: 35    },
            feelsLike:    { min: -60,   max: 75    },
            windPower:    { min: 0,     max: 250   }
        };
    }

    // ══════════════════════════════════════════════════════════════════════
    // PRNG — Mulberry32
    // ══════════════════════════════════════════════════════════════════════
    seededRand() {
        let t = (this._prngState += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    rand(min, max) {
        return this.seededRand() * (max - min) + min;
    }

    randGauss(mu = 0, sigma = 1) {
        const u1 = Math.max(1e-10, this.seededRand());
        const u2 = this.seededRand();
        return mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    // ══════════════════════════════════════════════════════════════════════
    // FEATURE ENGINEERING
    // ══════════════════════════════════════════════════════════════════════

    computeDewpoint(temp, humidity) {
        const a = 17.27, b = 237.7;
        const gamma = (a * temp) / (b + temp) + Math.log(Math.max(0.01, humidity) / 100);
        return (b * gamma) / (a - gamma);
    }

    computeFeelsLike(temp, humidity, windSpeed) {
        if (temp >= 27 && humidity >= 40) {
            const T = temp, R = humidity;
            return -8.784695 + 1.61139411 * T + 2.3385027 * R
                - 0.14611605 * T * R - 0.012308094 * T * T
                - 0.016424828 * R * R + 0.002211732 * T * T * R
                + 0.00072546 * T * R * R - 0.000003582 * T * T * R * R;
        } else if (temp <= 10 && windSpeed >= 5) {
            const V = Math.pow(windSpeed, 0.16);
            return 13.12 + 0.6215 * temp - 11.37 * V + 0.3965 * temp * V;
        }
        return temp;
    }

    computeWindPower(windSpeed) {
        return (windSpeed * windSpeed) / 100;
    }

    computePhysicsLabel(raw) {
        const [temp, humidity, wind, gusts, precip, pressure,
               cloudCover, visibility, uv, pm25] = raw;

        let score = 0;
        if (temp > 40)      score += Math.min(0.30, ((temp - 40) / 15) * 0.30);
        else if (temp < 0)  score += Math.min(0.20, ((-temp) / 30) * 0.20);
        else if (temp < 5)  score += 0.05;

        if (gusts > 100)         score += Math.min(0.30, ((gusts - 100) / 100) * 0.30);
        else if (gusts > 60)     score += ((gusts - 60) / 40) * 0.15;
        else if (wind > 40)      score += Math.min(0.12, ((wind - 40) / 110) * 0.12);

        if (precip > 30)         score += Math.min(0.25, ((precip - 30) / 70) * 0.25);
        else if (precip > 10)    score += ((precip - 10) / 20) * 0.10;
        else if (precip > 2)     score += 0.03;

        if (pressure < 980)      score += Math.min(0.22, ((980 - pressure) / 30) * 0.22);
        else if (pressure < 995) score += ((995 - pressure) / 15) * 0.08;
        else if (pressure < 1005) score += 0.03;

        if (visibility < 200)       score += 0.22;
        else if (visibility < 500)  score += 0.16;
        else if (visibility < 2000) score += 0.08;

        if (pm25 > 150)       score += Math.min(0.18, ((pm25 - 150) / 350) * 0.18);
        else if (pm25 > 55)   score += ((pm25 - 55) / 95) * 0.07;

        if (uv >= 11)         score += 0.12;
        else if (uv >= 8)     score += 0.06;

        if (humidity > 85 && temp > 30) score += 0.08;
        if (cloudCover > 90 && precip > 15) score += 0.06;

        return Math.min(1.0, Math.max(0.0, score));
    }

    // ══════════════════════════════════════════════════════════════════════
    // ARQUITETURA
    // ══════════════════════════════════════════════════════════════════════
    buildModel() {
        this.model = tf.sequential();

        this.model.add(tf.layers.dense({
            inputShape: [16],
            units: 48,
            kernelInitializer: 'heNormal',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.008 })
        }));
        this.model.add(tf.layers.batchNormalization());
        this.model.add(tf.layers.leakyReLU({ alpha: 0.15 }));
        this.model.add(tf.layers.dropout({ rate: 0.25 }));

        this.model.add(tf.layers.dense({
            units: 24,
            kernelInitializer: 'heNormal',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.008 })
        }));
        this.model.add(tf.layers.batchNormalization());
        this.model.add(tf.layers.leakyReLU({ alpha: 0.1 }));
        this.model.add(tf.layers.dropout({ rate: 0.15 }));

        this.model.add(tf.layers.dense({
            units: 12,
            kernelInitializer: 'heNormal'
        }));
        this.model.add(tf.layers.leakyReLU({ alpha: 0.1 }));

        this.model.add(tf.layers.dense({
            units: 1,
            activation: 'sigmoid'
        }));

        this.model.compile({
            optimizer: tf.train.adam(0.002),
            loss: 'meanSquaredError',
            metrics: ['mse']
        });

        console.log('[METEORGUARD AI v3.0] Arquitetura operacional: 16 features | BN | EarlyStopping.');
    }

    // ══════════════════════════════════════════════════════════════════════
    // DATASET
    // ══════════════════════════════════════════════════════════════════════
    generateTrainingData() {
        const inputs = [], outputs = [];
        const N = 1000;

        const buildVector = (raw13) => {
            const [temp, humidity, wind, gusts, precip, pressure,
                   cloud, vis, uv, pm25, dc, si, inst] = raw13;
            const dew    = this.computeDewpoint(temp, humidity);
            const feels  = this.computeFeelsLike(temp, humidity, wind);
            const wpower = this.computeWindPower(wind);
            return [...raw13, dew, feels, wpower];
        };

        // 1. CONDIÇÕES IDEAIS
        for (let i = 0; i < N; i++) {
            const temp   = this.randGauss(22, 3);
            const hum    = this.randGauss(50, 8);
            const wind   = Math.abs(this.randGauss(5, 4));
            const raw = [
                temp, hum, wind, wind * this.rand(1.1, 1.4),
                0, this.randGauss(1018, 4),
                this.rand(0, 25), this.rand(12000, 20000),
                this.rand(0, 4), this.rand(0, 15),
                0, Math.log1p(wind * 0), 0
            ];
            const v = buildVector(raw);
            inputs.push(v);
            outputs.push([this.computePhysicsLabel(raw)]);
        }

        // 2. ATENÇÃO LEVE
        for (let i = 0; i < N; i++) {
            const wind   = this.rand(10, 25);
            const precip = this.rand(0.5, 4);
            const hum    = this.rand(55, 75);
            const press  = this.rand(1005, 1015);
            const raw = [
                this.rand(10, 30), hum, wind, wind * this.rand(1.2, 1.6),
                precip, press,
                this.rand(25, 65), this.rand(6000, 14000),
                this.rand(3, 7), this.rand(15, 45),
                1, Math.log1p(wind * precip),
                Math.max(0, (1000 - press) * (hum / 100))
            ];
            const v = buildVector(raw);
            inputs.push(v);
            outputs.push([this.computePhysicsLabel(raw)]);
        }

        // 3. ATENÇÃO MODERADA
        for (let i = 0; i < N; i++) {
            const wind   = this.rand(20, 50);
            const precip = this.rand(5, 20);
            const hum    = this.rand(70, 90);
            const press  = this.rand(995, 1010);
            const raw = [
                this.rand(5, 25), hum, wind, wind * this.rand(1.3, 1.8),
                precip, press,
                this.rand(60, 95), this.rand(2500, 7000),
                this.rand(0, 3), this.rand(30, 85),
                2, Math.log1p(wind * precip),
                Math.max(0, (1000 - press) * (hum / 100))
            ];
            const v = buildVector(raw);
            inputs.push(v);
            outputs.push([this.computePhysicsLabel(raw)]);
        }

        // 4. PERIGO SEVERO
        for (let i = 0; i < N; i++) {
            const wind   = this.rand(45, 90);
            const precip = this.rand(18, 65);
            const hum    = this.rand(85, 98);
            const press  = this.rand(978, 998);
            const raw = [
                this.rand(3, 20), hum, wind, wind * this.rand(1.4, 2.0),
                precip, press,
                this.rand(88, 100), this.rand(300, 2500),
                this.rand(0, 2), this.rand(55, 160),
                3, Math.log1p(wind * precip),
                Math.max(0, (1000 - press) * (hum / 100))
            ];
            const v = buildVector(raw);
            inputs.push(v);
            outputs.push([this.computePhysicsLabel(raw)]);
        }

        // 5. EVENTOS EXTREMOS
        for (let i = 0; i < N; i++) {
            const isHeatwave = this.seededRand() > 0.4;
            const isBlizzard = !isHeatwave && this.seededRand() > 0.5;
            let wind, precip, temp, hum, press;
            if (isHeatwave) {
                temp = this.rand(44, 55); hum  = this.rand(20, 65); wind = this.rand(8, 30); precip = 0; press  = this.rand(1000, 1020);
            } else if (isBlizzard) {
                temp = this.rand(-25, -5); hum  = this.rand(80, 100); wind = this.rand(50, 120); precip = this.rand(10, 60); press  = this.rand(960, 990);
            } else {
                temp = this.rand(20, 35); hum  = this.rand(90, 100); wind = this.rand(80, 150); precip = this.rand(40, 100); press  = this.rand(930, 975);
            }
            const raw = [
                temp, hum, wind, wind * this.rand(1.5, 2.2), precip, press,
                100, this.rand(10, 500), isHeatwave ? this.rand(10, 15) : 0,
                this.rand(100, 500), 3, Math.log1p(wind * precip),
                Math.max(0, (1000 - press) * (hum / 100))
            ];
            const v = buildVector(raw);
            inputs.push(v);
            outputs.push([this.computePhysicsLabel(raw)]);
        }

        const noiseStd = [0.8, 1.5, 0.5, 0.8, 0.3, 0.5, 1.0, 200, 0.1, 1.5, 0, 0.05, 0.2, 0.3, 0.5, 0.1];
        for (let i = 0; i < inputs.length; i++) {
            for (let j = 0; j < inputs[i].length; j++) {
                if (noiseStd[j] > 0) inputs[i][j] += this.randGauss(0, noiseStd[j]);
            }
        }
        return { inputs, outputs };
    }

    // ══════════════════════════════════════════════════════════════════════
    // TREINO
    // ══════════════════════════════════════════════════════════════════════
    async train(onProgress) {
        try {
            const savedModel = await tf.loadLayersModel('localstorage://' + this.modelKey);
            this.model = savedModel;
            this.model.compile({ optimizer: tf.train.adam(0.002), loss: 'meanSquaredError', metrics: ['mse'] });
            this.isReady = true;
            console.log('[METEORGUARD AI v3.0] ⚡ Modelo carregado do cache!');
            if (onProgress) onProgress(20, 20, { loss: 0, val_loss: 0 });
            return;
        } catch (_) {
            console.log('[METEORGUARD AI v3.0] Treinando modelo v3.0...');
        }

        this.buildModel();
        const { inputs: rawIn, outputs: rawOut } = this.generateTrainingData();
        const normalizedIn = rawIn.map(row => this.normalizeInput(row));
        const inputTensor  = tf.tensor2d(normalizedIn);
        const outputTensor = tf.tensor2d(rawOut);

        const patience = 10, minDelta = 0.0002;
        let bestValLoss = Infinity, patienceCounter = 0, bestWeightsData = null;

        const epochs = 80;
        const callbacks = {
            onEpochEnd: async (epoch, logs) => {
                const valLoss = logs.val_loss || logs.val_mse || Infinity;
                if (bestValLoss - valLoss > minDelta) {
                    bestValLoss = valLoss;
                    patienceCounter = 0;
                    bestWeightsData = this.model.getWeights().map(w => w.arraySync());
                    console.log(`[METEORGUARD AI v3.0] ✓ Epoch ${epoch + 1} — val_loss: ${valLoss.toFixed(5)} (best)`);
                } else {
                    patienceCounter++;
                    if (patienceCounter >= patience) {
                        console.log(`[METEORGUARD AI v3.0] Early stopping na epoch ${epoch + 1}. Melhor val_loss: ${bestValLoss.toFixed(5)}`);
                        this.model.stopTraining = true;
                    }
                }
                if (onProgress) onProgress(epoch + 1, epochs, logs);
            }
        };

        await this.model.fit(inputTensor, outputTensor, {
            epochs, batchSize: 64, validationSplit: 0.15, shuffle: true, callbacks
        });

        inputTensor.dispose(); outputTensor.dispose();

        if (bestWeightsData) {
            const bestTensors = bestWeightsData.map(w => tf.tensor(w));
            this.model.setWeights(bestTensors);
            bestTensors.forEach(t => t.dispose());
            console.log('[METEORGUARD AI v3.0] ✓ Pesos restaurados para o melhor checkpoint.');
        }

        try { await this.model.save('localstorage://' + this.modelKey); } catch (e) { console.warn(e); }
        this.isReady = true;
    }

    // ══════════════════════════════════════════════════════════════════════
    // PREDIÇÃO — v3.1 Pro: Análise de Momentum Híbrida
    // ══════════════════════════════════════════════════════════════════════
    async predict(data, previous = null) {
        if (!this.model) return this.fallbackPrediction(data);

        const humidity = data.humidity || 50, pressureMsl = data.pressureMsl || 1013, windSpeed = data.windSpeed || 0, temp = data.temperature || 20, precip = data.precipitation || 0;
        const stormIndex = Math.log1p(windSpeed * precip), instability = Math.max(0, (1000 - pressureMsl) * (humidity / 100)), dewpoint = this.computeDewpoint(temp, humidity), feelsLike = this.computeFeelsLike(temp, humidity, windSpeed), windPower = this.computeWindPower(windSpeed);

        const inputVector = [temp, humidity, windSpeed, data.windGusts || 0, precip, pressureMsl, data.cloudCover || 0, data.visibility || 20000, data.uvIndex || 0, data.pm25 || 10, data.dangerContext || 0, stormIndex, instability, dewpoint, feelsLike, windPower];
        const normalized = this.normalizeInput(inputVector);
        const tensor = tf.tensor2d([normalized]);
        const predTensor = this.model.predict(tensor);
        const riskData = await predTensor.data();
        let rawRisk = riskData[0];

        tensor.dispose(); predTensor.dispose();

        // ── Nudging Físico (v3.1 Pro Simulation) ──────────────────────────
        let momentumSafetyBias = 0;
        if (previous && previous.current) {
            const prev = previous.current;
            const deltaP = (pressureMsl - (prev.pressureMsl || 1013));
            
            // Simulação de tendência barométrica (Clássico na física)
            if (deltaP < -0.8) {
                // Pressão caindo rápido: Aumenta risco (instabilidade chegando)
                momentumSafetyBias += Math.min(0.20, Math.abs(deltaP) * 0.1);
                console.log(`[METEORGUARD PRO] Physics: Tendência barométrica negativa detectada (${deltaP.toFixed(1)} hPa).`);
            } else if (deltaP > 0.8) {
                // Pressão subindo rápido: Reduz risco (tempo estabilizando)
                momentumSafetyBias -= Math.min(0.15, deltaP * 0.05);
            }

            // Delta Temperatura (Frentes térmicas)
            const deltaT = temp - (prev.temp || temp);
            if (Math.abs(deltaT) > 3) momentumSafetyBias += 0.05; 
        }

        const certainty = Math.abs(rawRisk - 0.5) * 2;
        const nnWeight = 0.50 + certainty * 0.40;
        const hWeight = 1 - nnWeight;
        const heuristicScore = this.quickHeuristic(data);
        
        // Fusão final: NN + Heurística + Bias Físico de Momentum
        const riskScore = Math.min(1.0, Math.max(0.0, (rawRisk * nnWeight + heuristicScore * hWeight) + momentumSafetyBias));

        return this.interpretPrediction(riskScore, data, momentumSafetyBias);
    }

    interpretPrediction(riskScore, data, physicsBias = 0) {
        const percentage = Math.round(riskScore * 100);
        const analysis = this.generateDetailedAnalysis(riskScore, data);
        let level, title, icon, color;
        
        // Títulos PRO baseados na física (Traduzidos)
        const suffix = physicsBias > 0.05 ? i18n.t('physicsUnstable') : physicsBias < -0.05 ? i18n.t('physicsStable') : '';

        if (riskScore < 0.2) { level = 'safe'; title = i18n.t('aiRiskTitleSafe')(percentage) + suffix; icon = 'fa-shield-check'; color = '#00ff88'; }
        else if (riskScore < 0.4) { level = 'low-warning'; title = i18n.t('aiRiskTitleWarningLow')(percentage) + suffix; icon = 'fa-umbrella'; color = '#ffdf00'; }
        else if (riskScore < 0.65) { level = 'warning'; title = i18n.t('aiRiskTitleWarning')(percentage) + suffix; icon = 'fa-circle-exclamation'; color = '#ff8800'; }
        else if (riskScore < 0.85) { level = 'danger'; title = i18n.t('aiRiskTitleDanger')(percentage) + suffix; icon = 'fa-triangle-exclamation'; color = '#ff3366'; }
        else { level = 'critical'; title = i18n.t('aiRiskTitleCritical')(percentage) + suffix; icon = 'fa-skull-crossbones'; color = '#ff0040'; }

        const locale = i18n.current === 'en' ? 'en-US' : i18n.current === 'es' ? 'es-ES' : 'pt-BR';
        return { riskScore, percentage, level, title, icon, color, analysis, timestamp: new Date().toLocaleTimeString(locale) };
    }

    generateDetailedAnalysis(riskScore, data) {
        const alerts = [], suggestions = [], details = [];
        const langObj = i18n.translations[i18n.current] || i18n.translations.pt;
        const ctx = langObj.aiContext || i18n.translations.pt.aiContext;

        if (data.temperature > 40) { alerts.push(ctx.tempHighAlert); suggestions.push(ctx.tempHighSugg); }
        else if (data.temperature < 5) { alerts.push(ctx.tempLowAlert); suggestions.push(ctx.tempLowSugg); }

        if (data.windGusts > 90) { alerts.push(ctx.windCritAlert); suggestions.push(ctx.windCritSugg); }
        else if (data.windSpeed > 50) { alerts.push(ctx.windHighAlert); suggestions.push(ctx.windHighSugg); }

        const rainFixed = data.precipitation ? data.precipitation.toFixed(2) : '0.00';
        if (data.precipitation > 30) { alerts.push(ctx.rainCritAlert(rainFixed)); suggestions.push(ctx.rainCritSugg); }
        else if (data.precipitation > 10) { alerts.push(ctx.rainHighAlert(rainFixed)); suggestions.push(ctx.rainHighSugg); }

        if (data.pressureMsl < 990) { alerts.push(ctx.pressLowAlert(data.pressureMsl?.toFixed(0))); details.push(ctx.pressLowDet); }
        if (data.uvIndex >= 11) { alerts.push(ctx.uvCritAlert(data.uvIndex)); suggestions.push(ctx.uvCritSugg); }

        if (alerts.length === 0 && suggestions.length === 0) suggestions.push(this.pick(ctx.allClearSugg));
        return { alerts, suggestions, details };
    }

    generateText(data, riskScore, analysis) {
        const langObj  = i18n.translations[i18n.current] || i18n.translations.pt;
        const ctx      = langObj.aiContext || i18n.translations.pt.aiContext;
        const lang     = i18n.current;
        const pct      = Math.round(riskScore * 100);

        const hasUVRisk  = (data.uvIndex || 0) >= 8;
        const hasAirRisk = (data.pm25    || 0) > 55;

        let intro;
        if (riskScore < 0.2 && hasUVRisk) {
            intro = lang === 'en' ? 'Stable weather, but high UV exposure risk.' :
                    lang === 'es' ? 'Clima estable, pero con riesgo elevado de exposición solar.' :
                                    'Clima estável, porém com risco elevado de exposição solar.';
        } else if (riskScore < 0.2 && hasAirRisk) {
            intro = lang === 'en' ? 'Stable weather, but air quality deserves attention.' :
                    lang === 'es' ? 'Clima estable, pero la calidad del aire merece atención.' :
                                    'Clima estável, porém a qualidade do ar merece atenção.';
        } else if (riskScore < 0.2)  { intro = ctx.nlgIntroSafe;   }
        else if (riskScore < 0.4)    { intro = ctx.nlgIntroWarn;   }
        else if (riskScore < 0.65)   { intro = ctx.nlgIntroDanger; }
        else                         { intro = ctx.nlgIntroCrit;   }

        let text = intro + ' ';

        const cleanFact  = s => s.replace(/^[^\w\s]+\s*/, '').trim();
        const factsToUse = [
            ...(analysis?.alerts      || []),
            ...(analysis?.details     || []),
            ...(analysis?.suggestions || [])
        ].slice(0, 3);

        if (factsToUse[0]) { const f = cleanFact(factsToUse[0]); text += f.charAt(0).toUpperCase() + f.slice(1) + (f.endsWith('.') ? ' ' : '. '); }
        if (factsToUse[1]) { const f = cleanFact(factsToUse[1]); text += ctx.nlgAlso + ' ' + f.charAt(0).toLowerCase() + f.slice(1) + (f.endsWith('.') ? ' ' : '. '); }
        if (factsToUse[2]) { const f = cleanFact(factsToUse[2]); text += ctx.nlgFinally + ' ' + f.charAt(0).toLowerCase() + f.slice(1) + (f.endsWith('.') ? ' ' : '. '); }

        if (riskScore < 0.2)  text += ctx.nlgOutroSafe(pct);
        else if (riskScore < 0.65) text += ctx.nlgOutroWarn(pct);
        else                  text += ctx.nlgOutroCrit(pct);

        // Deduplicação por similaridade semântica
        const normalize = s => s.toLowerCase().replace(/[^a-záéíóúâêãõç\s]/g, '').trim();
        const seen = [];
        text = text.split('. ')
            .map(s => s.trim())
            .filter(s => {
                const c = s.replace(/\.$/, '');
                if (!c) return false;
                const n = normalize(c);
                for (const e of seen) {
                    const ew = new Set(e.split(' '));
                    const nw = n.split(' ');
                    const overlap = nw.filter(w => w.length > 3 && ew.has(w)).length;
                    if (nw.length > 0 && overlap / nw.length > 0.6) return false;
                }
                seen.push(n);
                return true;
            })
            .join('. ');

        if (!text.endsWith('.')) text += '.';
        return text;
    }

    normalizeInput(params) {
        const p = this.featureRanges;
        const keys = ['temperature','humidity','windSpeed','windGusts','precipitation','pressureMsl','cloudCover','visibility','uvIndex','pm25','dangerContext','stormIndex','instability','dewpoint','feelsLike','windPower'];
        return keys.map((k, i) => {
            const { min, max } = p[k];
            return Math.max(0, Math.min(1, (params[i] - min) / (max - min)));
        });
    }

    quickHeuristic(data) {
        let score = 0;
        if (data.temperature > 40 || data.temperature < 0) score += 0.28;
        if (data.windSpeed > 60) score += 0.25;
        if (data.precipitation > 20) score += 0.22;
        return Math.min(1.0, score);
    }

    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
}

const meteorGuardAI = new MeteorGuardAI();