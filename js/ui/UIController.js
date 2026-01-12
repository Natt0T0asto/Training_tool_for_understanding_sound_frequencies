/**
 * UIController - UI制御クラス
 * すべてのUI要素のイベントハンドリングと状態管理
 */
class UIController {
    constructor(audioEngine, quizManager) {
        this.audioEngine = audioEngine;
        this.quizManager = quizManager;
        this.visualizer = null;
        this.currentMode = 'freeplay';
        this.playbackTimer = null; // 再生タイマー
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        // ナビゲーション
        this.navBtns = document.querySelectorAll('.nav-btn');
        this.modeSections = document.querySelectorAll('.mode-section');

        // フリープレイ
        this.frequencySlider = document.getElementById('frequencySlider');
        this.frequencyInput = document.getElementById('frequencyInput');
        this.presetBtns = document.querySelectorAll('.preset-btn');
        this.waveformInputs = document.querySelectorAll('input[name="waveform"]');
        this.equalLoudnessSelect = document.getElementById('equalLoudness');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.playBtn = document.getElementById('playBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.spectrumCanvas = document.getElementById('spectrumCanvas');

        // クイズ
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');
        this.difficultySelect = document.getElementById('difficultySelect');
        this.quizPlay = document.getElementById('quizPlay');
        this.quizResults = document.getElementById('quizResults');
        this.questionNumber = document.getElementById('questionNumber');
        this.quizScore = document.getElementById('quizScore');
        this.timeRemaining = document.getElementById('timeRemaining');
        this.quizPlayBtn = document.getElementById('quizPlayBtn');
        this.playProgressBar = document.getElementById('playProgressBar');
        this.answerInputs = document.getElementById('answerInputs');
        this.submitAnswer = document.getElementById('submitAnswer');
        this.feedbackSection = document.getElementById('feedbackSection');
        this.exitQuiz = document.getElementById('exitQuiz');
        this.nextQuestionBtn = null; // 動的に作成

        // 履歴
        this.exportHistory = document.getElementById('exportHistory');
        this.clearHistory = document.getElementById('clearHistory');
        this.historyList = document.getElementById('historyList');

        // 警告モーダル
        this.volumeWarning = document.getElementById('volumeWarning');
        this.acceptWarning = document.getElementById('acceptWarning');
    }

    initEventListeners() {
        // ナビゲーション
        this.navBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
        });

        // 周波数スライダー (対数スケール)
        this.frequencySlider.addEventListener('input', (e) => {
            const freq = MathUtils.logToLinear(parseFloat(e.target.value));
            this.frequencyInput.value = MathUtils.formatWithCommas(freq);
            // 再生中なら即座に反映
            if (this.audioEngine.isPlaying()) {
                this.audioEngine.setFrequency(freq);
                const equalLoudness = this.equalLoudnessSelect.value;
                this.audioEngine.updateEqualLoudness(freq, equalLoudness);
            }
        });

        this.frequencyInput.addEventListener('input', (e) => {
            const freqStr = e.target.value.replace(/,/g, ''); // カンマを除去
            const freq = parseInt(freqStr);
            if (freq >= 20 && freq <= 20000) {
                this.frequencySlider.value = MathUtils.linearToLog(freq);
                e.target.value = MathUtils.formatWithCommas(freq);
                // 再生中なら即座に反映
                if (this.audioEngine.isPlaying()) {
                    this.audioEngine.setFrequency(freq);
                    const equalLoudness = this.equalLoudnessSelect.value;
                    this.audioEngine.updateEqualLoudness(freq, equalLoudness);
                }
            }
        });

        // プリセットボタン
        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const freq = parseInt(btn.dataset.freq);
                this.frequencyInput.value = MathUtils.formatWithCommas(freq);
                this.frequencySlider.value = MathUtils.linearToLog(freq);
                // 再生中なら即座に反映
                if (this.audioEngine.isPlaying()) {
                    this.audioEngine.setFrequency(freq);
                    const equalLoudness = this.equalLoudnessSelect.value;
                    this.audioEngine.updateEqualLoudness(freq, equalLoudness);
                }
            });
        });

        // 波形選択
        this.waveformInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                // 再生中なら即座に反映
                if (this.audioEngine.isPlaying()) {
                    this.audioEngine.setWaveform(e.target.value);
                }
            });
        });

        // 等ラウドネス補正
        this.equalLoudnessSelect.addEventListener('change', (e) => {
            // 再生中なら即座に反映
            if (this.audioEngine.isPlaying()) {
                const freq = parseInt(this.frequencyInput.value);
                this.audioEngine.updateEqualLoudness(freq, e.target.value);
            }
        });

        // 音量スライダー
        this.volumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value) / 100;
            this.volumeValue.textContent = e.target.value + '%';
            this.audioEngine.setVolume(volume);
            // 再生中なら等ラウドネス補正も更新
            if (this.audioEngine.isPlaying()) {
                const freq = parseInt(this.frequencyInput.value);
                const equalLoudness = this.equalLoudnessSelect.value;
                this.audioEngine.updateEqualLoudness(freq, equalLoudness);
            }
        });

        // 再生/停止ボタン
        this.playBtn.addEventListener('click', () => this.playFreeplay());
        this.stopBtn.addEventListener('click', () => this.stopFreeplay());

        // 難易度選択
        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.startQuiz(btn.dataset.difficulty);
            });
        });

        // クイズ再生ボタン
        if (this.quizPlayBtn) {
            this.quizPlayBtn.addEventListener('click', () => this.playQuizQuestion());
        }

        // 解答提出
        if (this.submitAnswer) {
            this.submitAnswer.addEventListener('click', () => this.submitQuizAnswer());
        }

        // クイズ終了ボタン
        if (this.exitQuiz) {
            this.exitQuiz.addEventListener('click', () => this.exitQuizWithoutSaving());
        }

        // 履歴
        if (this.exportHistory) {
            this.exportHistory.addEventListener('click', () => StorageManager.downloadCSV());
        }

        if (this.clearHistory) {
            this.clearHistory.addEventListener('click', () => {
                if (confirm('履歴を削除しますか?')) {
                    StorageManager.clearHistory();
                    this.loadHistory();
                }
            });
        }

        // 警告モーダル
        if (this.acceptWarning) {
            this.acceptWarning.addEventListener('click', () => {
                this.volumeWarning.style.display = 'none';
            });
        }
    }

    // モード切り替え
    switchMode(mode) {
        this.currentMode = mode;

        this.navBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        this.modeSections.forEach(section => {
            section.classList.toggle('active', section.id === mode + 'Mode');
        });

        if (mode === 'history') {
            this.loadHistory();
        }
    }

    // フリープレイ再生
    async playFreeplay() {
        await this.audioEngine.resume();

        const freq = parseInt(this.frequencyInput.value);
        const waveform = document.querySelector('input[name="waveform"]:checked').value;
        const equalLoudness = this.equalLoudnessSelect.value;

        this.audioEngine.playFrequency(freq, waveform, 0, equalLoudness);

        this.playBtn.disabled = true;
        this.stopBtn.disabled = false;

        // Visualizer開始
        if (!this.visualizer) {
            this.visualizer = new Visualizer(this.spectrumCanvas, this.audioEngine);
        }
        this.visualizer.start();
    }

    // フリープレイ停止
    stopFreeplay() {
        this.audioEngine.stop();
        this.playBtn.disabled = false;
        this.stopBtn.disabled = true;

        if (this.visualizer) {
            this.visualizer.stop();
        }
    }

    // クイズを中断して難易度選択に戻る（履歴保存なし）
    exitQuizWithoutSaving() {
        // 音声停止
        this.audioEngine.stop();

        // タイマー停止
        this.quizManager.stopTimer();

        // プログレスバークリア
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }

        // UIをリセット
        this.quizPlay.style.display = 'none';
        this.difficultySelect.style.display = 'block';
        this.quizResults.style.display = 'none';
    }

    // クイズ開始
    startQuiz(difficulty) {
        this.quizManager.startQuiz(difficulty);
        this.difficultySelect.style.display = 'none';
        this.quizPlay.style.display = 'block';
        this.quizResults.style.display = 'none';
        this.showNextQuestion();
    }

    // 次の問題を表示
    showNextQuestion() {
        const questionNo = this.quizManager.currentQuestionIndex + 1;
        this.questionNumber.textContent = `問題 ${questionNo}/10`;
        this.quizScore.textContent = `スコア: ${this.quizManager.score}/1000`;
        this.quizPlayBtn.disabled = false;
        this.submitAnswer.disabled = true;
        this.feedbackSection.style.display = 'none';

        // プログレスバーと残り時間表示をリセット
        document.querySelector('.play-progress').style.display = 'none';
        this.playProgressBar.style.width = '0%';
        this.timeRemaining.parentElement.style.display = 'none';
        this.timeRemaining.parentElement.classList.remove('warning');

        // 解答入力フィールドを生成
        this.createAnswerInputs();
    }

    // 解答入力フィールドを動的に生成
    createAnswerInputs() {
        const question = this.quizManager.getCurrentQuestion();
        const freqCount = question.frequencies.length;

        let inputsHTML = '';
        const labels = ['', '左', '右', '1', '2', '3'];

        for (let i = 0; i < freqCount; i++) {
            const label = freqCount === 2 && question.stereo ? labels[i + 1] : (freqCount > 2 ? labels[i + 3] : '');
            inputsHTML += `
                <div class="frequency-control">
                    ${label ? `<label>${label}:</label>` : ''}
                    <input type="range" class="answer-slider" data-index="${i}" min="1.301" max="4.301" step="0.001" value="3.000">
                    <input type="text" class="answer-input" data-index="${i}" value="1,000">
                    <span class="frequency-unit">Hz</span>
                </div>
            `;
        }

        this.answerInputs.innerHTML = inputsHTML;

        // イベントリスナーを設定
        const sliders = this.answerInputs.querySelectorAll('.answer-slider');
        const inputs = this.answerInputs.querySelectorAll('.answer-input');

        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const index = e.target.dataset.index;
                const freq = MathUtils.logToLinear(parseFloat(e.target.value));
                const input = this.answerInputs.querySelector(`.answer-input[data-index="${index}"]`);
                input.value = MathUtils.formatWithCommas(freq);
            });
        });

        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const index = e.target.dataset.index;
                const freqStr = e.target.value.replace(/,/g, ''); // カンマを除去
                const freq = parseInt(freqStr);
                if (freq >= 20 && freq <= 20000) {
                    const slider = this.answerInputs.querySelector(`.answer-slider[data-index="${index}"]`);
                    slider.value = MathUtils.linearToLog(freq);
                    e.target.value = MathUtils.formatWithCommas(freq);
                }
            });
        });
    }

    // クイズ問題を再生
    async playQuizQuestion() {
        await this.audioEngine.resume();

        // 既存のタイマーをクリア
        this.quizManager.stopTimer();

        // 問題を再生（10秒間）
        const question = this.quizManager.getCurrentQuestion();
        this.audioEngine.playMultiFrequency(
            question.frequencies,
            question.stereo,
            question.waveform,
            10, // 10秒間再生
            question.equalLoudness
        );

        this.quizPlayBtn.disabled = true;
        this.submitAnswer.disabled = false;

        // プログレスバー表示（10秒の再生時間）
        document.querySelector('.play-progress').style.display = 'block';
        this.playProgressBar.style.width = '0%';

        // プログレスバーアニメーション（10秒）
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        let progress = 0;
        this.progressInterval = setInterval(() => {
            progress += 1;
            this.playProgressBar.style.width = (progress * 10) + '%';
            if (progress >= 10) {
                clearInterval(this.progressInterval);
                this.progressInterval = null;
            }
        }, 1000);

        // 残り時間表示（30秒の制限時間）
        this.timeRemaining.parentElement.style.display = 'block';

        // タイマー開始（30秒）
        this.quizManager.startTimer((time) => {
            this.timeRemaining.textContent = time;
            if (time <= 5) {
                this.timeRemaining.parentElement.classList.add('warning');
            } else {
                this.timeRemaining.parentElement.classList.remove('warning');
            }
        }, () => {
            // タイムアウト時に自動提出
            if (!this.submitAnswer.disabled) {
                this.submitQuizAnswer();
            }
        });
    }

    // 解答を提出
    submitQuizAnswer() {
        // 全ての解答を収集（カンマを除去してから変換）
        const answerInputs = this.answerInputs.querySelectorAll('.answer-input');
        const userAnswers = Array.from(answerInputs).map(input => parseInt(input.value.replace(/,/g, '')));

        const result = this.quizManager.submitAnswer(userAnswers);

        // プログレスバーと残り時間を非表示
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        document.querySelector('.play-progress').style.display = 'none';
        this.playProgressBar.style.width = '0%';
        this.timeRemaining.parentElement.style.display = 'none';

        // 解答ボタンを無効化
        this.submitAnswer.disabled = true;

        this.showFeedback(result);
    }

    // 次の問題へ進む
    proceedToNextQuestion() {
        // 再生を停止
        this.audioEngine.stop();
        if (this.playbackTimer) {
            clearTimeout(this.playbackTimer);
            this.playbackTimer = null;
        }

        if (this.quizManager.nextQuestion()) {
            this.showNextQuestion();
        } else {
            this.showResults();
        }
    }

    // フィードバック表示
    showFeedback(result) {
        const question = this.quizManager.getCurrentQuestion();
        const freqCount = result.actualFreq.length;
        const labels = ['', '左', '右', '1', '2', '3'];

        let detailsHTML = '';
        for (let i = 0; i < freqCount; i++) {
            const label = freqCount === 2 && result.stereo ? labels[i + 1] : (freqCount > 2 ? labels[i + 3] : '');
            detailsHTML += `
                <div class="freq-result">
                    ${label ? `<strong>${label}:</strong> ` : ''}
                    正解: ${MathUtils.formatWithCommas(result.actualFreq[i])} Hz /
                    解答: ${MathUtils.formatWithCommas(result.userAnswer[i])} Hz /
                    誤差: ${result.errors[i].toFixed(2)}%
                    <button class="btn btn-small play-freq-btn" data-freq="${result.actualFreq[i]}">正解を再生</button>
                    <button class="btn btn-small play-freq-btn" data-freq="${result.userAnswer[i]}">解答を再生</button>
                </div>
            `;
        }

        this.feedbackSection.innerHTML = `
            <h3>${result.grade}</h3>
            ${detailsHTML}
            <p><strong>平均誤差:</strong> ${result.avgError.toFixed(2)}%</p>
            <p><strong>スコア:</strong> ${result.score}/100</p>
            <div class="playback-controls">
                <button class="btn btn-secondary" id="playCorrectAnswer">正解を全て再生</button>
                <button class="btn btn-secondary" id="playUserAnswer">解答を全て再生</button>
            </div>
            <button id="nextQuestion" class="btn btn-primary" style="margin-top: 15px;">次の問題</button>
        `;
        this.feedbackSection.className = 'feedback-section ' + (result.score >= 60 ? 'correct' : 'incorrect');
        this.feedbackSection.style.display = 'block';

        // 個別再生ボタンのイベントリスナー
        const playFreqBtns = this.feedbackSection.querySelectorAll('.play-freq-btn');
        playFreqBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const freq = parseInt(btn.dataset.freq);
                this.playWithTimer(() => {
                    this.audioEngine.playFrequency(freq, 'sine', 10, question.equalLoudness);
                });
            });
        });

        // 全体再生ボタンのイベントリスナー
        const playCorrectBtn = document.getElementById('playCorrectAnswer');
        const playUserBtn = document.getElementById('playUserAnswer');

        playCorrectBtn.addEventListener('click', () => {
            this.playWithTimer(() => {
                this.audioEngine.playMultiFrequency(
                    result.actualFreq,
                    result.stereo,
                    'sine',
                    10,
                    question.equalLoudness
                );
            });
        });

        playUserBtn.addEventListener('click', () => {
            this.playWithTimer(() => {
                this.audioEngine.playMultiFrequency(
                    result.userAnswer,
                    result.stereo,
                    'sine',
                    10,
                    question.equalLoudness
                );
            });
        });

        // 次の問題ボタン
        this.nextQuestionBtn = document.getElementById('nextQuestion');
        this.nextQuestionBtn.addEventListener('click', () => {
            this.proceedToNextQuestion();
        });
    }

    // 10秒タイマー付きで音を再生
    playWithTimer(playFunction) {
        // 既存のタイマーと再生をクリア
        if (this.playbackTimer) {
            clearTimeout(this.playbackTimer);
            this.playbackTimer = null;
        }
        this.audioEngine.stop();

        // 再生実行
        playFunction();

        // 10秒後に自動停止
        this.playbackTimer = setTimeout(() => {
            this.audioEngine.stop();
            this.playbackTimer = null;
        }, 10000);
    }

    // 結果表示
    showResults() {
        const results = this.quizManager.getResults();
        StorageManager.saveQuizResult(results);

        this.quizPlay.style.display = 'none';
        this.quizResults.style.display = 'block';

        this.quizResults.innerHTML = `
            <h3>クイズ終了!</h3>
            <div class="total-score">${results.totalScore}/1000</div>
            <canvas id="resultChart" width="600" height="300"></canvas>
            <button class="btn btn-primary" id="retryQuiz">もう一度</button>
            <button class="btn btn-secondary" onclick="app.ui.switchMode('history')">履歴を見る</button>
        `;

        const canvas = document.getElementById('resultChart');
        ChartRenderer.drawRangeAccuracyChart(canvas, results.rangeAccuracy);

        // もう一度ボタンのイベントリスナー
        document.getElementById('retryQuiz').addEventListener('click', () => {
            this.quizResults.style.display = 'none';
            this.difficultySelect.style.display = 'block';
        });
    }

    // 履歴を読み込み
    loadHistory() {
        const history = StorageManager.getHistory();

        if (history.length === 0) {
            this.historyList.innerHTML = '<p>履歴がありません</p>';
            return;
        }

        // 難易度ラベルのマッピング
        const difficultyLabels = {
            'easy': '初級',
            'medium': '中級',
            'hard': '上級'
        };

        this.historyList.innerHTML = history.map((session, idx) => `
            <div class="history-item">
                <h4>セッション ${history.length - idx}</h4>
                <p>日時: ${new Date(session.timestamp).toLocaleString('ja-JP')}</p>
                <p>難易度: ${difficultyLabels[session.difficulty] || session.difficulty || '-'}</p>
                <p>スコア: ${session.totalScore}/1000</p>
            </div>
        `).join('');
    }
}
