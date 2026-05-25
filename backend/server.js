/**
 * ParkXpert Backend Server
 * Express + JSON file storage (drop-in, no native modules needed)
 * Port: 5000
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, '../public')));

// ── Data Files ──
const DATA_DIR = path.join(__dirname, 'data');
const VEHICLES_FILE = path.join(DATA_DIR, 'vehicles.json');
const SLOTS_FILE = path.join(DATA_DIR, 'slots.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Helpers ──
function readJSON(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Initialize slots if not exist (30 total: 10 per gate)
function initSlots() {
  if (!fs.existsSync(SLOTS_FILE)) {
    const slots = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      gate: `Gate ${Math.floor(i / 10) + 1}`,
      occupied: false,
      vehicleNumber: null
    }));
    writeJSON(SLOTS_FILE, slots);
  }
}

initSlots();

// ── Routes ──

// GET all vehicles
app.get('/api/get-vehicles', (req, res) => {
  const data = readJSON(VEHICLES_FILE, []);
  res.json(data);
});

// GET slot map
app.get('/api/slots', (req, res) => {
  const slots = readJSON(SLOTS_FILE, []);
  res.json(slots);
});

// GET stats
app.get('/api/stats', (req, res) => {
  const slots = readJSON(SLOTS_FILE, []);
  const vehicles = readJSON(VEHICLES_FILE, []);
  const vacant = slots.filter(s => !s.occupied).length;
  const occupied = slots.filter(s => s.occupied).length;
  res.json({
    total: slots.length,
    vacant,
    occupied,
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => !v.exitTime).length
  });
});

// POST add vehicle (book slot)
app.post('/api/add-vehicle', (req, res) => {
  const { vehicleNumber, gate, slotId, date, entryTime, exitTime } = req.body;

  if (!vehicleNumber || !entryTime) {
    return res.status(400).json({ success: false, message: 'vehicleNumber and entryTime are required.' });
  }

  // Load data
  const vehicles = readJSON(VEHICLES_FILE, []);
  const slots = readJSON(SLOTS_FILE, []);

  // Find an available slot (auto-assign if slotId not given, or use provided)
  let targetSlotId = slotId ? Number(slotId) : null;
  let targetSlot = null;

  if (targetSlotId) {
    targetSlot = slots.find(s => s.id === targetSlotId);
    if (targetSlot && targetSlot.occupied) {
      return res.status(409).json({ success: false, message: `Slot ${targetSlotId} is already occupied.` });
    }
  } else {
    // Auto-assign first available slot in requested gate
    const gateSlots = gate ? slots.filter(s => s.gate === gate && !s.occupied) : slots.filter(s => !s.occupied);
    targetSlot = gateSlots[0];
    if (!targetSlot) {
      return res.status(409).json({ success: false, message: 'No slots available.' });
    }
    targetSlotId = targetSlot.id;
  }

  // Create record
  const newRecord = {
    id: vehicles.length > 0 ? Math.max(...vehicles.map(v => v.id)) + 1 : 1,
    vehicleNumber: vehicleNumber.toUpperCase(),
    gate: gate || (targetSlot ? targetSlot.gate : 'Gate 1'),
    slotId: targetSlotId,
    date: date || new Date().toLocaleDateString('en-IN'),
    entryTime,
    exitTime: exitTime || ''
  };

  vehicles.push(newRecord);
  writeJSON(VEHICLES_FILE, vehicles);

  // Mark slot occupied
  const slotIndex = slots.findIndex(s => s.id === targetSlotId);
  if (slotIndex !== -1) {
    slots[slotIndex].occupied = true;
    slots[slotIndex].vehicleNumber = vehicleNumber.toUpperCase();
    writeJSON(SLOTS_FILE, slots);
  }

  res.json({ success: true, message: 'Vehicle booked successfully!', data: newRecord });
});

// POST exit vehicle
app.post('/api/exit-vehicle', (req, res) => {
  const { vehicleNumber, exitTime } = req.body;

  if (!vehicleNumber) {
    return res.status(400).json({ success: false, message: 'vehicleNumber is required.' });
  }

  const vehicles = readJSON(VEHICLES_FILE, []);
  const slots = readJSON(SLOTS_FILE, []);

  // Find latest active record for this vehicle
  const idx = vehicles.slice().reverse().findIndex(
    v => v.vehicleNumber === vehicleNumber.toUpperCase() && !v.exitTime
  );

  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'No active record found for this vehicle.' });
  }

  // idx is reversed, get actual index
  const actualIdx = vehicles.length - 1 - idx;
  vehicles[actualIdx].exitTime = exitTime || new Date().toTimeString().slice(0,5);

  // Free the slot
  const slotId = vehicles[actualIdx].slotId;
  const slotIndex = slots.findIndex(s => s.id === slotId);
  if (slotIndex !== -1) {
    slots[slotIndex].occupied = false;
    slots[slotIndex].vehicleNumber = null;
    writeJSON(SLOTS_FILE, slots);
  }

  writeJSON(VEHICLES_FILE, vehicles);
  res.json({ success: true, message: 'Exit processed.', data: vehicles[actualIdx] });
});

// DELETE vehicle record
app.delete('/api/delete-vehicle/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let vehicles = readJSON(VEHICLES_FILE, []);
  const slots = readJSON(SLOTS_FILE, []);

  const target = vehicles.find(v => v.id === id);
  if (!target) {
    return res.status(404).json({ success: false, message: 'Record not found.' });
  }

  // Free slot if still occupied
  if (!target.exitTime && target.slotId) {
    const slotIndex = slots.findIndex(s => s.id === target.slotId);
    if (slotIndex !== -1) {
      slots[slotIndex].occupied = false;
      slots[slotIndex].vehicleNumber = null;
      writeJSON(SLOTS_FILE, slots);
    }
  }

  vehicles = vehicles.filter(v => v.id !== id);
  writeJSON(VEHICLES_FILE, vehicles);
  res.json({ success: true, message: 'Record deleted.' });
});

// Reset all slots (admin utility)
app.post('/api/reset-slots', (req, res) => {
  const slots = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    gate: `Gate ${Math.floor(i / 10) + 1}`,
    occupied: false,
    vehicleNumber: null
  }));
  writeJSON(SLOTS_FILE, slots);
  writeJSON(VEHICLES_FILE, []);
  res.json({ success: true, message: 'All slots and records reset.' });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n🚗 ParkXpert Server running at http://localhost:${PORT}`);
  console.log(`📂 Serving frontend from: ${path.join(__dirname, '../public')}`);
  console.log(`💾 Data stored in: ${DATA_DIR}\n`);
});
