/**
 * QuizManager - クイズ進行管理クラス
 * クイズの状態管理，問題出題，採点を管理
 */
class QuizManager {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        this.difficulty = 'medium';
        this.timer = null;
        this.timeRemaining = 30;
        this.sessionId = null;
    }

    /**
     * クイズを開始
     * @param {string} difficulty - 難易度
     */
    startQuiz(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.questions = QuestionGenerator.generateQuestions(difficulty, 10);
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.answers = [];
        this.sessionId = MathUtils.generateUUID();
    }

    /**
     * 現在の問題を取得
     * @returns {Object} 問題オブジェクト
     */
    getCurrentQuestion() {
        return this.questions[this.currentQuestionIndex];
    }

    /**
     * 問題の音を再生
     */
    playCurrentQuestion() {
        const question = this.getCurrentQuestion();
        if (!question) return;

        this.audioEngine.playMultiFrequency(
            question.frequencies,
            question.stereo,
            question.waveform,
            question.duration,
            question.equalLoudness
        );
    }

    /**
     * タイマーを開始
     * @param {Function} callback - 毎秒呼ばれるコールバック
     * @param {Function} onTimeout - タイムアウト時のコールバック
     */
    startTimer(callback, onTimeout) {
        this.timeRemaining = 30;
        this.stopTimer();

        this.timer = setInterval(() => {
            this.timeRemaining--;
            if (callback) callback(this.timeRemaining);

            if (this.timeRemaining <= 0) {
                this.stopTimer();
                if (onTimeout) onTimeout();
            }
        }, 1000);
    }

    /**
     * タイマーを停止
     */
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * 解答を提出
     * @param {Array<number>} userAnswers - ユーザーの解答周波数の配列
     * @returns {Object} 採点結果
     */
    submitAnswer(userAnswers) {
        const question = this.getCurrentQuestion();
        if (!question) return null;

        this.stopTimer();
        this.audioEngine.stop();

        // 上級（3周波数）の場合はソートして照合
        const shouldSort = question.frequencies.length === 3 && !question.stereo;
        const result = ScoreCalculator.calculateMultiScore(question.frequencies, userAnswers, shouldSort);

        const answerRecord = {
            questionNo: this.currentQuestionIndex + 1,
            actualFreq: question.frequencies,
            userAnswer: userAnswers,
            score: result.score,
            errors: result.errors,
            avgError: result.avgError,
            responseTime: 30 - this.timeRemaining,
            grade: result.grade,
            stereo: question.stereo
        };

        this.answers.push(answerRecord);
        this.score += result.score;

        return answerRecord;
    }

    /**
     * 次の問題へ進む
     * @returns {boolean} 次の問題があるかどうか
     */
    nextQuestion() {
        this.currentQuestionIndex++;
        return this.currentQuestionIndex < this.questions.length;
    }

    /**
     * クイズが終了したかどうか
     * @returns {boolean}
     */
    isFinished() {
        return this.currentQuestionIndex >= this.questions.length;
    }

    /**
     * 結果を取得
     * @returns {Object} セッション結果
     */
    getResults() {
        const stats = ScoreCalculator.calculateSessionScore(this.answers);

        return {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            mode: 'quiz',
            difficulty: this.difficulty,
            questions: this.answers,
            totalScore: this.score,
            rangeAccuracy: stats.rangeAccuracy
        };
    }
}
