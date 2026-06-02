/**
 * ParkXpert — Shared State Manager v3.3
 * Single source of truth via localStorage + sessionStorage
 */
const PX = {
  TOTAL_SLOTS: 30,
  SLOTS_PER_GATE: 10,
  GATES: ['Gate 1', 'Gate 2', 'Gate 3'],

  /* ══ SLOTS ══ */
  getSlots() {
    try { const s=JSON.parse(localStorage.getItem('px_slots')||'[]'); if(s.length===30) return s; } catch {}
    return this._initSlots();
  },
  _initSlots() {
    const s=Array.from({length:30},(_,i)=>({id:i+1,gate:`Gate ${Math.floor(i/10)+1}`,occupied:false,vehicleNumber:null,bookedAt:null}));
    this.saveSlots(s); return s;
  },
  saveSlots(s){ localStorage.setItem('px_slots',JSON.stringify(s)); },

  bookSlot(slotId, vehicleNumber) {
    const slots=this.getSlots(), idx=slots.findIndex(s=>s.id===slotId);
    if(idx===-1||slots[idx].occupied) return false;
    slots[idx].occupied=true; slots[idx].vehicleNumber=vehicleNumber.toUpperCase(); slots[idx].bookedAt=new Date().toISOString();
    this.saveSlots(slots); return true;
  },
  freeSlot(slotId) {
    const slots=this.getSlots(), idx=slots.findIndex(s=>s.id===slotId);
    if(idx===-1) return;
    slots[idx].occupied=false; slots[idx].vehicleNumber=null; slots[idx].bookedAt=null;
    this.saveSlots(slots);
  },

  getStats() {
    const slots=this.getSlots(), vehicles=this.getVehicles();
    const gf=(g,occ)=>slots.filter(s=>s.gate===g&&(occ?s.occupied:!s.occupied)).length;
    return {
      total:30,
      vacant:slots.filter(s=>!s.occupied).length,
      occupied:slots.filter(s=>s.occupied).length,
      gate1Free:gf('Gate 1',false), gate2Free:gf('Gate 2',false), gate3Free:gf('Gate 3',false),
      gate1Occ:gf('Gate 1',true),   gate2Occ:gf('Gate 2',true),   gate3Occ:gf('Gate 3',true),
      totalVehicles:vehicles.length,
      activeVehicles:vehicles.filter(v=>!v.exitTime).length,
      exitedVehicles:vehicles.filter(v=>!!v.exitTime).length,
    };
  },

  getGateStats(gate) {
    const slots=this.getSlots().filter(s=>s.gate===gate);
    return { total:slots.length, vacant:slots.filter(s=>!s.occupied).length, occupied:slots.filter(s=>s.occupied).length };
  },

  /* ══ VEHICLES ══ */
  getVehicles(){ try{ return JSON.parse(localStorage.getItem('px_vehicles')||'[]'); }catch{ return []; } },
  saveVehicles(v){ localStorage.setItem('px_vehicles',JSON.stringify(v)); },

  addVehicle(vehicleNumber, gate, slotId, entryTime, userName, userPhone) {
    const vehicles=this.getVehicles();
    const record={
      id:vehicles.length?Math.max(...vehicles.map(v=>v.id))+1:1,
      vehicleNumber:vehicleNumber.toUpperCase(), gate, slotId,
      date:new Date().toLocaleDateString('en-IN'),
      entryTime, exitTime:'',
      userName:userName||'', userPhone:userPhone||''
    };
    vehicles.push(record); this.saveVehicles(vehicles); return record;
  },

  exitVehicle(vehicleNumber, exitTime) {
    const vehicles=this.getVehicles();
    let idx=-1;
    for(let i=vehicles.length-1;i>=0;i--){ if(vehicles[i].vehicleNumber===vehicleNumber.toUpperCase()&&!vehicles[i].exitTime){idx=i;break;} }
    if(idx===-1) return null;
    vehicles[idx].exitTime=exitTime; this.saveVehicles(vehicles);
    if(vehicles[idx].slotId) this.freeSlot(vehicles[idx].slotId);
    return vehicles[idx];
  },

  deleteVehicle(id) {
    const vehicles=this.getVehicles(), target=vehicles.find(v=>v.id===id);
    if(target&&!target.exitTime&&target.slotId) this.freeSlot(target.slotId);
    this.saveVehicles(vehicles.filter(v=>v.id!==id));
  },

  /* ══ AUTH ══ */
  getUsers() {
    try { const u=JSON.parse(localStorage.getItem('px_users')||'[]'); if(u.length) return u; } catch {}
    const defaults=[
      {id:1,name:'Default User',email:'user@parkxpert.com',phone:'9999999999',password:'1234',role:'user'},
      {id:2,name:'Admin',email:'admin@parkxpert.com',phone:'8888888888',password:'9876',role:'admin'}
    ];
    localStorage.setItem('px_users',JSON.stringify(defaults)); return defaults;
  },

  registerUser(name, email, phone, password, role) {
    const users=this.getUsers();
    if(users.find(u=>u.email.toLowerCase()===email.toLowerCase()))
      return {success:false,message:'Email already registered.'};
    if(users.find(u=>u.phone===phone))
      return {success:false,message:'Phone number already registered.'};
    const user={id:users.length?Math.max(...users.map(u=>u.id))+1:1,name,email:email.toLowerCase(),phone,password,role};
    users.push(user); localStorage.setItem('px_users',JSON.stringify(users));
    return {success:true,user};
  },

  /* Login with email OR phone number */
  loginUser(identifier, password, remember) {
    const users=this.getUsers();
    const id=identifier.trim().toLowerCase();
    // match by email or phone
    const user=users.find(u=>
      (u.email.toLowerCase()===id || u.phone===identifier.trim()) &&
      u.password===password
    );
    if(!user) return {success:false,message:'Invalid credentials. Please check your email/phone and password.'};
    const data=JSON.stringify(user);
    sessionStorage.setItem('px_current_user',data);
    if(remember) localStorage.setItem('px_remember_user',data);
    return {success:true,user};
  },

  getCurrentUser() {
    try {
      const s=sessionStorage.getItem('px_current_user');
      if(s) return JSON.parse(s);
      const r=localStorage.getItem('px_remember_user');
      if(r){ sessionStorage.setItem('px_current_user',r); return JSON.parse(r); }
    } catch {}
    return null;
  },

  logout() {
    sessionStorage.removeItem('px_current_user');
    localStorage.removeItem('px_remember_user');
  },

  requireAuth(role) {
    const user=this.getCurrentUser();
    if(!user){ window.location.href='index.html'; return null; }
    if(role&&user.role!==role){ window.location.href='index.html'; return null; }
    return user;
  }
};
