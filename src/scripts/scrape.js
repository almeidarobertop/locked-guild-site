const fs = require("fs");
const cheerio = require("cheerio");

const URL = "https://www.tibia.com/community/?subtopic=guilds&page=view&GuildName=Locked";

(async () => {
  try {
    const res = await fetch(URL, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const members = [];

    $("table.TableContent tr").slice(1).each((i, el) => {
      const cols = $(el).find("td");

      if (cols.length >= 5) {
        members.push({
          name: $(cols[0]).text().trim(),
          rank: $(cols[1]).text().trim(),
          vocation: $(cols[2]).text().trim(),
          level: parseInt($(cols[3]).text().trim()),
          status: $(cols[4]).text().trim()
        });
      }
    });

    fs.mkdirSync("./src/data", { recursive: true });

    fs.writeFileSync(
      "./src/data/members.json",
      JSON.stringify(members, null, 2)
    );

    console.log("Members updated:", members.length);

  } catch (err) {
    console.error("Erro no scraping:", err);
    process.exit(1);
  }
})();
