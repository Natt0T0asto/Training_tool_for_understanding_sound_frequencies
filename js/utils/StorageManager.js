/**
 * StorageManager - LocalStorage管理クラス
 * ユーザー設定とクイズ履歴の保存・読み込みを管理
 */
class StorageManager {
    static KEYS = {
        SETTINGS: 'freqQuiz_settings',
        HISTORY: 'freqQuiz_history'
    };

    static DEFAULT_SETTINGS = {
        volume: 30,
        defaultWaveform: 'sine',
        equalLoudnessMode: 'off'
    };

    /**
     * 設定を保存
     * @param {Object} settings - 設定オブジェクト
     */
    static saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('設定の保存に失敗:', error);
            return false;
        }
    }

    /**
     * 設定を読み込み
     * @returns {Object} 設定オブジェクト
     */
    static loadSettings() {
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            if (data) {
                return { ...this.DEFAULT_SETTINGS, ...JSON.parse(data) };
            }
        } catch (error) {
            console.error('設定の読み込みに失敗:', error);
        }
        return { ...this.DEFAULT_SETTINGS };
    }

    /**
     * クイズ結果を保存
     * @param {Object} result - 結果オブジェクト
     */
    static saveQuizResult(result) {
        try {
            const history = this.getHistory();
            history.unshift(result); // 最新を先頭に追加

            // 最大100件まで保存
            if (history.length > 100) {
                history.splice(100);
            }

            localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
            return true;
        } catch (error) {
            console.error('クイズ結果の保存に失敗:', error);

            // LocalStorage容量オーバーの可能性
            if (error.name === 'QuotaExceededError') {
                alert('ストレージの容量が不足しています．履歴をクリアしてください．');
            }
            return false;
        }
    }

    /**
     * クイズ履歴を取得
     * @returns {Array} 履歴の配列
     */
    static getHistory() {
        try {
            const data = localStorage.getItem(this.KEYS.HISTORY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('履歴の読み込みに失敗:', error);
        }
        return [];
    }

    /**
     * 履歴をクリア
     * @returns {boolean} 成功したかどうか
     */
    static clearHistory() {
        try {
            localStorage.removeItem(this.KEYS.HISTORY);
            return true;
        } catch (error) {
            console.error('履歴のクリアに失敗:', error);
            return false;
        }
    }

    /**
     * 履歴をCSV形式でエクスポート
     * @returns {string} CSV文字列
     */
    static exportToCSV() {
        const history = this.getHistory();
        if (history.length === 0) {
            return '';
        }

        // CSVヘッダー
        let csv = '日時,難易度,モード,総スコア,低域正解率,中域正解率,高域正解率,平均誤差率\n';

        // データ行
        history.forEach(session => {
            const date = new Date(session.timestamp).toLocaleString('ja-JP');
            const difficulty = session.difficulty || '-';
            const mode = session.mode || '-';
            const totalScore = session.totalScore || 0;
            const lowAcc = (session.rangeAccuracy?.low * 100 || 0).toFixed(1);
            const midAcc = (session.rangeAccuracy?.mid * 100 || 0).toFixed(1);
            const highAcc = (session.rangeAccuracy?.high * 100 || 0).toFixed(1);

            // 平均誤差率を計算
            const avgError = session.questions ?
                (session.questions.reduce((sum, q) => sum + (q.error || 0), 0) / session.questions.length).toFixed(2) : 0;

            csv += `${date},${difficulty},${mode},${totalScore},${lowAcc}%,${midAcc}%,${highAcc}%,${avgError}%\n`;
        });

        return csv;
    }

    /**
     * CSVファイルとしてダウンロード
     */
    static downloadCSV() {
        const csv = this.exportToCSV();
        if (!csv) {
            alert('エクスポートする履歴がありません．');
            return;
        }

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

        link.setAttribute('href', url);
        link.setAttribute('download', `freq_quiz_history_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * 統計情報を取得
     * @returns {Object} 統計オブジェクト
     */
    static getStats() {
        const history = this.getHistory();

        if (history.length === 0) {
            return {
                totalSessions: 0,
                averageScore: 0,
                bestScore: 0,
                totalQuestions: 0,
                weakestRange: null
            };
        }

        const totalSessions = history.length;
        const scores = history.map(s => s.totalScore || 0);
        const averageScore = scores.reduce((a, b) => a + b, 0) / totalSessions;
        const bestScore = Math.max(...scores);
        const totalQuestions = history.reduce((sum, s) => sum + (s.questions?.length || 0), 0);

        // 音域別の正解率を集計
        const rangeAccuracy = {
            low: [],
            mid: [],
            high: []
        };

        history.forEach(session => {
            if (session.rangeAccuracy) {
                if (session.rangeAccuracy.low !== undefined) rangeAccuracy.low.push(session.rangeAccuracy.low);
                if (session.rangeAccuracy.mid !== undefined) rangeAccuracy.mid.push(session.rangeAccuracy.mid);
                if (session.rangeAccuracy.high !== undefined) rangeAccuracy.high.push(session.rangeAccuracy.high);
            }
        });

        // 各音域の平均正解率を計算
        const avgLow = rangeAccuracy.low.length > 0 ?
            rangeAccuracy.low.reduce((a, b) => a + b, 0) / rangeAccuracy.low.length : 0;
        const avgMid = rangeAccuracy.mid.length > 0 ?
            rangeAccuracy.mid.reduce((a, b) => a + b, 0) / rangeAccuracy.mid.length : 0;
        const avgHigh = rangeAccuracy.high.length > 0 ?
            rangeAccuracy.high.reduce((a, b) => a + b, 0) / rangeAccuracy.high.length : 0;

        // 最も弱い音域を特定
        let weakestRange = null;
        const minAcc = Math.min(avgLow, avgMid, avgHigh);
        if (minAcc === avgLow && avgLow > 0) weakestRange = '低域';
        else if (minAcc === avgMid && avgMid > 0) weakestRange = '中域';
        else if (minAcc === avgHigh && avgHigh > 0) weakestRange = '高域';

        return {
            totalSessions,
            averageScore: Math.round(averageScore),
            bestScore,
            totalQuestions,
            rangeAccuracy: {
                low: avgLow,
                mid: avgMid,
                high: avgHigh
            },
            weakestRange
        };
    }

    /**
     * LocalStorageの使用容量を確認
     * @returns {Object} 使用容量情報
     */
    static getStorageInfo() {
        let totalSize = 0;

        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }

        // KB単位に変換
        const usedKB = (totalSize / 1024).toFixed(2);
        const limitKB = 5120; // 一般的に5MB
        const usagePercent = ((totalSize / (limitKB * 1024)) * 100).toFixed(1);

        return {
            usedKB,
            limitKB,
            usagePercent
        };
    }
}
