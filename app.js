// === Bandit's Bane - Non-Magical Single-File JS ===
// Supports multiple HTML pages: index.html, camp.html, exploration.html, ambush.html, shop.html, gameover.html

// --- Game Constants ---
const LEVEL_UP_XP = 100;
const LEVEL_UP_HP_GAIN = 5;
const MAX_HP = 100;

// --- Game State ---
let gameState = {
  playerName: "Unknown", // Updated dynamically based on class choice
  class: null, // Set on index.html: "warrior", "rogue", "guardian"
  xp: 0,
  hp: 20,
  maxHp: 20,
  level: 1,
  stats: { attack: 0, defense: 0, speed: 0 }, // Set by class
  baseAC: 10,
  gold: 100,
  inventory: [
    { name: "healingPotion", quantity: 2 },
    { name: "shortSword", quantity: 1 }
  ],
  equipped: { weapon: null, armor: null }, // One weapon, one armor/accessory
  ability: null // Set based on class
};

let combatState = {
  active: false,
  turn: "player",
  currentEnemy: null,
  log: []
};

// --- Data ---
const classes = {
  warrior: { stats: { attack: 5, defense: 3, speed: 1 }, ability: { name: "Cleave", effect: (user, target) => { const dmg = rollDamage("1d10") + user.stats.attack; target.hp -= dmg; return `${user.playerName} uses Cleave, dealing ${dmg} damage!`; } } },
  rogue: { stats: { attack: 3, defense: 1, speed: 5 }, ability: { name: "Backstab", effect: (user, target) => { const dmg = rollDamage("1d6") + user.stats.attack + 2; target.hp -= dmg; return `${user.playerName} uses Backstab, striking for ${dmg} damage!`; } } },
  guardian: { stats: { attack: 3, defense: 5, speed: 1 }, ability: { name: "Shield Bash", effect: (user, target) => { const dmg = rollDamage("1d6") + user.stats.attack; target.hp -= dmg; target.stunTurns = 1; return `${user.playerName} uses Shield Bash, dealing ${dmg} damage and stunning ${target.name}!`; } } }
};

const enemies = {
  bandit: { 
    name: "Bandit", 
    hp: 12, 
    stats: { attack: 2, speed: 3, defense: 2 }, 
    goldReward: 10, 
    xpReward: 20, 
    image: "/assets/img_folder/enemies/bandit.jpeg", 
    damage: "1d4", 
    ability: "steal", // Steals 5 gold
    loot: { common: ["wolfPelt", 50], rare: ["dagger", 10] }
  },
  wolves: { 
    name: "Wolves", 
    hp: 15, 
    stats: { attack: 3, speed: 5, defense: 1 }, 
    goldReward: 5, 
    xpReward: 25, 
    image: "/assets/img_folder/enemies/wolves.jpg", 
    damage: "1d6", 
    ability: "bite", // Bonus 1d4 damage
    loot: { common: ["wolfPelt", 80], rare: ["cloak", 5] }
  },
  thief: { 
    name: "Thief", 
    hp: 10, 
    stats: { attack: 2, speed: 6, defense: 2 }, 
    goldReward: 15, 
    xpReward: 15, 
    image: "/assets/img_folder/enemies/thief.jpg", 
    damage: "1d4", 
    ability: "evade", // +2 AC for 1 turn
    loot: { common: ["lockpick", 40], rare: ["swiftBoots", 8] }
  }
};

const equipment = {
  shortSword: { type: "weapon", damage: "1d6", attack: 1, defense: 0, speed: 0, price: 20 },
  longsword: { type: "weapon", damage: "1d8", attack: 2, defense: 0, speed: -1, price: 30 },
  dagger: { type: "weapon", damage: "1d4", attack: 0, defense: 0, speed: 2, price: 15 },
  bow: { type: "weapon", damage: "1d6", attack: 1, defense: 0, speed: 1, price: 25 },
  spear: { type: "weapon", damage: "1d8", attack: 1, defense: 1, speed: 0, price: 25 },
  staff: { type: "weapon", damage: "1d6", attack: 0, defense: 1, speed: 0, price: 20 },
  leatherArmor: { type: "armor", attack: 0, defense: 2, speed: 0, price: 30 },
  chainmail: { type: "armor", attack: 0, defense: 4, speed: -1, price: 50 },
  plateArmor: { type: "armor", attack: 0, defense: 6, speed: -2, price: 80 },
  cloak: { type: "armor", attack: 0, defense: 1, speed: 1, price: 20 },
  swiftBoots: { type: "armor", attack: 0, defense: 0, speed: 3, price: 40 }
};

const items = {
  healingPotion: { effect: (user) => { user.hp = Math.min(MAX_HP, user.hp + 15); return `${user.playerName} uses a Healing Potion, restoring 15 HP!`; }, price: 10 },
  herbalSalve: { effect: (user) => { user.hp = Math.min(MAX_HP, user.hp + 5); return `${user.playerName} applies Herbal Salve, healing 5 HP!`; }, price: 5 },
  campRations: { effect: (user) => { user.hp = Math.min(MAX_HP, user.hp + 10); return `${user.playerName} eats Camp Rations, recovering 10 HP!`; }, price: 8 },
  bomb: { effect: (user, target) => { const dmg = rollDamage("2d6"); target.hp -= dmg; return `${user.playerName} throws a Bomb, dealing ${dmg} damage!`; }, price: 20 },
  poisonDart: { effect: (user, target) => { target.poisonTurns = 3; return `${user.playerName} fires a Poison Dart—${target.name} is poisoned!`; }, price: 15 },
  sharpeningStone: { effect: (user) => { user.sharpenTurns = 3; return `${user.playerName} uses a Sharpening Stone (+2 attack for 3 turns)!`; }, price: 10 },
  bearTrap: { effect: (user, target) => { target.trapTurns = 2; target.stats.speed = 0; return `${user.playerName} sets a Bear Trap—${target.name} is immobilized!`; }, price: 25 },
  pocketSand: { effect: (user, target) => { target.blindTurns = 1; return `${user.playerName} tosses Pocket Sand—${target.name} is distracted!`; }, price: 5 },
  lockpick: { effect: () => "A tool for opening locks—useless in combat.", price: 10, sellPrice: 5 },
  wolfPelt: { effect: () => "A pelt from a wolf—good for trading.", price: 0, sellPrice: 8 }
};

const enemyAbilities = {
  steal: (user, target) => { target.gold = Math.max(0, target.gold - 5); return `${user.name} steals 5 gold from you!`; },
  bite: (user, target) => { const dmg = rollDamage("1d4"); target.hp -= dmg; return `${user.name} bites you for ${dmg} extra damage!`; },
  evade: (user) => { user.evadeTurns = 1; return `${user.name} prepares to evade (+2 AC for 1 turn)!`; }
};

// --- Utility Functions ---
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
  console.log("Game saved");
}

function loadPlayerData() {
  const savedData = localStorage.getItem("gameState");
  if (savedData) {
    gameState = JSON.parse(savedData);
    if (!Array.isArray(gameState.inventory)) gameState.inventory = [{ name: "healingPotion", quantity: 2 }, { name: "shortSword", quantity: 1 }];
    if (!gameState.equipped) gameState.equipped = { weapon: null, armor: null };
    if (gameState.class) {
      gameState.stats = { ...classes[gameState.class].stats };
      gameState.ability = classes[gameState.class].ability;
    }
  }
  console.log("Game loaded:", gameState);
}

function calculateAC(entity) {
  const baseAC = entity.baseAC || 10;
  const speedBonus = Math.floor((entity.stats.speed || 0) / 3);
  const defenseBonus = Math.floor((entity.stats.defense || 0) / 2);
  const equipBonus = (entity.equipped?.weapon?.defense || 0) + (entity.equipped?.armor?.defense || 0) + (entity.evadeTurns > 0 ? 2 : 0);
  const ac = baseAC + speedBonus + defenseBonus + equipBonus;
  console.log(`${entity.playerName || entity.name || "Player"} AC: ${ac}`);
  return ac;
}

// --- Inventory & Equipment Functions ---
function addToInventory(itemName, amount = 1) {
  const item = gameState.inventory.find(i => i.name === itemName);
  if (item) item.quantity += amount;
  else if (items[itemName] || equipment[itemName]) gameState.inventory.push({ name: itemName, quantity: amount });
  updateUI();
}

function removeFromInventory(itemName, amount = 1) {
  const item = gameState.inventory.find(i => i.name === itemName);
  if (item && item.quantity >= amount) {
    item.quantity -= amount;
    if (item.quantity === 0) gameState.inventory = gameState.inventory.filter(i => i.name !== itemName);
    return true;
  }
  return false;
}

function useItem(itemName, user, target) {
  const item = items[itemName];
  if (!item || !removeFromInventory(itemName)) return null;
  const effectMessage = typeof item.effect === "function" ? item.effect(user, target || user) : item.effect;
  updateUI();
  return effectMessage;
}

function equipItem(itemName) {
  const item = equipment[itemName];
  if (!item || !removeFromInventory(itemName)) return false;
  const current = gameState.equipped[item.type];
  if (current) {
    gameState.stats.attack -= current.attack || 0;
    gameState.stats.defense -= current.defense || 0;
    gameState.stats.speed -= current.speed || 0;
    addToInventory(current.name);
  }
  gameState.equipped[item.type] = item;
  gameState.stats.attack += item.attack || 0;
  gameState.stats.defense += item.defense || 0;
  gameState.stats.speed += item.speed || 0;
  console.log(`Equipped ${itemName}:`, gameState.stats);
  updateUI();
  return true;
}

// --- UI Functions ---
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
    weapon: document.getElementById("weapon"),
    armor: document.getElementById("armor"),
    enemyName: document.getElementById("enemyName"),
    enemyHP: document.getElementById("enemyHP")
  };

  if (elements.playerName) elements.playerName.textContent = gameState.playerName;
  if (elements.xp) elements.xp.textContent = `${gameState.xp}/${LEVEL_UP_XP}`;
  if (elements.hp) elements.hp.textContent = gameState.hp;
  if (elements.level) elements.level.textContent = gameState.level;
  if (elements.gold) elements.gold.textContent = gameState.gold;
  if (elements.att) elements.att.textContent = gameState.stats.attack;
  if (elements.def) elements.def.textContent = gameState.stats.defense;
  if (elements.spd) elements.spd.textContent = gameState.stats.speed;
  if (elements.weapon) elements.weapon.textContent = gameState.equipped.weapon?.name || "Fist";
  if (elements.armor) elements.armor.textContent = gameState.equipped.armor?.name || "None";
  if (elements.enemyName && combatState.currentEnemy) elements.enemyName.textContent = combatState.currentEnemy.name;
  if (elements.enemyHP) elements.enemyHP.textContent = combatState.currentEnemy?.hp > 0 ? combatState.currentEnemy.hp : "No enemy";
  if (elements.inventoryList) {
    elements.inventoryList.innerHTML = gameState.inventory.length === 0
      ? "<p class='item'>Empty</p>"
      : gameState.inventory.map(item => `<p class="item">${item.name}: ${item.quantity}</p>`).join("");
  }
}

function showAction(text) {
  const actionBox = document.getElementById("actionBox");
  if (actionBox) {
    const p = document.createElement("p");
    p.textContent = text;
    actionBox.appendChild(p);
    if (combatState.active) combatState.log.push(text);
    actionBox.classList.remove("hidden");
    actionBox.scrollTop = actionBox.scrollHeight;
    console.log("Action:", text);
  }
}

// --- Combat Functions ---
function startBattle(enemyType) {
  if (!enemies[enemyType]) {
    console.error("Invalid enemy type:", enemyType);
    return;
  }
  combatState.currentEnemy = { ...enemies[enemyType], ac: calculateAC(enemies[enemyType]), poisonTurns: 0, trapTurns: 0, blindTurns: 0, evadeTurns: 0, sharpenTurns: 0, stunTurns: 0 };
  gameState.ac = calculateAC(gameState);
  combatState.active = true;
  combatState.turn = "player";
  showAction(`A ${combatState.currentEnemy.name} appears! Your turn.`);
  showCombatMenu();
  updateUI();
}

function showCombatMenu() {
  const combatMenu = document.getElementById("combatMenu");
  if (!combatMenu) return;
  const isAmbush = window.location.pathname.includes("ambush.html");
  combatMenu.innerHTML = `
    <button id="attackOption">Attack</button>
    <button id="abilityOption">${gameState.ability?.name || "Ability"}</button>
    <button id="itemOption">Item</button>
    ${!isAmbush ? '<button id="runOption">Run</button>' : ''}
  `;
  combatMenu.classList.remove("hidden");
  document.getElementById("attackOption")?.addEventListener("click", () => playerAction("attack"), { once: true });
  document.getElementById("abilityOption")?.addEventListener("click", () => playerAction("ability"), { once: true });
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
    message = performAttack(gameState, combatState.currentEnemy);
  } else if (action === "ability") {
    message = gameState.ability.effect(gameState, combatState.currentEnemy);
  } else if (action === "item" && itemName) {
    message = useItem(itemName, gameState, combatState.currentEnemy) || `Can't use ${itemName} now!`;
  } else if (action === "run") {
    message = runAway();
  }
  showAction(message);
  updateEffects(gameState);
  updateUI();
  savePlayerData();

  if (combatState.currentEnemy.hp <= 0) {
    endBattle();
    return;
  }
  if (gameState.hp <= 0) {
    gameOver();
    return;
  }
  combatState.turn = "enemy";
  setTimeout(enemyTurn, 1000);
}

function performAttack(attacker, target) {
  console.log("Attacker:", attacker); // Debug log
  const stats = { ...attacker.stats, attack: attacker.sharpenTurns > 0 ? attacker.stats.attack + 2 : attacker.stats.attack };
  const weapon = attacker.equipped?.weapon || { damage: "1d4" }; // Safe access with fallback
  const attackRoll = rollDice(20) + stats.attack;
  const targetAC = target.ac;
  const name = attacker.playerName || attacker.name || "Unknown"; // Use attacker.name for enemies
  const targetName = attacker.playerName ? target.name : target.playerName || "you"; // Use target.playerName for player

  console.log(`${name} attacks: Roll=${attackRoll} vs AC=${targetAC}`);
  if (target.blindTurns > 0 || attackRoll >= targetAC) {
    let damage = rollDamage(weapon.damage) + stats.attack;
    const reduction = attacker.playerName ? 0 : Math.floor(gameState.stats.defense / 2);
    damage = Math.max(1, damage - reduction);
    target.hp -= damage;
    return `${name} hits ${targetName} for ${damage} damage${reduction > 0 ? ` (-${reduction})` : ""}!`;
  }
  return `${name} swings at ${targetName} but misses!`;
}

function runAway() {
  const damage = rollDice(4);
  gameState.hp -= damage;
  showAction(`You try to flee but take ${damage} damage from ${combatState.currentEnemy.name}!`);
  updateUI();
  savePlayerData();
  if (gameState.hp <= 0) gameOver();
  return null;
}

function enemyTurn() {
  if (!combatState.active || combatState.turn !== "enemy" || !combatState.currentEnemy) {
    console.log("Enemy turn skipped: Invalid state or enemy missing");
    return;
  }
  updateEffects(combatState.currentEnemy);
  const enemy = combatState.currentEnemy;
  let message = "";
  if (enemy.stunTurns > 0) {
    message = `${enemy.name} is stunned and cannot act!`;
  } else if (rollDice(2) === 1 && enemyAbilities[enemy.ability]) {
    message = enemyAbilities[enemy.ability](enemy, gameState);
  } else {
    message = performAttack(enemy, gameState);
  }
  showAction(message);
  updateUI();
  savePlayerData();

  if (gameState.hp <= 0) {
    gameOver();
    return;
  }
  if (enemy.hp <= 0) {
    endBattle();
    return;
  }
  combatState.turn = "player";
  showAction("Your turn.");
  showCombatMenu();
}

function updateEffects(entity) {
  if (entity.sharpenTurns > 0) entity.sharpenTurns--;
  if (entity.poisonTurns > 0) { entity.hp -= 2; entity.poisonTurns--; }
  if (entity.trapTurns > 0) { entity.trapTurns--; if (entity.trapTurns === 0) entity.stats.speed = enemies[entity.name.toLowerCase()].stats.speed; }
  if (entity.blindTurns > 0) entity.blindTurns--;
  if (entity.evadeTurns > 0) entity.evadeTurns--;
  if (entity.stunTurns > 0) entity.stunTurns--;
}

function endBattle() {
  const enemy = combatState.currentEnemy;
  combatState.active = false;
  combatState.currentEnemy = null;
  hideCombatMenu();
  gameState.gold += enemy.goldReward;
  gameState.xp += enemy.xpReward;
  let summary = `--- Battle Won! ---\nDefeated: ${enemy.name}\nRewards: +${enemy.goldReward} Gold, +${enemy.xpReward} XP`;
  
  // Loot Drops
  const commonRoll = rollDice(100);
  const rareRoll = rollDice(100);
  if (commonRoll <= enemy.loot.common[1]) addToInventory(enemy.loot.common[0]);
  if (rareRoll <= enemy.loot.rare[1]) addToInventory(enemy.loot.rare[0]);
  if (commonRoll <= enemy.loot.common[1] || rareRoll <= enemy.loot.rare[1]) {
    summary += `\nLoot: ${commonRoll <= enemy.loot.common[1] ? enemy.loot.common[0] : ""}${commonRoll <= enemy.loot.common[1] && rareRoll <= enemy.loot.rare[1] ? ", " : ""}${rareRoll <= enemy.loot.rare[1] ? enemy.loot.rare[0] : ""}`;
  }
  
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
  if (gameState.xp < LEVEL_UP_XP) return;
  gameState.level++;
  gameState.xp -= LEVEL_UP_XP;
  gameState.hp = Math.min(MAX_HP, gameState.hp + LEVEL_UP_HP_GAIN);
  gameState.stats.attack += 1;
  gameState.stats.defense += 1;
  gameState.stats.speed += 1;
  alert("You leveled up!");
  savePlayerData();
  updateUI();
}

function hideCombatMenu() {
  const combatMenu = document.getElementById("combatMenu");
  if (combatMenu) combatMenu.classList.add("hidden");
}

// --- Shop Functions ---
function handleBuyItem(itemName, price) {
  if (gameState.gold >= price) {
    gameState.gold -= price;
    if (equipment[itemName]) equipItem(itemName) ? showAction(`Equipped ${itemName}!`) : addToInventory(itemName);
    else addToInventory(itemName);
    showAction(`Bought ${itemName} for ${price} Gold!`);
    savePlayerData();
    updateUI();
    updateShopUI();
  } else {
    showAction("Not enough gold!");
  }
}

function handleSellItem(itemName) {
  const item = items[itemName] || equipment[itemName];
  const sellPrice = item.sellPrice || Math.floor(item.price / 2);
  if (removeFromInventory(itemName)) {
    gameState.gold += sellPrice;
    showAction(`Sold ${itemName} for ${sellPrice} Gold!`);
    savePlayerData();
    updateUI();
    updateShopUI();
  } else {
    showAction(`No ${itemName} to sell!`);
  }
}

function updateShopUI() {
  const buyList = document.getElementById("buyList");
  const sellList = document.getElementById("sellList");
  if (buyList) {
    buyList.innerHTML = Object.keys({ ...equipment, ...items }).map(item => {
      const data = equipment[item] || items[item];
      return data.price ? `<p>${item}: ${data.price} Gold <button class="buyBtn" data-item="${item}">Buy</button></p>` : "";
    }).join("");
    document.querySelectorAll(".buyBtn").forEach(btn => btn.addEventListener("click", () => handleBuyItem(btn.dataset.item, equipment[btn.dataset.item]?.price || items[btn.dataset.item].price), { once: true }));
  }
  if (sellList) {
    sellList.innerHTML = gameState.inventory.map(item => {
      const data = equipment[item.name] || items[item.name];
      const sellPrice = data.sellPrice || Math.floor(data.price / 2);
      return `<p>${item.name} (${item.quantity}): ${sellPrice} Gold <button class="sellBtn" data-item="${item.name}">Sell</button></p>`;
    }).join("");
    document.querySelectorAll(".sellBtn").forEach(btn => btn.addEventListener("click", () => handleSellItem(btn.dataset.item), { once: true }));
  }
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
  loadPlayerData();
  updateUI();
  const page = window.location.pathname;

  if (page.includes("index.html")) {
    if (gameState.class) {
      window.location.href = "camp.html"; // Skip if class already chosen
    } else {
      // Removed: showAction("Choose your class:");
      document.getElementById("warriorBtn")?.addEventListener("click", () => {
        gameState.class = "warrior";
        gameState.stats = { ...classes.warrior.stats };
        gameState.ability = classes.warrior.ability;
        gameState.playerName = "Torin Blackthorne";
        savePlayerData();
        // showAction("You take up the path of Torin Blackthorne, the Warrior!"); // Commented out as no actionBox on index.html
        setTimeout(() => window.location.href = "camp.html", 1000);
      });
      document.getElementById("rogueBtn")?.addEventListener("click", () => {
        gameState.class = "rogue";
        gameState.stats = { ...classes.rogue.stats };
        gameState.ability = classes.rogue.ability;
        gameState.playerName = "Lira Swiftblade";
        savePlayerData();
        // showAction("You embrace the shadows as Lira Swiftblade, the Rogue!");
        setTimeout(() => window.location.href = "camp.html", 1000);
      });
      document.getElementById("guardianBtn")?.addEventListener("click", () => {
        gameState.class = "guardian";
        gameState.stats = { ...classes.guardian.stats };
        gameState.ability = classes.guardian.ability;
        gameState.playerName = "Thane Ironwall";
        savePlayerData();
        // showAction("You stand firm as Thane Ironwall, the Guardian!");
        setTimeout(() => window.location.href = "camp.html", 1000);
      });
    }
  } else if (page.includes("camp.html")) {
    showAction(localStorage.getItem("lastActionMessage") || "You’ve arrived at camp.");
    document.getElementById("exploreBtn")?.addEventListener("click", () => {
      showAction("You head into the wild forest...");
      savePlayerData();
      setTimeout(() => window.location.href = "exploration.html", 1000);
    });
    document.getElementById("shopBtn")?.addEventListener("click", () => {
      showAction("You approach the merchant...");
      savePlayerData();
      setTimeout(() => window.location.href = "shop.html", 1000);
    });
    document.getElementById("shortRestBtn")?.addEventListener("click", () => {
      const roll = rollDice(20);
      const message = roll >= 6 ? `You rest well (+5 HP).` : "Ambush!";
      if (roll >= 6) gameState.hp = Math.min(MAX_HP, gameState.hp + 5);
      showAction(message);
      savePlayerData();
      updateUI();
      if (roll < 6) setTimeout(() => window.location.href = "ambush.html", 1000);
    });
  } else if (page.includes("exploration.html")) {
    document.getElementById("forestBtn")?.addEventListener("click", () => {
      const roll = rollDice(20);
      const enemyType = roll <= 10 ? "bandit" : roll <= 15 ? "wolves" : "thief";
      startBattle(enemyType);
      const banditEnemyImg = document.getElementById("banditEnemy");
      if (banditEnemyImg) {
        banditEnemyImg.src = enemies[enemyType].image;
        banditEnemyImg.classList.remove("hidden");
      }
      const combatContainer = document.getElementById("combat-container");
      if (combatContainer) combatContainer.classList.remove("hidden");
      document.getElementById("forestBtn")?.classList.add("hidden");
      document.getElementById("campBtn")?.classList.add("hidden");
    });
    document.getElementById("campBtn")?.addEventListener("click", () => {
      const message = "You return to camp.";
      showAction(message);
      savePlayerData();
      localStorage.setItem("lastActionMessage", message);
      setTimeout(() => window.location.href = "camp.html", 1000);
    });
  } else if (page.includes("ambush.html")) {
    const enemyType = Object.keys(enemies)[rollDice(Object.keys(enemies).length) - 1];
    startBattle(enemyType);
    const banditEnemyImg = document.getElementById("banditEnemy");
    if (banditEnemyImg) {
      banditEnemyImg.src = enemies[enemyType].image;
      banditEnemyImg.classList.remove("hidden");
    }
    const combatContainer = document.getElementById("combat-container");
    if (combatContainer) combatContainer.classList.remove("hidden");
    document.getElementById("campBtn")?.classList.add("hidden");
  } else if (page.includes("shop.html")) {
    showAction("Welcome to the shop!");
    updateShopUI();
    document.getElementById("returnBtn")?.addEventListener("click", () => {
      showAction("You head back to camp...");
      savePlayerData();
      setTimeout(() => window.location.href = "camp.html", 1000);
    });
  } else if (page.includes("gameover.html")) {
    document.getElementById("restartBtn")?.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "index.html";
    });
  }
});