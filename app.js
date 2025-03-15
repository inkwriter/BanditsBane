// === 1. Game Data and Initial Setup ===
console.log("Game script loaded.");

const LEVEL_UP_XP = 100;
const LEVEL_UP_HP_GAIN = 5;
const MAX_HP = 100;

const gameState = {
  playerName: "Xander Oakenshield",
  xp: 0,
  hp: 20,
  maxHp: 20,
  level: 1,
  stats: { attack: 3, defense: 1, speed: 2 },
  baseAC: 10,
  gold: 100,
  inventory: [
    { name: "potion", quantity: 2 },
    { name: "throwingknife", quantity: 1 }
  ],
  cooldowns: {},
  weapon: { name: "fist", damage: "1d4", attack: 0, defense: 0, speed: 0 },
};

const enemies = {
  bandit: { name: "Bandit", hp: 10, stats: { attack: 2, speed: 3, defense: 2 }, acBonus: 0, goldReward: 10, xpReward: 20, image: "/assets/img_folder/enemies/bandit.jpeg", damage: "1d4" },
  wolves: { name: "Wolves", hp: 15, stats: { attack: 3, speed: 8, defense: 4 }, acBonus: 1, goldReward: 15, xpReward: 25, image: "/assets/img_folder/enemies/wolves.jpg", damage: "1d6" },
  bountyHunter: { name: "Bounty Hunter", hp: 20, stats: { attack: 4, speed: 5, defense: 10 }, acBonus: 2, goldReward: 25, xpReward: 40, image: "/assets/img_folder/enemies/bountyHunter.jpg", damage: "1d4" },
  trickster: { name: "Trickster", hp: 1, stats: { attack: 8, speed: 15, defense: 5 }, acBonus: 4, goldReward: 5, xpReward: 70, image: "/assets/img_folder/enemies/trickster.jpg", damage: "1d4" },
  thief: { name: "Thief", hp: 15, stats: { attack: 6, speed: 10, defense: 8 }, acBonus: 1, goldReward: 150, xpReward: 10, image: "/assets/img_folder/enemies/thief.jpg", damage: "1d4" },
};

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
      return `${user.playerName || user.name} uses a potion, restoring 10 HP!`;
    },
    cooldown: 0
  },
  throwingknife: {
    use: (user, target) => {
      const damage = rollDamage("1d6");
      target.hp -= damage;
      return `${user.playerName || user.name} throws a knife, dealing ${damage} damage!`;
    },
    cooldown: 3
  },
  smokebomb: {
    use: (user) => {
      user.acBonus = (user.acBonus || 0) + 5;
      user.smokebombTurns = 1;
      return `${user.playerName || user.name} uses a smoke bomb, boosting evasion (+5 AC for 1 turn)!`;
    },
    cooldown: 3
  },
  net: {
    use: (user, target) => {
      target.stats.speed = 0;
      target.netTurns = 1;
      return `${user.playerName || user.name} throws a net, immobilizing ${target.name} for 1 turn!`;
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
  const [_, numDice, sides] = match;
  return Array.from({ length: parseInt(numDice) }, () => rollDice(parseInt(sides))).reduce((a, b) => a + b, 0);
}

function savePlayerData() {
  localStorage.setItem("gameState", JSON.stringify(gameState));
}

function loadPlayerData() {
  const savedData = localStorage.getItem("gameState");
  try {
    if (savedData) Object.assign(gameState, JSON.parse(savedData));
    if (!Array.isArray(gameState.inventory)) {
      gameState.inventory = [
        { name: "potion", quantity: 2 },
        { name: "throwingknife", quantity: 1 }
      ];
    }
  } catch (error) {
    console.error("Error loading game data, resetting:", error);
    localStorage.removeItem("gameState");
    gameState.inventory = [
      { name: "potion", quantity: 2 },
      { name: "throwingknife", quantity: 1 }
    ];
  }
}

function calculateAC(baseAC, stats, acBonus = 0) {
  return baseAC + Math.floor(stats.speed / 3) + Math.floor(stats.defense / 2) + acBonus;
}

function addToInventory(itemName, amount = 1) {
  const normalizedItemName = itemName.toLowerCase();
  if (!Array.isArray(gameState.inventory)) gameState.inventory = [];
  const item = gameState.inventory.find(i => i.name === normalizedItemName);
  if (item) {
    item.quantity += amount;
  } else if (itemEffects[normalizedItemName]) {
    gameState.inventory.push({ name: normalizedItemName, quantity: amount });
  }
  updateUI();
}

function removeFromInventory(itemName, amount = 1) {
  const normalizedItemName = itemName.toLowerCase();
  const item = gameState.inventory.find(i => i.name === normalizedItemName);
  if (item && item.quantity >= amount) {
    item.quantity -= amount;
    if (item.quantity === 0) gameState.inventory = gameState.inventory.filter(i => i.name !== normalizedItemName);
    return true;
  }
  return false;
}

function useItem(itemName, user, target) {
  const inventory = user === gameState ? gameState.inventory : user.consumables;
  const cooldowns = user === gameState ? gameState.cooldowns : user.cooldowns;
  const normalizedItemName = itemName.toLowerCase();
  const item = inventory.find(i => i.name === normalizedItemName);
  if (item && item.quantity > 0 && (!cooldowns[normalizedItemName] || cooldowns[normalizedItemName] === 0)) {
    const effectMessage = itemEffects[normalizedItemName].use(user, target || user);
    removeFromInventory(normalizedItemName);
    if (itemEffects[normalizedItemName].cooldown > 0) cooldowns[normalizedItemName] = itemEffects[normalizedItemName].cooldown;
    return effectMessage;
  }
  return null;
}

function updateCooldowns(entity) {
  for (let item in entity.cooldowns) {
    if (entity.cooldowns[item] > 0) entity.cooldowns[item]--;
  }
  if (entity.smokebombTurns > 0) {
    entity.smokebombTurns--;
    if (entity.smokebombTurns === 0) {
      entity.acBonus = (entity.acBonus || 0) - 5;
      showAction("The smoke clears...");
    }
  }
  if (entity.netTurns > 0) {
    entity.netTurns--;
    if (entity.netTurns === 0) {
      entity.stats.speed = entity.originalSpeed;
      showAction(`${entity.name} breaks free from the net!`);
    }
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
    enemyName: document.getElementById("enemyName"),
    enemyHP: document.getElementById("enemyHP"),
    playerHealth: document.getElementById("player-health"),
    enemyHealth: document.getElementById("enemy-health"),
  };

  if (elements.playerName) elements.playerName.textContent = gameState.playerName;
  if (elements.xp) elements.xp.textContent = `${gameState.xp}/${LEVEL_UP_XP}`;
  if (elements.hp) elements.hp.textContent = gameState.hp;
  if (elements.level) elements.level.textContent = gameState.level;
  if (elements.gold) elements.gold.textContent = gameState.gold;
  if (elements.att) elements.att.textContent = gameState.stats.attack;
  if (elements.def) elements.def.textContent = gameState.stats.defense;
  if (elements.spd) elements.spd.textContent = gameState.stats.speed;
  if (elements.enemyName && combatState.currentEnemy) elements.enemyName.textContent = combatState.currentEnemy.name;
  if (elements.enemyHP) {
    elements.enemyHP.textContent = combatState.currentEnemy && combatState.currentEnemy.hp > 0 ? combatState.currentEnemy.hp : "No enemy";
  }

  if (elements.playerHealth) updateHealthBar("player-health", gameState.hp, gameState.maxHp);
  if (elements.enemyHealth && combatState.currentEnemy) {
    const enemyMaxHp = enemies[combatState.currentEnemy.name.toLowerCase()]?.hp || 1;
    updateHealthBar("enemy-health", combatState.currentEnemy.hp, enemyMaxHp);
  }

  if (elements.inventoryList) {
    elements.inventoryList.innerHTML = gameState.inventory.length === 0
      ? "<p class='item'>Empty</p>"
      : gameState.inventory.map(item => `<p class="item">${item.name}: ${item.quantity}</p>`).join("");
  }
}

// === 3. Inventory and Shop Functions ===
function handleBuyItem(item) {
  if (gameState.gold >= item.price) {
    gameState.gold -= item.price;
    addToInventory(item.name);
    savePlayerData();
    updateUI();
    showShopDialogue();
    setTimeout(hideShopDialogue, 3000);
  } else {
    alert("Not enough gold!");
  }
}

const shopDialogueBox = document.getElementById("shopDialogueBox");
const shopDialogueText = document.getElementById("shopDialogueText");

function showShopDialogue() {
  if (shopDialogueBox && shopDialogueText) {
    shopDialogueBox.classList.remove("hidden");
    const shopDialogues = [
      "Shop Keeper: 'Thank you so much for your purchase!'",
      "Shop Keeper: 'I've had my eye on that too!'",
      "Shop Keeper: 'Have a great day!'",
      "Shop Keeper: 'We should be getting some new items soon!'",
    ];
    shopDialogueText.textContent = shopDialogues[Math.floor(Math.random() * shopDialogues.length)];
  }
}

function hideShopDialogue() {
  if (shopDialogueBox) shopDialogueBox.classList.add("hidden");
}

// === 4. Dialogue System ===
function showAction(text, append = false) {
  const actionBox = document.getElementById("actionBox");
  if (actionBox) {
    if (!append) {
      const p = document.createElement("p");
      p.textContent = text;
      actionBox.appendChild(p);
      if (combatState.active) combatLog.push(text);
    } else {
      const lastP = actionBox.lastElementChild;
      if (lastP && lastP.tagName === "P") lastP.textContent += `\n\n${text}`;
      else {
        const p = document.createElement("p");
        p.textContent = text;
        actionBox.appendChild(p);
      }
      if (combatState.active) combatLog.push(text);
    }
    actionBox.classList.remove("hidden");
    actionBox.scrollTop = actionBox.scrollHeight;
  }
}

// === 5. Combat System ===
let combatState = {
  active: false,
  turn: "player",
  currentEnemy: null,
};

function startBattle(enemyType) {
  if (!enemies[enemyType]) return;
  const enemyData = enemies[enemyType];
  combatState.currentEnemy = {
    ...enemyData,
    ac: calculateAC(10, enemyData.stats, enemyData.acBonus || 0),
    originalSpeed: enemyData.stats.speed,
  };
  gameState.ac = calculateAC(gameState.baseAC, gameState.stats, 0);
  combatState.active = true;
  combatState.turn = "player";
  showAction(`A ${combatState.currentEnemy.name} appears! Your turn.`);
  showCombatMenu();
  updateUI();
}

function showCombatMenu() {
  const combatMenu = document.getElementById("combatMenu");
  if (!combatMenu) return;

  // Check if we're on ambush.html to exclude "Run"
  const isAmbush = window.location.pathname.includes("ambush.html");
  combatMenu.innerHTML = `
    <button id="attackOption">Attack</button>
    <button id="itemOption">Item</button>
    ${!isAmbush ? '<button id="runOption">Run</button>' : ''}
  `;
  combatMenu.classList.remove("hidden");

  document.getElementById("attackOption")?.addEventListener("click", () => playerAction("attack"), { once: true });
  document.getElementById("itemOption")?.addEventListener("click", showItemMenu, { once: true });
  if (!isAmbush) document.getElementById("runOption")?.addEventListener("click", () => playerAction("run"), { once: true });
}

function showItemMenu() {
  const combatMenu = document.getElementById("combatMenu");
  if (!combatMenu) return;
  combatMenu.innerHTML = gameState.inventory.map(item => `
    <button class="itemOption" data-item="${item.name}">${item.name} (${item.quantity})</button>
  `).join("") + `<button id="backOption">Back</button>`;

  document.querySelectorAll(".itemOption").forEach(button => {
    button.addEventListener("click", () => playerAction("item", button.dataset.item), { once: true });
  });
  document.getElementById("backOption")?.addEventListener("click", showCombatMenu, { once: true });
}

function playerAction(action, itemName = null) {
  if (!combatState.active || combatState.turn !== "player") return;
  hideCombatMenu();

  let message = "";
  if (action === "attack") {
    message = performAttack(gameState, combatState.currentEnemy, true);
  } else if (action === "item" && itemName) {
    message = useItem(itemName, gameState, combatState.currentEnemy) || `Can't use ${itemName} now!`;
  } else if (action === "run") {
    message = runAway();
  }

  showAction(message);
  updateUI();
  savePlayerData();

  if (combatState.currentEnemy.hp <= 0) {
    endBattle(combatState.currentEnemy);
    return;
  }
  if (gameState.hp <= 0) {
    gameOver();
    return;
  }

  combatState.turn = "enemy";
  setTimeout(enemyTurn, 1000);
}

function enemyTurn() {
  if (!combatState.active || combatState.turn !== "enemy") return;
  updateCooldowns(combatState.currentEnemy);
  const message = performAttack(combatState.currentEnemy, gameState, false);
  showAction(message);
  updateUI();
  savePlayerData();

  if (gameState.hp <= 0) {
    gameOver();
    return;
  }
  if (combatState.currentEnemy.hp <= 0) {
    endBattle(combatState.currentEnemy);
    return;
  }

  combatState.turn = "player";
  updateCooldowns(gameState);
  showAction("Your turn.");
  showCombatMenu();
}

function performAttack(attacker, target, isPlayer) {
  const stats = isPlayer ? gameState.stats : attacker.stats;
  const weapon = isPlayer ? gameState.weapon : { damage: attacker.damage || "1d4" };
  const targetAC = isPlayer ? target.ac : gameState.ac;
  const name = isPlayer ? gameState.playerName : attacker.name;
  const targetName = isPlayer ? target.name : "you";

  const attackRoll = rollDice(20) + stats.attack;
  if (attackRoll >= targetAC) {
    let damage = rollDamage(weapon.damage) + stats.attack;
    const damageReduction = isPlayer ? 0 : Math.floor(gameState.stats.defense / 2);
    damage = Math.max(1, damage - damageReduction);
    if (isPlayer) target.hp -= damage; else gameState.hp -= damage;

    let message = `${name} hits ${targetName} for ${damage} damage${damageReduction > 0 ? ` (-${damageReduction} reduction)` : ""}!`;
    
    const extraChance = Math.min(2, Math.floor((stats.speed - 5) / 5)) * 10;
    for (let i = 0; i < Math.min(2, Math.floor((stats.speed - 5) / 5)); i++) {
      if (rollDice(100) <= extraChance && (isPlayer ? target.hp > 0 : gameState.hp > 0)) {
        const extraDamage = rollDamage(weapon.damage) + stats.attack;
        const reducedExtra = Math.max(1, extraDamage - damageReduction);
        if (isPlayer) target.hp -= reducedExtra; else gameState.hp -= reducedExtra;
        message += `\n${name} strikes again for ${reducedExtra} damage!`;
      }
    }
    return message;
  } else {
    return `${name} swings at ${targetName} but misses!`;
  }
}

function runAway() {
  const damage = rollDice(4); // Always deal 1d4 damage
  gameState.hp -= damage;
  showAction(`You try to flee but take ${damage} damage from ${combatState.currentEnemy.name}!`);
  updateUI();
  savePlayerData();
  if (gameState.hp <= 0) gameOver();
  return null; // No escape, just damage
}

function endBattle(enemy) {
  combatState.active = false;
  combatState.currentEnemy = null;
  hideCombatMenu();
  gameState.gold += enemy.goldReward;
  gameState.xp += enemy.xpReward;
  const summary = `--- Battle Won! ---\nDefeated: ${enemy.name}\nRewards: +${enemy.goldReward} Gold, +${enemy.xpReward} XP`;
  showAction(summary);
  levelUp();
  savePlayerData();
  updateUI();
  document.getElementById("combat-container")?.classList.add("hidden");
  document.getElementById("campBtn")?.classList.remove("hidden");
  document.getElementById("forestBtn")?.classList.remove("hidden");
}

function gameOver() {
  combatState.active = false;
  combatState.currentEnemy = null;
  hideCombatMenu();
  showAction("You have been defeated!");
  setTimeout(() => window.location.href = "gameover.html", 2000);
}

function levelUp() {
  if (gameState.xp < LEVEL_UP_XP) return savePlayerData();
  gameState.level++;
  gameState.xp -= LEVEL_UP_XP;
  gameState.hp = Math.min(MAX_HP, gameState.hp + LEVEL_UP_HP_GAIN);
  alert("You leveled up!");
  gameState.stats.attack += 1;
  gameState.stats.defense += 1;
  gameState.stats.speed += 1;
  savePlayerData();
  updateUI();
}

function updateHealthBar(elementId, currentHealth, maxHealth) {
  const healthBar = document.getElementById(elementId);
  if (healthBar) {
    let healthPercentage = (currentHealth / maxHealth) * 100;
    healthBar.style.width = `${healthPercentage}%`;
    healthBar.style.backgroundColor = healthPercentage > 50 ? "green" : healthPercentage > 20 ? "yellow" : "red";
  }
}

function hideCombatMenu() {
  const combatMenu = document.getElementById("combatMenu");
  if (combatMenu) combatMenu.classList.add("hidden");
}

// === 6. Event Listeners ===
document.addEventListener("DOMContentLoaded", () => {
  loadPlayerData();
  updateUI();
  const lastMessage = localStorage.getItem("lastActionMessage");
  const currentPage = window.location.pathname;

  if (lastMessage && currentPage.includes("camp.html")) showAction(lastMessage);
  else if (currentPage.includes("camp.html")) showAction("You’ve arrived at camp, weary but alive.");
  else if (currentPage.includes("ambush.html")) {
    const enemyTypes = Object.keys(enemies);
    const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const elements = {
      enemyImage: document.getElementById("banditEnemy"),
      combatContainer: document.getElementById("combat-container"),
      actionBox: document.getElementById("actionBox"),
      enemyHP: document.getElementById("enemyHP"),
      campBtn: document.getElementById("campBtn")
    };

    startBattle(enemyType);
    if (elements.enemyImage) elements.enemyImage.src = enemies[enemyType].image;
    if (elements.actionBox) elements.actionBox.innerHTML = `<p>Ambush! A ${enemies[enemyType].name} attacks!</p>`;
    if (elements.enemyHP) elements.enemyHP.textContent = enemies[enemyType].hp;

    elements.enemyImage?.classList.remove("hidden");
    elements.combatContainer?.classList.remove("hidden");
    elements.actionBox?.classList.remove("hidden");
    elements.campBtn?.classList.add("hidden");
  }
});

document.getElementById("forestBtn")?.addEventListener("click", function () {
  if (window.location.pathname.includes("camp.html")) {
    showAction("You head back into the wild forest...");
    savePlayerData();
    setTimeout(() => window.location.href = "exploration.html", 1000);
    return;
  }

  const roll = rollDice(20);
  let enemyType;
  if (roll <= 10) enemyType = "bandit";
  else if (roll === 11) enemyType = "thief";
  else if (roll === 12) enemyType = "trickster";
  else if (roll <= 16) enemyType = "wolves";
  else enemyType = "bountyHunter";

  const enemy = enemies[enemyType];
  if (!enemy) return;

  const elements = {
    enemyImage: document.getElementById("banditEnemy"),
    combatContainer: document.getElementById("combat-container"),
    actionBox: document.getElementById("actionBox"),
    forestBtn: document.getElementById("forestBtn"),
    campBtn: document.getElementById("campBtn"),
  };

  if (elements.enemyImage) elements.enemyImage.src = enemy.image;
  if (elements.actionBox) elements.actionBox.innerHTML = `<p>${forestMessages[Math.floor(Math.random() * forestMessages.length)]}</p>`;
  elements.enemyImage?.classList.remove("hidden");
  elements.combatContainer?.classList.remove("hidden");
  elements.actionBox?.classList.remove("hidden");
  elements.forestBtn?.classList.add("hidden");
  elements.campBtn?.classList.add("hidden");

  startBattle(enemyType);
});

document.getElementById("campBtn")?.addEventListener("click", () => {
  const randomMessage = campMessages[Math.floor(Math.random() * campMessages.length)];
  showAction(randomMessage);
  document.getElementById("campBtn")?.classList.add("hidden");
  updateUI();
  savePlayerData();
  localStorage.setItem("lastActionMessage", randomMessage);
  setTimeout(() => window.location.href = "camp.html", 1000);
});

document.getElementById("shortRestBtn")?.addEventListener("click", () => {
  const roll = rollDice(20);
  let message;
  if (roll >= 6) {
    message = restOutcomes.safe[Math.floor(Math.random() * restOutcomes.safe.length)];
    gameState.hp = Math.min(MAX_HP, gameState.hp + 5);
    showAction(message);
    savePlayerData();
    updateUI();
  } else {
    message = restOutcomes.ambush[Math.floor(Math.random() * restOutcomes.ambush.length)];
    showAction(message);
    savePlayerData();
    setTimeout(() => window.location.href = "ambush.html", 1000);
  }
});

document.getElementById("buyPotionsBtn")?.addEventListener("click", () => handleBuyItem({ name: "potion", price: 10 }));
document.getElementById("buyThrowingKnifeBtn")?.addEventListener("click", () => handleBuyItem({ name: "throwingknife", price: 15 }));
document.getElementById("buySmokeBombBtn")?.addEventListener("click", () => handleBuyItem({ name: "smokebomb", price: 20 }));
document.getElementById("buyNetBtn")?.addEventListener("click", () => handleBuyItem({ name: "net", price: 25 }));

document.getElementById("viewLogBtn")?.addEventListener("click", () => {
  const actionBox = document.getElementById("actionBox");
  if (actionBox) {
    actionBox.innerHTML = "";
    combatLog.forEach(log => {
      const p = document.createElement("p");
      p.textContent = log;
      actionBox.appendChild(p);
    });
    actionBox.classList.remove("hidden");
    actionBox.scrollTop = actionBox.scrollHeight;
  }
});

document.getElementById("restartBtn")?.addEventListener("click", () => { localStorage.clear(); window.location.href = "index.html"; });

updateUI();