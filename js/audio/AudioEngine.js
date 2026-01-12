/**
 * AudioEngine - Web Audio API制御エンジン
 * オシレーター，アナライザー，等ラウドネス補正を統合管理
 */
class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.analyser = null;
        this.oscillator = null;
        this.equalLoudness = new EqualLoudness();
        this.volume = 0.3;
        this.initialized = false;
        this.autoStopTimer = null; // 自動停止用タイマー
    }

    /**
     * Audio Contextを初期化
     */
    async init() {
        if (this.initialized) {
            return;
        }

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;

            // アナライザー作成
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;

            // 接続
            this.masterGain.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.initialized = true;
        } catch (error) {
            console.error('Audio Contextの初期化に失敗:', error);
            throw error;
        }
    }

    /**
     * 周波数を再生
     * @param {number} frequency - 周波数 (Hz)
     * @param {string} waveform - 波形タイプ
     * @param {number} duration - 再生時間 (秒，0で無限)
     * @param {string} equalLoudnessMode - 等ラウドネスモード
     */
    playFrequency(frequency, waveform = 'sine', duration = 0, equalLoudnessMode = 'off') {
        if (!this.initialized) {
            console.error('AudioEngineが初期化されていません');
            return;
        }

        // 既存のオシレーターを停止
        this.stop();

        // 新しいオシレーター作成（masterGainに接続）
        this.oscillator = new Oscillator(this.audioContext, this.equalLoudness, this.masterGain);
        this.oscillator.start(frequency, waveform, this.volume, equalLoudnessMode);

        // 持続時間が指定されている場合は自動停止
        if (duration > 0) {
            this.autoStopTimer = setTimeout(() => {
                this.stop();
            }, duration * 1000);
        }
    }

    /**
     * 複数周波数を再生（クイズ用）
     * @param {Array<number>} frequencies - 周波数の配列
     * @param {boolean} stereo - ステレオ配置
     * @param {string} waveform - 波形タイプ
     * @param {number} duration - 再生時間 (秒，0で無限)
     * @param {string} equalLoudnessMode - 等ラウドネスモード
     */
    playMultiFrequency(frequencies, stereo = false, waveform = 'sine', duration = 0, equalLoudnessMode = 'off') {
        if (!this.initialized) {
            console.error('AudioEngineが初期化されていません');
            return;
        }

        // 既存のオシレーターを停止
        this.stop();

        // 新しいマルチオシレーター作成
        this.oscillator = new MultiOscillator(this.audioContext, this.equalLoudness, this.masterGain);
        this.oscillator.start(frequencies, stereo, waveform, this.volume, equalLoudnessMode);

        // 持続時間が指定されている場合は自動停止
        if (duration > 0) {
            this.autoStopTimer = setTimeout(() => {
                this.stop();
            }, duration * 1000);
        }
    }

    /**
     * 再生を停止
     */
    stop() {
        // 自動停止タイマーをクリア
        if (this.autoStopTimer) {
            clearTimeout(this.autoStopTimer);
            this.autoStopTimer = null;
        }

        // オシレーターを停止
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator = null;
        }
    }

    /**
     * マスター音量を設定
     * @param {number} volume - 音量 (0-1)
     */
    setVolume(volume) {
        this.volume = MathUtils.clamp(volume, 0, 1);
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(
                this.volume,
                this.audioContext.currentTime
            );
        }
    }

    /**
     * Audio Contextを再開 (ユーザーインタラクション後)
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * アナライザーのデータを取得
     * @returns {Uint8Array} 周波数データ
     */
    getFrequencyData() {
        if (!this.analyser) {
            return new Uint8Array(0);
        }

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }

    /**
     * 現在の再生状態を取得
     * @returns {boolean} 再生中かどうか
     */
    isPlaying() {
        return this.oscillator && this.oscillator.isPlaying;
    }

    /**
     * 再生中の周波数を変更
     * @param {number} frequency - 新しい周波数
     */
    setFrequency(frequency) {
        if (this.oscillator) {
            this.oscillator.setFrequency(frequency);
        }
    }

    /**
     * 再生中の波形を変更
     * @param {string} waveform - 新しい波形
     */
    setWaveform(waveform) {
        if (this.oscillator) {
            this.oscillator.setWaveform(waveform);
        }
    }

    /**
     * 再生中の等ラウドネス補正を再適用
     * @param {number} frequency - 周波数
     * @param {string} equalLoudnessMode - 等ラウドネスモード
     */
    updateEqualLoudness(frequency, equalLoudnessMode) {
        if (this.oscillator && this.oscillator.isPlaying) {
            let correctedGain = this.volume;
            if (this.equalLoudness && equalLoudnessMode !== 'off') {
                const loudnessGain = this.equalLoudness.getGain(frequency, equalLoudnessMode);
                correctedGain = this.volume * loudnessGain;
            }
            this.oscillator.setVolume(correctedGain);
        }
    }
}
