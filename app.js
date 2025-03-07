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
  inventory: [
    { name: "potion", quantity: 2 }, // Start with 2 potions
    { name: "throwingKnife", quantity: 1 } // And 1 knife
  ],
  cooldowns: {}, // Added for item cooldowns
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
    image: "/assets/img_folder/enemies/bandit.jpeg",
    damage: "1d4"
  },
  wolves: {
    name: "Wolves",
    hp: 15,
    stats: { attack: 3, speed: 8, defense: 4 },
    acBonus: 1,
    goldReward: 15,
    xpReward: 25,
    image: "/assets/img_folder/enemies/wolves.jpg",
    damage: "1d6"
  },
  bountyHunter: {
    name: "Bounty Hunter",
    hp: 20,
    stats: { attack: 4, speed: 5, defense: 10 },
    acBonus: 2,
    goldReward: 25,
    xpReward: 40,
    image: "/assets/img_folder/enemies/bountyHunter.jpg",
    damage: "1d4"
  },
  trickster: {
    name: "Trickster",
    hp: 1,
    stats: { attack: 8, speed: 15, defense: 5 },
    acBonus: 4,
    goldReward: 5,
    xpReward: 70,
    image: "/assets/img_folder/enemies/trickster.jpg",
    damage: "1d4"
  },
  thief: {
    name: "Thief",
    hp: 15,
    stats: { attack: 6, speed: 10, defense: 8 },
    acBonus: 1,
    goldReward: 150,
    xpReward: 10,
    image: "/assets/img_folder/enemies/thief.jpg",
    damage: "1d4"
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

const itemEffects = {
  potion: {
    use: (user) => {
      user.hp = Math.min(MAX_HP, user.hp + 10);
      return `${user.name} uses a potion, restoring 10 HP!`;
    },
    cooldown: 0
  },
  throwingKnife: {
    use: (user, target) => {
      const damage = rollDamage("1d6");
      target.hp -= damage;
      return `${user.name} throws a knife, dealing ${damage} damage!`;
    },
    cooldown: 3
  },
  smokeBomb: {
    use: (user) => {
      user.acBonus = (user.acBonus || 0) + 5;
      setTimeout(() => {
        user.acBonus = (user.acBonus || 0) - 5;
        updateUI();
      }, 4000); // 1 round (assuming 2s turns)
      return `${user.name} uses a smoke bomb, boosting evasion (+5 AC for 1 round)!`;
    },
    cooldown: 3
  },
  net: {
    use: (user, target) => {
      target.stats.speed = 0;
      setTimeout(() => {
        target.stats.speed = target.originalSpeed;
        updateUI();
      }, 4000);
      return `${user.name} throws a net, immobilizing ${target.name} for 1 round!`;
    },
    cooldown: 3
  }
};

// === 2. Utility Functions ===
let combatLog = [];

function rollDice(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function rollDamage(damageString) {
  const match = damageString.match(/(\d+)d(\d+)/);
  if (!match) return rollDice(4);
  const numDice = parseInt(match[1]);
  const sides = parseInt(match[2]);
  let total = 0;
  for (let i = 0; i < numDice; i++) {
    total += rollDice(sides);
  }
  return total;
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

function addToInventory(itemName, amount = 1) {
  console.log(`Adding ${amount} ${itemName}(s) to inventory...`);
  const normalizedItemName = itemName.toLowerCase(); // Normalize case
  const item = gameState.inventory.find(i => i.name === normalizedItemName);
  if (item) {
    item.quantity += amount;
  } else if (itemEffects[normalizedItemName]) {
    gameState.inventory.push({ name: normalizedItemName, quantity: amount });
  } else {
    console.error(`Unknown item: ${normalizedItemName}`);
    return;
  }
  console.log("Inventory updated:", gameState.inventory);
  updateUI();
}

function removeFromInventory(itemName, amount = 1) {
  const normalizedItemName = itemName.toLowerCase();
  const item = gameState.inventory.find(i => i.name === normalizedItemName);
  if (item && item.quantity >= amount) {
    item.quantity -= amount;
    if (item.quantity === 0) {
      gameState.inventory = gameState.inventory.filter(i => i.name !== normalizedItemName);
    }
    console.log(`Removed ${amount} ${itemName}(s). Inventory now:`, gameState.inventory);
    return true;
  }
  console.log(`Not enough ${itemName} to remove!`);
  return false;
}

function useItem(itemName, user, target) {
  const inventory = user === gameState ? gameState.inventory : user.consumables;
  const cooldowns = user === gameState ? gameState.cooldowns : user.cooldowns;
  const normalizedItemName = itemName.toLowerCase();
  const item = inventory.find(i => i.name === normalizedItemName);

  if (item && item.quantity > 0 && (!cooldowns[normalizedItemName] || cooldowns[normalizedItemName] === 0)) {
    const effectMessage = itemEffects[normalizedItemName].use(user, target || user); // Default target to user if none
    removeFromInventory(normalizedItemName);
    if (itemEffects[normalizedItemName].cooldown > 0) {
      cooldowns[normalizedItemName] = itemEffects[normalizedItemName].cooldown;
    }
    return effectMessage;
  }
  return null;
}

function updateCooldowns(entity) {
  for (let item in entity.cooldowns) {
    if (entity.cooldowns[item] > 0) entity.cooldowns[item]--;
  }
}

function updateUI() {
  const elements = {
    playerName: document.getElementById("playerName"),
    xp: document.getElementById("xp"),
    hp: document.getElementById("hp"),
    level: document.getElementById("level"),
    gold: document.getElementById("gold"),
    inventoryList: document.getElementById("inventoryList"),
    att: document.getElementById("att"),
    def: document.getElementById("def"),
    spd: document.getElementById("spd"),
    enemyHP: document.getElementById("enemyHP"),
  };

  if (elements.playerName) elements.playerName.textContent = gameState.playerName || "Player";
  if (elements.xp) elements.xp.textContent = `${gameState.xp}/${LEVEL_UP_XP}`;
  if (elements.hp) elements.hp.textContent = gameState.hp;
  if (elements.level) elements.level.textContent = gameState.level;
  if (elements.gold) elements.gold.textContent = gameState.gold;
  if (elements.att) elements.att.textContent = gameState.stats.attack;
  if (elements.def) elements.def.textContent = gameState.stats.defense;
  if (elements.spd) elements.spd.textContent = gameState.stats.speed;
  if (elements.enemyHP) {
    elements.enemyHP.textContent = currentEnemy && currentEnemy.hp > 0 ? currentEnemy.hp : "No enemy";
  }
  if (elements.inventoryList) {
    elements.inventoryList.innerHTML = "";
    if (gameState.inventory.length === 0) {
      const p = document.createElement("p");
      p.className = "item";
      p.textContent = "Empty";
      elements.inventoryList.appendChild(p);
    } else {
      gameState.inventory.forEach(item => {
        const p = document.createElement("p");
        p.className = "item";
        p.textContent = `${item.name}: ${item.quantity}`;
        elements.inventoryList.appendChild(p);
      });
    }
  }
}

function checkGameOver() {
  if (gameState.hp <= 0) {
    localStorage.setItem("gameOver", "true");
    window.location.href = "gameover.html";
  }
}

// === 3. Inventory and Shop Functions ===
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
  const playerName = document.getElementById("playerName");
  const gold = document.getElementById("gold");
  const inventoryList = document.getElementById("inventoryList");
  if (playerName) playerName.textContent = gameState.playerName || "Player";
  if (gold) gold.textContent = gameState.gold;
  if (inventoryList) {
    inventoryList.innerHTML = "";
    if (gameState.inventory.length === 0) {
      const p = document.createElement("p");
      p.className = "item";
      p.textContent = "Empty";
      inventoryList.appendChild(p);
    } else {
      gameState.inventory.forEach(item => {
        const p = document.createElement("p");
        p.className = "item";
        p.textContent = `${item.name}: ${item.quantity}`;
        inventoryList.appendChild(p);
      });
    }
  }
  console.log("Shop UI updated.");
}

function playerUseItem(itemName) {
  if (!battleActive || !currentEnemy) return;
  const message = useItem(itemName, gameState, currentEnemy);
  if (message) {
    showAction(message);
    updateUI();
    savePlayerData();
    if (currentEnemy.hp <= 0) endBattle(currentEnemy);
  } else {
    showAction(`Can't use ${itemName} yet!`);
  }
}

// === 4. Dialogue System ===
const universalDialogueBox = document.getElementById("universalDialogueBox");
const universalDialogueText = document.getElementById("universalDialogueText");

function updateDialogue(text) {
  if (universalDialogueText) universalDialogueText.textContent = text;
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
  if (universalDialogueBox) universalDialogueBox.classList.add("hidden");
}

// Fixed duplicate showAction issue
function showAction(text, append = false) {
  const actionBox = document.getElementById("actionBox");
  const actionText = document.getElementById("actionText");
  if (actionBox && actionText) {
    if (append) {
      actionText.textContent += `\n${text}`;
    } else {
      actionText.textContent = text;
      if (battleActive) combatLog.push(text);
    }
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
    ac: calculateAC(10, enemyData.stats.speed, enemyData.stats.defense, enemyData.acBonus || 0),
    originalSpeed: enemyData.stats.speed // For net reset
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
  document.getElementById("attackBtn")?.setAttribute("disabled", "true");
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

  const actionText = document.getElementById("actionText");
  if (actionText) actionText.textContent = "";

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

function performAttack(attacker, target, isPlayer) {
  const speed = isPlayer ? gameState.stats.speed + gameState.weapon.speed : attacker.stats.speed;
  const numAttacks = calculateAttacks(speed);
  const attackStat = isPlayer ? gameState.stats.attack : attacker.stats.attack;
  const targetAC = isPlayer ? attacker.ac : gameState.ac;
  const damageReduction = isPlayer ? 0 : Math.min(2, Math.floor(gameState.stats.defense / 5));
  const damageFunc = isPlayer ? () => rollDamage(gameState.weapon.damage) : () => rollDamage(attacker.damage || "1d4");
  const name = isPlayer ? "You" : attacker.name;
  const targetName = isPlayer ? attacker.name : "you";

  console.log(`${name} attacks ${numAttacks} time(s) with speed ${speed}`);
  let turnSummary = `${name}'s turn (${numAttacks} attacks):`;

  for (let i = 0; i < numAttacks && (isPlayer ? attacker.hp > 0 : gameState.hp > 0); i++) {
    let attackRoll = rollDice(20) + attackStat;
    console.log(`${name} attack ${i + 1}: rolls ${attackRoll} (needs ${targetAC} to hit)`);

    if (attackRoll >= targetAC) {
      let baseDamage = damageFunc();
      let damage = Math.max(1, baseDamage - damageReduction);
      if (isPlayer) attacker.hp -= damage; else gameState.hp -= damage;
      turnSummary += `\nAttack ${i + 1}: Hit ${targetName} for ${damage} damage${damageReduction > 0 ? ` (-${damageReduction})` : ""}!`;
      console.log(`Hit! Dealt ${damage} damage. ${targetName} now has ${isPlayer ? attacker.hp : gameState.hp} HP left.`);

      if (isPlayer && attacker.hp <= 0) {
        console.log(`Enemy ${attacker.name} defeated!`);
        showAction(turnSummary);
        endBattle(attacker);
        return false;
      } else if (!isPlayer && gameState.hp <= 0) {
        console.log("Player defeated!");
        turnSummary += "\nYou have been defeated!";
        showAction(turnSummary);
        gameOver();
        return false;
      }
    } else {
      turnSummary += `\nAttack ${i + 1}: Missed!`;
      console.log("Miss!");
    }
  }

  showAction(turnSummary);
  updateCooldowns(isPlayer ? gameState : attacker); // Update cooldowns after turn
  return true;
}

function playerAttack() {
  performAttack(currentEnemy, null, true);
  updateUI();
  savePlayerData();
}

function enemyAttack() {
  if (!battleActive) return;
  performAttack(currentEnemy, null, false);
  updateUI();
  savePlayerData();
}

function endBattle(enemy) {
  battleActive = false;
  document.getElementById("attackBtn")?.removeAttribute("disabled");
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
  document.getElementById("attackBtn")?.removeAttribute("disabled");
  showAction("You have been defeated!");
  setTimeout(() => {
    window.location.href = "gameover.html";
  }, 2000);
}

const LEVEL_UP_XP = 100;
const LEVEL_UP_HP_GAIN = 5;
const MAX_HP = 100;

function levelUp() {
  if (gameState.xp >= LEVEL_UP_XP) {
    gameState.level++;
    console.log("Adding level");
    gameState.xp -= LEVEL_UP_XP;
    console.log("Removing xp");
    gameState.hp = Math.min(MAX_HP, gameState.hp + LEVEL_UP_HP_GAIN);
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
    if (enemyImage) enemyImage.src = enemies[enemyType].image;
    if (actionText) actionText.textContent = `Ambush! A ${enemies[enemyType].name} attacks!`;
    if (enemyHPDisplay) enemyHPDisplay.textContent = enemies[enemyType].hp;

    enemyImage?.classList.remove("hidden");
    combatContainer?.classList.remove("hidden");
    actionBox?.classList.remove("hidden");
    buttons?.classList.remove("hidden");
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
  if (roll >= 1 && roll <= 10) enemyType = "bandit";
  else if (roll === 11) enemyType = "thief";
  else if (roll === 12) enemyType = "trickster";
  else if (roll >= 13 && roll <= 16) enemyType = "wolves";
  else if (roll >= 17 && roll <= 20) enemyType = "bountyHunter";
  else {
    console.error("Invalid roll value:", roll);
    return;
  }

  let enemy = enemies[enemyType];
  if (!enemy) {
    console.error("Enemy not found!");
    return;
  }

  if (enemyImage) enemyImage.src = enemy.image;
  if (actionText) actionText.textContent = enemy.dialogue ? `${enemy.name}: "${enemy.dialogue}"` : `A ${enemy.name} appears!`;
  if (enemyHPDisplay) enemyHPDisplay.textContent = enemy.hp;

  enemyImage?.classList.remove("hidden");
  combatContainer?.classList.remove("hidden");
  actionBox?.classList.remove("hidden");
  buttons?.classList.remove("hidden");
  forestBtn?.classList.add("hidden");
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
    gameState.hp = Math.min(MAX_HP, gameState.hp + 5);
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
  handleBuyItem({ name: "potion", price: 10 }); // Normalized to "potion"
});

document.getElementById("useItemBtn")?.addEventListener("click", () => playerUseItem("potion"));

document.getElementById("attackBtn")?.addEventListener("click", startAutoBattle);

document.getElementById("runAwayBtn")?.addEventListener("click", runAway);

document.getElementById("restartBtn")?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

document.getElementById("viewLogBtn")?.addEventListener("click", () => {
  showAction(combatLog.join("\n\n"), false);
});

updateUI();