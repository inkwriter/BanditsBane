// === 1. Game Data and Initial Setup ===
console.log("Game script loaded.");

const gameState = {
  playerName: "Xander",
  xp: 0,
  hp: 20,
  level: 1,
  stats: {
    attack: 3,
    defense: 1,
    speed: 2,
  },
  ac: 12,
  gold: 100,
  inventory: {
    potions: 0,
    poison: 0,
  },
};

const bandit = {
  name: "Bandit",
  hp: 10,
  ac: 10,
  attack: 2,
  goldReward: 10,
  xpReward: 20,
};

console.log("Game state initialized:", gameState);

function updateUI() {
  const elements = {
    playerName: document.getElementById("playerName"),
    xp: document.getElementById("xp"),
    hp: document.getElementById("hp"),
    level: document.getElementById("level"),
    gold: document.getElementById("gold"),
    healthPotions: document.getElementById("healthPotions"),
    poison: document.getElementById("poison"),
    att: document.getElementById("att"),
    def: document.getElementById("def"),
    spd: document.getElementById("spd"),
    enemyHP: document.getElementById("enemyHP"),
  };

  if (elements.playerName) elements.playerName.textContent = gameState.playerName || "Player";
  if (elements.xp) elements.xp.textContent = `${gameState.xp}/100`;
  if (elements.hp) elements.hp.textContent = gameState.hp;
  if (elements.level) elements.level.textContent = gameState.level;
  if (elements.gold) elements.gold.textContent = gameState.gold;
  if (elements.healthPotions) elements.healthPotions.textContent = gameState.inventory.potions;
  if (elements.poison) elements.poison.textContent = gameState.inventory.poison;
  if (elements.att) elements.att.textContent = gameState.stats.attack;
  if (elements.def) elements.def.textContent = gameState.stats.defense;
  if (elements.spd) elements.spd.textContent = gameState.stats.speed;
  if (elements.enemyHP) elements.enemyHP.textContent = bandit.hp > 0 ? bandit.hp : "Defeated";
}

// === 2. Utility Functions ===
function rollDice(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function savePlayerData() {
  console.log("Saving player data...");
  localStorage.setItem("gameState", JSON.stringify(gameState));
}

const shopDialogueBox = document.getElementById("shopDialogueBox");
const shopDialogueText = document.getElementById("shopDialogueText");

function showShopDialogue() {
    if (shopDialogueBox) {
        shopDialogueBox.classList.remove("hidden");
        const shopDialogues = [
            "Shop Keeper: 'Thank you so much for your purchase!'",
            "Shop Keeper: 'I've had my eye on that too!'",
            "Shop Keeper: 'Have a great day!'",
            "Shop Keeper: 'We should be getting some new items soon!'",
        ];
        shopDialogueText.textContent = shopDialogues[Math.floor(Math.random() * shopDialogues.length)];
    } else {
        console.error("Shop dialogue box not found.");
    }
}

function hideShopDialogue() {
    if (shopDialogueBox) {
        shopDialogueBox.classList.add("hidden");
    } else {
        console.error("Shop dialogue box not found.");
    }
}

function handleBuyItem(item) {
  if (gameState.gold >= item.price) {
      console.log(`Buying ${item.name}...`);
      gameState.gold -= item.price;
      addToInventory(item.name);
      savePlayerData();
      updateShopUI();
      showShopDialogue(); // Show a confirmation message
      setTimeout(hideShopDialogue, 3000); // Hide after 3 seconds
  } else {
      alert("Not enough gold!");
  }
}


function loadPlayerData() {
  console.log("Loading player data...");
  const savedData = localStorage.getItem("gameState");

  try {
      if (savedData) {
          const parsedData = JSON.parse(savedData);
          Object.assign(gameState, parsedData);
          console.log("Game state after loading:", gameState);
      } else {
          console.log("No saved game data found. Starting fresh.");
      }
  } catch (error) {
      console.error("Error loading game data, resetting storage:", error);
      localStorage.removeItem("gameState"); // Fix corruption
  }
}


// === 3. Inventory Management ===
function addToInventory(itemName) {
  console.log(`Adding ${itemName} to inventory...`);
  if (itemName === "Potion") gameState.inventory.potions += 1;
  if (itemName === "Poison") gameState.inventory.poison += 1;
  console.log("Inventory updated:", gameState.inventory);
}

// === 4. Dialogue System ===
const universalDialogueBox = document.getElementById("universalDialogueBox");
const universalDialogueText = document.getElementById("universalDialogueText");

function updateDialogue(text) {
  if (universalDialogueText) {
    universalDialogueText.textContent = text;
  } else {
    console.error("Universal dialogue text element not found.");
  }
}

function showDialogue(type, text) {
  if (universalDialogueBox) {
    universalDialogueBox.classList.remove("hidden");
    updateDialogue(text);
  } else {
    console.error("Dialogue box not found.");
  }
}

function hideDialogue() {
  if (universalDialogueBox) {
    universalDialogueBox.classList.add("hidden");
  }
}

// === Auto-Battle System ===

let battleActive = false;

function startAutoBattle() {
    if (battleActive) return;
    battleActive = true;
    console.log("Battle started!");
    showDialogue("combat", "A bandit appears, ready to fight!");
    autoBattleLoop();
}

function autoBattleLoop() {
    if (gameState.hp <= 0) {
        gameOver();
        return;
    }
    if (bandit.hp <= 0) {
        endBattle();
        return;
    }
    
    setTimeout(() => {
        playerAttack();
        if (bandit.hp > 0) {
            setTimeout(() => {
                banditAttack();
                autoBattleLoop();
            }, 1000);
        } else {
            endBattle();
        }
    }, 1000);
}

function playerAttack() {
    let attackRoll = rollDice(20) + gameState.stats.attack;
    console.log(`Player rolls: ${attackRoll} (needs ${bandit.ac} to hit)`);

    if (attackRoll >= bandit.ac) {
        let damage = rollDice(6);
        bandit.hp -= damage;
        console.log(`Hit! Dealt ${damage} damage.`);
        showDialogue("combat", `You hit the bandit for ${damage} damage!`);
    } else {
        console.log("Miss!");
        showDialogue("combat", "You missed the attack!");
    }
    updateUI();
    savePlayerData();
}

function banditAttack() {
    let attackRoll = rollDice(20) + bandit.attack;
    console.log(`Bandit rolls: ${attackRoll} (needs ${gameState.ac} to hit)`);

    if (attackRoll >= gameState.ac) {
        let damage = rollDice(4);
        gameState.hp -= damage;
        console.log(`Bandit hits! You take ${damage} damage.`);
        showDialogue("combat", `The bandit strikes you for ${damage} damage!`);
    } else {
        console.log("Bandit missed!");
        showDialogue("combat", "The bandit's attack misses!");
    }
    updateUI();
    savePlayerData();
}

function endBattle() {
    battleActive = false;
    gameState.gold += bandit.goldReward;
    gameState.xp += bandit.xpReward;
    console.log("Battle won!");
    alert(`You defeated the Bandit! +${bandit.goldReward} Gold, +${bandit.xpReward} XP`);
    savePlayerData();
    updateUI();
}

function gameOver() {
    battleActive = false;
    alert("You have been defeated!");
    window.location.href = "gameover.html";
}

function savePlayerData() {
  console.log("Saving player data...", JSON.stringify(gameState)); // Ensure it's JSON
  localStorage.setItem("gameState", JSON.stringify(gameState));
}

function updateShopUI() {
  document.getElementById("playerName").textContent = gameState.playerName || "Player";
  document.getElementById("gold").textContent = gameState.gold;
  document.getElementById("healthPotions").textContent = gameState.inventory.potions;
  document.getElementById("poison").textContent = gameState.inventory.poison;
  console.log("Shop UI updated.");
}

document.getElementById("buyPotionsBtn")?.addEventListener("click", () => {
  handleBuyItem({ name: "Potion", price: 10 });
});


document.addEventListener("DOMContentLoaded", () => {
  loadPlayerData();  // <- Load data as soon as the game starts
  updateUI();
});

document.getElementById("attackBtn")?.addEventListener("click", startAutoBattle);
updateUI();