# ParkXpert v2.0 — Smart Parking Slot Management

> Park Smarter, Not Harder

## Project Structure

```
parkxpert/
├── public/                  # Frontend (all HTML pages)
│   ├── index.html           # Landing + Login page
│   ├── dashboard.html       # User dashboard (gate selection)
│   ├── slot.html            # Slot booking page
│   ├── exit.html            # Exit parking page
│   └── admindashboard.html  # Admin panel
│
└── backend/                 # Node.js backend
    ├── server.js            # Express API server
    ├── package.json
    └── data/                # Auto-created JSON data files
        ├── vehicles.json    # Vehicle records
        └── slots.json       # Slot map (30 slots, 3 gates)
```

## Quick Start

### 1. Install & Run Backend
```bash
cd backend
npm install
node server.js
```

Server starts at **http://localhost:5000**  
Frontend is served automatically at **http://localhost:5000**

### 2. Login Credentials
| Role  | Username | Password |
|-------|----------|----------|
| User  | user     | 1234     |
| Admin | admin    | 9876     |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/get-vehicles` | List all vehicle records |
| GET | `/api/slots` | Get all 30 slot statuses |
| GET | `/api/stats` | Summary stats (vacant, occupied) |
| POST | `/api/add-vehicle` | Book a slot |
| POST | `/api/exit-vehicle` | Process vehicle exit |
| DELETE | `/api/delete-vehicle/:id` | Delete a record |
| POST | `/api/reset-slots` | Reset all data (admin) |

### POST /api/add-vehicle — Body
```json
{
  "vehicleNumber": "AP 09 AB 1234",
  "gate": "Gate 1",
  "slotId": 3,
  "date": "25/05/2026",
  "entryTime": "10:30",
  "exitTime": ""
}
```

### POST /api/exit-vehicle — Body
```json
{
  "vehicleNumber": "AP 09 AB 1234",
  "exitTime": "13:45"
}
```

---

## Features

### Frontend
- Luxury black & gold design with Bebas Neue typography
- Live slot map with color-coded availability
- Interactive slot picker on booking page
- Exit receipt generation
- Real-time clock in dashboard
- Admin record management with search & delete
- Auto-refresh every 10–15 seconds

### Backend
- REST API with Express.js
- JSON file storage (no database setup needed)
- 30 slots across 3 gates (10 each)
- Auto slot assignment or manual slot selection
- Slot freed automatically on exit or delete

## Future Enhancements
- JWT authentication (replace hardcoded credentials)
- MySQL / MongoDB integration
- IoT sensor integration for auto slot detection
- Email/SMS notifications on booking
- QR code generation for parking tickets
- Payment integration
