const fs = require("fs");
const cheerio = require("cheerio");

const URL = "https://www.tibia.com/community/?subtopic=guilds&page=view&GuildName=Locked";

(async () => {
  try {
    const res = await fetch(URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "text/html",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache"
      }
    });

    const html = await res.text();

    if (!html.includes("Guild Members")) {
      throw new Error("Página bloqueada ou HTML inesperado");
    }

    const $ = cheerio.load(html);

    const members = [];

    const rows = $("table.TableContent tr").filter((i, el) => {
      return $(el).find("td").length === 6;
    });

    rows.each((i, el) => {
      const cols = $(el).find("td");
      const nameCell = $(cols[1]);

      members.push({
        rank: $(cols[0]).text().trim(),
        name: nameCell.find("a").text().trim(),
        vocation: $(cols[2]).text().trim(),
        level: parseInt($(cols[3]).text().trim()),
        status: $(cols[5]).text().toLowerCase().includes("online")
          ? "online"
          : "offline"
      });
    });

    fs.mkdirSync("./src/data", { recursive: true });

    fs.writeFileSync(
      "./src/data/members.json",
      JSON.stringify(members, null, 2)
    );

    console.log("Members updated:", members.length);

    if (members.length === 0) {
      throw new Error("Nenhum membro encontrado após parsing");
    }

  } catch (err) {
    console.error("Erro no scraping:", err);
    process.exit(1);
  }
})();
