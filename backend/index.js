const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const xlsx = require("xlsx");
const axios = require("axios");
const { BlacklistAlliance } = require("blacklist-alliance-client");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { syncDncResultToCrm } = require("./services/crmSyncService");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Ensure the reports root directory exists at startup
const REPORTS_DIR = path.join(__dirname, "reports");
fs.mkdirSync(REPORTS_DIR, { recursive: true });

// ── Helpers ──────────────────────────────────────────────────────────────────

// Normalize and validate phone numbers
const cleanNumber = (num) => {
  if (!num) return null;
  const cleaned = String(num).replace(/[^0-9]/g, "");
  if (cleaned.length === 10) return cleaned;
  if (cleaned.length === 11 && cleaned.startsWith("1")) return cleaned.slice(1);
  return null;
};

// Build a public base URL (strip any trailing slash)
const buildBaseUrl = () =>
  (process.env.PUBLIC_BASE_URL || "http://localhost:5001").replace(/\/$/, "");

// Write a 2-D array (rows of arrays) to a CSV file using xlsx
const writeCSV = (filePath, rows) => {
  const worksheet = xlsx.utils.aoa_to_sheet(rows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Results");
  xlsx.writeFile(workbook, filePath, { bookType: "csv" });
};

// Sanitise a filename stem (strip extension, replace unsafe chars)
const safeFileStem = (originalname) => {
  const base = path.basename(originalname, path.extname(originalname));
  return base.replace(/[^a-zA-Z0-9_\-. ]/g, "_").trim() || "report";
};

// ── POST /api/check ──────────────────────────────────────────────────────────

app.post("/api/check", upload.single("file"), async (req, res) => {
  try {
    const { campaign } = req.body;
    const file = req.file;

    if (!campaign || !file) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Campaign and file are required." });
    }

    // ── Parse uploaded file (CSV / XLSX / TXT) ────────────────────────────
    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let allPhones = [];
    let invalidCount = 0;
    let validPhoneSet = new Set();
    let duplicatesCount = 0;

    const headers = data.length > 0 ? data[0] : [];
    const dataRows = data.length > 0 ? data.slice(1) : [];

    dataRows.forEach((row) => {
      let rowHasPhone = false;
      for (let i = 0; i < row.length; i++) {
        const cell = row[i];
        if (cell !== null && cell !== undefined) {
          const str = String(cell);
          if (str.replace(/[^0-9]/g, "").length >= 10) {
            const cleaned = cleanNumber(str);
            if (cleaned) {
              rowHasPhone = true;
              if (validPhoneSet.has(cleaned)) {
                duplicatesCount++;
              } else {
                validPhoneSet.add(cleaned);
                allPhones.push({ phone: cleaned, row: row });
              }
            }
          }
        }
      }
      if (!rowHasPhone) invalidCount++;
    });

    const totalPhonesFound = allPhones.length + duplicatesCount;
    const uniqueNumbers = Array.from(validPhoneSet);

    const apiKey = process.env.BLA_API_KEY;

    try {
      // ── BLA API check ───────────────────────────────────────────────────
      const client = new BlacklistAlliance(apiKey, { timeout: 60000 });
      let suppressedSet = new Set();

      if (uniqueNumbers.length > 0) {
        const bulkResult = await client.bulkLookupSimple(uniqueNumbers, {
          responseFormat: "json",
          autoBatch: true,
        });
        const rawSuppressed =
          bulkResult?.supression ?? bulkResult?.suppression ?? [];
        suppressedSet = new Set(
          rawSuppressed.map((p) => String(p).replace(/\D/g, ""))
        );
      }

      // ── Build row arrays ────────────────────────────────────────────────
      let matchedRows = headers.length > 0 ? [headers] : [];
      let cleanRows   = headers.length > 0 ? [headers] : [];
      let fullReport  =
        headers.length > 0
          ? [[...headers, "DNC Status", "Extracted Phone"]]
          : [["DNC Status", "Extracted Phone"]];

      let matchedCount = 0;
      let cleanCount   = 0;

      allPhones.forEach((item) => {
        const isDnc =
          suppressedSet.has(item.phone) || suppressedSet.has(`1${item.phone}`);

        if (isDnc) {
          matchedRows.push(item.row);
          matchedCount++;
        } else {
          cleanRows.push(item.row);
          cleanCount++;
        }

        fullReport.push([
          ...item.row,
          isDnc ? "DNC Matched" : "Clean",
          item.phone,
        ]);
      });

      // ── Generate unique job ID & report folder ──────────────────────────
      const jobId    = crypto.randomUUID();
      const jobDir   = path.join(REPORTS_DIR, jobId);
      fs.mkdirSync(jobDir, { recursive: true });

      const cleanPath  = path.join(jobDir, "clean.csv");
      const matchedPath = path.join(jobDir, "matched.csv");
      const fullPath   = path.join(jobDir, "full-report.csv");

      try {
        writeCSV(cleanPath,   cleanRows);
        writeCSV(matchedPath, matchedRows);
        writeCSV(fullPath,    fullReport);
      } catch (csvErr) {
        console.error("[Report Gen] Failed to write CSV files:", csvErr.message);
        // Do not abort — fall through and return result without URLs
      }

      // ── Build download URLs ─────────────────────────────────────────────
      const base         = buildBaseUrl();
      const cleanFileUrl  = `${base}/api/reports/${jobId}/clean`;
      const matchedFileUrl = `${base}/api/reports/${jobId}/matched`;
      const reportFileUrl  = `${base}/api/reports/${jobId}/full`;

      // ── Result object ───────────────────────────────────────────────────
      const result = {
        totalRows:   totalPhonesFound,
        matched:     matchedCount,
        clean:       cleanCount,
        invalid:     invalidCount,
        duplicates:  duplicatesCount,
        matchedRows: matchedRows,
        cleanRows:   cleanRows,
        fullReport:  fullReport,
        jobId,
        cleanFileUrl,
        matchedFileUrl,
        reportFileUrl,
      };

      // ── CRM Sync (summary + URLs, no large arrays) ──────────────────────
      const stem = safeFileStem(file.originalname);
      const crmPayload = {
        campaign,
        fileName:         file.originalname,
        originalFileName: file.originalname,
        totalRows:        result.totalRows,
        matched:          result.matched,
        clean:            result.clean,
        invalid:          result.invalid,
        duplicates:       result.duplicates,
        status:           "completed",
        source:           "checkdncnumber.com",
        cleanFileUrl,
        matchedFileUrl,
        reportFileUrl,
        checkedAt: new Date().toISOString(),
      };

      const crmSync = await syncDncResultToCrm(crmPayload);
      const crmSynced = crmSync.success === true;
      const crmSyncMessage = crmSynced
        ? "Result synced with CRM successfully."
        : "DNC check completed, but CRM sync failed.";

      if (!crmSynced) {
        console.warn("[CRM Sync] Sync failed:", crmSync.message);
      }
      // ────────────────────────────────────────────────────────────────────

      // Delete temporary uploaded file (reports folder is kept)
      fs.unlinkSync(file.path);

      return res.json({ ...result, crmSynced, crmSyncMessage });
    } catch (apiError) {
      fs.unlinkSync(file.path);
      console.error(
        "BLA API Error:",
        apiError.response?.data || apiError.message
      );
      return res
        .status(500)
        .json({ error: "Failed to check numbers with BLA API" });
    }
  } catch (error) {
    console.error(error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /api/reports/:jobId/:type ─────────────────────────────────────────────
// type: clean | matched | full

const FILE_MAP = {
  clean:   { file: "clean.csv",       suffix: "clean" },
  matched: { file: "matched.csv",     suffix: "dnc-matched" },
  full:    { file: "full-report.csv", suffix: "full-report" },
};

app.get("/api/reports/:jobId/:type", (req, res) => {
  const { jobId, type } = req.params;

  // Validate jobId — must be a UUID v4 (no path traversal possible)
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(jobId)) {
    return res.status(400).json({ error: "Invalid job ID." });
  }

  const entry = FILE_MAP[type];
  if (!entry) {
    return res.status(400).json({ error: "Invalid report type. Use: clean, matched, full." });
  }

  const filePath = path.join(REPORTS_DIR, jobId, entry.file);

  // Confirm resolved path is still inside REPORTS_DIR (extra safety)
  if (!filePath.startsWith(REPORTS_DIR)) {
    return res.status(400).json({ error: "Invalid path." });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Report file not found." });
  }

  // Use jobId prefix as the download filename
  const downloadName = `${jobId.slice(0, 8)}-${entry.suffix}.csv`;
  return res.download(filePath, downloadName);
});

// ── POST /api/search ──────────────────────────────────────────────────────────

app.post("/api/search", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required." });
    }

    const cleaned = cleanNumber(phone);
    if (!cleaned) {
      return res.json({ status: "Invalid", phone });
    }

    const apiKey = process.env.BLA_API_KEY;

    try {
      const client = new BlacklistAlliance(apiKey, { timeout: 10000 });
      const singleResult = await client.lookupSingle(cleaned);
      
      const isDnc = singleResult.results === 1;
      const isWireless = singleResult.wireless === 1;
      
      const statusStr = isDnc ? "DNC" : "Clean";
      const lineType = isWireless ? "Wireless" : "Landline";

      const clientIp = req.body.clientIp;
      const ipAddress = clientIp || req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || req.ip || "";

      // ── CRM Sync (Single Phone) ──────────────────────────────────────────
      const crmPayload = {
        phoneNumber: cleaned,
        dncStatus: statusStr,
        source: "checkdncnumber.com",
        checkedAt: new Date().toISOString(),
        lineType: lineType,
        ipAddress: ipAddress
      };

      const crmSync = await syncDncResultToCrm(crmPayload, true);
      const crmSynced = crmSync.success === true;
      const crmSyncMessage = crmSynced
        ? "Result synced with CRM successfully."
        : "DNC check completed, but CRM sync failed.";

      if (!crmSynced) {
        console.warn("[CRM Sync] Sync failed:", crmSync.message);
      }

      return res.json({ status: statusStr, phone: cleaned, lineType, crmSynced, crmSyncMessage });
    } catch (apiError) {
      console.error(
        "BLA API Error:",
        apiError.response?.data || apiError.message
      );
      return res
        .status(500)
        .json({ error: "Failed to search number with BLA API" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Static frontend ───────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
