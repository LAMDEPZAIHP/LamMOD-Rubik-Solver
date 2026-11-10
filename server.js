const express = require("express");
const path = require("path");
const fs = require("fs");
const Cube = require("cubejs");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function ensureStorage() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, "[]");
}
function readHistory() {
  ensureStorage();
  try { return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8")); }
  catch { return []; }
}
function writeHistory(items) {
  ensureStorage();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(items.slice(0, 100), null, 2));
}

// Facelet order expected by cubejs: U, R, F, D, L, B.
// Each face is row-major as viewed directly from outside that face.
const FACE_ORDER = ["U", "R", "F", "D", "L", "B"];
const VALID = new Set("URFDLB");

function validateFacelets(facelets) {
  if (typeof facelets !== "string" || facelets.length !== 54) {
    return { ok: false, error: "Trạng thái phải có đúng 54 ký tự." };
  }
  const chars = facelets.toUpperCase();
  const invalid = [...chars].find(c => !VALID.has(c));
  if (invalid) return { ok: false, error: "Chỉ chấp nhận các ký tự U, R, F, D, L, B." };

  const counts = Object.fromEntries([...VALID].map(c => [c, 0]));
  for (const c of chars) counts[c]++;
  const wrong = Object.entries(counts).filter(([, n]) => n !== 9);
  if (wrong.length) {
    return {
      ok: false,
      error: "Mỗi mặt màu phải xuất hiện đúng 9 lần.",
      counts
    };
  }
  for (let i = 0; i < 6; i++) {
    const center = chars[i * 9 + 4];
    if (center !== FACE_ORDER[i]) {
      return { ok: false, error: `Tâm mặt ${FACE_ORDER[i]} không đúng vị trí.`, counts };
    }
  }
  try {
    // cubejs constructor performs cubie-level conversion; solve() detects many impossible states.
    Cube.fromString(chars);
  } catch (e) {
    return { ok: false, error: "Không thể đọc trạng thái Rubik: " + e.message, counts };
  }
  return { ok: true, facelets: chars, counts };
}

let solverReady = false;
let solverError = null;
let solverPromise = null;
function initSolver() {
  if (!solverPromise) {
    solverPromise = new Promise((resolve, reject) => {
      setImmediate(() => {
        try {
          Cube.initSolver();
          solverReady = true;
          resolve(true);
        } catch (err) {
          solverError = err;
          reject(err);
        }
      });
    });
  }
  return solverPromise;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "LamMOD Rubik Solver", solverReady, solverError: solverError?.message || null });
});

app.post("/api/validate", (req, res) => {
  const result = validateFacelets(req.body?.facelets);
  res.status(result.ok ? 200 : 400).json(result);
});

app.post("/api/solve", async (req, res) => {
  const check = validateFacelets(req.body?.facelets);
  if (!check.ok) return res.status(400).json(check);
  try {
    await initSolver();
    const cube = Cube.fromString(check.facelets);
    const solution = cube.solve();
    const moves = solution.trim() ? solution.trim().split(/\s+/) : [];
    const record = {
      id: Date.now().toString(36),
      createdAt: new Date().toISOString(),
      facelets: check.facelets,
      solution,
      moveCount: moves.length
    };
    const history = readHistory();
    history.unshift(record);
    writeHistory(history);
    res.json({ ok: true, solution, moves, moveCount: moves.length, solved: moves.length === 0 });
  } catch (err) {
    res.status(422).json({
      ok: false,
      error: "Trạng thái này không hợp lệ hoặc bộ giải không tìm được lời giải.",
      detail: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

app.get("/api/history", (_req, res) => res.json({ ok: true, items: readHistory() }));
app.delete("/api/history", (_req, res) => {
  writeHistory([]);
  res.json({ ok: true });
});

app.use((req, res, next) => {\n  if (req.method === "GET" && !req.path.startsWith("/api/")) {\n    return res.sendFile(path.join(__dirname, "public", "index.html"));\n  }\n  next();\n});

app.listen(PORT, () => {
  console.log(`LamMOD Rubik Solver listening on port ${PORT}`);
  initSolver().then(() => console.log("Kociemba solver tables initialized"))
    .catch(err => console.error("Solver initialization failed:", err));
});
