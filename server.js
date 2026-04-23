const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

const HISTORY_FILE = "history.txt";

// 🔹 Read history
function getHistoryLines() {
  try {
    return fs.readFileSync(HISTORY_FILE, "utf-8")
      .split("\n")
      .filter(l => l.trim() !== "");
  } catch {
    return [];
  }
}

// 🔹 Save history (limit size)
function saveHistory(text) {
  let lines = getHistoryLines();
  lines.push(text);

  if (lines.length > 50) {
    lines = lines.slice(-50);
  }

  fs.writeFileSync(HISTORY_FILE, lines.join("\n"));
}

// 🔹 Find palindromes
function findPalindromes(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/);

  return [...new Set(
    words.filter(w => w.length > 2 && w === w.split("").reverse().join(""))
  )];
}

// 🔹 Highlight (fast version)
function highlightText(text, palindromes) {
  const parts = text.split(/\b/);

  return parts.map(w =>
    palindromes.includes(w.toLowerCase())
      ? `<span class="highlight">${w}</span>`
      : w
  ).join("");
}

// 🔹 Frequency
function getTopPalindromes() {
  const lines = getHistoryLines();
  let freq = {};

  lines.forEach(line => {
    const words = line
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/);

    words.forEach(w => {
      if (w.length > 2 && w === w.split("").reverse().join("")) {
        freq[w] = (freq[w] || 0) + 1;
      }
    });
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

// 🔥 NEW: Load data on refresh
app.get("/data", (req, res) => {
  res.json({
    history: getHistoryLines().slice(-10).reverse(),
    top: getTopPalindromes()
  });
});

// 🔹 Analyze
app.post("/analyze", upload.single("file"), (req, res) => {
  let text = "";

  // safer file handling
  if (req.file) {
    try {
      text = fs.readFileSync(req.file.path, "utf-8");
    } catch {
      return res.json({ error: "File read error" });
    }
  } else {
    text = req.body.text || "";
  }

  if (!text.trim()) {
    return res.json({ error: "No input provided" });
  }

  if (text.length > 5000) {
    return res.json({ error: "Input too large!" });
  }

  const palindromes = findPalindromes(text);
  const highlighted = highlightText(text, palindromes);

  saveHistory(text);

  res.json({
    count: palindromes.length,
    highlighted,
    history: getHistoryLines().slice(-10).reverse(),
    top: getTopPalindromes()
  });
});

// 🔹 Clear
app.post("/clear", (req, res) => {
  fs.writeFileSync(HISTORY_FILE, "");
  res.json({ message: "History cleared" });
});

// 🔹 Download
app.post("/download", (req, res) => {
  const data = req.body.data;

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", "attachment; filename=report.txt");
  res.send(data);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});