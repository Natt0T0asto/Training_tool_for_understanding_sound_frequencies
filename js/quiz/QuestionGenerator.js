/**
 * QuestionGenerator - 問題生成クラス
 * 難易度に応じて周波数問題を生成
 */
class QuestionGenerator {
    static FREQUENCY_RANGES = {
        ultraLow:  { min: 20,    max: 80,    count: 1 },
        low:       { min: 80,    max: 250,   count: 2 },
        lowMid:    { min: 250,   max: 500,   count: 1 },
        mid:       { min: 500,   max: 2000,  count: 3 },
        highMid:   { min: 2000,  max: 6000,  count: 2 },
        high:      { min: 6000,  max: 12000, count: 1 },
        ultraHigh: { min: 12000, max: 20000, count: 1 }
    };

    static DIFFICULTY = {
        easy: {
            freqCount: 1,
            minFreqGap: 1.5,
            equalLoudness: 'off',
            stereo: false
        },
        medium: {
            freqCount: 2,
            minFreqGap: 1.25,
            equalLoudness: 'off',
            stereo: true
        },
        hard: {
            freqCount: 3,
            minFreqGap: 1.1,
            equalLoudness: '60',
            stereo: false
        }
    };

    /**
     * 問題セットを生成
     * @param {string} difficulty - 難易度
     * @param {number} count - 問題数
     * @returns {Array} 問題の配列
     */
    static generateQuestions(difficulty = 'medium', count = 10) {
        const questions = [];
        const usedFrequencies = new Set();

        const config = this.DIFFICULTY[difficulty];

        for (let i = 0; i < count; i++) {
            const question = this.generateQuestion(config, usedFrequencies);
            questions.push(question);
            usedFrequencies.add(question.frequency);
        }

        return MathUtils.shuffle(questions);
    }

    /**
     * 1つの問題を生成
     * @param {Object} config - 難易度設定
     * @param {Set} usedFrequencies - 既に使用した周波数
     * @returns {Object} 問題オブジェクト
     */
    static generateQuestion(config, usedFrequencies) {
        const frequencies = [];

        // 必要な数の周波数を生成
        for (let i = 0; i < config.freqCount; i++) {
            // ランダムに音域を選択
            const ranges = Object.keys(this.FREQUENCY_RANGES);
            const rangeName = ranges[Math.floor(Math.random() * ranges.length)];
            const range = this.FREQUENCY_RANGES[rangeName];

            // 周波数を生成 (重複回避，既存周波数との間隔確保)
            let frequency;
            let attempts = 0;
            do {
                frequency = MathUtils.randomLogFreq(range.min, range.max);
                attempts++;

                // 既存の周波数との間隔チェック
                const tooClose = frequencies.some(f => {
                    const ratio = Math.max(f, frequency) / Math.min(f, frequency);
                    return ratio < config.minFreqGap;
                });

                if (!tooClose && !usedFrequencies.has(frequency)) {
                    break;
                }
            } while (attempts < 100);

            frequencies.push(frequency);
            usedFrequencies.add(frequency);
        }

        // ステレオの場合，左右の順番をランダム化（50%の確率で逆順）
        let finalFrequencies = frequencies.sort((a, b) => a - b); // まずソート
        if (config.stereo && Math.random() < 0.5) {
            finalFrequencies = finalFrequencies.reverse(); // 50%の確率で逆順
        }

        return {
            frequencies: finalFrequencies,
            stereo: config.stereo,
            waveform: 'sine',
            duration: 10, // 10秒
            equalLoudness: config.equalLoudness
        };
    }
}
