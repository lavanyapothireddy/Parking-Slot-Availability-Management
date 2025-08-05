
const express = require("express");
const cors = require("cors");
const                                        fs = require("fs");
const xlsx = require("xlsx");

const app = express();
app.use(cors());
app.use(express.json());

const filePath = "./vehicle_records.xlsx";

// Function to read Excel file
function readExcelData() {
    if (!fs.existsSync(filePath)) {
        return []; // Return empty array if file doesn't exist
    }

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet);
}

// Function to save data to Excel file
function saveExcelData(data) {
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Records");
    xlsx.writeFile(workbook, filePath);
}

// API to get vehicle data
app.get("/get-vehicles", (req, res) => {
    const data = readExcelData();
    res.json(data);
});

// API to add new vehicle record
app.post("/add-vehicle", (req, res) => {
    let data = readExcelData();
    
    const newRecord = {
        id: data.length + 1,
        vehicleNumber: req.body.vehicleNumber,
        date: req.body.date,
        entryTime: req.body.entryTime,
        exitTime: req.body.exitTime,
    };

    data.push(newRecord);
    saveExcelData(data);
    res.json({ message: "Vehicle record added successfully!", data });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

