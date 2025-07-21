document.addEventListener("DOMContentLoaded", () => {
    generateParkingSlots(); // Generate slots when the page loads
});




// Function to generate parking slots dynamically
function generateParkingSlots() {
    const grid = document.getElementById("parkingSlotsGrid");
    grid.innerHTML = ""; // Clear previous slots

    for (let i = 1; i <= 10; i++) { // Example: 10 slots
        let slot = document.createElement("div");
        slot.classList.add("parking-slot");
        slot.id = `slot-${i}`;

        // Randomly mark some slots as occupied (red) or available (green)
        let isOccupied = Math.random() < 0.5; // 50% chance
        slot.classList.add(isOccupied ? "occupied" : "available");
        
        slot.textContent = `Slot ${i}`;
        grid.appendChild(slot);
    }
}

// Function to find the nearest available slot for a selected gate
function findNearestSlot(gate) {
    alert(`Checking availability for ${gate}...`);

    // Reset previous highlights
    document.querySelectorAll(".parking-slot").forEach(slot => {
        slot.style.border = "none";
    });

    let slots = document.querySelectorAll(".parking-slot.available");

    if (slots.length > 0) {
        // Highlight the first available slot
        slots[0].style.border = "5px solid blue";
        document.getElementById("nearestSlot").innerHTML = 
            `<p>Nearest Available Slot: ${slots[0].textContent}</p>`;
    } else {
        document.getElementById("nearestSlot").innerHTML = `<p>No slots available!</p>`;
    }
}

// Logout function (Example)
function logout() {
    alert("Logging out...");
    window.location.href = "login.html"; // Redirect to login page
}
