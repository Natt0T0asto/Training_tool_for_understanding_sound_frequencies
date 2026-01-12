/**
 * ScoreCalculator - スコア計算クラス
 * 誤差率に基づいてスコアを計算
 */
class ScoreCalculator {
    /**
     * スコアを計算
     * @param {number} actualFreq - 実際の周波数
     * @param {number} userAnswer - ユーザーの解答
     * @returns {Object} スコア情報
     */
    static calculateScore(actualFreq, userAnswer) {
        const error = MathUtils.calculateError(actualFreq, userAnswer);
        const errorPercent = error * 100;

        // 連続的なスコア計算（指数減衰関数）
        // スコア = 100 * e^(-k * error)
        // k = 5 で調整（より緩やかなスコアリング）
        const k = 5;
        let score = Math.round(100 * Math.exp(-k * error));
        score = Math.max(0, Math.min(100, score)); // 0-100の範囲に制限

        // グレード判定（区分けはそのまま）
        let grade = '';
        if (error < 0.01) {
            grade = '完璧!';
        } else if (error < 0.05) {
            grade = '素晴らしい!';
        } else if (error < 0.10) {
            grade = '良い!';
        } else if (error < 0.20) {
            grade = '惜しい';
        } else {
            grade = '要練習';
        }

        return {
            score,
            grade,
            error: errorPercent,
            isCorrect: score >= 60
        };
    }

    /**
     * 複数周波数の解答をスコアリング
     * @param {Array<number>} actualFreqs - 実際の周波数の配列
     * @param {Array<number>} userAnswers - ユーザーの解答の配列
     * @param {boolean} sortAnswers - 解答をソートするかどうか（上級用）
     * @returns {Object} スコア情報
     */
    static calculateMultiScore(actualFreqs, userAnswers, sortAnswers = false) {
        // 配列の長さを合わせる
        while (userAnswers.length < actualFreqs.length) {
            userAnswers.push(1000); // デフォルト値
        }

        // 上級の場合は解答を周波数順にソート
        if (sortAnswers && userAnswers.length === 3) {
            userAnswers = [...userAnswers].sort((a, b) => a - b);
        }

        // 各周波数ペアのエラーを計算
        const errors = actualFreqs.map((actual, index) => {
            return MathUtils.calculateError(actual, userAnswers[index]);
        });

        // 平均誤差を計算
        const avgError = errors.reduce((sum, e) => sum + e, 0) / errors.length;

        // 平均誤差からスコアを計算
        const k = 5;
        let score = Math.round(100 * Math.exp(-k * avgError));
        score = Math.max(0, Math.min(100, score));

        // グレード判定
        let grade = '';
        if (avgError < 0.01) {
            grade = '完璧!';
        } else if (avgError < 0.05) {
            grade = '素晴らしい!';
        } else if (avgError < 0.10) {
            grade = '良い!';
        } else if (avgError < 0.20) {
            grade = '惜しい';
        } else {
            grade = '要練習';
        }

        return {
            score,
            grade,
            errors: errors.map(e => e * 100), // パーセント表記
            avgError: avgError * 100,
            isCorrect: score >= 60
        };
    }

    /**
     * 音域を判定（5段階）
     * @param {number} frequency - 周波数
     * @returns {string} 音域名
     */
    static getFrequencyRange(frequency) {
        if (frequency < 100) return 'ultraLow';      // 20-100Hz
        if (frequency < 500) return 'low';           // 100-500Hz
        if (frequency < 2000) return 'mid';          // 500-2000Hz
        if (frequency < 8000) return 'highMid';      // 2000-8000Hz
        return 'high';                                // 8000-20000Hz
    }

    /**
     * 音域名をHz表記に変換
     * @param {string} rangeName - 音域名
     * @returns {string} Hz表記
     */
    static getRangeLabel(rangeName) {
        const labels = {
            'ultraLow': '20-100Hz',
            'low': '100-500Hz',
            'mid': '500-2kHz',
            'highMid': '2k-8kHz',
            'high': '8k-20kHz'
        };
        return labels[rangeName] || rangeName;
    }

    /**
     * セッション全体のスコアを集計
     * @param {Array} questions - 全問題の配列
     * @returns {Object} 集計結果
     */
    static calculateSessionScore(questions) {
        const totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);
        const avgError = questions.reduce((sum, q) => sum + (q.avgError || q.error || 0), 0) / questions.length;

        // 音域別の平均スコアを計算（5段階）
        const rangeStats = {
            ultraLow: { totalScore: 0, count: 0 },
            low: { totalScore: 0, count: 0 },
            mid: { totalScore: 0, count: 0 },
            highMid: { totalScore: 0, count: 0 },
            high: { totalScore: 0, count: 0 }
        };

        questions.forEach(q => {
            // actualFreqが配列の場合は全周波数で判定
            const freqs = Array.isArray(q.actualFreq) ? q.actualFreq : [q.actualFreq];
            freqs.forEach(freq => {
                const range = this.getFrequencyRange(freq);
                rangeStats[range].totalScore += (q.score || 0);
                rangeStats[range].count++;
            });
        });

        // 音域別の平均スコアを0-1の範囲に正規化
        const rangeAccuracy = {
            ultraLow: rangeStats.ultraLow.count > 0 ? rangeStats.ultraLow.totalScore / rangeStats.ultraLow.count / 100 : 0,
            low: rangeStats.low.count > 0 ? rangeStats.low.totalScore / rangeStats.low.count / 100 : 0,
            mid: rangeStats.mid.count > 0 ? rangeStats.mid.totalScore / rangeStats.mid.count / 100 : 0,
            highMid: rangeStats.highMid.count > 0 ? rangeStats.highMid.totalScore / rangeStats.highMid.count / 100 : 0,
            high: rangeStats.high.count > 0 ? rangeStats.high.totalScore / rangeStats.high.count / 100 : 0
        };

        return {
            totalScore,
            avgError: avgError.toFixed(2),
            rangeAccuracy
        };
    }
}
