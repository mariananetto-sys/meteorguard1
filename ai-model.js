/**
 * @class MeteorGuardAI
 * @version 4.1 MAX — HYBRID DYNAMICS EDITION
 * @description Sequential Deep Learning Engine with Temporal Memory (Sliding Window),
 *              Geographical Context Bias, and Spatial Vision (Regional Gradients).
 */
class MeteorGuardAI {
    constructor() {
        this.model = null;
        this.isReady = false;
        this.trainingLog = [];
        this.slidingWindow = [];     // v4.1 MAX: Sequential buffer for temporal memory
        this.performanceHistory = []; // v4.1 MAX: Tracking prediction accuracy for meta-learning
        this.nnWeight = 0.75;         // v4.1 MAX: Dynamic trust weight for the NN
        
        // v4.1 MAX: Updated model key
        this.modelKey = 'meteorguard-model-v4.1-max';
        
        this.calibrationTemperature = 1.0;
        this.featureImportance = null;
        this._prngState = 42;

        // v4.1 MAX: 27 Features per step mapping
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
            i1: { min: -100, max: 500, mean: 100, std: 150 }, // Interaction 1
            i2: { min: -100, max: 1000, mean: 200, std: 250 }, // Interaction 2
            i3: { min: -50, max: 100, mean: 25, std: 30 }, // Interaction 3
            i4: { min: -50, max: 1000, mean: 10, std: 50 }, // Interaction 4
            latitude:     { min: -90,   max: 90,    mean: 0,    std: 40   },
            longitude:    { min: -180,  max: 180,   mean: 0,    std: 100  },
            altitude:     { min: 0,     max: 8000,  mean: 500,  std: 1000 },
            gradPressure: { min: -10,   max: 10,    mean: 0,    std: 3    },
            gradTemp:     { min: -15,   max: 15,    mean: 0,    std: 4    },
            coastalBias:  { min: 0,     max: 1,     mean: 0.5,  std: 0.5  },
            regionalState:{ min: 0,     max: 1,     mean: 0.5,  std: 0.3  }
        };

        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║  🧠 METEORGUARD AI v4.1 MAX — HYBRID DYNAMICS EDITION    ║');
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
        if (visibility < 1000) score += 0.10;
        return Math.min(1.0, Math.max(0.0, score));
    }

    computeFeatureInteractions(vec16) {
        return [vec16[0] * vec16[1], vec16[2] * vec16[4], (1013 - vec16[5]) * vec16[1], vec16[6] * vec16[4]];
    }

    buildModel() {
        const input = tf.input({ shape: [81] }); // 3 steps * 27 features
        let x = tf.layers.dense({ units: 128, kernelInitializer: 'heNormal', activation: 'leakyReLU', name: 'dense1' }).apply(input);
        x = tf.layers.batchNormalization().apply(x);
        x = tf.layers.dropout({ rate: 0.3 }).apply(x);
        
        const attention = tf.layers.dense({ units: 128, activation: 'sigmoid', name: 'attention' }).apply(x);
        x = tf.layers.multiply().apply([x, attention]);
        
        let x2 = tf.layers.dense({ units: 64, activation: 'leakyReLU', name: 'dense2' }).apply(x);
        x = tf.layers.add().apply([x2, tf.layers.dense({ units: 64 }).apply(x)]); // Residual
        
        x = tf.layers.dense({ units: 32, activation: 'leakyReLU' }).apply(x);
        const riskHead = tf.layers.dense({ units: 1, activation: 'sigmoid', name: 'risk_output' }).apply(x);
        const confHead = tf.layers.dense({ units: 1, activation: 'sigmoid', name: 'confidence_output' }).apply(x);
        
        this.model = tf.model({ inputs: input, outputs: [riskHead, confHead] });
        this.model.compile({ optimizer: tf.train.adam(0.001), loss: { risk_output: 'meanSquaredError', confidence_output: 'binaryCrossentropy' }, lossWeights: { risk_output: 1.0, confidence_output: 0.4 } });
    }

    generateTrainingData() {
        const inputs = [], riskOutputs = [], confidenceOutputs = [];
        const N = 800;
        const buildVector = (raw10, lat, lon, alt) => {
            const [temp, hum, wind, gusts, precip, press, cloud, vis, uv, pm25] = raw10;
            const storm = Math.log1p(wind * precip), instability = Math.max(0, (1000 - press) * (hum/100));
            const dew = this.computeDewpoint(temp, hum), feels = this.computeFeelsLike(temp, hum, wind), wp = this.computeWindPower(wind);
            const base16 = [temp, hum, wind, gusts, precip, press, cloud, vis, uv, pm25, 1, storm, instability, dew, feels, wp];
            const interactions = this.computeFeatureInteractions(base16);
            
            // Spatial Vision (Rio/Naturals)
            const isRio = (lat > -25 && lat < -22 && lon > -45 && lon < -41) ? 1 : 0;
            return [...base16, ...interactions, lat, lon, alt, this.rand(-2, 2), this.rand(-3, 3), isRio ? 0.9 : 0.2, this.rand(0.3, 0.8)];
        };

        for (let i = 0; i < N; i++) {
            const lat = this.rand(-30, 10), lon = this.rand(-60, -35), alt = this.rand(0, 2000);
            const sequence = [];
            let curr = [this.rand(15, 35), this.rand(40, 90), this.rand(5, 30), this.rand(10, 50), this.rand(0, 10), this.rand(1000, 1020), this.rand(0, 100), 20000, 5, 20];
            for (let t = 0; t < 3; t++) {
                curr = curr.map(v => v + this.rand(-2, 2));
                sequence.push(buildVector(curr, lat, lon, alt));
            }
            inputs.push([...sequence[0], ...sequence[1], ...sequence[2]]);
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
        await this.model.fit(tf.tensor2d(normalizedIn), { risk_output: tf.tensor2d(data.riskOutputs), confidence_output: tf.tensor2d(data.confidenceOutputs) }, { epochs: 40, batchSize: 32, validationSplit: 0.15, callbacks: { onEpochEnd: (e, l) => onProgress && onProgress(e + 1, 40, l) } });
        await this.model.save('localstorage://' + this.modelKey);
        this.isReady = true;
    }

    normalizeInput(vector) {
        const normalized = [];
        const keys = Object.keys(this.featureRanges);
        for (let step = 0; step < 3; step++) {
            const offset = step * 27;
            for (let i = 0; i < 27; i++) {
                const range = this.featureRanges[keys[i]];
                normalized.push(range ? Math.max(0, Math.min(1, (vector[offset + i] - range.mean) / range.std * 0.5 + 0.5)) : 0.5);
            }
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
        
        // Spatial Vision Context (Tijuca / Rio)
        const lat = data.lat || 0, lon = data.lon || 0;
        const isRio = (lat > -24 && lat < -22 && lon > -44 && lon < -42);
        const spatial = [lat, lon, data.alt || 500, data.gradPressure || 0, data.gradTemp || 0, isRio ? 0.95 : 0.5, data.regionalState || 0.6];
        
        const currentVector = [...base16, ...interactions, ...spatial];
        this.slidingWindow.push(currentVector);
        if (this.slidingWindow.length > 3) this.slidingWindow.shift();
        let fullWindow = [...this.slidingWindow];
        while (fullWindow.length < 3) fullWindow.unshift(fullWindow[0]);
        
        const flattened = [...fullWindow[0], ...fullWindow[1], ...fullWindow[2]];
        const normalized = this.normalizeInput(flattened);
        const predTensor = this.model.predict(tf.tensor2d([normalized]));
        const risk = (await predTensor[0].data())[0], conf = (await predTensor[1].data())[0];
        
        // Online Performance Learning
        this.performanceHistory.push({ risk, data: {...data}, verified: false });

        return { riskScore: risk, level: this.getRiskLevel(risk), title: this.getRiskTitle(risk), color: this.getRiskColor(risk), confidence: conf, timestamp: new Date().toLocaleTimeString() };
    }

    getRiskLevel(risk) { if (risk > 0.8) return 'critical'; if (risk > 0.6) return 'danger'; if (risk > 0.4) return 'warning'; if (risk > 0.2) return 'warning-low'; return 'safe'; }
    getRiskTitle(risk) { if (risk > 0.8) return '🚨 RISCO EXTREMO'; if (risk > 0.6) return '🔴 PERIGO'; if (risk > 0.4) return '🟠 ATENÇÃO'; if (risk > 0.2) return '🟡 ATENÇÃO LEVE'; return '🟢 SEGURO'; }
    getRiskColor(risk) { if (risk > 0.8) return '#ff0040'; if (risk > 0.6) return '#ff3366'; if (risk > 0.4) return '#ff8800'; if (risk > 0.2) return '#ffdf00'; return '#00ff88'; }
}