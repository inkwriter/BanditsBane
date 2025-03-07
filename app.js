// === 1. Game Data and Initial Setup ===
console.log("Game script loaded.");

const gameState = {
  playerName: "Xander Oakenshield",
  xp: 0,
  hp: 20,
  maxHp: 20,
  level: 1,
  stats: {
    attack: 3,
    defense: 1,
    speed: 2,
  },
  baseAC: 10,
  gold: 100,
  inventory: {
    potions: 0,
    poison: 0,
  },
  weapon: {
    name: "fist",
    damage: "1d4",
    attack: 0,
    defense: 0,
    speed: 0
  },
};

const enemies = {
  bandit: {
    name: "Bandit",
    hp: 10,
    stats: { attack: 2, speed: 3, defense: 2 },
    acBonus: 0,
    goldReward: 10,
    xpReward: 20,
    image: "/assets/img_folder/enemies/bandit.jpeg"
  },
  wolves: {
    name: "Wolves",
    hp: 15,
    stats: { attack: 3, speed: 8, defense: 4 },
    acBonus: 1,
    goldReward: 15,
    xpReward: 25,
    image: "/assets/img_folder/enemies/wolves.jpg"
  },
  bountyHunter: {
    name: "Bounty Hunter",
    hp: 20,
    stats: { attack: 4, speed: 5, defense: 10 },
    acBonus: 2,
    goldReward: 25,
    xpReward: 40,
    image: "/assets/img_folder/enemies/bountyHunter.jpg"
  },
  trickster: {
    name: "Trickster",
    hp: 1,
    stats: { attack: 8, speed: 15, defense: 5 },
    acBonus: 4,
    goldReward: 5,
    xpReward: 70,
    image: "/assets/img_folder/enemies/trickster.jpg"
  },
  thief: {
    name: "Thief",
    hp: 15,
    stats: { attack: 6, speed: 10, defense: 8 },
    acBonus: 1,
    goldReward: 150,
    xpReward: 10,
    image: "/assets/img_folder/enemies/thief.jpg"
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

// === 2. Utility Functions ===
function rollDice(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function savePlayerData() {
  console.log("Saving player data...", JSON.stringify(gameState));
  localStorage.setItem("gameState", JSON.stringify(gameState));
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
    localStorage.removeItem("gameState");
  }
}

function calculateAC(baseAC, speed, defense, acBonus = 0) {
  return baseAC + Math.min(2, Math.floor(speed / 5)) + Math.min(2, Math.floor(defense / 5)) + acBonus;
}

function calculateAttacks(speed) {
  if (speed >= 20) return 5;
  if (speed >= 15) return 4;
  if (speed >= 10) return 3;
  if (speed >= 5) return 2;
  return 1;
}

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

function checkGameOver() {
  if (gameState.hp <= 0) {
    localStorage.setItem("gameOver", "true");
    window.location.href = "gameover.html";
  }
}

// === 3. Inventory and Shop Functions ===
function addToInventory(itemName) {
  console.log(`Adding ${itemName} to inventory...`);
  if (itemName === "Potion") gameState.inventory.potions += 1;
  if (itemName === "Poison") gameState.inventory.poison += 1;
  console.log("Inventory updated:", gameState.inventory);
}

function handleBuyItem(item) {
  if (gameState.gold >= item.price) {
    console.log(`Buying ${item.name}...`);
    gameState.gold -= item.price;
    addToInventory(item.name);
    savePlayerData();
    updateShopUI();
    showShopDialogue();
    setTimeout(hideShopDialogue, 3000);
  } else {
    alert("Not enough gold!");
  }
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
    gameState.hp = Math.min(100, gameState.hp + 10);
    gameState.inventory.potions--;
    alert("You used a health potion and restored 10 HP!");
    updateUI(); // Changed from updateCombatUI (undefined)
    savePlayerData();
  } else {
    alert("You have no health potions left!");
    console.log("No health potions available to use.");
  }
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

// === 5. Auto-Battle System ===
let battleActive = false;
let currentEnemy;

function startBattle(enemyType) {
  if (!enemies[enemyType]) {
    console.error("Invalid enemy type:", enemyType);
    return;
  }
  const enemyData = enemies[enemyType];
  currentEnemy = {
    ...enemyData,
    ac: calculateAC(10, enemyData.stats.speed, enemyData.stats.defense, enemyData.acBonus || 0)
  };
  gameState.ac = calculateAC(gameState.baseAC, gameState.stats.speed + gameState.weapon.speed, gameState.stats.defense + gameState.weapon.defense);
  console.log(`A wild ${currentEnemy.name} appears! AC: ${currentEnemy.ac}`, currentEnemy);
  showAction(`A ${currentEnemy.name} appears, ready to fight!`);
  updateUI();

  if (window.location.pathname.includes("ambush.html")) {
    setTimeout(startAutoBattle, 1000);
  }
}

function startAutoBattle() {
  if (battleActive || !currentEnemy) return;
  battleActive = true;
  console.log("Battle started!");
  showAction(`A ${currentEnemy.name} appears, ready to fight!`);
  autoBattleLoop();
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
    playerAttack();
    if (currentEnemy && currentEnemy.hp > 0) {
      setTimeout(() => {
        enemyAttack();
        autoBattleLoop();
      }, 1000);
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

  let attackRoll = rollDice(20) + currentEnemy.stats.attack;
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

  document.getElementById("combat-container")?.classList.add("hidden");
  document.querySelector(".buttons")?.classList.add("hidden");
  document.getElementById("campBtn")?.classList.remove("hidden");
  document.getElementById("forestBtn")?.classList.remove("hidden");
}

function runAway() {
  if (!battleActive || !currentEnemy) {
    console.log("No active battle to run from!");
    return;
  }

  const damage = rollDice(4);
  gameState.hp -= damage;
  console.log(`You flee, taking ${damage} damage. HP now: ${gameState.hp}`);
  showAction(`You flee from the ${currentEnemy.name}, taking ${damage} damage in your escape!`);

  updateUI();
  savePlayerData();

  if (gameState.hp <= 0) {
    gameOver();
    return;
  }

  battleActive = false;
  currentEnemy = null;
  document.getElementById("combat-container")?.classList.add("hidden");
  document.querySelector(".buttons")?.classList.add("hidden");

  setTimeout(() => {
    window.location.href = "camp.html";
  }, 1500);
}

function gameOver() {
  battleActive = false;
  showAction("You have been defeated!");
  setTimeout(() => {
    window.location.href = "gameover.html";
  }, 2000);
}

function levelUp() {
  if (gameState.xp >= 100) {
    gameState.level++;
    console.log("Adding level");
    gameState.xp -= 100;
    console.log("Removing xp");
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

// === 6. Event Listeners ===
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
    const enemyTypes = ["bandit", "wolves", "bountyHunter", "trickster", "thief"];
    const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const enemyImage = document.getElementById("banditEnemy");
    const combatContainer = document.getElementById("combat-container");
    const actionBox = document.getElementById("actionBox");
    const actionText = document.getElementById("actionText");
    const buttons = document.querySelector(".buttons");
    const enemyHPDisplay = document.getElementById("enemyHP");

    startBattle(enemyType);
    enemyImage.src = enemies[enemyType].image;
    actionText.textContent = `Ambush! A ${enemies[enemyType].name} attacks!`;
    enemyHPDisplay.textContent = enemies[enemyType].hp;

    enemyImage.classList.remove("hidden");
    combatContainer.classList.remove("hidden");
    actionBox.classList.remove("hidden");
    buttons.classList.remove("hidden");
    document.getElementById("campBtn")?.classList.add("hidden");
  }
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

  if (roll >= 1 && roll <= 10) {
    enemyType = "bandit";
  } else if (roll === 11) {
    enemyType = "thief";
  } else if (roll === 12) {
    enemyType = "trickster";
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
  actionText.textContent = enemy.dialogue ? `${enemy.name}: "${enemy.dialogue}"` : `A ${enemy.name} appears!`;
  enemyHPDisplay.textContent = enemy.hp;

  enemyImage.classList.remove("hidden");
  combatContainer.classList.remove("hidden");
  actionBox.classList.remove("hidden");
  buttons.classList.remove("hidden");
  forestBtn.classList.add("hidden");
  document.getElementById("campBtn")?.classList.add("hidden");
  
  startBattle(enemyType);
});

document.getElementById("campBtn")?.addEventListener("click", () => {
  const randomMessage = campMessages[Math.floor(Math.random() * campMessages.length)];
  showAction(randomMessage);
  document.getElementById("campBtn")?.classList.add("hidden");
  document.querySelector(".buttons")?.classList.add("hidden");
  updateUI();
  savePlayerData();
  localStorage.setItem("lastActionMessage", randomMessage);
  setTimeout(() => {
    window.location.href = "camp.html";
  }, 1000);
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
  } else {
    message = restOutcomes.ambush[Math.floor(Math.random() * restOutcomes.ambush.length)];
    showAction(message);
    savePlayerData();
    setTimeout(() => {
      window.location.href = "ambush.html";
    }, 1000);
  }
});

document.getElementById("buyPotionsBtn")?.addEventListener("click", () => {
  handleBuyItem({ name: "Potion", price: 10 });
});

document.getElementById("useItemBtn")?.addEventListener("click", useItem);

document.getElementById("attackBtn")?.addEventListener("click", startAutoBattle);

document.getElementById("runAwayBtn")?.addEventListener("click", runAway);

document.getElementById("restartBtn")?.addEventListener("click", function () {
  localStorage.clear();
  window.location.href = "index.html";
});

updateUI();