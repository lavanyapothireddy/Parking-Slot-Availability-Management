document.addEventListener("DOMContentLoaded", () => {
    generateParkingSlots(); 
});

function generateParkingSlots() {
    const grid = document.getElementById("parkingSlotsGrid");
    grid.innerHTML = ""; 

    for (let i = 1; i <= 10; i++) {
        let slot = document.createElement("div");
        slot.classList.add("parking-slot");
        slot.id = `slot-${i}`;

        let isOccupied = Math.random() < 0.5; 
        slot.classList.add(isOccupied ? "occupied" : "available");
        
        slot.textContent = `Slot ${i}`;
        grid.appendChild(slot);
    }
}
function findNearestSlot(gate) {
    alert(`Checking availability for ${gate}...`);

    document.querySelectorAll(".parking-slot").forEach(slot => {
        slot.style.border = "none";
    });

    let slots = document.querySelectorAll(".parking-slot.available");

    if (slots.length > 0) {
        slots[0].style.border = "5px solid blue";
        document.getElementById("nearestSlot").innerHTML = 
            `<p>Nearest Available Slot: ${slots[0].textContent}</p>`;
    } else {
        document.getElementById("nearestSlot").innerHTML = `<p>No slots available!</p>`;
    }
}
function logout() {
    alert("Logging out...");
    window.location.href = "login.html"; 
}
