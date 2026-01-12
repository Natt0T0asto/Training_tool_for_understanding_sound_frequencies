/**
 * EqualLoudness - 等ラウドネス補正クラス
 * ISO 226:2003準拠の等ラウドネス曲線データに基づいて
 * 周波数ごとのゲイン補正を計算
 */
class EqualLoudness {
    constructor() {
        this.curves = null;
        this.loadCurves();
    }

    /**
     * 等ラウドネス曲線データを読み込み
     */
    async loadCurves() {
        try {
            const response = await fetch('data/equal_loudness_curves.json');
            this.curves = await response.json();
        } catch (error) {
            console.error('等ラウドネス曲線データの読み込みに失敗:', error);
            this.curves = {};
        }
    }

    /**
     * 指定された周波数とラウドネスレベルに対するゲイン補正値を取得
     * @param {number} frequency - 周波数 (Hz)
     * @param {string|number} phon - ラウドネスレベル ('40', '60', '80', または 'off')
     * @returns {number} ゲイン補正値 (線形スケール)
     */
    getGain(frequency, phon) {
        if (!this.curves || phon === 'off' || phon === null) {
            return 1.0; // 補正なし
        }

        const curveKey = `${phon}_phon`;
        const curve = this.curves[curveKey];

        if (!curve) {
            console.warn(`曲線データが見つかりません: ${curveKey}`);
            return 1.0;
        }

        // 曲線データから補正値を補間して取得
        const dbCorrection = this.interpolateCorrection(frequency, curve);

        // dBを線形ゲインに変換して返す
        return MathUtils.dbToGain(dbCorrection);
    }

    /**
     * 周波数に対する補正値を補間
     * @param {number} frequency - 周波数 (Hz)
     * @param {Object} curve - 曲線データオブジェクト
     * @returns {number} 補正値 (dB)
     */
    interpolateCorrection(frequency, curve) {
        // 曲線データの周波数ポイントを数値に変換して取得
        const freqPoints = Object.keys(curve).map(f => parseFloat(f)).sort((a, b) => a - b);

        // 周波数が範囲外の場合
        if (frequency <= freqPoints[0]) {
            return curve[freqPoints[0]];
        }
        if (frequency >= freqPoints[freqPoints.length - 1]) {
            return curve[freqPoints[freqPoints.length - 1]];
        }

        // 補間する2点を見つける
        let lowerFreq = freqPoints[0];
        let upperFreq = freqPoints[freqPoints.length - 1];

        for (let i = 0; i < freqPoints.length - 1; i++) {
            if (frequency >= freqPoints[i] && frequency <= freqPoints[i + 1]) {
                lowerFreq = freqPoints[i];
                upperFreq = freqPoints[i + 1];
                break;
            }
        }

        const lowerDb = curve[lowerFreq];
        const upperDb = curve[upperFreq];

        // 対数スケールで補間
        const logFreq = Math.log10(frequency);
        const logLower = Math.log10(lowerFreq);
        const logUpper = Math.log10(upperFreq);

        const t = (logFreq - logLower) / (logUpper - logLower);
        return MathUtils.lerp(lowerDb, upperDb, t);
    }

    /**
     * 等ラウドネス曲線をCanvasに描画
     * @param {CanvasRenderingContext2D} ctx - Canvas コンテキスト
     * @param {number} width - Canvas 幅
     * @param {number} height - Canvas 高さ
     * @param {string} phon - ラウドネスレベル
     */
    drawCurve(ctx, width, height, phon) {
        if (!this.curves || phon === 'off') {
            return;
        }

        const curveKey = `${phon}_phon`;
        const curve = this.curves[curveKey];

        if (!curve) {
            return;
        }

        const freqPoints = Object.keys(curve).map(f => parseFloat(f)).sort((a, b) => a - b);
        const minFreq = 20;
        const maxFreq = 20000;
        const minDb = -60;
        const maxDb = 20;

        ctx.save();
        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 2;
        ctx.beginPath();

        let first = true;

        for (let freq = minFreq; freq <= maxFreq; freq *= 1.05) {
            const db = this.interpolateCorrection(freq, curve);

            // 周波数を対数スケールでx座標に変換
            const logFreq = Math.log10(freq);
            const logMin = Math.log10(minFreq);
            const logMax = Math.log10(maxFreq);
            const x = ((logFreq - logMin) / (logMax - logMin)) * width;

            // dBをy座標に変換
            const y = height - ((db - minDb) / (maxDb - minDb)) * height;

            if (first) {
                ctx.moveTo(x, y);
                first = false;
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
        ctx.restore();
    }

    /**
     * 複数の等ラウドネス曲線を描画
     * @param {CanvasRenderingContext2D} ctx - Canvas コンテキスト
     * @param {number} width - Canvas 幅
     * @param {number} height - Canvas 高さ
     */
    drawAllCurves(ctx, width, height) {
        if (!this.curves) {
            return;
        }

        const colors = {
            '40_phon': '#4CAF50',
            '60_phon': '#FF9800',
            '80_phon': '#F44336'
        };

        ctx.save();

        // 背景
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        // グリッド線
        this.drawGrid(ctx, width, height);

        // 各曲線を描画
        Object.keys(this.curves).forEach(curveKey => {
            const curve = this.curves[curveKey];
            const freqPoints = Object.keys(curve).map(f => parseFloat(f)).sort((a, b) => a - b);
            const minFreq = 20;
            const maxFreq = 20000;
            const minDb = -60;
            const maxDb = 20;

            ctx.strokeStyle = colors[curveKey] || '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();

            let first = true;

            for (let freq = minFreq; freq <= maxFreq; freq *= 1.05) {
                const db = this.interpolateCorrection(freq, curve);

                const logFreq = Math.log10(freq);
                const logMin = Math.log10(minFreq);
                const logMax = Math.log10(maxFreq);
                const x = ((logFreq - logMin) / (logMax - logMin)) * width;

                const y = height - ((db - minDb) / (maxDb - minDb)) * height;

                if (first) {
                    ctx.moveTo(x, y);
                    first = false;
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();
        });

        // ラベル
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px sans-serif';
        ctx.fillText('40 phon', 10, 30);
        ctx.fillText('60 phon', 10, 50);
        ctx.fillText('80 phon', 10, 70);

        ctx.restore();
    }

    /**
     * グリッド線を描画
     * @param {CanvasRenderingContext2D} ctx - Canvas コンテキスト
     * @param {number} width - Canvas 幅
     * @param {number} height - Canvas 高さ
     */
    drawGrid(ctx, width, height) {
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;

        // 周波数グリッド (対数スケール)
        const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
        const logMin = Math.log10(20);
        const logMax = Math.log10(20000);

        frequencies.forEach(freq => {
            const logFreq = Math.log10(freq);
            const x = ((logFreq - logMin) / (logMax - logMin)) * width;

            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();

            // ラベル
            ctx.fillStyle = '#666666';
            ctx.font = '10px sans-serif';
            ctx.fillText(MathUtils.formatFrequency(freq) + 'Hz', x + 2, height - 5);
        });

        // dBグリッド
        const dbLevels = [-60, -40, -20, 0, 20];
        const minDb = -60;
        const maxDb = 20;

        dbLevels.forEach(db => {
            const y = height - ((db - minDb) / (maxDb - minDb)) * height;

            ctx.strokeStyle = '#333333';
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            // ラベル
            ctx.fillStyle = '#666666';
            ctx.fillText(db + 'dB', 5, y - 2);
        });
    }
}
