# 🎙️ Gemini Voice Replication & TTS デモ

Google Gemini API のTTSモデル（`gemini-3.8-flash-tts` および `gemini-3.8-flash-lite-tts`）を使用した、**Voice Replication（声のクローン学習）** および **Text-to-Speech（音声合成）** を体験できるTypeScriptプロジェクトです。

---

## 🌟 対応モデル

| モデル名 | 特徴 | 用途・メリット |
| :--- | :--- | :--- |
| **`gemini-3.8-flash-tts`** (デフォルト) | 高表現力・自然な抑揚 | ナレーション、対話、高品質なコンテンツ制作 |
| **`gemini-3.8-flash-lite-tts`** (Lite) | 超高速・低コスト | リアルタイム音声エージェント、大量生成 |

※ 本プロジェクトでは、コマンド1つで通常版とLite版を自由に切り替えられます。

---

## 📂 プロジェクト構成

```text
gemini-tts-clone/
├── audio_inputs/             # 🎤 音声ファイル配置フォルダ
│   ├── README.md             # 音声要件と同意フレーズの説明
│   ├── reference.wav         # 【要配置】学習用音声（10〜30秒の本人の声）
│   └── consent.wav           # 【要配置】同意フレーズを読み上げた音声
├── outputs/                  # 🔊 合成された音声（.wav）が出力されるフォルダ
│   ├── latest.wav            # 最新の合成結果
│   └── speech_*.wav          # 日時付きの履歴
├── src/
│   ├── client.ts             # Gemini SDK初期化・設定管理・モデル定義
│   ├── replicate.ts          # 音声モデル作成（Voices API）
│   ├── tts.ts                # 音声合成（Interactions API / GenerateContent）
│   ├── list-voices.ts        # 登録済み音声モデル一覧表示
│   └── delete-voice.ts       # 音声モデル削除
├── voice_config.json         # 作成された Voice ID などのローカルキャッシュ（自動保存）
├── .env.example              # APIキー設定サンプル
├── package.json
├── tsconfig.json
└── LICENSE                   # MIT License
```

---

## 🚀 クイックスタート手順

### 1. APIキーの設定

プロジェクトルートに `.env` ファイルを作成し、Gemini APIキーを設定します。

```ini
GEMINI_API_KEY=AIzaSy...あなたのAPIキー
```

> APIキーは [Google AI Studio](https://aistudio.google.com/apikey) から無料で取得できます。
> ※ Bun はプロジェクトルートの `.env` を自動で読み込みます。

---

### 2. 音声ファイルの準備

[audio_inputs/](file:///c:/my-projects/gemini-tts-clone/audio_inputs) フォルダに以下の2つの WAV ファイルを配置してください：

1. **`reference.wav`** (学習用音声)
   - 10〜30秒程度のクリアな本人の発話
   - 推奨仕様: 24kHz モノラル 16-bit WAV、ノイズやBGMなし
2. **`consent.wav`** (同意フレーズ音声)
   - `reference.wav` と **同一人物が同じマイク・録音環境** で以下の文章を正確に読み上げた音声

#### 🗣️ 同意フレーズ（Consent Phrase）
>
> **「私はこの音声の所有者であり、Googleがこの音声を使用して音声合成モデルを作成することを承認します。」**

*(英語で発話する場合: `"I am the owner of this voice and I consent to Google using this voice to create a synthetic voice model."`)*

---

### 3. 音声モデルの作成（Replication）

PowerShell で以下のコマンドを実行します：

#### 🌟 標準モデル (`gemini-3.8-flash-tts`) で作成

```powershell
bun run replicate
```

#### ⚡ Liteモデル (`gemini-3.8-flash-lite-tts`) で作成

```powershell
bun run replicate:lite
# または
bun run replicate -- --lite
```

- 音声ファイルが Gemini API に送信され、生体認証（声紋照合）と同意確認が行われます。
- 成功すると、作成された `Voice ID`（例: `voice_123456...`）がコンソールに表示され、[voice_config.json](file:///c:/my-projects/gemini-tts-clone/voice_config.json) に自動保存されます。

---

### 4. 音声合成（TTS）の実行

作成した音声モデルを使って、テキストを読み上げさせます。

#### 🌟 標準モデルで生成

```powershell
# デフォルトテキストで試す
bun run tts

# 任意のテキストを喋らせる
bun run tts -- "こんにちは！これはGemini APIで複製した私の声です。"

# 発話スタイルを指定する
bun run tts -- "今日も一日お疲れ様でした！" --style "cheerful and energetic"
```

#### ⚡ Liteモデルで高速生成

```powershell
# Liteモデルで生成
bun run tts:lite

# 任意のテキストをLiteで生成
bun run tts:lite -- "軽量モデルによる高速な音声合成です。"
```

- 生成された音声は [outputs/latest.wav](file:///c:/my-projects/gemini-tts-clone/outputs/latest.wav) および日時付きファイルに保存されます。

---

### 5. 音声モデルの管理（一覧・削除）

#### 登録済み音声モデルの一覧を確認

```powershell
bun run list-voices
```

#### 不要になった音声モデルを削除

```powershell
bun run delete-voice
# または特定のIDを指定:
bun run delete-voice voice_xxxxxx
```
