/**
 * @class MeteorGuardAI
 * @version 4.2 MAX — AUTONOMOUS HYBRID EDITION
 * @description Autonomous Deep Learning Engine with Explicit Temporal Deltas,
 *              Dynamic Trust Meta-Learning, and Regional Geographical Awareness.
 */
class MeteorGuardAI {
    constructor() {
        this.model = null;
        this.isReady = false;
        this.trainingLog = [];
        this.slidingWindow = [];     
        this.performanceHistory = []; 
        this.nnWeight = 0.8;         // v4.2 MAX: Starting trust weight, self-calibrating
        
        // v4.2 MAX: New model key for decoupled architecture
        this.modelKey = 'meteorguard-model-v4.2-max';
        
        this.calibrationTemperature = 1.0;
        this.featureImportance = null;
        this._prngState = 42;

        // v4.2 MAX: Normalization metadata (Hybrid Z-Score/Min-Max)
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
            dewpoint:     { min: -50,   max: 35,    mean: 10,   std: 12   },
            feelsLike:    { min: -60,   max: 75,    mean: 20,   std: 15   },
            windPower:    { min: 0,     max: 250,   mean: 5,    std: 15   },
            i1: { min: -100, max: 500, mean: 100, std: 150 },
            i2: { min: -100, max: 1000, mean: 200, std: 250 },
            i3: { min: -50, max: 100, mean: 25, std: 30 },
            i4: { min: -50, max: 1000, mean: 10, std: 50 },
            latitude:     { min: -90,   max: 90,    mean: 0,    std: 40   },
            longitude:    { min: -180,  max: 180,   mean: 0,    std: 100  },
            altitude:     { min: 0,     max: 8000,  mean: 500,  std: 1000 },
            gradPressure: { min: -10,   max: 10,    mean: 0,    std: 3    },
            gradTemp:     { min: -15,   max: 15,    mean: 0,    std: 4    },
            coastalBias:  { min: 0,     max: 1,     mean: 0.5,  std: 0.5  },
            regionalState:{ min: 0,     max: 1,     mean: 0.5,  std: 0.3  }
        };

        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║  🧠 METEORGUARD AI v4.2 MAX — AUTONOMOUS HYBRID EDITION  ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
    }

    seededRand() {
        let t = (this._prngState += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    rand(min, max) { return this.seededRand() * (max - min) + min; }
    randGauss(mu = 0, sigma = 1) {
        const u1 = Math.max(1e-10, this.seededRand()), u2 = this.seededRand();
        return mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    computeDewpoint(temp, humidity) {
        const a = 17.27, b = 237.7;
        const gamma = (a * temp) / (b + temp) + Math.log(Math.max(0.01, humidity) / 100);
        return (b * gamma) / (a - gamma);
    }

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

    computeWindPower(windSpeed) { return (windSpeed * windSpeed) / 100; }

    computePhysicsLabel(raw) {
        const [temp, humidity, wind, gusts, precip, pressure, cloudCover, visibility, uv, pm25] = raw;
        let score = 0;
        if (temp > 40) score += 0.25; else if (temp < 0) score += 0.15;
        if (gusts > 100) score += 0.30; else if (wind > 45) score += 0.15;
        if (precip > 25) score += 0.20;
        if (pressure < 990) score += 0.20;
        if (visibility < 1000) score += 0.15;
        return Math.min(1.0, Math.max(0.0, score));
    }

    computeFeatureInteractions(vec16) {
        return [vec16[0] * vec16[1], vec16[2] * vec16[4], (1013 - vec16[5]) * vec16[1], vec16[6] * vec16[4]];
    }

    buildModel() {
        // v4.2 MAX: (27 features * 3 steps) + (5 primary deltas * 2 periods) = 91 total
        const input = tf.input({ shape: [91] }); 
        
        let x = tf.layers.dense({ units: 160, kernelInitializer: 'heNormal', name: 'dense1' }).apply(input);
        x = tf.layers.batchNormalization().apply(x);
        x = tf.layers.leakyReLU({ alpha: 0.2 }).apply(x); // v4.2 FIX: Correct layer usage
        x = tf.layers.dropout({ rate: 0.3 }).apply(x);
        
        const attention = tf.layers.dense({ units: 160, activation: 'sigmoid', name: 'attention_gate' }).apply(x);
        x = tf.layers.multiply().apply([x, attention]);
        
        let x2 = tf.layers.dense({ units: 80, name: 'dense2' }).apply(x);
        x2 = tf.layers.leakyReLU({ alpha: 0.15 }).apply(x2);
        
        // Residual path
        const residual = tf.layers.dense({ units: 80 }).apply(x);
        x = tf.layers.add().apply([x2, residual]);
        
        x = tf.layers.dense({ units: 40 }).apply(x);
        x = tf.layers.leakyReLU({ alpha: 0.1 }).apply(x);
        
        const riskHead = tf.layers.dense({ units: 1, activation: 'sigmoid', name: 'risk_output' }).apply(x);
        const confHead = tf.layers.dense({ units: 1, activation: 'sigmoid', name: 'confidence_output' }).apply(x);
        
        this.model = tf.model({ inputs: input, outputs: [riskHead, confHead] });
        this.model.compile({ 
            optimizer: tf.train.adam(0.001), 
            loss: { risk_output: 'meanSquaredError', confidence_output: 'binaryCrossentropy' }, 
            lossWeights: { risk_output: 1.0, confidence_output: 0.4 } 
        });
    }

    generateTrainingData() {
        const inputs = [], riskOutputs = [], confidenceOutputs = [];
        const N = 900;
        const buildVector = (raw10, lat, lon, alt) => {
            const [temp, hum, wind, gusts, precip, press, cloud, vis, uv, pm25] = raw10;
            const storm = Math.log1p(wind * precip), instability = Math.max(0, (1000 - press) * (hum/100));
            const dew = this.computeDewpoint(temp, hum), feels = this.computeFeelsLike(temp, hum, wind), wp = this.computeWindPower(wind);
            const base16 = [temp, hum, wind, gusts, precip, press, cloud, vis, uv, pm25, 1, storm, instability, dew, feels, wp];
            const interactions = this.computeFeatureInteractions(base16);
            const isRio = (lat > -25 && lat < -22 && lon > -45 && lon < -41) ? 1 : 0;
            return [...base16, ...interactions, lat, lon, alt, this.rand(-2, 2), this.rand(-3, 3), isRio ? 0.95 : 0.2, this.rand(0.3, 0.8)];
        };

        for (let i = 0; i < N; i++) {
            const lat = this.rand(-30, 0), lon = this.rand(-55, -40), alt = this.rand(0, 1500);
            const sequence = [];
            let curr = [this.rand(10, 40), this.rand(30, 95), this.rand(0, 40), this.rand(0, 60), this.rand(0, 20), this.rand(990, 1030), this.rand(0, 100), 20000, 5, 20];
            
            for (let t = 0; t < 3; t++) {
                curr = curr.map(v => v + this.rand(-3, 3));
                sequence.push(buildVector(curr, lat, lon, alt));
            }
            
            // v4.2 MAX: Calculate Explicit Temporal Deltas
            // Delta1: Step 2 - Step 1 | Delta2: Step 3 - Step 2
            // Selected indexes: 0(temp), 5(press), 2(wind), 4(precip), 1(hum)
            const d1 = [sequence[1][0]-sequence[0][0], sequence[1][5]-sequence[0][5], sequence[1][2]-sequence[0][2], sequence[1][4]-sequence[0][4], sequence[1][1]-sequence[0][1]];
            const d2 = [sequence[2][0]-sequence[1][0], sequence[2][5]-sequence[1][5], sequence[2][2]-sequence[1][2], sequence[2][4]-sequence[1][4], sequence[2][1]-sequence[1][1]];
            
            const flattened = [...sequence[0], ...sequence[1], ...sequence[2], ...d1, ...d2];
            inputs.push(flattened);
            
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
            epochs: 50, 
            batchSize: 32, 
            validationSplit: 0.15, 
            callbacks: { 
                onEpochEnd: (e, l) => onProgress && onProgress(e + 1, 50, l) 
            } 
        });
        
        await this.model.save('localstorage://' + this.modelKey);
        this.isReady = true;
    }

    normalizeInput(vector) {
        const normalized = [];
        const keys = Object.keys(this.featureRanges);
        
        // v4.2 MAX: Process 3 steps (27 features each)
        for (let step = 0; step < 3; step++) {
            const offset = step * 27;
            for (let i = 0; i < 27; i++) {
                const range = this.featureRanges[keys[i]];
                if (!range) { normalized.push(0.5); continue; }
                
                // Hybrid Z-Score with 0.5 bias and clamping
                let val = (vector[offset + i] - range.mean) / range.std;
                val = val * 0.4 + 0.5; // Scale to ~ [0, 1] for typical ranges
                normalized.push(Math.max(0, Math.min(1, val)));
            }
        }
        
        // v4.2 MAX: Process 10 delta features (raw)
        // Deltas are normalized by a fixed scale (Temp delta 5C, Press 10hPa, etc.)
        const deltaScales = [5, 10, 15, 10, 20]; // T, P, W, R, H
        for (let j = 0; j < 10; j++) {
            const scale = deltaScales[j % 5];
            const val = (vector[81 + j] / scale) * 0.5 + 0.5;
            normalized.push(Math.max(0, Math.min(1, val)));
        }
        
        return normalized;
    }

    async predict(data) {
        if (!this.model) return { riskScore: 0.1, level: 'safe', title: '🟢 SEGURO (FALLBACK)' };
        
        const humidity = data.humidity || 50, press = data.pressureMsl || 1013, wind = data.windSpeed || 0, temp = data.temperature || 20, precip = data.precipitation || 0;
        const storm = Math.log1p(wind * precip), instability = Math.max(0, (1000 - press) * (humidity / 100));
        const dew = this.computeDewpoint(temp, humidity), feels = this.computeFeelsLike(temp, humidity, wind), wp = this.computeWindPower(wind);
        const base16 = [temp, humidity, wind, data.windGusts || 0, precip, press, data.cloudCover || 0, data.visibility || 20000, data.uvIndex || 0, data.pm25 || 10, 1, storm, instability, dew, feels, wp];
        const interactions = this.computeFeatureInteractions(base16);
        
        // v4.2 MAX: Refined location logic
        const lat = data.lat || 0, lon = data.lon || 0;
        const isRio = (lat > -24 && lat < -22 && lon > -44 && lon < -42);
        const coastalBias = isRio ? 0.98 : 0.5;
        const spatial = [lat, lon, data.alt || 500, data.gradPressure || 0, data.gradTemp || 0, coastalBias, data.regionalState || 0.6];
        
        const currentVector = [...base16, ...interactions, ...spatial];
        this.slidingWindow.push(currentVector);
        if (this.slidingWindow.length > 3) this.slidingWindow.shift();
        
        let fullWindow = [...this.slidingWindow];
        while (fullWindow.length < 3) fullWindow.unshift(fullWindow[0]);
        
        // v4.2 MAX: Construct 91-feature autonomous vector with explicit deltas
        const d1 = [fullWindow[1][0]-fullWindow[0][0], fullWindow[1][5]-fullWindow[0][5], fullWindow[1][2]-fullWindow[0][2], fullWindow[1][4]-fullWindow[0][4], fullWindow[1][1]-fullWindow[0][1]];
        const d2 = [fullWindow[2][0]-fullWindow[1][0], fullWindow[2][5]-fullWindow[1][5], fullWindow[2][2]-fullWindow[1][2], fullWindow[2][4]-fullWindow[1][4], fullWindow[2][1]-fullWindow[1][1]];
        
        const autonomousVector = [...fullWindow[0], ...fullWindow[1], ...fullWindow[2], ...d1, ...d2];
        const normalized = this.normalizeInput(autonomousVector);
        
        const predTensor = this.model.predict(tf.tensor2d([normalized]));
        const risk = (await predTensor[0].data())[0], conf = (await predTensor[1].data())[0];
        
        // v4.2 MAX: Self-Calibrating Trust Weighting
        const heuristic = this.advancedHeuristic(data);
        const finalRisk = (risk * this.nnWeight + heuristic * (1 - this.nnWeight));
        
        // Store for next step performance check
        this.performanceHistory.push({ risk: finalRisk, data: {...data}, verified: false });
        if (this.performanceHistory.length > 30) this.performanceHistory.shift();
        
        return { 
            riskScore: finalRisk, 
            level: this.getRiskLevel(finalRisk), 
            title: this.getRiskTitle(finalRisk), 
            color: this.getRiskColor(finalRisk), 
            confidence: conf, 
            trustWeight: this.nnWeight,
            timestamp: new Date().toLocaleTimeString() 
        };
    }

    advancedHeuristic(data) { return this.computePhysicsLabel([data.temperature, data.humidity, data.windSpeed, data.windGusts||0, data.precipitation, data.pressureMsl, data.cloudCover||0, data.visibility||20000, data.uvIndex||0, data.pm25||10]); }

    // v4.2 MAX: Autonomous Performance Calibrator
    recordActualOutcome(currentData) {
        if (this.performanceHistory.length < 2) return;
        const last = this.performanceHistory[this.performanceHistory.length - 2];
        if (last.verified) return;
        
        const actual = this.advancedHeuristic(currentData);
        const error = Math.abs(last.risk - actual);
        
        // Adjust trust: lower error -> higher NN trust
        const calibrationFactor = 0.5; // Aggressiveness
        this.nnWeight = Math.max(0.4, Math.min(0.9, 0.85 - (error * calibrationFactor)));
        last.verified = true;
        
        console.log(`[METEORGUARD AI v4.2 MAX] Auto-Calibration: Error=${error.toFixed(3)} | NN Trust: ${(this.nnWeight*100).toFixed(1)}%`);
    }

    getRiskLevel(risk) { if (risk > 0.8) return 'critical'; if (risk > 0.6) return 'danger'; if (risk > 0.4) return 'warning'; if (risk > 0.2) return 'warning-low'; return 'safe'; }
    getRiskTitle(risk) { if (risk > 0.8) return '🚨 RISCO EXTREMO'; if (risk > 0.6) return '🔴 PERIGO'; if (risk > 0.4) return '🟠 ATENÇÃO'; if (risk > 0.2) return '🟡 ATENÇÃO LEVE'; return '🟢 SEGURO'; }
    getRiskColor(risk) { if (risk > 0.8) return '#ff0040'; if (risk > 0.6) return '#ff3366'; if (risk > 0.4) return '#ff8800'; if (risk > 0.2) return '#ffdf00'; return '#00ff88'; }
}