/**
 * Visualizer - スペクトラム可視化クラス
 * リアルタイムでスペクトラム波形を描画
 */
class Visualizer {
    constructor(canvas, audioEngine) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioEngine = audioEngine;
        this.animationId = null;
        this.isRunning = false;
    }

    /**
     * 可視化を開始
     */
    start() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.draw();
    }

    /**
     * 可視化を停止
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // キャンバスをクリア
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * スペクトラムを描画
     */
    draw() {
        if (!this.isRunning) {
            return;
        }

        this.animationId = requestAnimationFrame(() => this.draw());

        const width = this.canvas.width;
        const height = this.canvas.height;

        // 背景クリア
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, width, height);

        // 周波数データ取得
        const dataArray = this.audioEngine.getFrequencyData();
        const bufferLength = dataArray.length;

        if (bufferLength === 0) {
            return;
        }

        // グリッド描画
        this.drawGrid(width, height);

        // 20kHzまでの範囲のみ表示
        const nyquist = this.audioEngine.audioContext.sampleRate / 2;
        const maxFreq = 20000; // 20kHz
        const displayRatio = Math.min(1.0, maxFreq / nyquist);
        const displayBins = Math.floor(bufferLength * displayRatio);

        // スペクトラム描画
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#2196F3';
        this.ctx.beginPath();

        const sliceWidth = width / displayBins;
        let x = 0;

        for (let i = 0; i < displayBins; i++) {
            const v = dataArray[i] / 255.0;
            const y = height - (v * height);

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.ctx.stroke();
    }

    /**
     * グリッド線を描画
     * @param {number} width - Canvas幅
     * @param {number} height - Canvas高さ
     */
    drawGrid(width, height) {
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;

        // 水平線
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }

        // 垂直線
        for (let i = 0; i <= 10; i++) {
            const x = (width / 10) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }

        // 周波数ラベル（20kHzまでの範囲に合わせて配置）
        this.ctx.fillStyle = '#666666';
        this.ctx.font = '10px sans-serif';

        const labelFreqs = [20, 1000, 2000, 5000, 10000, 20000];
        const maxFreq = 20000; // 20kHz

        labelFreqs.forEach(freq => {
            // 20kHzまでの範囲内での位置を計算
            const position = freq / maxFreq;
            const x = width * position;

            // ラベルのフォーマット
            let label;
            if (freq >= 1000) {
                label = (freq / 1000) + 'k';
            } else {
                label = freq + '';
            }

            this.ctx.fillText(label, x + 5, height - 10);
        });
    }
}
