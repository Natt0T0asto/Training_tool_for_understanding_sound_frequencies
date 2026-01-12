# 音の周波数トレーニングツール

[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://natt0t0asto.github.io/Training_tool_for_understanding_sound_frequencies/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)


## 概要

Web Audio APIを使用した，周波数識別能力を向上させるためのWebアプリケーションです．フリープレイモードで周波数を自由に聴き比べたり，クイズモードで周波数識別スキルをテストできます．

**デモサイト**: https://natt0t0asto.github.io/Training_tool_for_understanding_sound_frequencies/

> **Note**: このプロジェクトは[Anthropic Claude](https://claude.ai)のコード生成機能（ClaudeCode）を活用して開発されました．

## 主な機能

### 1. フリープレイモード
- **周波数範囲**: 20Hz ~ 20,000Hz
- **対数スケールスライダー**: 周波数選択
- **プリセット周波数**: 主要な周波数にワンクリックでアクセス
- **波形選択**: 正弦波，三角波，矩形波，のこぎり波
- **等ラウドネス補正**: ISO 226:2003準拠（40/60/80 phon）
- **リアルタイムスペクトラム表示**: Canvas によるビジュアライゼーション
- **音量コントロール**: 0-100%の調整

### 2. クイズモード
- **3つの難易度レベル**: 初級，中級，上級
- **10問構成**: 音域別にバランスよく出題
- **フィードバック**: 誤差率（%），スコア
- **グラフ**: 音域別正解率の可視化
- **LocalStorage保存**: ブラウザにクイズ履歴を保存

### 3. 履歴管理
- **クイズ履歴閲覧**: 過去のセッション結果を一覧表示
- **CSVエクスポート**: データ分析用にエクスポート可能
- **データクリア**: 履歴の削除

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| **フロントエンド** | HTML5, CSS3, JavaScript (ES6+) |
| **音声処理** | Web Audio API (OscillatorNode, GainNode, AnalyserNode, StereoPannerNode) |
| **データ保存** | LocalStorage API |
| **ビジュアライゼーション** | Canvas API |
| **デプロイ** | GitHub Pages |
| **開発支援** | Anthropic Claude (ClaudeCode) |

## プロジェクト構造

```
Training_tool_for_understanding_sound_frequencies/
├── index.html                          # メインページ
├── css/
│   ├── style.css                      # メインスタイルシート
│   ├── responsive.css                 # レスポンシブデザイン
│   └── animation.css                  # アニメーション定義
├── js/
│   ├── app.js                         # アプリケーション初期化
│   ├── audio/
│   │   ├── AudioEngine.js            # Web Audio API制御クラス
│   │   ├── Oscillator.js             # オシレーター管理
│   │   ├── NoiseGenerator.js         # ノイズ生成
│   │   └── EqualLoudness.js          # 等ラウドネス補正
│   ├── quiz/
│   │   ├── QuizManager.js            # クイズ進行管理
│   │   ├── QuestionGenerator.js      # 問題生成ロジック
│   │   └── ScoreCalculator.js        # スコア計算
│   ├── ui/
│   │   ├── UIController.js           # UI全体制御
│   │   ├── Visualizer.js             # スペクトラム表示
│   │   └── ChartRenderer.js          # グラフ描画
│   └── utils/
│       ├── StorageManager.js         # LocalStorage管理
│       └── MathUtils.js              # 数学関数ライブラリ
├── data/
│   └── equal_loudness_curves.json    # ISO 226:2003データ
├── assets/
│   └── images/                        # 画像ファイル
├── README.md                          # このファイル
└── LICENSE                            # ライセンス情報
```

## 使い方

### オンラインで使用（推奨）

デモサイトにアクセスするだけで，すぐに使用できます：

**https://natt0t0asto.github.io/Training_tool_for_understanding_sound_frequencies/**

### ローカルでの開発

1. **リポジトリをクローン**:
```bash
git clone https://github.com/Natt0T0asto/Training_tool_for_understanding_sound_frequencies.git
cd Training_tool_for_understanding_sound_frequencies
```

2. **ローカルサーバーを起動**:

Pythonを使用する場合:
```bash
# Python 3.x
python -m http.server 8000

# Python 2.x
python -m SimpleHTTPServer 8000
```

Node.jsを使用する場合:
```bash
# http-serverをインストール（初回のみ）
npm install -g http-server

# サーバー起動
http-server -p 8000
```

3. **ブラウザで開く**:
```
http://localhost:8000
```

## キーボードショートカット

| キー | 機能 |
|-----|------|
| **スペースキー** | 再生/停止の切り替え（フリープレイモード） |
| **Enterキー** | 解答を提出（クイズモード） |
| **←/→ 矢印キー** | 周波数の調整 |

## 推奨環境

- **ヘッドフォン/イヤホン**: 正確な周波数識別のため推奨
- **静かな環境**: 背景ノイズの少ない環境
- **デスクトップブラウザ**: モバイルでも動作しますが，デスクトップが最適
> ⚠️ **注意**: Web Audio API対応が必須です．一部ブラウザでは動作しない可能性があります．
> ⚠️ **警告**: 長時間の使用や大音量での再生は聴覚に悪影響を及ぼす可能性があります．適度な音量と休憩を心がけてください．

## ライセンス

このプロジェクトはMITライセンスの下で公開されています．詳細は[LICENSE](LICENSE)ファイルを参照してください．
利用は自由に行っていただけます．

## 作成者

**Natt0T0asto**

- GitHub: [@Natt0T0asto](https://github.com/Natt0T0asto)
- プロジェクトリンク: [Training_tool_for_understanding_sound_frequencies](https://github.com/Natt0T0asto/Training_tool_for_understanding_sound_frequencies)

## 更新履歴

### v1.0.0 (2026-01-12)
- 初回リリース

## 関連リンク

- [Web Audio API ドキュメント](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [ISO 226:2003 等ラウドネス曲線](https://www.iso.org/standard/83117.html)
- [Anthropic Claude](https://claude.ai)
- [GitHub Pages](https://pages.github.com/)

