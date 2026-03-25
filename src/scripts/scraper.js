const fs = require("fs");
const cheerio = require("cheerio");

const URL = "https://www.tibia.com/community/?subtopic=guilds&page=view&GuildName=Locked";

(async () => {
  try {
    const res = await fetch(URL, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const members = [];

    const table = $("div.Text")
      .filter((i, el) => $(el).text().includes("Guild Members"))
      .closest(".TableContainer")
      .find("table.TableContent");

    const rows = table.find("tr").not(".LabelH");

    rows.each((i, el) => {
      const cols = $(el).find("td");

      if (cols.length === 6) {
        const nameCell = $(cols[1]);

        members.push({
          rank: $(cols[0]).text().trim(),

          name: nameCell.find("a").text().trim(),

          vocation: $(cols[2]).text().trim(),

          level: parseInt($(cols[3]).text().trim()),

          status: $(cols[5]).text().includes("online")
            ? "online"
            : "offline"
        });
      }
    });

    fs.mkdirSync("./src/data", { recursive: true });

    fs.writeFileSync(
      "./src/data/members.json",
      JSON.stringify(members, null, 2)
    );

    console.log("Members updated:", members.length);

    if (members.length === 0) {
      throw new Error("Nenhum membro encontrado — parsing falhou");
    }

  } catch (err) {
    console.error("Erro no scraping:", err);
    process.exit(1);
  }
})();
