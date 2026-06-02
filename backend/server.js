/**
 * ParkXpert Backend Server v3
 * Express + JSON file storage · Port 5000
 */
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const DATA = path.join(__dirname, 'data');
const F    = { v: path.join(DATA,'vehicles.json'), s: path.join(DATA,'slots.json'), u: path.join(DATA,'users.json') };

if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });

const rj = (f, d=[]) => { try { if (!fs.existsSync(f)) return d; return JSON.parse(fs.readFileSync(f,'utf8')); } catch { return d; } };
const wj = (f, d)    => fs.writeFileSync(f, JSON.stringify(d, null, 2));

function initSlots() {
  if (!fs.existsSync(F.s)) wj(F.s, Array.from({length:30},(_,i)=>({id:i+1,gate:`Gate ${Math.floor(i/10)+1}`,occupied:false,vehicleNumber:null})));
}
function initUsers() {
  if (!fs.existsSync(F.u)) wj(F.u,[
    {id:1,name:'Default User',email:'user@parkxpert.com',password:'1234',role:'user'},
    {id:2,name:'Admin',email:'admin@parkxpert.com',password:'9876',role:'admin'}
  ]);
}
initSlots(); initUsers();

// ── Auth ──
app.post('/api/register', (req, res) => {
  const {name,email,password,role} = req.body;
  if (!name||!email||!password||!role) return res.status(400).json({success:false,message:'All fields required.'});
  const users = rj(F.u,[]);
  if (users.find(u=>u.email.toLowerCase()===email.toLowerCase())) return res.status(409).json({success:false,message:'Email already registered.'});
  const user = {id:users.length?Math.max(...users.map(u=>u.id))+1:1,name,email:email.toLowerCase(),password,role};
  users.push(user); wj(F.u,users);
  res.json({success:true,user:{id:user.id,name:user.name,role:user.role}});
});

app.post('/api/login', (req, res) => {
  const {email,password} = req.body;
  const users = rj(F.u,[]);
  const user  = users.find(u=>u.email.toLowerCase()===email.toLowerCase()&&u.password===password);
  if (!user) return res.status(401).json({success:false,message:'Invalid email or password.'});
  res.json({success:true,user:{id:user.id,name:user.name,role:user.role}});
});

// ── Data ──
app.get('/api/slots',        (req,res)=>res.json(rj(F.s,[])));
app.get('/api/get-vehicles', (req,res)=>res.json(rj(F.v,[])));
app.get('/api/users',        (req,res)=>res.json(rj(F.u,[]).map(u=>({id:u.id,name:u.name,email:u.email,role:u.role}))));

app.get('/api/stats', (req, res) => {
  const s=rj(F.s,[]), v=rj(F.v,[]);
  res.json({total:s.length,vacant:s.filter(x=>!x.occupied).length,occupied:s.filter(x=>x.occupied).length,
    totalVehicles:v.length,activeVehicles:v.filter(x=>!x.exitTime).length,exitedVehicles:v.filter(x=>!!x.exitTime).length});
});

app.post('/api/add-vehicle', (req, res) => {
  const {vehicleNumber,gate,slotId,date,entryTime} = req.body;
  if (!vehicleNumber||!entryTime) return res.status(400).json({success:false,message:'vehicleNumber and entryTime required.'});
  const vehicles=rj(F.v,[]), slots=rj(F.s,[]);
  const sid = slotId ? Number(slotId) : (slots.find(s=>s.gate===gate&&!s.occupied)||{}).id;
  if (!sid) return res.status(409).json({success:false,message:'No slots available.'});
  const slot=slots.find(s=>s.id===sid);
  if (slot?.occupied) return res.status(409).json({success:false,message:'Slot already occupied.'});
  const rec={id:vehicles.length?Math.max(...vehicles.map(v=>v.id))+1:1,vehicleNumber:vehicleNumber.toUpperCase(),gate,slotId:sid,date:date||new Date().toLocaleDateString('en-IN'),entryTime,exitTime:''};
  vehicles.push(rec); wj(F.v,vehicles);
  const si=slots.findIndex(s=>s.id===sid);
  if(si!==-1){slots[si].occupied=true;slots[si].vehicleNumber=vehicleNumber.toUpperCase();} wj(F.s,slots);
  res.json({success:true,data:rec});
});

app.post('/api/exit-vehicle', (req, res) => {
  const {vehicleNumber,exitTime}=req.body;
  if(!vehicleNumber) return res.status(400).json({success:false,message:'vehicleNumber required.'});
  const vehicles=rj(F.v,[]),slots=rj(F.s,[]);
  let idx=-1;
  for(let i=vehicles.length-1;i>=0;i--){if(vehicles[i].vehicleNumber===vehicleNumber.toUpperCase()&&!vehicles[i].exitTime){idx=i;break;}}
  if(idx===-1) return res.status(404).json({success:false,message:'No active record found.'});
  vehicles[idx].exitTime=exitTime||new Date().toTimeString().slice(0,5);
  const si=slots.findIndex(s=>s.id===vehicles[idx].slotId);
  if(si!==-1){slots[si].occupied=false;slots[si].vehicleNumber=null;} wj(F.s,slots); wj(F.v,vehicles);
  res.json({success:true,data:vehicles[idx]});
});

app.delete('/api/delete-vehicle/:id', (req, res) => {
  const id=parseInt(req.params.id);
  let vehicles=rj(F.v,[]);const slots=rj(F.s,[]);
  const t=vehicles.find(v=>v.id===id);
  if(!t) return res.status(404).json({success:false,message:'Not found.'});
  if(!t.exitTime&&t.slotId){const si=slots.findIndex(s=>s.id===t.slotId);if(si!==-1){slots[si].occupied=false;slots[si].vehicleNumber=null;}wj(F.s,slots);}
  wj(F.v,vehicles.filter(v=>v.id!==id));
  res.json({success:true});
});

app.post('/api/reset', (req, res) => {
  wj(F.s,Array.from({length:30},(_,i)=>({id:i+1,gate:`Gate ${Math.floor(i/10)+1}`,occupied:false,vehicleNumber:null})));
  wj(F.v,[]);
  res.json({success:true});
});

app.listen(PORT, () => console.log(`\n🚗  ParkXpert → http://localhost:${PORT}\n`));
