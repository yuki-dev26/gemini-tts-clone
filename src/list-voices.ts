import { ai } from "./client.js";

async function main() {
  console.log("\n=======================================================");
  console.log(" 📋 登録済み Voice 一覧 (type: replicated)");
  console.log("=======================================================\n");

  try {
    const response = await ai.voices.list({ type: ["replicated"] });
    const voices = response.voices ?? [];

    if (voices.length === 0) {
      console.log(
        "現在、プロジェクト内に登録されているレプリケート音声はありません。",
      );
      console.log("作成するには: bun run replicate");
      return;
    }

    console.log(`見つかった音声モデル数: ${voices.length} 件\n`);

    for (const [index, voice] of voices.entries()) {
      console.log(
        `[${index + 1}] 🏷️ 表示名: ${voice.display_name ?? "(名称なし)"}`,
      );
      console.log(`    🆔 ID:     ${voice.id}`);
      console.log(`    🤖 モデル: ${voice.model ?? "N/A"}`);
      if (voice.expire_time) {
        console.log(`    ⏳ 有効期限: ${voice.expire_time}`);
      }
      console.log("-------------------------------------------------------");
    }
  } catch (error: any) {
    console.error("\x1b[31m[エラー] 音声一覧の取得に失敗しました:\x1b[0m");
    console.error(error?.message || error);
  }
}

main().catch((err) => {
  console.error("予期せぬエラーが発生しました:", err);
  process.exit(1);
});
