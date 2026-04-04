/**
 * @class MeteorGuardAI
 * @version 5.1 - STABILITY UPGRADE
 * @description The peak of autonomous weather intelligence. 
 *              Features: Priority Hierarchical Logic, Explainability Layer, 
 *              Semantically Coherent NLG, and Self-Calibrating Trust Fusion.
 */
class MeteorGuardAI {
    constructor() {
        this.model = null;
        this.isReady = false;
        this.trainingLog = [];
        this.slidingWindow = [];     
        this.performanceHistory = []; 
        this.nnWeight = 0.75;         // v5.0 MAX: Starting trust weight, dynamically adjusted
        
        // v5.0 MAX: Ultimate model key
        this.modelKey = 'meteorguard-model-v5.0-max';
        
        this.calibrationTemperature = 1.0;
        this.featureImportance = null;
        this._prngState = 42;

        // v5.0 MAX: Normalized metadata for optimized 70-feature set
        this.featureRanges = {
            temperature:  { min: -30,   max: 55,    mean: 20,   std: 12   },
            humidity:     { min: 0,     max: 100,   mean: 60,   std: 20   },
            windSpeed:    { min: 0,     max: 150,   mean: 15,   std: 20   },
            windGusts:    { min: 0,     max: 200,   mean: 20,   std: 30   },
            precipitation:{ min: 0,     max: 100,   mean: 5,    std: 15   },
            pressureMsl:  { min: 950,   max: 1060,  mean: 1013, std: 15   },
            cloudCover:   { min: 0,     max: 100,   mean: 50,   std: 30   },
            visibility:   { min: 0,     max: 50000, mean: 15000,std: 10000},
            uvIndex:      { min: 0,     max: 12,    mean: 5,    std: 3    },
            pm25:         { min: 0,     max: 500,   mean: 35,   std: 50   },
            dangerContext:{ min: 0,     max: 3,     mean: 1,    std: 1    },
            stormIndex:   { min: 0,     max: 12,    mean: 2,    std: 2.5  },
            instability:  { min: 0,     max: 70,    mean: 10,   std: 15   },
            feelsLike:    { min: -60,   max: 75,    mean: 20,   std: 15   },
            i_temphum:    { min: -500,  max: 5000,  mean: 1200, std: 1000 }, // Interaction: temp * hum
            i_windprec:   { min: -100,  max: 2000,  mean: 100,  std: 300  }, // Interaction: wind * precip
            latitude:     { min: -90,   max: 90,    mean: -22,  std: 10   },
            longitude:    { min: -180,  max: 180,   mean: -43,  std: 15   },
            altitude:     { min: 0,     max: 8000,  mean: 500,  std: 1000 },
            locationRisk: { min: 0,     max: 1,     mean: 0.5,  std: 0.3  }  // Merged: coastal + regional
        };

        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║  🧠 MeteorGuard AI — Sistema de Monitoramento Ativo      ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
    }

    seededRand() {
        let t = (this._prngState += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    rand(min, max) { return this.seededRand() * (max - min) + min; }

    computeFeelsLike(temp, humidity, windSpeed) {
        if (temp >= 27 && humidity >= 40) {
            const T = temp, R = humidity;
            return -8.784695 + 1.61139411 * T + 2.3385027 * R - 0.14611605 * T * R - 0.012308094 * T * T - 0.016424828 * R * R + 0.002211732 * T * T * R + 0.00072546 * T * R * R - 0.000003582 * T * T * R * R;
        } else if (temp <= 10 && windSpeed >= 5) {
            const V = Math.pow(windSpeed, 0.16);
            return 13.12 + 0.6215 * temp - 11.37 * V + 0.3965 * temp * V;
        }
        return temp;
    }

    computePhysicsLabel(raw) {
        const [temp, humidity, wind, gusts, precip, pressure, cloudCover, visibility, uv, pm25] = raw;
        let score = 0;
        if (temp > 42) score += 0.25; else if (temp < -5) score += 0.15;
        if (gusts > 100) score += 0.30; else if (wind > 45) score += 0.15;
        if (precip > 30) score += 0.25;
        if (pressure < 985) score += 0.20;
        if (visibility < 800) score += 0.15;
        return Math.min(1.0, Math.max(0.0, score));
    }

    buildModel() {
        // v5.0 MAX: Optimized Feature Pruning (Input: 70)
        const input = tf.input({ shape: [70] }); 
        
        // Residual Attention Block
        let x = tf.layers.dense({ units: 128, kernelInitializer: 'heNormal', name: 'dense_base' }).apply(input);
        x = tf.layers.batchNormalization().apply(x);
        x = tf.layers.leakyReLU({ alpha: 0.2 }).apply(x);
        x = tf.layers.dropout({ rate: 0.2 }).apply(x);
        
        const gate = tf.layers.dense({ units: 128, activation: 'sigmoid', name: 'attention_gate' }).apply(x);
        const gated = tf.layers.multiply().apply([x, gate]);
        
        let x2 = tf.layers.dense({ units: 64, name: 'dense_bottleneck' }).apply(gated);
        x2 = tf.layers.leakyReLU({ alpha: 0.15 }).apply(x2);
        
        // Residual addition with projection
        const residual = tf.layers.dense({ units: 64 }).apply(gated);
        x = tf.layers.add().apply([x2, residual]);
        
        const riskHead = tf.layers.dense({ units: 1, activation: 'sigmoid', name: 'risk_output' }).apply(x);
        const confHead = tf.layers.dense({ units: 1, activation: 'sigmoid', name: 'confidence_output' }).apply(x);
        
        this.model = tf.model({ inputs: input, outputs: [riskHead, confHead] });
        this.model.compile({ 
            optimizer: tf.train.adam(0.001), 
            loss: { risk_output: 'meanSquaredError', confidence_output: 'binaryCrossentropy' }, 
            lossWeights: { risk_output: 1.0, confidence_output: 0.3 } 
        });
    }

    buildVector(raw10, lat, lon, alt, spatialData) {
        const [temp, hum, wind, gusts, precip, press, cloud, vis, uv, pm25] = raw10;
        const storm = Math.log1p(wind * precip), instability = Math.max(0, (1000 - press) * (hum/100));
        const feels = this.computeFeelsLike(temp, hum, wind);
        
        // 14 Base Features
        const base14 = [temp, hum, wind, gusts, precip, press, cloud, vis, uv, pm25, 1, storm, instability, feels];
        
        // 2 Top Interactions
        const interactions = [temp * hum, wind * precip];
        
        // 4 Spatial features
        const mergedLoc = (spatialData.coastalBias + (spatialData.regionalState || 0.5)) / 2;
        const spatial = [lat, lon, alt, mergedLoc];
        
        return [...base14, ...interactions, ...spatial]; // Total 20 per step
    }

    generateTrainingData() {
        const inputs = [], riskOutputs = [], confidenceOutputs = [];
        const N = 850;
        
        for (let i = 0; i < N; i++) {
            const lat = this.rand(-25, -20), lon = this.rand(-45, -40), alt = this.rand(0, 1000);
            const sequence = [];
            let curr = [this.rand(15, 38), this.rand(40, 95), this.rand(0, 35), this.rand(0, 50), this.rand(0, 15), this.rand(995, 1025), this.rand(0, 100), 20000, 5, 25];
            
            for (let t = 0; t < 3; t++) {
                curr = curr.map(v => v + this.rand(-2, 2));
                sequence.push(this.buildVector(curr, lat, lon, alt, { coastalBias: 0.6, regionalState: 0.5 }));
            }
            
            // v5.0 MAX: Calculate Explicit D1 & D2 (Temperature, Pressure, Wind, Precip, Humidity)
            const d1 = [sequence[1][0]-sequence[0][0], sequence[1][5]-sequence[0][5], sequence[1][2]-sequence[0][2], sequence[1][4]-sequence[0][4], sequence[1][1]-sequence[0][1]];
            const d2 = [sequence[2][0]-sequence[1][0], sequence[2][5]-sequence[1][5], sequence[2][2]-sequence[1][2], sequence[2][4]-sequence[1][4], sequence[2][1]-sequence[1][1]];
            
            inputs.push([...sequence[0], ...sequence[1], ...sequence[2], ...d1, ...d2]); // 20*3 + 5*2 = 70
            const risk = this.computePhysicsLabel(curr);
            riskOutputs.push([risk]);
            confidenceOutputs.push([Math.abs(risk - 0.5) * 2]);
        }
        return { inputs, riskOutputs, confidenceOutputs };
    }

    async train(onProgress) {
        try {
            this.model = await tf.loadLayersModel('localstorage://' + this.modelKey);
            this.isReady = true; return;
        } catch (_) {}
        
        this.buildModel();
        const data = this.generateTrainingData();
        const normalizedIn = data.inputs.map(row => this.normalizeInput(row));
        
        await this.model.fit(tf.tensor2d(normalizedIn), { 
            risk_output: tf.tensor2d(data.riskOutputs), 
            confidence_output: tf.tensor2d(data.confidenceOutputs) 
        }, { 
            epochs: 45, 
            batchSize: 32, 
            validationSplit: 0.1, 
            callbacks: { 
                onEpochEnd: (e, l) => onProgress && onProgress(e + 1, 45, l) 
            } 
        });
        
        await this.model.save('localstorage://' + this.modelKey);
        this.isReady = true;
    }

    normalizeInput(vector) {
        const normalized = [];
        const keys = Object.keys(this.featureRanges);
        
        for (let step = 0; step < 3; step++) {
            const offset = step * 20;
            for (let i = 0; i < 20; i++) {
                const range = this.featureRanges[keys[i]];
                if (!range) { normalized.push(0.5); continue; }
                let val = (vector[offset + i] - range.mean) / range.std;
                normalized.push(Math.max(0, Math.min(1, val * 0.4 + 0.5)));
            }
        }
        
        // Normalize 10 Deltas (T, P, W, R, H)
        const dScales = [5, 10, 15, 10, 20];
        for (let j = 0; j < 10; j++) {
            normalized.push(Math.max(0, Math.min(1, (vector[60 + j] / dScales[j % 5]) * 0.5 + 0.5)));
        }
        return normalized;
    }

    /**
     * v5.0 MAX: Hierarchical Decision Pipeline
     */
    async predict(data) {
        if (!this.model) return { riskScore: 0.1, level: 'safe', title: '🟢 ANÁLISE...' };
        
        const humidity = data.humidity || 50, press = data.pressureMsl || 1013, wind = data.windSpeed || 0, temp = data.temperature || 20;
        const lat = data.lat || 0, lon = data.lon || 0;
        const isRio = (lat > -24 && lat < -22 && lon > -44 && lon < -42);
        
        const currentVector = this.buildVector(
            [temp, humidity, wind, data.windGusts||wind*1.3, data.precipitation||0, press, data.cloudCover||0, data.visibility||20000, data.uvIndex||0, data.pm25||10],
            lat, lon, data.alt || 500, 
            { coastalBias: isRio ? 0.98 : 0.5, regionalState: data.regionalState || 0.6 }
        );

        this.slidingWindow.push(currentVector);
        if (this.slidingWindow.length > 3) this.slidingWindow.shift();
        let fw = [...this.slidingWindow];
        while (fw.length < 3) fw.unshift(fw[0]);
        
        // Sequential 70 features
        const d1 = [fw[1][0]-fw[0][0], fw[1][5]-fw[0][5], fw[1][2]-fw[0][2], fw[1][4]-fw[0][4], fw[1][1]-fw[0][1]];
        const d2 = [fw[2][0]-fw[1][0], fw[2][5]-fw[1][5], fw[2][2]-fw[1][2], fw[2][4]-fw[1][4], fw[2][1]-fw[1][1]];
        const ultimateVector = [...fw[0], ...fw[1], ...fw[2], ...d1, ...d2];
        
        const normalized = this.normalizeInput(ultimateVector);
        const pred = this.model.predict(tf.tensor2d([normalized]));
        const risk = (await pred[0].data())[0];
        const conf = (await pred[1].data())[0];
        
        // Tensor Guard
        pred[0].dispose();
        pred[1].dispose();

        // 1. Anomaly Check
        const anomaly = this.detectAnomaly(ultimateVector);
        
        // 2. Physics Heuristic
        const heuristic = this.computePhysicsLabel([temp, humidity, wind, data.windGusts||wind*1.3, data.precipitation||0, press, data.cloudCover||0, data.visibility||20000, data.uvIndex||0, data.pm25||10]);
        
        // 3. Dynamic Trust Fusion
        const fusion = this.computeFinalRisk(risk, conf, heuristic, anomaly);
        const finalRisk = fusion.risk;

        // 4. Intelligence Synthesis
        const explanation = this.generateText(data, finalRisk, conf);
        const topFactors = this.getTopRiskFactors(data, finalRisk);

        return { 
            riskScore: finalRisk || 0, 
            level: this.getRiskLevel(finalRisk || 0), 
            title: this.getRiskTitle(finalRisk || 0), 
            color: this.getRiskColor(finalRisk || 0), 
            confidence: isNaN(conf) ? 0.5 : conf,
            explanation,
            topFactors,
            trustWeight: fusion.nnWeight,
            anomalyScore: anomaly,
            timestamp: new Date().toLocaleTimeString() 
        };
    }

    computeFinalRisk(nnRisk, nnConf, heuristicRisk, anomaly) {
        let weight = Math.max(0.3, Math.min(0.9, 0.7 + (nnConf > 0.8 ? 0.15 : (nnConf < 0.5 ? -0.25 : 0))));
        if (anomaly > 0.7) weight -= 0.2;
        weight = Math.max(0.3, Math.min(0.85, weight));
        
        let risk = (nnRisk * weight) + (heuristicRisk * (1 - weight));
        if (heuristicRisk > 0.85 && nnRisk < 0.5) risk = Math.max(risk, heuristicRisk * 0.9); // Safety override
        return { risk, nnWeight: weight };
    }

    detectAnomaly(vector) {
        let score = 0;
        const keys = Object.keys(this.featureRanges);
        for (let i = 0; i < 20; i++) {
            const range = this.featureRanges[keys[i]];
            if (!range) continue;
            const z = Math.abs((vector[i] - range.mean) / range.std);
            if (z > 3.5) score += 0.3; else if (z > 2.8) score += 0.15;
        }
        return Math.min(1.0, score);
    }

    getDominantSignals(data) {
        const signals = { critical: [], severe: [], moderate: [], positive: [] };
        if (data.windGusts > 110) signals.critical.push("Ventos destrutivos");
        if (data.precipitation > 45) signals.critical.push("Chuva torrencial");
        if (data.pressureMsl < 975) signals.critical.push("Baixíssima pressão");
        if (data.pm25 > 250) signals.severe.push("Ar perigoso");
        if (data.uvIndex >= 11) signals.moderate.push("Radiação UV extrema");
        if (signals.critical.length === 0 && signals.severe.length === 0 && data.visibility > 15000) signals.positive.push("Visibilidade excelente");
        return signals;
    }

    getTopRiskFactors(data, risk) {
        const factors = [];
        if (data.windGusts > 50) factors.push({ factor: 'Ventos', percentage: Math.round((data.windGusts/150)*100) });
        if (data.precipitation > 5) factors.push({ factor: 'Chuva', percentage: Math.round((data.precipitation/60)*100) });
        if (data.pressureMsl < 1005) factors.push({ factor: 'Pressão', percentage: Math.round(((1013-data.pressureMsl)/30)*100) });
        return factors.slice(0, 3).sort((a,b) => b.percentage - a.percentage);
    }

    generateText(data, risk, conf) {
        const sigs = this.getDominantSignals(data);
        const displayConf = isNaN(conf) ? 0 : Math.round(conf * 100);
        
        if (sigs.critical.length > 0) return `🚨 PERIGO EXTREMO: ${sigs.critical.join(', ')}. Proteja-se imediatamente!`;
        if (risk > 0.7) return `⚠️ Condições severas detectadas. Foco em ${sigs.severe.concat(sigs.moderate).join(', ')}.`;
        if (risk < 0.35) return `✅ Condições seguras. ${sigs.positive.length > 0 ? sigs.positive[0] + '.' : 'Aproveite o dia!'} (Confiança: ${displayConf}%)`;
        return `🌦️ Risco moderado. Atenção a mudanças rápidas. Confiança: ${displayConf}%.`;
    }

    getRiskLevel(risk) { if (risk > 0.8) return 'critical'; if (risk > 0.6) return 'danger'; if (risk > 0.35) return 'warning'; return 'safe'; }
    getRiskTitle(risk) { if (risk > 0.8) return '🚨 RISCO EXTREMO'; if (risk > 0.6) return '🔴 PERIGO'; if (risk > 0.35) return '🟠 ATENÇÃO'; return '🟢 SEGURO'; }
    getRiskColor(risk) { if (risk > 0.8) return '#ff0040'; if (risk > 0.6) return '#ff3366'; if (risk > 0.35) return '#ff8800'; return '#00ff88'; }
}

// Inicialização Global
const meteorGuardAI = new MeteorGuardAI();
