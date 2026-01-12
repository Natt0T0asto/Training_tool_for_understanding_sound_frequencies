/**
 * MultiOscillator - 複数周波数・ステレオ対応オシレータークラス
 * 複数の周波数を同時に再生，ステレオ配置にも対応
 */
class MultiOscillator {
    constructor(audioContext, equalLoudness, destination) {
        this.audioContext = audioContext;
        this.equalLoudness = equalLoudness;
        this.destination = destination;
        this.oscillators = [];
        this.gainNodes = [];
        this.panners = [];
        this.isPlaying = false;
    }

    /**
     * 複数周波数のオシレーターを開始
     * @param {Array<number>} frequencies - 周波数の配列
     * @param {boolean} stereo - ステレオ配置するかどうか
     * @param {string} waveform - 波形タイプ
     * @param {number} volume - 音量 (0-1)
     * @param {string} equalLoudnessMode - 等ラウドネスモード
     */
    start(frequencies, stereo = false, waveform = 'sine', volume = 0.3, equalLoudnessMode = 'off') {
        if (this.isPlaying) {
            this.stop();
        }

        const freqCount = frequencies.length;

        frequencies.forEach((frequency, index) => {
            // オシレーター作成
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            // 波形設定
            oscillator.type = waveform;
            oscillator.frequency.value = frequency;

            // 等ラウドネス補正を適用
            let correctedGain = volume / freqCount; // 複数音の場合は音量を分配
            if (this.equalLoudness && equalLoudnessMode !== 'off') {
                const loudnessGain = this.equalLoudness.getGain(frequency, equalLoudnessMode);
                correctedGain = (volume / freqCount) * loudnessGain;
            }

            // フェードイン処理
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                Math.max(0.001, correctedGain),
                this.audioContext.currentTime + 0.05
            );

            // 接続処理
            oscillator.connect(gainNode);

            // ステレオ配置が必要な場合
            if (stereo && freqCount === 2) {
                const panner = this.audioContext.createStereoPanner();
                // 2つの場合: 左 (-1) と 右 (1)
                panner.pan.value = index === 0 ? -1 : 1;
                gainNode.connect(panner);
                panner.connect(this.destination || this.audioContext.destination);
                this.panners.push(panner);
            } else {
                // ステレオ配置しない場合はそのまま接続
                gainNode.connect(this.destination || this.audioContext.destination);
            }

            // 開始
            oscillator.start(this.audioContext.currentTime);

            this.oscillators.push(oscillator);
            this.gainNodes.push(gainNode);
        });

        this.isPlaying = true;
    }

    /**
     * オシレーターを停止
     */
    stop() {
        if (!this.isPlaying) {
            return;
        }

        // フェードアウト処理
        this.gainNodes.forEach(gainNode => {
            const currentGain = gainNode.gain.value;
            gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(currentGain, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.001,
                this.audioContext.currentTime + 0.05
            );
        });

        // 停止
        this.oscillators.forEach(oscillator => {
            oscillator.stop(this.audioContext.currentTime + 0.05);
        });

        this.isPlaying = false;

        // クリーンアップ
        setTimeout(() => {
            this.oscillators.forEach(osc => osc.disconnect());
            this.gainNodes.forEach(gain => gain.disconnect());
            this.panners.forEach(panner => panner.disconnect());
            this.oscillators = [];
            this.gainNodes = [];
            this.panners = [];
        }, 100);
    }

    /**
     * 音量を変更 (リアルタイム)
     * @param {number} volume - 新しい音量 (0-1)
     */
    setVolume(volume) {
        if (this.isPlaying) {
            const freqCount = this.gainNodes.length;
            this.gainNodes.forEach(gainNode => {
                gainNode.gain.setValueAtTime(
                    volume / freqCount,
                    this.audioContext.currentTime
                );
            });
        }
    }
}
