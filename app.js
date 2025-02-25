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

const enemies = {
  bandit: {
    name: "Bandit",
    hp: 10,
    ac: 10,
    attack: 2,
    goldReward: 10,
    xpReward: 20,
    image: "/assets/img_folder/enemies/bandit.jpeg"
  },
  wolves: {
    name: "Wolves",
    hp: 15,
    ac: 12,
    attack: 3,
    goldReward: 15,
    xpReward: 25,
    image: "/assets/img_folder/enemies/wolves.jpg"
  },
  bountyHunter: {
    name: "Bounty Hunter",
    hp: 20,
    ac: 14,
    attack: 4,
    goldReward: 25,
    xpReward: 40,
    image: "/assets/img_folder/enemies/bountyHunter.jpg"
  },
};


console.log("Game state initialized:", gameState);

const campMessages = [
  "You rest by the campfire, feeling refreshed.",
  "You sit by the flames, ready for the next fight.",
  "The quiet of camp soothes your weary soul.",
  "The camp’s peace washes away the battle’s strain."
];

const forestMessages = [
  "The forest whispers as danger approaches...",
  "Shadows move among the trees—battle awaits!",
  "A rustle in the bushes signals a fight!",
  "The wild calls you to combat!",
  "You step into the unknown, blade ready."
];

const restOutcomes = {
  safe: [
    "The night passes peacefully. (+5 HP)",
    "You rest undisturbed, feeling better. (+5 HP)",
    "A calm rest restores a bit of strength. (+5 HP)"
  ],
  ambush: [
    "Rustling in the bushes—ambush!",
    "A shadow moves—enemies strike!",
    "Your rest is cut short by foes!"
  ]
};

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
  if (elements.enemyHP) {
    elements.enemyHP.textContent = currentEnemy && currentEnemy.hp > 0 ? currentEnemy.hp : "No enemy";
  }
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
let currentEnemy;

function startBattle(enemyType) {
  if (!enemies[enemyType]) {
    console.error("Invalid enemy type!");
    return;
  }
  currentEnemy = JSON.parse(JSON.stringify(enemies[enemyType]));
  console.log(`A wild ${currentEnemy.name} appears!`, currentEnemy);
  showAction(`A ${currentEnemy.name} appears, ready to fight!`);
  updateUI();

  // If on ambush.html, automatically start the battle after a short delay
  if (window.location.pathname.includes("ambush.html")) {
    setTimeout(startAutoBattle, 1000);
  }
}

function startAutoBattle() {
  if (battleActive || !currentEnemy) return; // Prevent starting if already active or no enemy
  battleActive = true;
  console.log("Battle started!");
  showAction(`A ${currentEnemy.name} appears, ready to fight!`);
  autoBattleLoop(); // Kick off the combat loop
}

// Update startBattle to set up the enemy without auto-starting (except for ambush.html)
function startBattle(enemyType) {
  if (!enemies[enemyType]) {
    console.error("Invalid enemy type!");
    return;
  }
  currentEnemy = JSON.parse(JSON.stringify(enemies[enemyType]));
  console.log(`A wild ${currentEnemy.name} appears!`, currentEnemy);
  showAction(`A ${currentEnemy.name} appears, ready to fight!`); // Changed to showAction for consistency
  updateUI();

  // Only auto-start on ambush.html
  if (window.location.pathname.includes("ambush.html")) {
    setTimeout(startAutoBattle, 1000);
  }
}

function autoBattleLoop() {
    if (!battleActive) return;

    if (gameState.hp <= 0) {
        gameOver();
        return;
    }
    if (currentEnemy && currentEnemy.hp <= 0) {
        endBattle(currentEnemy);
        return;
    }

    setTimeout(() => {
        if (typeof playerAttack === "function") {
            playerAttack();
            if (currentEnemy && currentEnemy.hp > 0) {
                setTimeout(() => {
                    if (typeof enemyAttack === "function") {
                        enemyAttack();
                        autoBattleLoop();
                    } else {
                        console.error("enemyAttack is not defined!");
                    }
                }, 1000);
            }
        } else {
            console.error("playerAttack is not defined!");
        }
    }, 1000);
}

function playerAttack() {
  let attackRoll = rollDice(20) + gameState.stats.attack;
  console.log(`Player rolls: ${attackRoll} (needs ${currentEnemy.ac} to hit)`);

  if (attackRoll >= currentEnemy.ac) {
    let damage = rollDice(6);
    currentEnemy.hp -= damage;
    showAction(`You hit the ${currentEnemy.name} for ${damage} damage!`);
    console.log(`Hit! Dealt ${damage} damage. ${currentEnemy.name} now has ${currentEnemy.hp} HP left.`);

    if (currentEnemy.hp <= 0) {
      console.log(`Enemy ${currentEnemy.name} defeated!`);
      endBattle(currentEnemy);
      return;
    }
  } else {
    showAction("You missed the attack!");
    console.log("Miss!");
  }

  updateUI();
  savePlayerData();
}

function enemyAttack() {
  if (!battleActive) return;

  let attackRoll = rollDice(20) + currentEnemy.attack;
  console.log(`${currentEnemy.name} rolls: ${attackRoll} (needs ${gameState.ac} to hit)`);

  if (attackRoll >= gameState.ac) {
    let damage = rollDice(4);
    gameState.hp -= damage;
    console.log(`${currentEnemy.name} hits! You take ${damage} damage. You now have ${gameState.hp} HP left.`);
    showAction(`The ${currentEnemy.name} strikes you for ${damage} damage!`);

    if (gameState.hp <= 0) {
      console.log("Player defeated!");
      showAction("You have been defeated!");
      gameOver();
      return;
    }
  } else {
    console.log(`${currentEnemy.name} missed!`);
    showAction(`The ${currentEnemy.name}'s attack misses!`);
  }

  updateUI();
  savePlayerData();
}

function endBattle(enemy) {
  battleActive = false;
  gameState.gold += enemy.goldReward;
  gameState.xp += enemy.xpReward;
  console.log(`Battle won! +${enemy.goldReward} Gold, +${enemy.xpReward} XP`);
  showAction(`You defeated the ${enemy.name}! +${enemy.goldReward} Gold, +${enemy.xpReward} XP`);
  
  levelUp();
  savePlayerData();
  updateUI();

  document.getElementById("combat-container").classList.add("hidden");
  document.querySelector(".buttons").classList.add("hidden"); // Fix: Use class selector
  document.getElementById("forestBtn").classList.remove("hidden");
  document.getElementById("campBtn").classList.remove("hidden");
  // actionBox stays visible with victory message
}

function gameOver() {
  battleActive = false;
  showAction("You have been defeated!");
  setTimeout(() => {
    window.location.href = "gameover.html";
  }, 2000); // Delay to show defeat message
}

function showAction(text) {
  const actionBox = document.getElementById("actionBox");
  const actionText = document.getElementById("actionText");
  if (actionBox && actionText) {
    actionText.textContent = text;
    actionBox.classList.remove("hidden");
  } else {
    console.error("Action box not found!");
  }
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

function useItem() {
  console.log("Use Item function triggered...");
  if (gameState.inventory.potions > 0) {
      gameState.hp = Math.min(100, gameState.hp + 10); // Heal player
      gameState.inventory.potions--; // Deduct potion
      alert("You used a health potion and restored 10 HP!");
      updateCombatUI(); // Refresh UI
      savePlayerData(); // Save updated game state
  } else {
      alert("You have no health potions left!");
      console.log("No health potions available to use.");
  }
}

function startBattle(enemyType) {
  if (!enemies[enemyType]) {
      console.error("Invalid enemy type!");
      return;
  }
  currentEnemy = JSON.parse(JSON.stringify(enemies[enemyType])); // Deep clone
  console.log(`A wild ${currentEnemy.name} appears!`, currentEnemy);
  showDialogue("combat", `A ${currentEnemy.name} appears, ready to fight!`);
  updateUI();
  // Remove autoBattleLoop() from here; let the attack button trigger it
}

function levelUp() {
  if (gameState.xp >= 100) {
    gameState.level++;
    console.log("Adding level")
    gameState.xp -= 100;
    console.log("Removing xp")
    gameState.hp += 5;
    alert("You leveled up!");

    gameState.stats.attack += 1;
    gameState.stats.defense += 1;
    gameState.stats.speed += 1;
    console.log("Updated stats after leveling up:", gameState.stats);

    savePlayerData();
    updateUI();
  } else {
    savePlayerData();
  }
}

document.getElementById("buyPotionsBtn")?.addEventListener("click", () => {
  handleBuyItem({ name: "Potion", price: 10 });
});

document.getElementById("useItemBtn")?.addEventListener("click", useItem);

document.addEventListener("DOMContentLoaded", () => {
  loadPlayerData();  // <- Load data as soon as the game starts
  updateUI();
});

document.getElementById("forestBtn")?.addEventListener("click", function () {
  if (window.location.pathname.includes("camp.html")) {
    showAction("You head back into the wild forest...");
    savePlayerData();
    setTimeout(() => {
      window.location.href = "exploration.html";
    }, 1000);
    return;
  }

  const roll = rollDice(20);
  const enemyImage = document.getElementById("banditEnemy");
  const combatContainer = document.getElementById("combat-container");
  const actionBox = document.getElementById("actionBox");
  const actionText = document.getElementById("actionText");
  const buttons = document.querySelector(".buttons");
  const forestBtn = document.getElementById("forestBtn");
  const enemyHPDisplay = document.getElementById("enemyHP");

  let enemyType;

  if (roll >= 1 && roll <= 12) {
    enemyType = "bandit";
  } else if (roll >= 13 && roll <= 16) {
    enemyType = "wolves";
  } else if (roll >= 17 && roll <= 20) {
    enemyType = "bountyHunter";
  } else {
    console.error("Invalid roll value:", roll);
    return;
  }

  let enemy = enemies[enemyType];

  if (!enemy) {
    console.error("Enemy not found!");
    return;
  }

  enemyImage.src = enemy.image;
  actionText.textContent = enemy.dialogue 
    ? `${enemy.name}: "${enemy.dialogue}"` 
    : `A ${enemy.name} appears!`;
  enemyHPDisplay.textContent = enemy.hp;

  enemyImage.classList.remove("hidden");
  combatContainer.classList.remove("hidden");
  actionBox.classList.remove("hidden");
  buttons.classList.remove("hidden");
  forestBtn.classList.add("hidden");
  document.getElementById("campBtn").classList.add("hidden");
  
  startBattle(enemyType);
});

document.getElementById("campBtn")?.addEventListener("click", () => {
  const randomMessage = campMessages[Math.floor(Math.random() * campMessages.length)];
  showAction(randomMessage);
  document.getElementById("campBtn").classList.add("hidden");
  document.getElementById("forestBtn").classList.remove("hidden");
  document.querySelector(".buttons").classList.add("hidden");
  updateUI();
  savePlayerData();
  localStorage.setItem("lastActionMessage", randomMessage);
  setTimeout(() => {
    window.location.href = "camp.html";
  }, 1000);
});

document.addEventListener("DOMContentLoaded", () => {
  loadPlayerData();
  updateUI();
  const lastMessage = localStorage.getItem("lastActionMessage");
  const currentPage = window.location.pathname;

  if (lastMessage && currentPage.includes("camp.html")) {
    showAction(lastMessage);
  } else if (currentPage.includes("camp.html")) {
    showAction("You’ve arrived at camp, weary but alive.");
  } else if (currentPage.includes("ambush.html")) {
    const enemyTypes = ["bandit", "wolves", "bountyHunter"];
    const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const enemyImage = document.getElementById("banditEnemy");
    const combatContainer = document.getElementById("combat-container");
    const actionBox = document.getElementById("actionBox");
    const actionText = document.getElementById("actionText");
    const buttons = document.querySelector(".buttons");
    const forestBtn = document.getElementById("forestBtn");
    const enemyHPDisplay = document.getElementById("enemyHP");

    startBattle(enemyType);
    enemyImage.src = enemies[enemyType].image;
    actionText.textContent = `Ambush! A ${enemies[enemyType].name} attacks!`;
    enemyHPDisplay.textContent = enemies[enemyType].hp;

    enemyImage.classList.remove("hidden");
    combatContainer.classList.remove("hidden");
    actionBox.classList.remove("hidden");
    buttons.classList.remove("hidden");
    forestBtn.classList.add("hidden");
    document.getElementById("campBtn").classList.add("hidden");
  }
});

document.getElementById("shortRestBtn")?.addEventListener("click", () => {
  const roll = rollDice(20);
  let message;

  if (roll >= 6 && roll <= 20) {
    message = restOutcomes.safe[Math.floor(Math.random() * restOutcomes.safe.length)];
    gameState.hp = Math.min(100, gameState.hp + 5);
    showAction(message);
    savePlayerData();
    updateUI();
  } else { // 1-5
    message = restOutcomes.ambush[Math.floor(Math.random() * restOutcomes.ambush.length)];
    showAction(message);
    savePlayerData();
    setTimeout(() => {
      window.location.href = "ambush.html"; // Redirect to new ambush page
    }, 1000);
  }
});

document.getElementById("attackBtn")?.addEventListener("click", startAutoBattle);
updateUI();