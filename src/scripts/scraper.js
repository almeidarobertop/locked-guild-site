const fs = require("fs");

const URL = "https://api.tibiadata.com/v4/guild/Locked";

(async () => {
  try {
    const res = await fetch(URL);
    const data = await res.json();

    const members = data.guild.members.map(m => ({
      name: m.name,
      rank: m.rank,
      vocation: m.vocation,
      level: m.level,
      status: m.status
    }));

    fs.mkdirSync("./src/data", { recursive: true });

    fs.writeFileSync(
      "./src/data/members.json",
      JSON.stringify(members, null, 2)
    );

    console.log("Members updated:", members.length);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
