const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const xlsx = require("xlsx");
const axios = require("axios");
const { BlacklistAlliance } = require("blacklist-alliance-client");
const fs = require("fs");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Normalize and validate phone numbers
const cleanNumber = (num) => {
  if (!num) return null;
  const cleaned = String(num).replace(/[^0-9]/g, "");
  // Assuming standard 10 digit US numbers
  if (cleaned.length === 10) return cleaned;
  if (cleaned.length === 11 && cleaned.startsWith("1")) return cleaned.slice(1);
  return null; // Invalid
};

app.post("/api/check", upload.single("file"), async (req, res) => {
  try {
    const { campaign } = req.body;
    const file = req.file;

    if (!campaign || !file) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Campaign and file are required." });
    }

    // Parse file (CSV/XLSX/TXT)
    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let allPhones = [];
    let invalidCount = 0;
    let validPhoneSet = new Set();
    let duplicatesCount = 0;

    // Extract headers if present. We will assume the first row is headers.
    const headers = data.length > 0 ? data[0] : [];
    const dataRows = data.length > 0 ? data.slice(1) : [];

    dataRows.forEach((row) => {
      let rowHasPhone = false;
      // Search for phone numbers in all columns
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

      if (!rowHasPhone) {
        invalidCount++;
      }
    });

    const totalPhonesFound = allPhones.length + duplicatesCount;
    const uniqueNumbers = Array.from(validPhoneSet);

    const apiKey = process.env.BLA_API_KEY;

    try {
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
          rawSuppressed.map((p) => String(p).replace(/\D/g, "")),
        );
      }

      let matchedRows = headers.length > 0 ? [headers] : [];
      let cleanRows = headers.length > 0 ? [headers] : [];
      let fullReport =
        headers.length > 0
          ? [[...headers, "DNC Status", "Extracted Phone"]]
          : [["DNC Status", "Extracted Phone"]];

      let matchedCount = 0;
      let cleanCount = 0;

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

      const result = {
        totalRows: totalPhonesFound, // Total valid numbers extracted
        matched: matchedCount,
        clean: cleanCount,
        invalid: invalidCount,
        duplicates: duplicatesCount,
        matchedRows: matchedRows,
        cleanRows: cleanRows,
        fullReport: fullReport,
      };

      fs.unlinkSync(file.path);
      return res.json(result);
    } catch (apiError) {
      fs.unlinkSync(file.path);
      console.error(
        "BLA API Error:",
        apiError.response?.data || apiError.message,
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
      const bulkResult = await client.bulkLookupSimple([cleaned], {
        responseFormat: "json",
      });
      const rawSuppressed =
        bulkResult?.supression ?? bulkResult?.suppression ?? [];
      const suppressedSet = new Set(
        rawSuppressed.map((p) => String(p).replace(/\D/g, "")),
      );

      const isDnc =
        suppressedSet.has(cleaned) || suppressedSet.has(`1${cleaned}`);
      return res.json({ status: isDnc ? "DNC" : "Clean", phone: cleaned });
    } catch (apiError) {
      console.error(
        "BLA API Error:",
        apiError.response?.data || apiError.message,
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
