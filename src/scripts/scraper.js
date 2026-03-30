const fs = require("fs");

const URL = "https://api.tibiadata.com/v4/guild/Locked";
const MEMBERS_PATH = "./src/data/members.json";
const BRAZIL_TIMEZONE = "America/Sao_Paulo";

const getBrazilDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);

const loadPreviousMembers = () => {
  if (!fs.existsSync(MEMBERS_PATH)) {
    return new Map();
  }

  try {
    const raw = fs.readFileSync(MEMBERS_PATH, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return new Map();
    }

    return new Map(parsed.map((member) => [member.name, member]));
  } catch (error) {
    console.warn("Could not read previous members snapshot:", error.message);
    return new Map();
  }
};

(async () => {
  try {
    const res = await fetch(URL);
    const data = await res.json();
    const previousMembers = loadPreviousMembers();
    const snapshotAt = new Date().toISOString();
    const snapshotDate = getBrazilDate();

    const members = data.guild.members.map((m) => {
      const previousMember = previousMembers.get(m.name);
      const previousLevel = Number.parseInt(previousMember?.level, 10);
      const currentLevel = Number.parseInt(m.level, 10);
      const previousSnapshotDate = previousMember?.snapshotDate;
      const storedBaselineLevel = Number.parseInt(previousMember?.baselineLevel, 10);

      const baselineLevel =
        previousSnapshotDate === snapshotDate && Number.isFinite(storedBaselineLevel)
          ? storedBaselineLevel
          : Number.isFinite(previousLevel)
            ? previousLevel
            : currentLevel;

      const baselineDate =
        previousSnapshotDate === snapshotDate && previousMember?.baselineDate
          ? previousMember.baselineDate
          : previousSnapshotDate || snapshotDate;

      const levelGain = currentLevel > baselineLevel
        ? currentLevel - baselineLevel
        : 0;

      return {
        name: m.name,
        rank: m.rank,
        vocation: m.vocation,
        level: currentLevel,
        previousLevel: Number.isFinite(previousLevel) ? previousLevel : currentLevel,
        baselineLevel,
        baselineDate,
        levelGain,
        snapshotDate,
        snapshotAt,
        status: m.status
      };
    });

    fs.mkdirSync("./src/data", { recursive: true });

    fs.writeFileSync(
      MEMBERS_PATH,
      JSON.stringify(members, null, 2)
    );

    console.log("Members updated:", members.length);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
