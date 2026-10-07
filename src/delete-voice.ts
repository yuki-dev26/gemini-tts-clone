import * as fs from "node:fs";
import { ai, CONFIG_FILE_PATH, loadVoiceConfig } from "./client.js";

async function main() {
  console.log("\n=======================================================");
  console.log(" 🗑️ Voice モデル削除ツール");
  console.log("=======================================================\n");

  const argVoiceId = process.argv[2];
  const savedConfig = loadVoiceConfig();

  const targetId = argVoiceId || savedConfig?.voiceId;

  if (!targetId) {
    console.error(
      "\x1b[31m[エラー] 削除する Voice ID が指定されていません。\x1b[0m",
    );
    console.error("使用例: bun run delete-voice voice_xxxxxx\n");
    process.exit(1);
  }

  console.log(`削除対象 Voice ID: \x1b[33m${targetId}\x1b[0m`);
  console.log("削除を実行中...");

  try {
    await ai.voices.delete(targetId);
    console.log("\x1b[32m✨ 音声モデルが正常に削除されました。\x1b[0m");

    // 保存されている設定がこのIDと同じであれば削除
    if (savedConfig?.voiceId === targetId) {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        fs.unlinkSync(CONFIG_FILE_PATH);
        console.log("voice_config.json もクリアしました。");
      }
    }
  } catch (error: any) {
    console.error("\x1b[31m[エラー] 音声モデルの削除に失敗しました:\x1b[0m");
    console.error(error?.message || error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("予期せぬエラーが発生しました:", err);
  process.exit(1);
});
