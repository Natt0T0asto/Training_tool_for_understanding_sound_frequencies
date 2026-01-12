/**
 * Oscillator - オシレーター管理クラス
 * Web Audio APIのOscillatorNodeを簡単に制御
 */
class Oscillator {
    constructor(audioContext, equalLoudness, destination) {
        this.audioContext = audioContext;
        this.equalLoudness = equalLoudness;
        this.destination = destination;
        this.oscillator = null;
        this.gainNode = null;
        this.isPlaying = false;
    }

    /**
     * オシレーターを開始
     * @param {number} frequency - 周波数 (Hz)
     * @param {string} waveform - 波形タイプ
     * @param {number} volume - 音量 (0-1)
     * @param {string} equalLoudnessMode - 等ラウドネスモード
     */
    start(frequency, waveform = 'sine', volume = 0.3, equalLoudnessMode = 'off') {
        if (this.isPlaying) {
            this.stop();
        }

        // オシレーター作成
        this.oscillator = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();

        // 波形設定
        this.oscillator.type = waveform;
        this.oscillator.frequency.value = frequency;

        // 等ラウドネス補正を適用
        let correctedGain = volume;
        if (this.equalLoudness && equalLoudnessMode !== 'off') {
            const loudnessGain = this.equalLoudness.getGain(frequency, equalLoudnessMode);
            correctedGain = volume * loudnessGain;
        }

        // フェードイン処理
        this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.gainNode.gain.exponentialRampToValueAtTime(
            Math.max(0.001, correctedGain),
            this.audioContext.currentTime + 0.05
        );

        // 接続
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.destination || this.audioContext.destination);

        // 開始
        this.oscillator.start(this.audioContext.currentTime);
        this.isPlaying = true;
    }

    /**
     * オシレーターを停止
     */
    stop() {
        if (!this.oscillator || !this.isPlaying) {
            return;
        }

        // フェードアウト処理
        const currentGain = this.gainNode.gain.value;
        this.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
        this.gainNode.gain.setValueAtTime(currentGain, this.audioContext.currentTime);
        this.gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            this.audioContext.currentTime + 0.05
        );

        // 停止
        this.oscillator.stop(this.audioContext.currentTime + 0.05);
        this.isPlaying = false;

        // クリーンアップ
        setTimeout(() => {
            if (this.oscillator) {
                this.oscillator.disconnect();
                this.oscillator = null;
            }
            if (this.gainNode) {
                this.gainNode.disconnect();
                this.gainNode = null;
            }
        }, 100);
    }

    /**
     * 周波数を変更 (リアルタイム)
     * @param {number} frequency - 新しい周波数
     */
    setFrequency(frequency) {
        if (this.oscillator && this.isPlaying) {
            this.oscillator.frequency.setValueAtTime(
                frequency,
                this.audioContext.currentTime
            );
        }
    }

    /**
     * 音量を変更 (リアルタイム)
     * @param {number} volume - 新しい音量 (0-1)
     */
    setVolume(volume) {
        if (this.gainNode && this.isPlaying) {
            this.gainNode.gain.setValueAtTime(
                volume,
                this.audioContext.currentTime
            );
        }
    }

    /**
     * 波形を変更 (リアルタイム)
     * @param {string} waveform - 新しい波形タイプ
     */
    setWaveform(waveform) {
        if (this.oscillator && this.isPlaying) {
            this.oscillator.type = waveform;
        }
    }
}
