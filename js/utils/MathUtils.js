/**
 * MathUtils - 数学関数ユーティリティ
 * 対数スケール計算，周波数変換などの数学的処理を提供
 */
class MathUtils {
    /**
     * 線形値を対数スケール値に変換
     * @param {number} value - 線形値 (20-20000 Hz)
     * @returns {number} 対数値 (log10)
     */
    static linearToLog(value) {
        return Math.log10(Math.max(20, Math.min(20000, value)));
    }

    /**
     * 対数スケール値を線形値に変換
     * @param {number} logValue - 対数値
     * @returns {number} 線形値 (Hz)
     */
    static logToLinear(logValue) {
        return Math.round(Math.pow(10, logValue));
    }

    /**
     * 対数スケールでランダムな周波数を生成
     * @param {number} min - 最小周波数 (Hz)
     * @param {number} max - 最大周波数 (Hz)
     * @returns {number} ランダムな周波数 (Hz)
     */
    static randomLogFreq(min, max) {
        const logMin = Math.log10(min);
        const logMax = Math.log10(max);
        const logRandom = logMin + Math.random() * (logMax - logMin);
        return Math.round(Math.pow(10, logRandom));
    }

    /**
     * 値を範囲内に制限
     * @param {number} value - 値
     * @param {number} min - 最小値
     * @param {number} max - 最大値
     * @returns {number} 制限された値
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * 線形補間
     * @param {number} a - 開始値
     * @param {number} b - 終了値
     * @param {number} t - 補間係数 (0-1)
     * @returns {number} 補間された値
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * 2点間のスプライン補間 (3次エルミート補間)
     * @param {number} x - 補間したいx座標
     * @param {number} x0 - 点1のx座標
     * @param {number} y0 - 点1のy座標
     * @param {number} x1 - 点2のx座標
     * @param {number} y1 - 点2のy座標
     * @returns {number} 補間されたy値
     */
    static interpolate(x, x0, y0, x1, y1) {
        if (x <= x0) return y0;
        if (x >= x1) return y1;

        // 線形補間
        const t = (x - x0) / (x1 - x0);
        return this.lerp(y0, y1, t);
    }

    /**
     * 周波数を表示用文字列に変換
     * @param {number} freq - 周波数 (Hz)
     * @returns {string} 表示用文字列
     */
    static formatFrequency(freq) {
        if (freq >= 1000) {
            return (freq / 1000).toFixed(1) + 'k';
        }
        return Math.round(freq).toString();
    }

    /**
     * 数値を3桁区切りでフォーマット
     * @param {number} num - 数値
     * @returns {string} 3桁区切り文字列
     */
    static formatWithCommas(num) {
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * パーセンテージを計算
     * @param {number} value - 値
     * @param {number} total - 合計
     * @returns {number} パーセンテージ (0-100)
     */
    static percentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }

    /**
     * 誤差率を計算
     * @param {number} actual - 実際の値
     * @param {number} answer - 回答値
     * @returns {number} 誤差率 (0-1)
     */
    static calculateError(actual, answer) {
        if (actual === 0) return 1;
        return Math.abs(actual - answer) / actual;
    }

    /**
     * 2つの周波数間のオクターブ比を計算
     * @param {number} freq1 - 周波数1
     * @param {number} freq2 - 周波数2
     * @returns {number} オクターブ比
     */
    static octaveRatio(freq1, freq2) {
        return Math.max(freq1, freq2) / Math.min(freq1, freq2);
    }

    /**
     * UUIDv4を生成
     * @returns {string} UUID
     */
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 配列をシャッフル (Fisher-Yates)
     * @param {Array} array - 配列
     * @returns {Array} シャッフルされた配列
     */
    static shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * dB値を線形ゲインに変換
     * @param {number} db - dB値
     * @returns {number} 線形ゲイン
     */
    static dbToGain(db) {
        return Math.pow(10, db / 20);
    }

    /**
     * 線形ゲインをdB値に変換
     * @param {number} gain - 線形ゲイン
     * @returns {number} dB値
     */
    static gainToDb(gain) {
        return 20 * Math.log10(Math.max(0.0001, gain));
    }
}
