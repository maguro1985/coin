const fs = require("fs").promises;

const PRICE_FILE = "last_price.json";
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

async function getShibaPrice() {
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=shiba-inu&vs_currencies=jpy";
  const res = await fetch(url);
  const data = await res.json();
  return data["shiba-inu"].jpy;
}

async function sendDiscord(message) {
  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message }),
  });
  console.log("Discord に通知送信:", message);
}

async function main() {
  try {
    const newPrice = await getShibaPrice();
    console.log("現在価格:", newPrice, "円");

    let record = { price: newPrice, low: newPrice, notified: false };
    let firstTime = false;

    try {
      const content = await fs.readFile(PRICE_FILE, "utf-8");
      record = JSON.parse(content);
      if (newPrice < record.low) record.low = newPrice;
    } catch {
      console.log("初回実行として扱います");
      firstTime = true;
    }

    if (firstTime) {
      await sendDiscord(`🐶 柴犬コイン価格チェックを開始しました！現在価格: ¥${newPrice}`);
    }

    // 高騰検知：最安値の50倍以上
    const threshold = record.low * 50;
    if (!record.notified && newPrice >= threshold) {
      const message = `🚀 柴犬コインが高騰中！\n過去最安値 ¥${record.low} の約50倍に到達！\n現在価格: ¥${newPrice}`;
      await sendDiscord(message);
      record.notified = true;
    } else if (newPrice > record.price) {
      console.log("価格上昇中:", newPrice, "円");
    } else {
      console.log("上昇なし");
    }

    record.price = newPrice;
    await fs.writeFile(PRICE_FILE, JSON.stringify(record, null, 2), "utf-8");
  } catch (err) {
    console.error("エラー:", err);
  }
}

main();
