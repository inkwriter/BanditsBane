// === 1. Game Data and Initial Setup ===
console.log("Game script loaded.");

const gameState = {
  playerName: "Xander",
  xp:0,
  hp:15,
  level:1,
  stats: {
    attack:3,
    defense: 1,
    speed: 2,
  },
  gold: 100,
  inventory: {
    potions: 0,
    poison: 0,
  },
};

console.log("Game state initialized:", gameState);

function updateUI() {
  const playerNameElement = document.getElementById('playerName');
  if (playerNameElement) {
      playerNameElement.textContent = gameState.playerName || "Player";
  }
  document.getElementById('xp').textContent = `${gameState.xp}/100`;
  document.getElementById('hp').textContent = gameState.hp;
  document.getElementById('level').textContent = gameState.level;
  document.getElementById('gold').textContent = gameState.gold;

  document.getElementById('healthPotions').textContent = gameState.inventory.potions;
  document.getElementById('poison').textContent = textContent = gameState.inventory.poison;

  document.getElementById('att').textContent = gameState.stats.attack;
  document.getElementById('def').textContent = gameState.stats.defense;
  document.getElementById('spd').textContent = gameState.stats.speed;
}

// === 2. Utility Functions ===
function savePlayerData() {
  console.log("Saving player data...");
  localStorage.setItem("gameState", JSON.stringify(gameState));
}

function loadPlayerData() {
  console.log("Loading player data...");
  const savedData = JSON.parse(localStorage.getItem("gameState"));
  if (savedData) {
    Object.assign(gameState, savedData);
    console.log("Game state loaded:", gameState);
  } else {
    console.log("No saved game data found. Starting fresh.");
  }
}

function addToInventory(itemName) {
  console.log(`Adding ${itemName} to inventory...`);
  if (itemName === "Potion") {
    gameState.inventory.potions += 1;
  } else if (itemName === "Poison") {// Import dependencies
    
    // DOM Elements
    const dialogueBox = document.getElementById("shopDialogueBox");
    const dialogueText = document.getElementById("shopDialogueText");
    const playerNameElem = document.getElementById("playerName");
    const goldElem = document.getElementById("gold");
    const healthPotionsElem = document.getElementById("healthPotions");
    
    // Helper Functions
    function savePlayerData() {
      console.log("Saving player data...");
      localStorage.setItem("gameState", JSON.stringify(gameState));
    }
  
    
    function updateShopUI() {
      playerNameElem.textContent = gameState.playerName || "Player";
      goldElem.textContent = gameState.gold;
      healthPotionsElem.textContent = gameState.inventory.potions;
    }
    
    // Dialogue Functions
    function updateDialogue() {
      const dialogues = [
        "Shop Keeper: 'Thank you so much for your purchase!'",
        "Shop Keeper: 'I've had my eye on that too!'",
        "Shop Keeper: 'Have a great day!'",
        "Shop Keeper: 'We should be getting some new items soon!'",
      ];
      dialogueText.textContent = dialogues[Math.floor(Math.random() * dialogues.length)];
    }
    
    function showDialogue() {
      if (dialogueBox) {
        dialogueBox.classList.remove("hidden");
        updateDialogue();
      } else {
        console.error("Dialogue box not found in the DOM");
      }
    }
    
    function hideDialogue() {
      if (dialogueBox) {
        dialogueBox.classList.add("hidden");
      } else {
        console.error("Dialogue box not found in the DOM");
      }
    }
    
    // Shop Logic
    function handleBuyItem(item) {
      if (gameState.gold >= item.price) {
        console.log(`Buying ${item.name}...`);
        gameState.gold -= item.price;
        gameState.inventory.potions += 1; // Add to inventory for potions
        savePlayerData(); // Save updated game state
        updateShopUI(); // Update UI
        showDialogue(); // Show dialogue
        setTimeout(hideDialogue, 3000); // Hide dialogue after 3 seconds
      } else {
        alert("Not enough gold!");
      }
    }
    
    // Initialize the shop
    document.addEventListener("DOMContentLoaded", () => {
      loadPlayerData(); // Load saved game state
      updateShopUI(); // Update UI with saved data
      showDialogue(); // Show opening dialogue
      updateGameUI();
      setTimeout(hideDialogue, 3000); // Hide after 3 seconds
      // Buy potion button listener
      document.getElementById("buyPotionsBtn").addEventListener("click", () => {
        const Potion = { name: "Potion", price: 10 };
      handleBuyItem(Potion);
});
    });
    
    // Event Listeners
    document.getElementById("buyPotionsBtn").addEventListener("click", () => handleBuyItem(Potion));
    
    gameState.inventory.poison += 1;
  }
  console.log(`Inventory updated:`, gameState.inventory);
}

// === 3. Dialogue System ===
// Select DOM elements
const dialogueBox = document.getElementById("shopDialogueBox");
const dialogueText = document.getElementById("shopDialogueText");

// Dialogue options
const dialogues = [
  "Shop Keeper: 'Thank you so much for your purchase!'",
  "Shop Keeper: 'I've had my eye on that too!'",
  "Shop Keeper: 'Have a great day!'",
  "Shop Keeper: 'We should be getting some new items soon!'",
];

// Function to update dialogue with random messages
function updateDialogue() {
  dialogueText.textContent = dialogues[Math.floor(Math.random() * dialogues.length)];
}

// Show the dialogue box
function showDialogue() {
  if (dialogueBox) {
    dialogueBox.classList.remove("hidden");
    updateDialogue(); // Update with a random message
  } else {
    console.error("Dialogue box not found in the DOM");
  }
}

// Hide the dialogue box
function hideDialogue() {
  if (dialogueBox) {
    dialogueBox.classList.add("hidden");
  } else {
    console.error("Dialogue box not found in the DOM");
  }
}

// === 4. Shop Functions ===
function handleBuyItem(item) {
  if (gameState.gold >= item.price) {
    console.log(`Buying ${item.name}...`);
    gameState.gold -= item.price;
    addToInventory(item.name);
    savePlayerData();
    updateShopUI();
    console.log(`${item.name} purchased successfully!`);
    showDialogue(); // Show dialogue after purchase
    setTimeout(hideDialogue, 3000); // Hide dialogue after 3 seconds
  } else {
    alert("Not enough gold!");
  }
}

function updateShopUI() {
  console.log("Updating shop UI...");
  document.getElementById("playerName").textContent = gameState.playerName || "Player";
  document.getElementById("gold").textContent = gameState.gold;
  document.getElementById("healthPotions").textContent = gameState.inventory.potions;
  document.getElementById("poison").textContent = gameState.inventory.poison;
  console.log("Shop UI updated.");
}

// === 5. Event Listeners ===

// === 6. Game Initialization ===
loadPlayerData();
updateShopUI();

// Show dialogue when the shop page is first loaded
showDialogue();
setTimeout(hideDialogue, 3000); // Hide dialogue after 3 seconds
console.log("Game initialized.");