const fs = require("fs").promises;

const PRICE_FILE = "last_price.json"; // 前回価格保存用
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK; // GitHub Secrets に登録

async function getShibaPrice() {
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=shiba-inu&vs_currencies=usd";
  const res = await fetch(url);
  const data = await res.json();
  return data["shiba-inu"].usd;
}

async function sendDiscord(newPrice, firstTime = false) {
  const message = firstTime
    ? `柴犬コイン価格チェックを開始しました！現在価格: $${newPrice}`
    : `柴犬コインが上がりました！現在価格: $${newPrice}`;

  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message }),
  });

  console.log("Discord に通知送信完了");
}

async function main() {
  try {
    const newPrice = await getShibaPrice();
    console.log("現在価格:", newPrice);

    let lastPrice = null;
    let firstTime = false;

    // 前回価格を読み込む
    try {
      const content = await fs.readFile(PRICE_FILE, "utf-8");
      lastPrice = JSON.parse(content).price;
    } catch (err) {
      console.log("前回価格ファイルなし、初回実行とみなします");
      firstTime = true;
    }

    // 初回実行、または価格が上がったら通知
    if (firstTime || newPrice > lastPrice) {
      await sendDiscord(newPrice, firstTime);
    } else {
      console.log("価格は上昇していません");
    }

    // 新しい価格を保存
    await fs.writeFile(PRICE_FILE, JSON.stringify({ price: newPrice }), "utf-8");
  } catch (err) {
    console.error("エラー:", err);
  }
}

main();
