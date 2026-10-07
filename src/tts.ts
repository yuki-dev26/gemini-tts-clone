import * as fs from "node:fs";
import * as path from "node:path";
import { ai, loadVoiceConfig } from "./client.js";

// コマンドライン引数の簡易パース
function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index !== -1 && index + 1 < process.argv.length) {
    return process.argv[index + 1];
  }
  return undefined;
}

// プレーンな引数（フラグ以外のテキスト入力）を取得
function getPositionalText(): string | undefined {
  const args = process.argv.slice(2);
  const textParts: string[] = [];
  let skipNext = false;

  for (let i = 0; i < args.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    if (args[i].startsWith("--")) {
      skipNext = true;
      continue;
    }
    textParts.push(args[i]);
  }

  return textParts.length > 0 ? textParts.join(" ") : undefined;
}

async function synthesizeWithInteractions(
  model: string,
  voiceId: string,
  text: string,
  style: string,
): Promise<Buffer> {
  const interaction = await ai.interactions.create({
    model,
    input: [
      {
        type: "user_input",
        content: [
          {
            type: "text",
            text,
            annotations: [
              {
                type: "speech_metadata",
                style,
              },
            ],
          },
        ],
      },
    ],
    response_format: { type: "audio" },
    generation_config: {
      speech_config: [{ voice: voiceId }],
    },
  });

  const base64Data = interaction.output_audio?.data;
  if (!base64Data) {
    throw new Error("Interactions APIから音声データが返されませんでした。");
  }
  return Buffer.from(base64Data, "base64");
}

async function synthesizeWithGenerateContent(
  model: string,
  voiceId: string,
  text: string,
  style: string,
): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            text,
            speechMetadata: { style },
          },
        ],
      },
    ],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { voice: voiceId },
      },
    },
  });

  const base64Data =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Data) {
    throw new Error("generateContent APIから音声データが返されませんでした。");
  }
  return Buffer.from(base64Data, "base64");
}

async function main() {
  console.log("\n=======================================================");
  console.log(" 🔊 Gemini API TTS（音声合成）デモ");
  console.log("=======================================================\n");

  // 保存済みの VoiceConfig を取得
  const savedConfig = loadVoiceConfig();

  // コマンドライン引数から voice-id を取得（無ければ保存されたIDを使用）
  const voiceId = getArg("--voice-id") || savedConfig?.voiceId;
  const style = getArg("--style") || "warm and conversational";
  const modelName =
    getArg("--model") || savedConfig?.model || "gemini-3.8-flash-tts";

  // テキストの決定
  const defaultText =
    "こんにちは！これはGemini APIのVoice Replication機能を使って複製された私の声です。自然に聞こえますでしょうか？";
  const inputText = getPositionalText() || getArg("--text") || defaultText;

  if (!voiceId) {
    console.error("\x1b[31m[エラー] 有効な Voice ID が見つかりません。\x1b[0m");
    console.error("先に以下のコマンドで音声モデルを作成してください：");
    console.error("  \x1b[36mbun run replicate\x1b[0m\n");
    console.error("または、既存の Voice ID を直接指定して実行してください：");
    console.error(
      '  \x1b[33mbun run tts -- --voice-id voice_xxxx "喋らせたい文章"\x1b[0m\n',
    );
    process.exit(1);
  }

  console.log(`🆔 使用する Voice ID: \x1b[33m${voiceId}\x1b[0m`);
  if (savedConfig?.displayName) {
    console.log(`🏷️ モデル表示名:     ${savedConfig.displayName}`);
  }
  console.log(`🤖 ベースモデル:       ${modelName}`);
  console.log(`🎨 発話スタイル:       ${style}`);
  console.log(`📝 合成するテキスト:\n   「\x1b[32m${inputText}\x1b[0m」\n`);

  console.log("⏳ 音声を合成中...");

  let audioBuffer: Buffer | null = null;

  try {
    // まず推奨の Interactions API で試行
    audioBuffer = await synthesizeWithInteractions(
      modelName,
      voiceId,
      inputText,
      style,
    );
  } catch (err: any) {
    console.log(
      `ℹ️ Interactions APIでの生成をスキップし、GenerateContentでフォールバック試行します... (${err?.message})`,
    );
    try {
      audioBuffer = await synthesizeWithGenerateContent(
        modelName,
        voiceId,
        inputText,
        style,
      );
    } catch (fallbackErr: any) {
      console.error("\n\x1b[31m❌ 音声合成に失敗しました:\x1b[0m");
      console.error(fallbackErr?.message || fallbackErr);
      process.exit(1);
    }
  }

  if (!audioBuffer) {
    console.error("音声バッファの取得に失敗しました。");
    process.exit(1);
  }

  // outputs ディレクトリの確認
  const outputDir = path.resolve("outputs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // タイムスタンプ付きファイル名と latest.wav に保存
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace("T", "_")
    .slice(0, 15);
  const datedFilename = `speech_${timestamp}.wav`;
  const datedPath = path.join(outputDir, datedFilename);
  const latestPath = path.join(outputDir, "latest.wav");

  fs.writeFileSync(datedPath, audioBuffer);
  fs.writeFileSync(latestPath, audioBuffer);

  console.log("\n\x1b[32m✨ 音声合成が完了しました！\x1b[0m");
  console.log(`💾 保存先: \x1b[36m${datedPath}\x1b[0m`);
  console.log(`💾 最新版: \x1b[36m${latestPath}\x1b[0m`);
  console.log("\n再生して声をご確認ください！\n");
}

main().catch((err) => {
  console.error("予期せぬエラーが発生しました:", err);
  process.exit(1);
});
