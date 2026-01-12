/**
 * ChartRenderer - グラフ描画クラス
 * Canvasを使用して統計グラフを描画
 */
class ChartRenderer {
    /**
     * 音域別平均スコアの棒グラフを描画
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {Object} rangeAccuracy - 音域別平均スコアデータ（0-1の範囲）
     */
    static drawRangeAccuracyChart(canvas, rangeAccuracy) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // 背景クリア
        ctx.fillStyle = '#FAFAFA';
        ctx.fillRect(0, 0, width, height);

        const ranges = [
            { key: 'ultraLow', label: '20-100Hz', color: '#9C27B0' },
            { key: 'low', label: '100-500Hz', color: '#4CAF50' },
            { key: 'mid', label: '500-2kHz', color: '#2196F3' },
            { key: 'highMid', label: '2k-8kHz', color: '#FF9800' },
            { key: 'high', label: '8k-20kHz', color: '#F44336' }
        ];

        const barWidth = width / (ranges.length * 1.5);
        const maxHeight = height - 70;

        ranges.forEach((range, idx) => {
            const accuracy = rangeAccuracy[range.key] || 0;
            const barHeight = maxHeight * accuracy;
            const x = (idx * 1.5 + 0.25) * barWidth;
            const y = height - 50 - barHeight;

            // 棒グラフ描画
            ctx.fillStyle = range.color;
            ctx.fillRect(x, y, barWidth, barHeight);

            // スコア表示
            ctx.fillStyle = '#212121';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(accuracy * 100)}点`, x + barWidth / 2, y - 5);

            // ラベル
            ctx.fillStyle = '#666666';
            ctx.font = '10px sans-serif';
            ctx.fillText(range.label, x + barWidth / 2, height - 30);
        });

        // タイトル
        ctx.fillStyle = '#212121';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('音域別平均スコア', width / 2, 25);
    }

    /**
     * スコア推移の折れ線グラフを描画
     * @param {HTMLCanvasElement} canvas - Canvas要素
     * @param {Array} questions - 問題配列
     */
    static drawScoreTrendChart(canvas, questions) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // 背景クリア
        ctx.fillStyle = '#FAFAFA';
        ctx.fillRect(0, 0, width, height);

        if (questions.length === 0) return;

        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // 軸描画
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // グリッド線
        ctx.strokeStyle = '#F0F0F0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // データポイント描画
        const pointSpacing = chartWidth / (questions.length - 1 || 1);

        ctx.strokeStyle = '#2196F3';
        ctx.fillStyle = '#2196F3';
        ctx.lineWidth = 2;
        ctx.beginPath();

        questions.forEach((q, idx) => {
            const x = padding + pointSpacing * idx;
            const y = height - padding - (q.score / 100) * chartHeight;

            if (idx === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            // ポイント描画
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.stroke();

        // ラベル
        ctx.fillStyle = '#212121';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('スコア推移', width / 2, 20);
    }
}
