const fs = require("fs");
const path = require("path");

const baseDir = process.argv[2] || "assets";
const sessionsPath = process.argv[3] || path.join("other", "sessions.md");
const audioExtensions = new Set([".mp3", ".m4a", ".ogg", ".wav", ".aac", ".flac"]);

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function toEnglishDigits(value) {
  return String(value).replace(/[۰-۹٠-٩]/g, (char) => {
    const persianIndex = persianDigits.indexOf(char);
    if (persianIndex >= 0) return String(persianIndex);
    return String(arabicDigits.indexOf(char));
  });
}

function naturalParts(value) {
  const parts = toEnglishDigits(value)
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .match(/\d+|\D+/g);

  return (parts || [value]).map((part) => (/^\d+$/.test(part) ? Number(part) : part.trim()));
}

function naturalCompare(a, b) {
  const left = naturalParts(a);
  const right = naturalParts(b);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    if (left[index] === undefined) return -1;
    if (right[index] === undefined) return 1;
    if (left[index] === right[index]) continue;
    if (typeof left[index] === "number" && typeof right[index] === "number") return left[index] - right[index];
    return String(left[index]).localeCompare(String(right[index]), "fa", { numeric: true, sensitivity: "base" });
  }

  return 0;
}

function normalizeBulletLine(line) {
  return line.replace(/\t/g, "  ").replace(/^(\s*)[*-]\s+/, "$1- ").replace(/\*\*/g, "").replace(/\s+$/, "");
}

function parseSessionsMarkdown() {
  if (!fs.existsSync(sessionsPath)) return {};

  const sessions = {};
  const lines = fs.readFileSync(sessionsPath, "utf8").split(/\r?\n/);
  let currentSession = null;
  let currentSection = null;

  for (const line of lines) {
    const sessionMatch = line.match(/^##\s+جلسه\s+([۰-۹٠-٩\d]+)/);
    if (sessionMatch) {
      currentSession = toEnglishDigits(sessionMatch[1]);
      sessions[currentSession] = sessions[currentSession] || { taught: [], homework: [] };
      currentSection = null;
      continue;
    }

    if (!currentSession) continue;

    if (/^###\s+موارد\s+تدریس\s+شده/.test(line)) {
      currentSection = "taught";
      continue;
    }

    if (/^###\s+موارد\s+خواسته\s+شده\s+در\s+منزل/.test(line)) {
      currentSection = "homework";
      continue;
    }

    if (!currentSection || !/^\s*[*-]\s+/.test(line)) continue;

    const item = normalizeBulletLine(line);
    if (item.trim()) sessions[currentSession][currentSection].push(item);
  }

  return sessions;
}

function writeSessionNotes(sessionDir, notes) {
  const taughtPath = path.join(sessionDir, "taught.md");
  const homeworkPath = path.join(sessionDir, "homework.md");
  const taught = notes.taught.join("\n");
  const homework = notes.homework.join("\n");

  fs.writeFileSync(taughtPath, `${taught}\n`, "utf8");
  fs.writeFileSync(homeworkPath, `${homework}\n`, "utf8");
}

function main() {
  const absoluteBase = path.resolve(baseDir);
  if (!fs.existsSync(absoluteBase)) fs.mkdirSync(absoluteBase, { recursive: true });

  const notesBySession = parseSessionsMarkdown();
  const sessions = {};
  const sessionNames = new Set(Object.keys(notesBySession));

  fs.readdirSync(absoluteBase, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
    .forEach((entry) => sessionNames.add(entry.name));

  Array.from(sessionNames)
    .sort(naturalCompare)
    .forEach((sessionName) => {
      const sessionDir = path.join(absoluteBase, sessionName);
      if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

      const tracks = fs
        .readdirSync(sessionDir, { withFileTypes: true })
        .filter((file) => file.isFile() && audioExtensions.has(path.extname(file.name).toLowerCase()))
        .map((file) => file.name)
        .sort(naturalCompare);

      sessions[sessionName] = tracks;
      writeSessionNotes(sessionDir, notesBySession[sessionName] || { taught: [], homework: [] });
    });

  const outputPath = path.join(absoluteBase, "library.json");
  fs.writeFileSync(outputPath, `${JSON.stringify({ sessions }, null, 2)}\n`, "utf8");
  console.log(`Created ${outputPath} with ${Object.keys(sessions).length} sessions.`);
}

main();
