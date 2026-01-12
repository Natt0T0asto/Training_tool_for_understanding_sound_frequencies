/**
 * App - メインアプリケーション
 * すべてのコンポーネントを初期化して統合
 */
class App {
    constructor() {
        this.audioEngine = null;
        this.quizManager = null;
        this.ui = null;
        this.initialized = false;
    }

    /**
     * アプリケーションを初期化
     */
    async init() {
        if (this.initialized) {
            return;
        }

        try {
            // 音量警告モーダルを表示
            this.showVolumeWarning();

            // AudioEngineを初期化
            this.audioEngine = new AudioEngine();
            await this.audioEngine.init();

            // 設定を読み込み
            const settings = StorageManager.loadSettings();
            this.audioEngine.setVolume(settings.volume / 100);

            // QuizManagerを初期化
            this.quizManager = new QuizManager(this.audioEngine);

            // UIControllerを初期化
            this.ui = new UIController(this.audioEngine, this.quizManager);

            // 設定をUIに適用
            this.applySettings(settings);

            this.initialized = true;
            console.log('アプリケーションの初期化が完了しました');

        } catch (error) {
            console.error('アプリケーションの初期化に失敗:', error);
            alert('アプリケーションの初期化に失敗しました．ブラウザを再読み込みしてください．');
        }
    }

    /**
     * 音量警告モーダルを表示
     */
    showVolumeWarning() {
        const modal = document.getElementById('volumeWarning');
        if (modal) {
            modal.style.display = 'flex';

            const acceptBtn = document.getElementById('acceptWarning');
            acceptBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                // Audio Contextを再開
                if (this.audioEngine) {
                    this.audioEngine.resume();
                }
            });
        }
    }

    /**
     * 設定をUIに適用
     * @param {Object} settings - 設定オブジェクト
     */
    applySettings(settings) {
        // 音量
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        if (volumeSlider && volumeValue) {
            volumeSlider.value = settings.volume;
            volumeValue.textContent = settings.volume + '%';
        }

        // 波形
        const waveformInput = document.getElementById(settings.defaultWaveform);
        if (waveformInput) {
            waveformInput.checked = true;
        }

        // 等ラウドネス
        const equalLoudnessSelect = document.getElementById('equalLoudness');
        if (equalLoudnessSelect) {
            equalLoudnessSelect.value = settings.equalLoudnessMode;
        }
    }

    /**
     * 設定を保存
     */
    saveSettings() {
        const volumeSlider = document.getElementById('volumeSlider');
        const waveformInput = document.querySelector('input[name="waveform"]:checked');
        const equalLoudnessSelect = document.getElementById('equalLoudness');

        const settings = {
            volume: parseInt(volumeSlider?.value || 30),
            defaultWaveform: waveformInput?.value || 'sine',
            equalLoudnessMode: equalLoudnessSelect?.value || 'off'
        };

        StorageManager.saveSettings(settings);
    }
}

// グローバルAppインスタンス
let app = null;

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', async () => {
    app = new App();
    await app.init();
});

// ページを閉じる前に設定を保存
window.addEventListener('beforeunload', () => {
    if (app) {
        app.saveSettings();
    }
});

// キーボードショートカット
document.addEventListener('keydown', (e) => {
    // スペースキー: 再生/停止
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        const playBtn = document.getElementById('playBtn');
        const stopBtn = document.getElementById('stopBtn');

        if (playBtn && !playBtn.disabled) {
            playBtn.click();
        } else if (stopBtn && !stopBtn.disabled) {
            stopBtn.click();
        }
    }

    // Enterキー: 解答送信
    if (e.code === 'Enter') {
        const submitBtn = document.getElementById('submitAnswer');
        if (submitBtn && !submitBtn.disabled) {
            submitBtn.click();
        }
    }
});
