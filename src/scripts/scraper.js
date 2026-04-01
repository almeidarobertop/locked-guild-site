const fs = require("fs");

const GUILD_URL = "https://api.tibiadata.com/v4/guild/Locked";
const HIGHSCORES_BASE_URL = "https://api.tibiadata.com/v4/highscores/Ourobra";
const MEMBERS_PATH = "./src/data/members.json";
const BRAZIL_TIMEZONE = "America/Sao_Paulo";
const HIGHSCORE_CATEGORIES = ["magic", "distance", "fist", "axe", "sword", "club"];
const SKILL_TREND_PERSIST_DAYS = 7;
const SCRAPER_MODE = process.argv[2] || "snapshot";

const SKILL_METADATA = {
  magic: { label: "Magic Level", allowedVocations: ["sorcerer", "druid"] },
  distance: { label: "Distance Fighting", allowedVocations: ["paladin"] },
  fist: { label: "Fist Fighting", allowedVocations: ["monk"] },
  axe: { label: "Axe Fighting", allowedVocations: ["knight"] },
  sword: { label: "Sword Fighting", allowedVocations: ["knight"] },
  club: { label: "Club Fighting", allowedVocations: ["knight"] }
};

const getBrazilDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);

const getDaysBetweenDates = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return Number.POSITIVE_INFINITY;
  }

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((end.getTime() - start.getTime()) / 86400000);
};

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

const normalizeName = (name = "") => name.trim().toLowerCase();

const isAllowedForVocation = (category, vocation = "") => {
  const metadata = SKILL_METADATA[category];
  if (!metadata) return false;

  const normalizedVocation = vocation.toLowerCase();
  return metadata.allowedVocations.some((key) => normalizedVocation.includes(key));
};

const shouldReplaceHighscore = (currentBest, candidate) => {
  if (!currentBest) return true;
  if (candidate.rank !== currentBest.rank) return candidate.rank < currentBest.rank;
  if (candidate.value !== currentBest.value) return candidate.value > currentBest.value;
  return candidate.label.localeCompare(currentBest.label) < 0;
};

const fetchJson = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return response.json();
};

const fetchHighscoresByCategory = async (category) => {
  const entries = new Map();
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${HIGHSCORES_BASE_URL}/${category}/all/${page}`;
    const data = await fetchJson(url);
    const highscores = data.highscores;

    if (!highscores || !Array.isArray(highscores.highscore_list)) {
      throw new Error(`Unexpected highscores response for ${category} page ${page}`);
    }

    totalPages = Number.parseInt(highscores.highscore_page?.total_pages, 10) || 1;

    highscores.highscore_list.forEach((entry) => {
      entries.set(normalizeName(entry.name), {
        category,
        label: SKILL_METADATA[category].label,
        rank: Number.parseInt(entry.rank, 10),
        value: Number.parseInt(entry.value, 10),
        vocation: entry.vocation
      });
    });

    page += 1;
  }

  return entries;
};

const buildHighscoreIndexes = async () => {
  const indexes = {};

  for (const category of HIGHSCORE_CATEGORIES) {
    indexes[category] = await fetchHighscoresByCategory(category);
  }

  return indexes;
};

const buildSkillData = (member, highscoreIndexes) => {
  const skillHighlights = {};
  let primaryHighscore = null;
  const normalizedName = normalizeName(member.name);

  for (const category of HIGHSCORE_CATEGORIES) {
    if (!isAllowedForVocation(category, member.vocation)) {
      continue;
    }

    const entry = highscoreIndexes[category]?.get(normalizedName);
    if (!entry) {
      continue;
    }

    skillHighlights[category] = {
      rank: entry.rank,
      value: entry.value,
      label: entry.label
    };

    const candidate = {
      category,
      label: entry.label,
      rank: entry.rank,
      value: entry.value
    };

    if (shouldReplaceHighscore(primaryHighscore, candidate)) {
      primaryHighscore = candidate;
    }
  }

  return {
    skillHighlights,
    primaryHighscore
  };
};

const normalizeSkillHighlights = (value) => {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([category, entry]) => [
      category,
      {
        rank: Number.parseInt(entry?.rank, 10),
        value: Number.parseInt(entry?.value, 10),
        label: entry?.label || SKILL_METADATA[category]?.label || "Skill"
      }
    ])
  );
};

const buildSnapshotMember = ({
  member,
  previousMember,
  snapshotDate,
  snapshotAt,
  highscoreIndexes
}) => {
  const previousLevel = Number.parseInt(previousMember?.level, 10);
  const currentLevel = Number.parseInt(member.level, 10);
  const previousSnapshotDate = previousMember?.snapshotDate;
  const storedBaselineLevel = Number.parseInt(previousMember?.baselineLevel, 10);
  const previousSkillHighlights = normalizeSkillHighlights(previousMember?.skillHighlights);

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

  const { skillHighlights, primaryHighscore } = buildSkillData(member, highscoreIndexes);
  const previousPrimarySkillValue = primaryHighscore
    ? Number.parseInt(previousSkillHighlights[primaryHighscore.category]?.value, 10)
    : Number.NaN;
  const previousPrimarySkillTrend = previousMember?.primarySkillTrend;
  const previousPrimarySkillTrendDate = previousMember?.primarySkillTrendDate || previousSnapshotDate;
  const shouldPersistPreviousSkillTrend =
    primaryHighscore &&
    (previousPrimarySkillTrend === "up" || previousPrimarySkillTrend === "down") &&
    getDaysBetweenDates(previousPrimarySkillTrendDate, snapshotDate) < SKILL_TREND_PERSIST_DAYS;

  let primarySkillTrend = "none";
  let primarySkillTrendDate = null;

  if (primaryHighscore && Number.isFinite(previousPrimarySkillValue)) {
    if (primaryHighscore.value > previousPrimarySkillValue) {
      primarySkillTrend = "up";
      primarySkillTrendDate = snapshotDate;
    } else if (primaryHighscore.value < previousPrimarySkillValue) {
      primarySkillTrend = "down";
      primarySkillTrendDate = snapshotDate;
    }
  } else if (shouldPersistPreviousSkillTrend) {
    primarySkillTrend = previousPrimarySkillTrend;
    primarySkillTrendDate = previousPrimarySkillTrendDate;
  }

  return {
    name: member.name,
    rank: member.rank,
    vocation: member.vocation,
    level: currentLevel,
    previousLevel: Number.isFinite(previousLevel) ? previousLevel : currentLevel,
    baselineLevel,
    baselineDate,
    levelGain,
    snapshotDate,
    snapshotAt,
    status: member.status,
    skillHighlights,
    primaryHighscore,
    primarySkillTrend,
    primarySkillTrendDate
  };
};

const buildRosterSyncMember = ({
  member,
  previousMember,
  snapshotDate,
  snapshotAt,
  highscoreIndexes
}) => {
  if (!previousMember) {
    const { skillHighlights, primaryHighscore } = buildSkillData(member, highscoreIndexes);
    const currentLevel = Number.parseInt(member.level, 10);

    return {
      name: member.name,
      rank: member.rank,
      vocation: member.vocation,
      level: currentLevel,
      previousLevel: currentLevel,
      baselineLevel: currentLevel,
      baselineDate: snapshotDate,
      levelGain: 0,
      snapshotDate,
      snapshotAt,
      status: member.status,
      skillHighlights,
      primaryHighscore,
      primarySkillTrend: "none",
      primarySkillTrendDate: null
    };
  }

  return {
    ...previousMember,
    rank: member.rank,
    vocation: member.vocation,
    status: member.status
  };
};

(async () => {
  try {
    if (!["snapshot", "sync"].includes(SCRAPER_MODE)) {
      throw new Error(`Unsupported scraper mode: ${SCRAPER_MODE}`);
    }

    const data = await fetchJson(GUILD_URL);
    const guildMembers = data.guild?.members;

    if (!Array.isArray(guildMembers)) {
      throw new Error("Unexpected guild response: missing members list");
    }

    const previousMembers = loadPreviousMembers();
    const snapshotAt = new Date().toISOString();
    const snapshotDate = getBrazilDate();
    const shouldFetchHighscores = SCRAPER_MODE === "snapshot" || guildMembers.some((member) => !previousMembers.has(member.name));
    const highscoreIndexes = shouldFetchHighscores ? await buildHighscoreIndexes() : null;

    const members = guildMembers.map((member) => {
      const previousMember = previousMembers.get(member.name);
      if (SCRAPER_MODE === "snapshot") {
        return buildSnapshotMember({
          member,
          previousMember,
          snapshotDate,
          snapshotAt,
          highscoreIndexes
        });
      }

      return buildRosterSyncMember({
        member,
        previousMember,
        snapshotDate,
        snapshotAt,
        highscoreIndexes
      });
    });

    fs.mkdirSync("./src/data", { recursive: true });

    fs.writeFileSync(
      MEMBERS_PATH,
      JSON.stringify(members, null, 2)
    );

    console.log(`Members updated (${SCRAPER_MODE}):`, members.length);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
