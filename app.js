// ============================================================================
// GAME CONSTANTS
// ============================================================================
const LEVEL_UP_XP = 100;
const LEVEL_UP_HP_GAIN = 5;
const MAX_HP = 100;

// ============================================================================
// GAME STATE
// ============================================================================
let gameState = {
    playerName: "Unknown",
    class: null,
    xp: 0,
    hp: 20,
    maxHp: 20,
    level: 1,
    stats: { attack: 0, defense: 0, speed: 0 },
    baseAC: 10,
    gold: 100,
    inventory: [
        { name: "healingPotion", quantity: 2 },
        { name: "shortSword", quantity: 1 }
    ],
    equipped: { weapon: null, armor: null },
    ability: null
};

let combatState = {
    active: false,
    turn: "player",
    currentEnemy: null,
    log: []
};

// ============================================================================
// DATA
// ============================================================================
const classes = {
    warrior: {
        stats: { attack: 5, defense: 3, speed: 1 },
        ability: {
            name: "Cleave",
            effect: (user, target) => {
                const dmg = rollDamage("1d10") + user.stats.attack;
                target.hp -= dmg;
                return `${user.playerName} uses Cleave, dealing ${dmg} damage!`;
            }
        }
    },
    rogue: {
        stats: { attack: 3, defense: 1, speed: 5 },
        ability: {
            name: "Backstab",
            effect: (user, target) => {
                const dmg = rollDamage("1d6") + user.stats.attack + 2;
                target.hp -= dmg;
                return `${user.playerName} uses Backstab, striking for ${dmg} damage!`;
            }
        }
    },
    guardian: {
        stats: { attack: 3, defense: 5, speed: 1 },
        ability: {
            name: "Shield Bash",
            effect: (user, target) => {
                const dmg = rollDamage("1d6") + user.stats.attack;
                target.hp -= dmg;
                target.stunTurns = 1;
                return `${user.playerName} uses Shield Bash, dealing ${dmg} damage and stunning ${target.name}!`;
            }
        }
    }
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
        ability: "steal",
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
        ability: "bite",
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
        ability: "evade",
        loot: { common: ["lockpick", 40], rare: ["swiftBoots", 8] }
    },
    trickster: {
        name: "Trickster",
        hp: 8,
        stats: { attack: 1, speed: 7, defense: 1 },
        goldReward: 20,
        xpReward: 20,
        image: "/assets/img_folder/enemies/trickster.jpg",
        damage: "1d4",
        ability: "feint",
        loot: { common: ["pocketSand", 60], rare: ["sharpeningStone", 15] }
    },
    bountyHunter: {
        name: "Bounty Hunter",
        hp: 20,
        stats: { attack: 4, speed: 4, defense: 3 },
        goldReward: 25,
        xpReward: 35,
        image: "/assets/img_folder/enemies/bountyHunter.jpg",
        damage: "1d8",
        ability: "bash",
        loot: { common: ["goldCoin", 50], rare: ["shortSword", 20] }
    },
    banditScout: {
        name: "Bandit Scout",
        hp: 10,
        stats: { attack: 2, speed: 5, defense: 1 },
        goldReward: 15,
        xpReward: 25,
        image: "/assets/img_folder/enemies/banditScout.jpg",
        damage: "1d6",
        ability: "ambush",
        loot: { common: ["lockpick", 50], rare: ["cloak", 10] }
    },
    banditBrute: {
        name: "Bandit Brute",
        hp: 18,
        stats: { attack: 5, speed: 2, defense: 3 },
        goldReward: 20,
        xpReward: 30,
        image: "/assets/img_folder/enemies/banditBrute.jpg",
        damage: "1d8",
        ability: "charge",
        loot: { common: ["goldCoin", 50], rare: ["chainmail", 10] }
    },
    banditSniper: {
        name: "Bandit Sniper",
        hp: 12,
        stats: { attack: 3, speed: 4, defense: 2 },
        goldReward: 20,
        xpReward: 25,
        image: "/assets/img_folder/enemies/banditSniper.jpg",
        damage: "1d6",
        ability: "lunge",
        loot: { common: ["bomb", 40], rare: ["bow", 15] }
    },
    banditThug: {
        name: "Bandit Thug",
        hp: 15,
        stats: { attack: 3, speed: 3, defense: 2 },
        goldReward: 15,
        xpReward: 20,
        image: "/assets/img_folder/enemies/banditThug.jpg",
        damage: "1d6",
        ability: "bash",
        loot: { common: ["goldCoin", 50], rare: ["leatherArmor", 10] }
    },
    banditRogue: {
        name: "Bandit Rogue",
        hp: 10,
        stats: { attack: 2, speed: 6, defense: 1 },
        goldReward: 20,
        xpReward: 25,
        image: "/assets/img_folder/enemies/banditRogue.jpg",
        damage: "1d4",
        ability: "disarm",
        loot: { common: ["dagger", 60], rare: ["swiftBoots", 15] }
    },
    hoshithesloth: {
        name: "hoshiTheSloth",
        hp: 50,
        stats: { attack: 15, defense: 1, speed: 9 },
        goldReward: 5000,
        xpReward: 50,
        image: "/assets/img_folder/enemies/hoshithesloth.jpg",
        damage: "1d10",
        ability: "evade",
        loot: { common: [{ item: "campRations", chance: 50 }, { item: "campRations", chance: 50 }, { item: "campRations", chance: 50 }, { item: "campRations", chance: 50 }, { item: "campRations", chance: 50 }, { item: "campRations", chance: 50 }], rare: [{ item: "dagger", chance: 10 }] }
    },
    valontheimmortal: {
        name: "valonTheImmortal",
        hp: 50,
        stats: { attack: 6, defense: 15, speed: 9 },
        goldReward: 5000,
        xpReward: 50,
        image: "/assets/img_folder/enemies/valontheimmortal.jpg",
        damage: "1d10",
        ability: "block",
        loot: { common: [{ item: "chainmail", chance: 50 }], rare: [{ item: "dagger", chance: 10 }] }
    },
    dirtydave: {
        name: "dirtyDave",
        hp: 50,
        stats: { attack: 10, defense: 1, speed: 15 },
        goldReward: 5000,
        xpReward: 50,
        image: "/assets/img_folder/enemies/dirtydave.jpg",
        damage: "1d10",
        ability: "slash",
        loot: { common: [{ item: "dagger", chance: 50 }, { item: "pocketSand", chance: 50 }, { item: "silverRing", chance: 50 }], rare: [{ item: "dagger", chance: 10 }] }
    },
    banditKing: {
        name: "Bandit King",
        hp: 50,
        stats: { attack: 6, speed: 5, defense: 5 },
        goldReward: 100,
        xpReward: 150,
        image: "/assets/img_folder/enemies/banditKing.jpeg",
        damage: "1d10",
        ability: "intimidate",
        loot: { common: ["goldCoin", 80], rare: ["longsword", 50] }
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
    healingPotion: {
        effect: (user) => {
            user.hp = Math.min(MAX_HP, user.hp + 15);
            return `${user.playerName} uses a Healing Potion, restoring 15 HP!`;
        },
        price: 10
    },
    herbalSalve: {
        effect: (user) => {
            user.hp = Math.min(MAX_HP, user.hp + 5);
            return `${user.playerName} applies Herbal Salve, healing 5 HP!`;
        },
        price: 5
    },
    campRations: {
        effect: (user) => {
            user.hp = Math.min(MAX_HP, user.hp + 10);
            return `${user.playerName} eats Camp Rations, recovering 10 HP!`;
        },
        price: 8
    },
    bomb: {
        effect: (user, target) => {
            const dmg = rollDamage("2d6");
            target.hp -= dmg;
            return `${user.playerName} throws a Bomb, dealing ${dmg} damage!`;
        },
        price: 20
    },
    poisonDart: {
        effect: (user, target) => {
            target.poisonTurns = 3;
            return `${user.playerName} fires a Poison Dart—${target.name} is poisoned!`;
        },
        price: 15
    },
    sharpeningStone: {
        effect: (user) => {
            user.sharpenTurns = 3;
            return `${user.playerName} uses a Sharpening Stone (+2 attack for 3 turns)!`;
        },
        price: 10
    },
    bearTrap: {
        effect: (user, target) => {
            target.trapTurns = 2;
            target.stats.speed = 0;
            return `${user.playerName} sets a Bear Trap—${target.name} is immobilized!`;
        },
        price: 25
    },
    pocketSand: {
        effect: (user, target) => {
            target.blindTurns = 1;
            return `${user.playerName} tosses Pocket Sand—${target.name} is distracted!`;
        },
        price: 5
    },
    lockpick: { effect: () => "A tool for opening locks—useless in combat.", price: 10, sellPrice: 5 },
    wolfPelt: { effect: () => "A pelt from a wolf—good for trading.", price: 0, sellPrice: 8 },
    goldCoin: { effect: () => "A shiny coin—worth something to someone.", price: 0, sellPrice: 1 },
    rareGem: { effect: () => "A valuable gemstone—rare and precious.", price: 0, sellPrice: 50 }
};

const enemyAbilities = {
    steal: (user, target) => {
        target.gold = Math.max(0, target.gold - 5);
        return `${user.name} steals 5 gold from you!`;
    },
    bite: (user, target) => {
        const dmg = rollDamage("1d4");
        target.hp -= dmg;
        return `${user.name} bites you for ${dmg} extra damage!`;
    },
    evade: (user) => {
        user.evadeTurns = 1;
        return `${user.name} prepares to evade (+2 AC for 1 turn)!`;
    },
    charge: (user, target) => {
        const dmg = rollDamage("1d6") + user.stats.attack;
        target.hp -= dmg;
        return `${user.name} charges, dealing ${dmg} bonus damage!`;
    },
    slash: (user, target) => {
        const dmg = rollDamage(user.damage) + user.stats.attack;
        target.hp -= dmg;
        if (rollDice(100) <= 20) target.poisonTurns = 3;
        return `${user.name} slashes for ${dmg} damage${target.poisonTurns > 0 ? " and causes bleeding!" : ""}!`;
    },
    howl: (user, target) => {
        target.attackReduction = 1;
        target.attackReductionTurns = 2;
        return `${user.name} howls, reducing your attack by 1 for 2 turns!`;
    },
    ambush: (user) => {
        user.speedBonus = 2;
        user.speedBonusTurns = 1;
        return `${user.name} prepares an ambush (+2 speed this turn)!`;
    },
    disarm: (user, target) => {
        if (rollDice(100) <= 10 && target.equipped.weapon) {
            const weapon = target.equipped.weapon;
            target.stats.attack -= weapon.attack;
            target.stats.defense -= weapon.defense;
            target.stats.speed -= weapon.speed;
            target.equipped.weapon = null;
            addToInventory(weapon.name);
            return `${user.name} disarms you, dropping your ${weapon.name}!`;
        }
        return `${user.name} tries to disarm you but fails!`;
    },
    taunt: (user, target) => {
        target.tauntTurns = 1;
        return `${user.name} taunts you, forcing your next attack!`;
    },
    sneak: (user, target) => {
        const dmg = rollDamage(user.damage) + user.stats.attack;
        target.hp -= dmg;
        return `${user.name} sneaks in a free attack for ${dmg} damage!`;
    },
    frenzy: (user) => {
        user.frenzyBonus = (user.frenzyBonus || 0) + 1;
        user.frenzyBonus = Math.min(user.frenzyBonus, 3);
        return `${user.name} enters a frenzy (+${user.frenzyBonus} attack)!`;
    },
    pounce: (user, target) => {
        const dmg = user.stats.speed > target.stats.speed ? rollDamage(user.damage) * 2 + user.stats.attack : rollDamage(user.damage) + user.stats.attack;
        target.hp -= dmg;
        return `${user.name} pounces for ${dmg} damage!`;
    },
    ravage: (user, target) => {
        const dmg1 = Math.floor(rollDamage(user.damage) / 2) + user.stats.attack;
        const dmg2 = Math.floor(rollDamage(user.damage) / 2) + user.stats.attack;
        target.hp -= (dmg1 + dmg2);
        return `${user.name} ravages you for ${dmg1} and ${dmg2} damage!`;
    },
    block: (user) => {
        user.blockBonus = 2;
        user.blockTurns = 1;
        return `${user.name} prepares to block (-2 damage taken this turn)!`;
    },
    counter: (user, target) => {
        const dmg = rollDamage("1d4");
        target.hp -= dmg;
        return `${user.name} counters for ${dmg} damage!`;
    },
    lunge: (user, target) => {
        const dmg = rollDamage(user.damage) + user.stats.attack - Math.floor(target.stats.defense / 2);
        target.hp -= dmg;
        return `${user.name} lunges, ignoring half defense for ${dmg} damage!`;
    },
    intimidate: (user, target) => {
        target.speedReduction = 2;
        target.speedReductionTurns = 2;
        return `${user.name} intimidates you, lowering speed by 2 for 2 turns!`;
    },
    feint: (user) => {
        user.feintBonus = 2;
        user.feintTurns = 1;
        return `${user.name} feints (+2 to hit next attack)!`;
    },
    roar: (user, target) => {
        if (rollDice(100) <= 10) {
            target.stunTurns = 1;
            return `${user.name} roars, stunning you!`;
        }
        return `${user.name} roars but you resist!`;
    },
    cripple: (user, target) => {
        target.stats.speed = Math.max(0, target.stats.speed - 1);
        return `${user.name} cripples you, reducing speed by 1 permanently!`;
    },
    bash: (user, target) => {
        const dmg = rollDamage("1d6") + user.stats.attack;
        target.hp -= dmg;
        if (rollDice(100) <= 20) target.stunTurns = 1;
        return `${user.name} bashes for ${dmg} damage${target.stunTurns > 0 ? " and stuns you!" : ""}!`;
    },
    sweep: (user, target) => {
        const dmg = Math.floor(rollDamage(user.damage) / 2) + user.stats.attack;
        target.hp -= dmg;
        return `${user.name} sweeps for ${dmg} damage!`;
    },
    gouge: (user, target) => {
        const dmg = rollDamage("1d8") + user.stats.attack;
        target.hp -= dmg;
        if (rollDice(100) <= 15) target.blindTurns = 1;
        return `${user.name} gouges for ${dmg} damage${target.blindTurns > 0 ? " and blinds you!" : ""}!`;
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
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
    const dataToSave = JSON.stringify(gameState);
    console.log("Saving to localStorage:", dataToSave);
    localStorage.setItem("gameState", dataToSave);
    console.log("Game saved");
}

function loadPlayerData() {
    const savedData = localStorage.getItem("gameState");
    if (savedData) {
        gameState = JSON.parse(savedData);
        if (!Array.isArray(gameState.inventory)) {
            gameState.inventory = [{ name: "healingPotion", quantity: 2 }, { name: "shortSword", quantity: 1 }];
        }
        if (!gameState.equipped) {
            gameState.equipped = { weapon: null, armor: null };
        }
        if (gameState.class && classes[gameState.class]) {
            const baseStats = { ...classes[gameState.class].stats };
            if (gameState.equipped.weapon) {
                baseStats.attack += gameState.equipped.weapon.attack || 0;
                baseStats.defense += gameState.equipped.weapon.defense || 0;
                baseStats.speed += gameState.equipped.weapon.speed || 0;
            }
            if (gameState.equipped.armor) {
                baseStats.attack += gameState.equipped.armor.attack || 0;
                baseStats.defense += gameState.equipped.armor.defense || 0;
                baseStats.speed += gameState.equipped.armor.speed || 0;
            }
            gameState.stats = baseStats;
            gameState.ability = classes[gameState.class].ability;
        }
    }
    console.log("Game loaded:", gameState);
}

function calculateAC(entity) {
    const baseAC = entity.baseAC || 10;
    const speedBonus = Math.floor(((entity.stats.speed || 0) + (entity.speedBonus || 0)) / 3);
    const defenseBonus = Math.floor((entity.stats.defense || 0) / 2);
    const equipBonus = (entity.equipped?.weapon?.defense || 0) + (entity.equipped?.armor?.defense || 0) + (entity.evadeTurns > 0 ? 2 : 0);
    const ac = baseAC + speedBonus + defenseBonus + equipBonus;
    console.log(`${entity.playerName || entity.name || "Player"} AC: ${ac}`);
    return ac;
}

// ============================================================================
// INVENTORY & EQUIPMENT FUNCTIONS
// ============================================================================
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

function equipItem(itemName, type) {
    const item = equipment[itemName];
    if (!item || !removeFromInventory(itemName)) {
        showAction(`Cannot equip ${itemName} - not in inventory!`);
        return false;
    }

    const current = gameState.equipped[type];
    if (current) {
        gameState.stats.attack -= current.attack || 0;
        gameState.stats.defense -= current.defense || 0;
        gameState.stats.speed -= current.speed || 0;
        addToInventory(current.name);
        showAction(`Unequipped ${current.name}.`);
    }

    gameState.equipped[type] = { ...item }; // Ensure full item object with name
    gameState.stats.attack += item.attack || 0;
    gameState.stats.defense += item.defense || 0;
    gameState.stats.speed += item.speed || 0;
    showAction(`Equipped ${itemName}.`);
    console.log("Equipped:", gameState.equipped);

    savePlayerData();
    updateUI();
    return true;
}

function unequipItem(type) {
    const current = gameState.equipped[type];
    if (!current) return;

    gameState.stats.attack -= current.attack || 0;
    gameState.stats.defense -= current.defense || 0;
    gameState.stats.speed -= current.speed || 0;
    addToInventory(current.name);
    gameState.equipped[type] = null;
    showAction(`Unequipped ${current.name}.`);
    console.log("After unequipItem:", gameState.equipped);

    savePlayerData();
    updateUI();
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================
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
        equippedWeapon: document.getElementById("equippedWeapon"),
        equippedArmor: document.getElementById("equippedArmor"),
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
    if (elements.equippedWeapon) {
        elements.equippedWeapon.textContent = (gameState.equipped && gameState.equipped.weapon && gameState.equipped.weapon.name) 
            ? gameState.equipped.weapon.name 
            : "None";
    }
    if (elements.equippedArmor) {
        elements.equippedArmor.textContent = (gameState.equipped && gameState.equipped.armor && gameState.equipped.armor.name) 
            ? gameState.equipped.armor.name 
            : "None";
    }
    if (elements.inventoryList) {
        elements.inventoryList.innerHTML = gameState.inventory.length === 0
            ? "<p class='item'>Empty</p>"
            : gameState.inventory.map(item => `<p class="item">${item.name}: ${item.quantity}</p>`).join("");
    }
    console.log("UI update - Equipped:", gameState.equipped);

    if (combatState.active && combatState.currentEnemy) {
        if (elements.enemyName) elements.enemyName.textContent = combatState.currentEnemy.name;
        if (elements.enemyHP) elements.enemyHP.textContent = combatState.currentEnemy.hp;
        const enemyHealthBar = document.getElementById("enemy-health");
        if (enemyHealthBar) {
            const enemyKey = combatState.currentEnemy.enemyType || combatState.currentEnemy.name.toLowerCase();
            const enemyData = enemies[enemyKey];
            if (!enemyData) {
                console.error("Enemy not found in enemies object:", enemyKey, combatState.currentEnemy);
                return;
            }
            const maxHp = enemyData.hp;
            const hpPercent = (combatState.currentEnemy.hp / maxHp) * 100;
            enemyHealthBar.style.width = `${hpPercent}%`;
        }
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

function showEquipMenu() {
    const equipMenu = document.getElementById("equipMenu");
    if (!equipMenu) return;

    const weapons = gameState.inventory.filter(item => equipment[item.name]?.type === "weapon");
    const armors = gameState.inventory.filter(item => equipment[item.name]?.type === "armor");

    // Ensure gameState.equipped is initialized
    if (!gameState.equipped) {
        gameState.equipped = { weapon: null, armor: null };
    }

    equipMenu.innerHTML = `
        <h3>Equip Items</h3>
        <div class="equip-section">
            <h4>Weapons (Equipped: ${(gameState.equipped.weapon && gameState.equipped.weapon.name) ? gameState.equipped.weapon.name : "None"})</h4>
            ${weapons.length > 0 
                ? weapons.map(item => {
                    const stats = equipment[item.name];
                    const isEquipped = gameState.equipped.weapon && gameState.equipped.weapon.name === item.name;
                    return `
                        <p>
                            ${item.name} (${item.quantity})
                            <span class="stat-preview">
                                [A:${stats.attack || 0} D:${stats.defense || 0} S:${stats.speed || 0}]
                            </span>
                            <button class="equipBtn" data-item="${item.name}" data-type="weapon" ${isEquipped ? "disabled" : ""}>
                                ${isEquipped ? "Equipped" : "Equip"}
                            </button>
                            ${isEquipped ? `<button class="unequipBtn" data-item="${item.name}" data-type="weapon">Unequip</button>` : ""}
                        </p>`;
                }).join("") 
                : "<p>No weapons available</p>"}
        </div>
        <div class="equip-section">
            <h4>Armor (Equipped: ${(gameState.equipped.armor && gameState.equipped.armor.name) ? gameState.equipped.armor.name : "None"})</h4>
            ${armors.length > 0 
                ? armors.map(item => {
                    const stats = equipment[item.name];
                    const isEquipped = gameState.equipped.armor && gameState.equipped.armor.name === item.name;
                    return `
                        <p>
                            ${item.name} (${item.quantity})
                            <span class="stat-preview">
                                [A:${stats.attack || 0} D:${stats.defense || 0} S:${stats.speed || 0}]
                            </span>
                            <button class="equipBtn" data-item="${item.name}" data-type="armor" ${isEquipped ? "disabled" : ""}>
                                ${isEquipped ? "Equipped" : "Equip"}
                            </button>
                            ${isEquipped ? `<button class="unequipBtn" data-item="${item.name}" data-type="armor">Unequip</button>` : ""}
                        </p>`;
                }).join("") 
                : "<p>No armor available</p>"}
        </div>
        <button id="backBtn">Back</button>
    `;

    equipMenu.classList.remove("hidden");

    document.querySelectorAll(".equipBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const itemName = btn.dataset.item;
            const type = btn.dataset.type;
            equipItem(itemName, type);
            showEquipMenu();
        }, { once: true });
    });

    document.querySelectorAll(".unequipBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const itemName = btn.dataset.item;
            const type = btn.dataset.type;
            unequipItem(type);
            showEquipMenu();
        }, { once: true });
    });

    document.getElementById("backBtn").addEventListener("click", () => {
        equipMenu.classList.add("hidden");
        showAction("You’re back at camp.");
    }, { once: true });

    console.log("showEquipMenu - gameState.equipped:", gameState.equipped);
}

// ============================================================================
// COMBAT FUNCTIONS
// ============================================================================
function startBattle(enemyType) {
    if (enemyType === "negative") {
        const roll = rollDice(3);
        let message = "";
        if (roll === 1) {
            const dmg = rollDice(6);
            gameState.hp -= dmg;
            message = `You step into a trap, taking ${dmg} damage!`;
        } else if (roll === 2) {
            const goldLoss = Math.min(gameState.gold, 10);
            gameState.gold -= goldLoss;
            message = `A pickpocket swipes ${goldLoss} gold from you!`;
        } else {
            message = `You don't find anything`;
        }
        showAction(message);
        updateUI();
        savePlayerData();
        if (gameState.hp <= 0) gameOver();
        return;
    } else if (enemyType === "positive") {
        const roll = rollDice(3);
        let message = "";
        if (roll === 1) {
            const hpGain = rollDice(8) + 2;
            gameState.hp = Math.min(gameState.maxHp, gameState.hp + hpGain);
            message = `You find a hidden spring and recover ${hpGain} HP!`;
        } else if (roll === 2) {
            const goldGain = rollDice(10) + 10;
            gameState.gold += goldGain;
            message = `You discover a lost pouch with ${goldGain} gold!`;
        } else {
            const item = ["healingPotion", "sharpeningStone", "campRations"][rollDice(3) - 1];
            addToInventory(item);
            message = `You stumble upon a ${item}!`;
        }
        showAction(message);
        updateUI();
        savePlayerData();
        return;
    } else {
        if (!enemies[enemyType]) {
            console.error("Invalid enemy type:", enemyType);
            return;
        }
        combatState.currentEnemy = {
            ...enemies[enemyType],
            enemyType: enemyType, // Store the original key for reliable lookup
            ac: calculateAC(enemies[enemyType]),
            poisonTurns: 0,
            trapTurns: 0,
            blindTurns: 0,
            evadeTurns: 0,
            sharpenTurns: 0,
            stunTurns: 0,
            attackReduction: 0,
            attackReductionTurns: 0,
            speedBonus: 0,
            speedBonusTurns: 0,
            tauntTurns: 0,
            frenzyBonus: 0,
            blockBonus: 0,
            blockTurns: 0,
            feintBonus: 0,
            feintTurns: 0,
            speedReduction: 0,
            speedReductionTurns: 0
        };
        gameState.ac = calculateAC(gameState);
        combatState.active = true;
        combatState.turn = "player";
        showAction(enemyType === "banditKing" 
            ? "The Bandit King emerges from the shadows—there’s no escape now!" 
            : `A ${combatState.currentEnemy.name} appears! Your turn.`);

        const enemyNameEl = document.getElementById("enemyName");
        const enemyHPEl = document.getElementById("enemyHP");
        if (enemyNameEl) enemyNameEl.textContent = combatState.currentEnemy.name;
        if (enemyHPEl) enemyHPEl.textContent = combatState.currentEnemy.hp;

        const campBtn = document.getElementById("campBtn");
        const forestBtn = document.getElementById("forestBtn");
        if (campBtn) campBtn.classList.add("hidden");
        if (forestBtn) forestBtn.classList.add("hidden");

        const combatContainer = document.getElementById("combat-container");
        if (combatContainer) combatContainer.classList.remove("hidden");

        const banditEnemyImg = document.getElementById("banditEnemy");
        if (banditEnemyImg) {
            banditEnemyImg.src = enemies[enemyType].image;
            banditEnemyImg.classList.remove("hidden");
        }

        showCombatMenu(enemyType === "banditKing");
    }
}

function showCombatMenu(disableRun = false) {
    const combatMenu = document.getElementById("combatMenu");
    if (!combatMenu) return;
    const isAmbush = window.location.pathname.includes("ambush.html");
    combatMenu.innerHTML = `
        <button id="attackOption">Attack</button>
        <button id="abilityOption">${gameState.ability?.name || "Ability"}</button>
        <button id="itemOption">Item</button>
        ${!isAmbush && !disableRun ? '<button id="runOption">Run</button>' : ''}
    `;
    combatMenu.classList.remove("hidden");
    document.getElementById("attackOption")?.addEventListener("click", () => playerAction("attack"), { once: true });
    document.getElementById("abilityOption")?.addEventListener("click", () => playerAction("ability"), { once: true });
    document.getElementById("itemOption")?.addEventListener("click", showItemMenu, { once: true });
    if (!isAmbush && !disableRun) document.getElementById("runOption")?.addEventListener("click", () => playerAction("run"), { once: true });
    document.getElementById("viewLogOption")?.addEventListener("click", showCombatLog, { once: true });
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

function showCombatLog() {
    const logText = combatState.log.length > 0 
        ? combatState.log.join("\n") 
        : "No combat actions have occurred yet.";
    const actionBox = document.getElementById("actionBox");
    if (actionBox) {
        actionBox.innerHTML = "";
        const p = document.createElement("p");
        p.textContent = "--- Combat Log ---\n" + logText;
        actionBox.appendChild(p);
        actionBox.classList.remove("hidden");
        actionBox.scrollTop = actionBox.scrollHeight;
    } else {
        alert("Combat Log:\n" + logText);
    }
    setTimeout(showCombatMenu, 100);
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

    if (combatState.currentEnemy && combatState.currentEnemy.hp <= 0) {
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
    const stats = {
        ...attacker.stats,
        attack: (attacker.sharpenTurns > 0 ? attacker.stats.attack + 2 : attacker.stats.attack) -
                (attacker.attackReduction || 0) + (attacker.frenzyBonus || 0)
    };
    const weapon = attacker.equipped?.weapon || { damage: "1d4" };
    const attackRoll = rollDice(20) + stats.attack + (attacker.feintBonus || 0);
    const targetAC = target.ac;
    const name = attacker.playerName || attacker.name || "Unknown";
    const targetName = attacker.playerName ? target.name : target.playerName || "you";

    console.log(`${name} attacks: Roll=${attackRoll} vs AC=${targetAC}`);
    if (target.blindTurns > 0 || attackRoll >= targetAC) {
        let damage = rollDamage(weapon.damage) + stats.attack;
        const reduction = attacker.playerName ? (target.blockBonus || 0) : Math.floor(gameState.stats.defense / 2);
        damage = Math.max(1, damage - reduction);
        target.hp -= damage;
        if (!attacker.playerName && enemyAbilities.counter) showAction(enemyAbilities.counter(target, attacker));
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
    else {
        combatState.active = false;
        combatState.currentEnemy = null;
        setTimeout(() => window.location.href = "exploration.html", 1000);
    }
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
        if (enemy.ability === "sneak" && enemy.hp === enemies[enemy.name.toLowerCase()].hp) {
            enemy.hp--;
        }
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
    showCombatMenu(enemy.name === "Bandit King");
}

function updateEffects(entity) {
    if (entity.sharpenTurns > 0) entity.sharpenTurns--;
    if (entity.poisonTurns > 0) { entity.hp -= 2; entity.poisonTurns--; }
    if (entity.trapTurns > 0) { entity.trapTurns--; if (entity.trapTurns === 0) entity.stats.speed = enemies[entity.name.toLowerCase()]?.stats.speed || entity.stats.speed; }
    if (entity.blindTurns > 0) entity.blindTurns--;
    if (entity.evadeTurns > 0) entity.evadeTurns--;
    if (entity.stunTurns > 0) entity.stunTurns--;
    if (entity.attackReductionTurns > 0) { entity.attackReductionTurns--; if (entity.attackReductionTurns === 0) entity.attackReduction = 0; }
    if (entity.speedBonusTurns > 0) { entity.speedBonusTurns--; if (entity.speedBonusTurns === 0) entity.speedBonus = 0; }
    if (entity.tauntTurns > 0) entity.tauntTurns--;
    if (entity.blockTurns > 0) { entity.blockTurns--; if (entity.blockTurns === 0) entity.blockBonus = 0; }
    if (entity.feintTurns > 0) { entity.feintTurns--; if (entity.feintTurns === 0) entity.feintBonus = 0; }
    if (entity.speedReductionTurns > 0) { entity.speedReductionTurns--; if (entity.speedReductionTurns === 0) entity.speedReduction = 0; }
}

function endBattle() {
    const enemy = combatState.currentEnemy;
    combatState.active = false;
    combatState.currentEnemy = null;
    combatState.log = [];
    hideCombatMenu();

    gameState.gold += enemy.goldReward;
    gameState.xp += enemy.xpReward;
    let summary = `--- Battle Won! ---\nDefeated: ${enemy.name}\nRewards: +${enemy.goldReward} Gold, +${enemy.xpReward} XP`;

    const commonRoll = rollDice(100);
    const rareRoll = rollDice(100);
    if (commonRoll <= enemy.loot.common[1]) addToInventory(enemy.loot.common[0]);
    if (rareRoll <= enemy.loot.rare[1]) addToInventory(enemy.loot.rare[0]);
    if (commonRoll <= enemy.loot.common[1] || rareRoll <= enemy.loot.rare[1]) {
        summary += `\nLoot: ${commonRoll <= enemy.loot.common[1] ? enemy.loot.common[0] : ""}${commonRoll <= enemy.loot.common[1] && rareRoll <= enemy.loot.rare[1] ? ", " : ""}${rareRoll <= enemy.loot.rare[1] ? enemy.loot.rare[0] : ""}`;
    }

    if (enemy.name === "Bandit King") {
        summary += "\nVictory! The Bandit King is defeated, and the forest is safe!";
        showAction(summary);
        levelUp();
        savePlayerData();
        updateUI();
        setTimeout(() => window.location.href = "gameover.html", 2000);
        return;
    }

    showAction(summary);
    levelUp();
    savePlayerData();
    updateUI();

    const combatContainer = document.getElementById("combat-container");
    if (combatContainer) combatContainer.classList.add("hidden");

    const currentPage = window.location.pathname;
    if (currentPage.includes("ambush.html")) {
        setTimeout(() => window.location.href = "camp.html", 2000);
    } else if (currentPage.includes("exploration.html")) {
        const campBtn = document.getElementById("campBtn");
        const forestBtn = document.getElementById("forestBtn");
        const kingBtn = document.getElementById("kingBtn");
        if (campBtn) campBtn.classList.remove("hidden");
        if (forestBtn) forestBtn.classList.remove("hidden");
        if (kingBtn && gameState.level >= 5) kingBtn.classList.remove("hidden");
    }
}

function gameOver() {
    combatState.active = false;
    combatState.currentEnemy = null;
    combatState.log = [];
    hideCombatMenu();
    showAction("You have been defeated!");
    setTimeout(() => window.location.href = "gameover.html", 2000);
}

function levelUp() {
    if (gameState.xp < LEVEL_UP_XP) return;
    gameState.level++;
    gameState.xp -= LEVEL_UP_XP;
    gameState.hp = Math.min(MAX_HP, gameState.hp + LEVEL_UP_HP_GAIN);
    gameState.maxHp = Math.min(MAX_HP, gameState.maxHp + LEVEL_UP_HP_GAIN);
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

// ============================================================================
// SHOP FUNCTIONS
// ============================================================================
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
    console.log("Handling sell for:", itemName);
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
        const buyButtons = document.querySelectorAll(".buyBtn");
        console.log("Buy buttons found:", buyButtons.length);
        buyButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                console.log("Buy clicked for:", btn.dataset.item);
                handleBuyItem(btn.dataset.item, equipment[btn.dataset.item]?.price || items[btn.dataset.item].price);
            }, { once: true });
        });
    }

    if (sellList) {
        sellList.innerHTML = gameState.inventory.map(item => {
            const data = equipment[item.name] || items[item.name];
            const sellPrice = data.sellPrice || Math.floor(data.price / 2);
            return `<p>${item.name} (${item.quantity}): ${sellPrice} Gold <button class="sellBtn" data-item="${item.name}">Sell</button></p>`;
        }).join("");
        const sellButtons = document.querySelectorAll(".sellBtn");
        console.log("Sell buttons found:", sellButtons.length);
        sellButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                console.log("Sell clicked for:", btn.dataset.item);
                handleSellItem(btn.dataset.item);
            }, { once: true });
        });
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    loadPlayerData();
    updateUI();
    const page = window.location.pathname;

    if (page.includes("index.html")) {
        if (gameState.class) {
            window.location.href = "camp.html";
        } else {
            document.getElementById("warriorBtn")?.addEventListener("click", () => {
                gameState.class = "warrior";
                gameState.stats = { ...classes.warrior.stats };
                gameState.ability = classes.warrior.ability;
                gameState.playerName = "Torin Blackthorne";
                savePlayerData();
                setTimeout(() => window.location.href = "camp.html", 1000);
            });
            document.getElementById("rogueBtn")?.addEventListener("click", () => {
                gameState.class = "rogue";
                gameState.stats = { ...classes.rogue.stats };
                gameState.ability = classes.rogue.ability;
                gameState.playerName = "Lira Swiftblade";
                savePlayerData();
                setTimeout(() => window.location.href = "camp.html", 1000);
            });
            document.getElementById("guardianBtn")?.addEventListener("click", () => {
                gameState.class = "guardian";
                gameState.stats = { ...classes.guardian.stats };
                gameState.ability = classes.guardian.ability;
                gameState.playerName = "Thane Ironwall";
                savePlayerData();
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
        const equipBtn = document.getElementById("equipBtn");
        if (equipBtn) {
            equipBtn.addEventListener("click", () => {
                console.log("Equip button clicked");
                showAction("Choose your equipment...");
                showEquipMenu();
            });
        } else {
            console.error("Equip button not found");
        }
    } else if (page.includes("exploration.html")) {
        document.getElementById("forestBtn")?.addEventListener("click", () => {
            const roll = rollDice(20);
            let enemyType = null;
            if (roll === 1) {
                enemyType = "negative";
            } else if (roll <= 10) {
                enemyType = "bandit";
            } else if (roll === 11) {
                enemyType = "thief";
            } else if (roll === 12) {
                enemyType = "trickster";
            } else if (roll <= 16) {
                enemyType = "wolves";
            } else if (roll <= 18) {
                enemyType = "bountyHunter";
            } else if (roll === 19) {
                const specialRoll = rollDice(6);
                enemyType = [
                    "banditScout",
                    "banditBrute",
                    "banditSniper",
                    "banditThug",
                    "banditRogue",
                    "banditLeader",
                    "valonTheImmortal",
                    "dirtyDave",
                    "hoshiTheSloth"
                ][specialRoll - 1];
            } else if (roll === 20) {
                enemyType = "positive";
            }
            startBattle(enemyType);
        });
        document.getElementById("campBtn")?.addEventListener("click", () => {
            const message = "You return to camp.";
            showAction(message);
            savePlayerData();
            localStorage.setItem("lastActionMessage", message);
            setTimeout(() => window.location.href = "camp.html", 1000);
        });
        const kingBtn = document.getElementById("kingBtn");
        if (gameState.level >= 5 && kingBtn) {
            kingBtn.classList.remove("hidden");
            kingBtn.addEventListener("click", () => {
                showAction("You confront the Bandit King!");
                savePlayerData();
                startBattle("banditKing");
            });
        } else if (kingBtn) {
            kingBtn.textContent = "Bandit King (Reach Level 5)";
            kingBtn.disabled = true;
        }
    } else if (page.includes("ambush.html")) {
        const enemyType = Object.keys(enemies)[rollDice(Object.keys(enemies).length) - 1];
        startBattle(enemyType);
        const banditEnemyImg = document.getElementById("banditEnemy");
        if (banditEnemyImg) {
            banditEnemyImg.src = enemies[enemyType].image;
            banditEnemyImg.classList.remove("hidden");
        }
    } else if (page.includes("shop.html")) {
        showAction("Welcome to the shop!");
        updateShopUI();
        const sellBtn = document.getElementById("sellBtn");
        const sellList = document.getElementById("sellList");
        sellBtn?.addEventListener("click", () => {
            const isHidden = sellList.classList.contains("hidden");
            sellList.classList.toggle("hidden");
            sellBtn.textContent = isHidden ? "HIDE SELL" : "SELL ITEMS";
            if (isHidden) {
                updateShopUI();
                showAction("What would you like to sell?");
            } else {
                showAction("Anything else to buy?");
            }
        });
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