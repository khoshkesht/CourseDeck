const state = {
  courseTitle: "پخش صوت",
  basePath: "assets",
  folders: [],
  activeFolder: null,
  isSeeking: false,
};

const elements = {
  pageTitle: document.querySelector("#pageTitle"),
  pageSubtitle: document.querySelector("#pageSubtitle"),
  backButton: document.querySelector("#backButton"),
  aboutButton: document.querySelector("#aboutButton"),
  pdfLinks: document.querySelector("#pdfLinks"),
  emptyState: document.querySelector("#emptyState"),
  emptyBasePath: document.querySelector("#emptyBasePath"),
  folderView: document.querySelector("#folderView"),
  trackView: document.querySelector("#trackView"),
  playerSheet: document.querySelector("#playerSheet"),
  playerTitle: document.querySelector("#playerTitle"),
  playerFolder: document.querySelector("#playerFolder"),
  seekBar: document.querySelector("#seekBar"),
  currentTime: document.querySelector("#currentTime"),
  duration: document.querySelector("#duration"),
  playPauseButton: document.querySelector("#playPauseButton"),
  rewindButton: document.querySelector("#rewindButton"),
  forwardButton: document.querySelector("#forwardButton"),
  audioPlayer: document.querySelector("#audioPlayer"),
  notesSheet: document.querySelector("#notesSheet"),
  closePlayerButton: document.querySelector("#closePlayerButton"),
  closeNotesButton: document.querySelector("#closeNotesButton"),
  notesTitle: document.querySelector("#notesTitle"),
  notesList: document.querySelector("#notesList"),
};

const audioExtensions = [".mp3", ".m4a", ".ogg", ".wav", ".aac", ".flac"];
const icons = {
  book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H7a3 3 0 0 0-3 3V5.5Zm3-.5a1 1 0 0 0 0 2h10V5H7Zm0 5a1 1 0 0 0 0 2h10v-2H7Z"/></svg>`,
  workbook: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h11.5L20 6.5V21H5V3Zm10 1.8V8h3.2L15 4.8ZM8 11h8v2H8v-2Zm0 4h8v2H8v-2Z"/></svg>`,
  numbers: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4v16H7V7H5V4Zm8.2 0A3.8 3.8 0 0 1 17 7.8c0 1.1-.5 2.1-1.2 2.8L14 12.5h3.5V15h-8v-1.8l4.3-4.4c.4-.4.7-.8.7-1.2 0-.7-.5-1.1-1.3-1.1-.7 0-1.3.4-1.8 1L9.6 6c.8-1.2 2-2 3.6-2Z"/></svg>`,
  taught: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v12H3V5Zm2 2v8h14V7H5Zm3 12h8v2H8v-2Zm3-4h2v4h-2v-4Z"/></svg>`,
  homework: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h13l3 3v15H4V3Zm12 1.8V7h2.2L16 4.8ZM7 10h10v2H7v-2Zm0 4h7v2H7v-2Zm0 4h10v2H7v-2Z"/></svg>`,
};
const pdfFiles = [
  {
    title: "کتاب",
    href: "https://books.iran-europe.net/Kids/First_Friends/First_Friends_3/%D9%BE%DB%8C%20%D8%AF%DB%8C%20%D8%A7%D9%81%20%DA%A9%D8%AA%D8%A7%D8%A8%20%D8%A7%D8%B5%D9%84%DB%8C/",
    icon: icons.book,
  },
  {
    title: "کتاب کار",
    href: "https://books.iran-europe.net/Kids/First_Friends/First_Friends_3/%D9%BE%DB%8C%20%D8%AF%DB%8C%20%D8%A7%D9%81%20%DA%A9%D8%AA%D8%A7%D8%A8%20%DA%A9%D8%A7%D8%B1/",
    icon: icons.workbook,
  },
  {
    title: "کتاب اعداد",
    href: "https://books.iran-europe.net/Kids/First_Friends/First_Friends_3/%D9%BE%DB%8C%20%D8%AF%DB%8C%20%D8%A7%D9%81%20%DA%A9%D8%AA%D8%A7%D8%A8%20%D8%A7%D8%B9%D8%AF%D8%A7%D8%AF/",
    icon: icons.numbers,
  },
];

function naturalParts(value) {
  return value
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .match(/\d+|\D+/g)
    ?.map((part) => (/^\d+$/.test(part) ? Number(part) : part.trim()))
    .filter((part) => part !== "") || [value.toLowerCase()];
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

function fileTitle(src) {
  return decodeURIComponent(src.split("/").pop() || src).replace(/\.[^.]+$/, "");
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function buildAudioSrc(trackSrc) {
  if (/^(blob:|https?:|data:)/i.test(trackSrc)) return trackSrc;
  return `${state.basePath}/${trackSrc.replace(/^\/+/, "")}`;
}

async function loadCourse() {
  try {
    const response = await fetch("course.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const course = await response.json();
    state.courseTitle = course.title || state.courseTitle;
    state.basePath = course.audioPath || state.basePath;
  } catch {
    state.courseTitle = "پخش صوت";
  }

  document.title = state.courseTitle;
  elements.pageTitle.textContent = state.courseTitle;
}

async function loadLibrary() {
  elements.emptyBasePath.textContent = state.basePath;

  try {
    const response = await fetch(`${state.basePath}/library.json`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rawLibrary = await response.json();
    state.folders = normalizeFolders(rawLibrary);
  } catch {
    state.folders = [];
  }

  renderFolders();
}

function normalizeFolders(rawLibrary) {
  const sessions = rawLibrary.sessions || {};

  return Object.keys(sessions)
    .map((sessionNumber) => {
      const tracks = (sessions[sessionNumber] || [])
        .map((fileName) => ({
          title: fileTitle(fileName),
          src: `${sessionNumber}/${fileName}`,
        }))
        .filter((track) => track.src && audioExtensions.some((ext) => track.src.toLowerCase().endsWith(ext)))
        .sort((a, b) => naturalCompare(a.title, b.title));

      return {
        number: sessionNumber,
        title: `جلسه ${sessionNumber}`,
        tracks,
      };
    })
    .sort((a, b) => naturalCompare(a.number, b.number));
}

function renderPdfLinks() {
  elements.pdfLinks.innerHTML = "";
  pdfFiles.forEach((pdf) => {
    const link = document.createElement("a");
    link.className = "pdf-button";
    link.href = pdf.href;
    link.target = "_blank";
    link.rel = "noopener";
    link.innerHTML = `<span class="button-icon">${pdf.icon}</span><span></span>`;
    link.querySelector("span:last-child").textContent = pdf.title;
    elements.pdfLinks.append(link);
  });
}

function renderFolders() {
  state.activeFolder = null;
  elements.pageTitle.textContent = state.courseTitle;
  elements.pageSubtitle.textContent = `${state.folders.length} جلسه`;
  elements.folderView.innerHTML = "";
  elements.trackView.innerHTML = "";
  elements.folderView.classList.remove("hidden");
  elements.trackView.classList.add("hidden");
  elements.pdfLinks.classList.remove("hidden");
  elements.backButton.classList.add("hidden");
  elements.aboutButton.classList.remove("hidden");
  elements.emptyState.classList.toggle("hidden", state.folders.length > 0);
  renderPdfLinks();

  state.folders.forEach((folder) => {
    const button = document.createElement("button");
    button.className = "list-button";
    button.type = "button";
    button.innerHTML = `
      <span class="list-icon">♪</span>
      <span>
        <span class="list-title"></span>
        <span class="list-meta">${folder.tracks.length} فایل صوتی</span>
      </span>
    `;
    button.querySelector(".list-title").textContent = folder.title;
    button.addEventListener("click", () => openFolder(folder));
    elements.folderView.append(button);
  });
}

function renderSessionActions(folder) {
  const actions = document.createElement("div");
  actions.className = "session-actions";

  const taughtButton = document.createElement("button");
  taughtButton.className = "session-action-button";
  taughtButton.type = "button";
  taughtButton.innerHTML = `<span class="button-icon">${icons.taught}</span><span>تدریس شده</span>`;
  taughtButton.addEventListener("click", () => showNotes(folder, "taught"));

  const homeworkButton = document.createElement("button");
  homeworkButton.className = "session-action-button";
  homeworkButton.type = "button";
  homeworkButton.innerHTML = `<span class="button-icon">${icons.homework}</span><span>تکلیف منزل</span>`;
  homeworkButton.addEventListener("click", () => showNotes(folder, "homework"));

  actions.append(taughtButton, homeworkButton);
  elements.trackView.append(actions);
}

function openFolder(folder) {
  state.activeFolder = folder;
  elements.pageTitle.textContent = folder.title;
  elements.pageSubtitle.textContent = `${folder.tracks.length} فایل صوتی`;
  elements.folderView.classList.add("hidden");
  elements.trackView.classList.remove("hidden");
  elements.pdfLinks.classList.add("hidden");
  elements.backButton.classList.remove("hidden");
  elements.aboutButton.classList.add("hidden");
  elements.trackView.innerHTML = "";
  renderSessionActions(folder);

  folder.tracks.forEach((track, index) => {
    const button = document.createElement("button");
    button.className = "list-button";
    button.type = "button";
    button.innerHTML = `
      <span class="list-icon">${index + 1}</span>
      <span>
        <span class="list-title"></span>
        <span class="list-meta">برای پخش لمس کن</span>
      </span>
    `;
    button.querySelector(".list-title").textContent = track.title;
    button.addEventListener("click", () => playTrack(folder, track));
    elements.trackView.append(button);
  });
}

async function showNotes(folder, type) {
  elements.audioPlayer.pause();
  elements.playerSheet.classList.add("hidden");
  elements.notesTitle.textContent = `${folder.title} - ${type === "taught" ? "تدریس شده" : "تکلیف منزل"}`;
  elements.notesList.innerHTML = "";

  const items = await loadSessionNotes(folder.number, type);
  renderMarkdownList(elements.notesList, items);

  elements.notesSheet.classList.remove("hidden");
}

async function loadSessionNotes(sessionNumber, type) {
  const fileName = type === "taught" ? "taught.md" : "homework.md";

  try {
    const response = await fetch(`${state.basePath}/${sessionNumber}/${fileName}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    return markdown
      .split(/\r?\n/)
      .filter((line) => /^\s*[-*]\s+/.test(line));
  } catch {
    return [];
  }
}

function renderMarkdownList(root, lines) {
  const sourceLines = lines.length > 0 ? lines : ["- موردی ثبت نشده است."];
  const stack = [{ indent: -1, list: root }];
  root.innerHTML = "";

  sourceLines.forEach((line) => {
    const match = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (!match) return;

    const indent = match[1].replace(/\t/g, "  ").length;
    const text = match[2].trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    let parentList = stack[stack.length - 1].list;
    if (indent > stack[stack.length - 1].indent && parentList.lastElementChild) {
      const nestedList = document.createElement("ul");
      parentList.lastElementChild.append(nestedList);
      parentList = nestedList;
      stack.push({ indent, list: nestedList });
    }

    const li = document.createElement("li");
    li.textContent = text;
    parentList.append(li);
  });
}

function closeNotes() {
  elements.notesSheet.classList.add("hidden");
}

function playTrack(folder, track) {
  elements.audioPlayer.src = buildAudioSrc(track.src);
  elements.playerTitle.textContent = track.title;
  elements.playerFolder.textContent = folder.title;
  elements.playerSheet.classList.remove("hidden");
  elements.seekBar.value = 0;
  elements.currentTime.textContent = "0:00";
  elements.duration.textContent = "0:00";
  elements.playPauseButton.textContent = "❚❚";
  elements.audioPlayer.play().catch(() => {
    elements.playPauseButton.textContent = "▶";
  });
}

function closePlayer() {
  elements.audioPlayer.pause();
  elements.playerSheet.classList.add("hidden");
}

function togglePlayback() {
  if (!elements.audioPlayer.src) return;
  if (elements.audioPlayer.paused) elements.audioPlayer.play();
  else elements.audioPlayer.pause();
}

function seekBy(seconds) {
  if (!elements.audioPlayer.src) return;
  const audio = elements.audioPlayer;
  const nextTime = Math.max(0, audio.currentTime + seconds);
  audio.currentTime = Number.isFinite(audio.duration) ? Math.min(audio.duration, nextTime) : nextTime;
  syncProgress();
}

function seekToSliderValue() {
  const duration = elements.audioPlayer.duration;
  if (Number.isFinite(duration) && duration > 0) {
    elements.audioPlayer.currentTime = (Number(elements.seekBar.value) / 1000) * duration;
    elements.currentTime.textContent = formatTime(elements.audioPlayer.currentTime);
  }
}

function finishSliderSeek() {
  seekToSliderValue();
  state.isSeeking = false;
  syncProgress();
}

function syncProgress() {
  const { currentTime, duration } = elements.audioPlayer;
  elements.currentTime.textContent = formatTime(currentTime);
  elements.duration.textContent = formatTime(duration);

  if (!state.isSeeking && Number.isFinite(duration) && duration > 0) {
    elements.seekBar.value = Math.round((currentTime / duration) * 1000);
  }
}

document.addEventListener("click", (event) => {
  if (!elements.notesSheet.classList.contains("hidden")) {
    if (elements.notesSheet.contains(event.target)) return;
    if (event.target.closest(".session-action-button")) return;
    closeNotes();
    return;
  }

  if (elements.playerSheet.classList.contains("hidden")) return;
  if (elements.playerSheet.contains(event.target)) return;
  if (event.target.closest(".list-button")) return;
  closePlayer();
});

elements.pageTitle.addEventListener("click", () => {
  if (state.activeFolder) renderFolders();
});
elements.backButton.addEventListener("click", renderFolders);
elements.aboutButton.addEventListener("click", () => {
  window.location.href = "mailto:mo.khoshkesht@gmail.com";
});
elements.closePlayerButton.addEventListener("click", closePlayer);
elements.closeNotesButton.addEventListener("click", closeNotes);
elements.playPauseButton.addEventListener("click", togglePlayback);
elements.rewindButton.addEventListener("click", () => seekBy(-10));
elements.forwardButton.addEventListener("click", () => seekBy(10));
elements.seekBar.addEventListener("pointerdown", () => {
  state.isSeeking = true;
});
elements.seekBar.addEventListener("input", seekToSliderValue);
elements.seekBar.addEventListener("change", finishSliderSeek);
elements.seekBar.addEventListener("pointerup", finishSliderSeek);
elements.seekBar.addEventListener("touchend", finishSliderSeek);
elements.seekBar.addEventListener("mouseup", finishSliderSeek);
elements.audioPlayer.addEventListener("timeupdate", syncProgress);
elements.audioPlayer.addEventListener("loadedmetadata", syncProgress);
elements.audioPlayer.addEventListener("play", () => {
  elements.playPauseButton.textContent = "❚❚";
});
elements.audioPlayer.addEventListener("pause", () => {
  elements.playPauseButton.textContent = "▶";
});
elements.audioPlayer.addEventListener("ended", () => {
  elements.playPauseButton.textContent = "▶";
});

loadCourse().then(loadLibrary);


