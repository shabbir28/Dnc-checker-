const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const xlsx = require('xlsx');
const axios = require('axios');
const { BlacklistAlliance } = require('blacklist-alliance-client');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Normalize and validate phone numbers
const cleanNumber = (num) => {
    if (!num) return null;
    const cleaned = String(num).replace(/[^0-9]/g, '');
    // Assuming standard 10 digit US numbers
    if (cleaned.length === 10) return cleaned;
    if (cleaned.length === 11 && cleaned.startsWith('1')) return cleaned.slice(1);
    return null; // Invalid
};

app.post('/api/check', upload.single('file'), async (req, res) => {
    try {
        const { campaign } = req.body;
        const file = req.file;

        if (!campaign || !file) {
            if (file) fs.unlinkSync(file.path);
            return res.status(400).json({ error: 'Campaign and file are required.' });
        }

        // Parse file (CSV/XLSX/TXT)
        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        let extractedNumbers = [];
        data.forEach(row => {
            row.forEach(cell => {
                if (cell !== null && cell !== undefined) {
                    const str = String(cell);
                    // Basic heuristic to identify numbers
                    if (str.replace(/[^0-9]/g, '').length >= 10) {
                        extractedNumbers.push(str);
                    }
                }
            });
        });

        const totalRows = extractedNumbers.length;
        const normalizedNumbers = extractedNumbers.map(cleanNumber);
        
        let validNumbers = [];
        let invalidCount = 0;
        
        normalizedNumbers.forEach(n => {
            if (n) validNumbers.push(n);
            else invalidCount++;
        });

        const uniqueNumbers = [...new Set(validNumbers)];
        const duplicatesCount = validNumbers.length - uniqueNumbers.length;

        const apiKey = process.env.BLA_API_KEY;

        try {
            const client = new BlacklistAlliance(apiKey, { timeout: 60000 });
            const bulkResult = await client.bulkLookupSimple(uniqueNumbers, {
                responseFormat: "json",
                autoBatch: true
            });

            const rawSuppressed = bulkResult?.supression ?? bulkResult?.suppression ?? [];
            const suppressedSet = new Set(rawSuppressed.map(p => String(p).replace(/\D/g, '')));
            
            let matchedNumbers = [];
            let cleanNumbers = [];
            
            uniqueNumbers.forEach(phone => {
                if (suppressedSet.has(phone) || suppressedSet.has(`1${phone}`)) {
                    matchedNumbers.push(phone);
                } else {
                    cleanNumbers.push(phone);
                }
            });

            const result = {
                totalRows: totalRows,
                matched: matchedNumbers.length,
                clean: cleanNumbers.length,
                invalid: invalidCount,
                duplicates: duplicatesCount,
                matchedNumbers: matchedNumbers,
                cleanNumbers: cleanNumbers
            };

            fs.unlinkSync(file.path);
            return res.json(result);
        } catch (apiError) {
            fs.unlinkSync(file.path);
            console.error("BLA API Error:", apiError.response?.data || apiError.message);
            return res.status(500).json({ error: 'Failed to check numbers with BLA API' });
        }
    } catch (error) {
        console.error(error);
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/search', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required.' });
        }
        
        const cleaned = cleanNumber(phone);
        if (!cleaned) {
             return res.json({ status: 'Invalid', phone });
        }

        const apiKey = process.env.BLA_API_KEY;
        
        try {
            const client = new BlacklistAlliance(apiKey, { timeout: 10000 });
            const bulkResult = await client.bulkLookupSimple([cleaned], { responseFormat: "json" });
            const rawSuppressed = bulkResult?.supression ?? bulkResult?.suppression ?? [];
            const suppressedSet = new Set(rawSuppressed.map(p => String(p).replace(/\D/g, '')));
            
            const isDnc = suppressedSet.has(cleaned) || suppressedSet.has(`1${cleaned}`);
            return res.json({ status: isDnc ? 'DNC' : 'Clean', phone: cleaned });

        } catch (apiError) {
            console.error("BLA API Error:", apiError.response?.data || apiError.message);
            return res.status(500).json({ error: 'Failed to search number with BLA API' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
