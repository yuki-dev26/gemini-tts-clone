import * as fs from "node:fs";
import * as path from "node:path";
import { ai, saveVoiceConfig } from "./client.js";

// コマンドライン引数の簡易パース
function getArg(flag: string, defaultValue?: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index !== -1 && index + 1 < process.argv.length) {
    return process.argv[index + 1];
  }
  return defaultValue;
}

async function main() {
  console.log("\n=======================================================");
  console.log(" 🎙️ Gemini API Voice Replication（声のクローン学習）");
  console.log("=======================================================\n");

  // 入力ファイルパス（デフォルト: audio_inputs/ フォルダ配下）
  const referencePath = getArg(
    "--reference",
    path.resolve("audio_inputs", "reference.wav"),
  )!;
  const consentPath = getArg(
    "--consent",
    path.resolve("audio_inputs", "consent.wav"),
  )!;
  const displayName = getArg(
    "--name",
    `Custom Voice ${new Date().toISOString().slice(0, 10)}`,
  )!;
  const modelName = getArg("--model", "gemini-3.8-flash-tts")!;

  let hasError = false;

  // 参照音声の存在チェック
  if (!fs.existsSync(referencePath)) {
    console.error(
      `\x1b[31m[エラー] 参照音声ファイルが見つかりません: ${referencePath}\x1b[0m`,
    );
    hasError = true;
  }

  // 同意音声の存在チェック
  if (!fs.existsSync(consentPath)) {
    console.error(
      `\x1b[31m[エラー] 同意フレーズ音声ファイルが見つかりません: ${consentPath}\x1b[0m`,
    );
    hasError = true;
  }

  if (hasError) {
    console.log("\n-------------------------------------------------------");
    console.log("💡 音声ファイルの準備手順:");
    console.log(
      " 1. 学習用音声 (10〜30秒、クリアな本人の発話) を用意し、以下に配置してください:",
    );
    console.log(
      `    👉 \x1b[33m${path.resolve("audio_inputs", "reference.wav")}\x1b[0m`,
    );
    console.log(
      " 2. 同意フレーズを読み上げた音声を用意し、以下に配置してください:",
    );
    console.log(
      `    👉 \x1b[33m${path.resolve("audio_inputs", "consent.wav")}\x1b[0m`,
    );
    console.log(
      "\n🗣️ 同意フレーズ（以下の文章をそのまま正確に録音してください）:",
    );
    console.log(" 【日本語】");
    console.log(
      "   \x1b[36m「私はこの音声の所有者であり、Googleがこの音声を使用して音声合成モデルを作成することを承認します。」\x1b[0m",
    );
    console.log(" 【英語】");
    console.log(
      '   \x1b[36m"I am the owner of this voice and I consent to Google using this voice to create a synthetic voice model."\x1b[0m',
    );
    console.log("-------------------------------------------------------\n");
    process.exit(1);
  }

  console.log(`📁 参照音声: ${referencePath}`);
  console.log(`📁 同意音声: ${consentPath}`);
  console.log(`🏷️ 表示名:   ${displayName}`);
  console.log(`🤖 ベースモデル: ${modelName}`);
  console.log("\n音声データを読み込んでエンコード中...");

  const sourceB64 = fs.readFileSync(referencePath).toString("base64");
  const consentB64 = fs.readFileSync(consentPath).toString("base64");

  console.log("🚀 Gemini API に音声を送信し、音声モデルを作成しています...");
  console.log(
    "※ 同一人物の声紋照合・安全検証が行われます。数十秒かかる場合があります。",
  );

  try {
    const replicatedVoice = await ai.voices.create({
      store: true, // プロジェクト内に1年間保存
      voice: {
        model: modelName,
        type: "replicated",
        display_name: displayName,
        replicated: {
          source_audio: {
            mime_type: "audio/wav",
            data: sourceB64,
          },
          consent_audio: {
            mime_type: "audio/wav",
            data: consentB64,
          },
        },
      },
    });

    const voiceId = replicatedVoice.id;
    if (!voiceId) {
      throw new Error(
        "音声モデルは作成されましたが、Voice ID が取得できませんでした。",
      );
    }

    console.log("\n\x1b[32m✨ 音声モデルの作成が正常に完了しました！\x1b[0m");
    console.log(`🆔 Voice ID: \x1b[33m${voiceId}\x1b[0m`);
    console.log(`🏷️ 表示名:   ${replicatedVoice.display_name ?? displayName}`);

    // 設定ファイルに保存（TTS時に自動で利用可能にする）
    saveVoiceConfig({
      voiceId,
      displayName,
      createdAt: new Date().toISOString(),
      model: modelName,
    });
    console.log("💾 設定を voice_config.json に保存しました。");

    console.log("\n-------------------------------------------------------");
    console.log("🎉 次のステップ:");
    console.log(
      "以下のコマンドで、複製された声でTTS（音声合成）を実行できます:",
    );
    console.log("  \x1b[36mbun run tts\x1b[0m");
    console.log("または任意のテキストを指定して実行:");
    console.log(
      '  \x1b[36mbun run tts "こんにちは！私のクローン音声へようこそ。"\x1b[0m',
    );
    console.log("-------------------------------------------------------\n");
  } catch (error: any) {
    console.error("\n\x1b[31m❌ 音声モデルの作成に失敗しました:\x1b[0m");
    console.error(error?.message || error);

    console.log("\n💡 よくある失敗原因と対策:");
    console.log(
      " - 話者の声紋が一致しない: reference.wav と consent.wav を同一のマイク・同じ部屋で録音してください。",
    );
    console.log(
      " - 同意フレーズが不完全: 指定された同意フレーズを一字一句正確に発話してください。",
    );
    console.log(
      " - 音質または無音: 背景のノイズやBGMを消し、24kHz モノラル WAV で録音してください。",
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("予期せぬエラーが発生しました:", err);
  process.exit(1);
});
