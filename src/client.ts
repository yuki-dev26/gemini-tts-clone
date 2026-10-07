import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

// サポートされているTTSモデル
export const SUPPORTED_MODELS = {
  flash: "gemini-3.8-flash-tts",
  lite: "gemini-3.8-flash-lite-tts",
} as const;

export type SupportedModelKey = keyof typeof SUPPORTED_MODELS;
export const DEFAULT_MODEL = SUPPORTED_MODELS.flash;

/**
 * コマンドライン引数などからTTSモデル名を解決するヘルパー関数
 */
export function resolveModel(
  specifiedModel?: string,
  useLiteFlag: boolean = false,
  fallbackModel: string = DEFAULT_MODEL,
): string {
  if (useLiteFlag) {
    return SUPPORTED_MODELS.lite;
  }
  if (!specifiedModel) {
    return fallbackModel;
  }

  const lower = specifiedModel.toLowerCase().trim();
  if (lower === "lite" || lower === "flash-lite" || lower.includes("lite")) {
    return SUPPORTED_MODELS.lite;
  }
  if (lower === "flash" || lower === "standard" || lower === "default") {
    return SUPPORTED_MODELS.flash;
  }
  if (lower === SUPPORTED_MODELS.flash || lower === SUPPORTED_MODELS.lite) {
    return lower;
  }

  // それ以外の文字列が直接指定された場合はそのまま使用
  return specifiedModel;
}

// APIキーの確認
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error(
    "\x1b[31m[エラー] GEMINI_API_KEY が設定されていません。\x1b[0m",
  );
  console.error(
    "プロジェクトルートに .env ファイルを作成し、以下のようにAPIキーを設定してください：",
  );
  console.error("\x1b[33mGEMINI_API_KEY=あなたのGeminiAPIキー\x1b[0m\n");
  console.error(
    "APIキーは Google AI Studio (https://aistudio.google.com/apikey) から取得できます。",
  );
  process.exit(1);
}

// Google GenAI クライアントの初期化
export const ai = new GoogleGenAI({ apiKey });

// voice_config.json のパス（作成したモデル情報をローカルに保持）
export const CONFIG_FILE_PATH = path.resolve(
  process.cwd(),
  "voice_config.json",
);

export interface VoiceConfig {
  voiceId: string;
  displayName: string;
  createdAt: string;
  model: string;
}

/**
 * 保存済みの VoiceConfig を読み込む
 */
export function loadVoiceConfig(): VoiceConfig | null {
  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
    return JSON.parse(raw) as VoiceConfig;
  } catch {
    return null;
  }
}

/**
 * VoiceConfig を保存する
 */
export function saveVoiceConfig(config: VoiceConfig): void {
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
}
