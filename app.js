// === 1. Global Variables and Game Data ===
const player = {
    name: "",
    stats: {
      health: 10,
      attack: 2,
      defense: 1,
      speed: 1,
    },
    inventory: [],
  };
  
  const enemies = [
    { name: "Goblin", health: 8, attack: 2 },
    { name: "Bandit", health: 12, attack: 3 },
    { name: "Troll", health: 20, attack: 4 },
  ];
  
  const items = [
    { name: "Health Potion", effect: { health: +5 }, price: 10 },
    { name: "Sword", effect: { attack: +2 }, price: 25 },
    { name: "Shield", effect: { defense: +2 }, price: 20 },
  ];

  const weapons = [
    { name: "Dagger", attack: 2, speed: 2 },
    { name: "Sword", attack: 4, speed: 0 },
    { name: "Great Axe", attack: 6, speed: -2 },
  ];
  
  const armor = [
    { name: "Light Armor", defense: 1, speed: 2 },
    { name: "Medium Armor", defense: 3, speed: 0 },
    { name: "Heavy Armor", defense: 5, speed: -2 },
  ];
  
  const buffs = [
    { name: "Keen Senses", effect: { speed: +2 } },
    { name: "Tough Skin", effect: { defense: +2 } },
    { name: "Powerful Strikes", effect: { attack: +2, defense: -1 } },
  ];
  
  
  // === 2. Core Functions ===
  function rollDice(sides) {
    return Math.floor(Math.random() * sides) + 1;
  }
  
  function updatePlayerStat(stat, amount) {
    player.stats[stat] += amount;
    console.log(`${stat} is now ${player.stats[stat]}`);
  }
  
  function addItemToInventory(itemName) {
    const item = items.find((i) => i.name === itemName);
    if (item) {
      player.inventory.push(item);
      console.log(`${item.name} added to inventory.`);
    }
  }
  
  // === 3. Game Logic ===
  function attackEnemy(enemyIndex) {
    const enemy = enemies[enemyIndex];
    const roll = rollDice(20);
  
    console.log(`You rolled a ${roll} to attack the ${enemy.name}!`);
    if (roll + player.stats.attack > 10) {
      console.log(`You hit the ${enemy.name}!`);
      enemy.health -= player.stats.attack;
      if (enemy.health <= 0) {
        console.log(`You defeated the ${enemy.name}!`);
      }
    } else {
      console.log(`You missed the ${enemy.name}.`);
    }
  }
  
  function visitShop() {
    console.log("Welcome to the shop! Here are the items:");
    items.forEach((item, index) => {
      console.log(`${index + 1}: ${item.name} - ${item.price} gold`);
    });
    // Example purchase logic (you can tie this to UI later)
    const purchaseIndex = 0; // Assume player selects the first item
    addItemToInventory(items[purchaseIndex].name);
  }
  
  // === 4. Event Handlers ===
  document.getElementById("startGame").addEventListener("click", () => {
    player.name = document.getElementById("playerName").value || "Adventurer";
    console.log(`Welcome, ${player.name}!`);
    startGame();
  });
  
  // === 5. Game Initialization ===
  function startGame() {
    console.log("The adventure begins...");
    console.log(player);
  }

  const classAbilities = [
    {
      name: "Power Strike",
      description: "Deals 150% Attack damage to a single target.",
      levelRequirement: 2,
      effect: (player, target) => {
        const damage = Math.floor(player.stats.attack * 1.5);
        target.hp -= damage;
        return damage;
      },
    },
    {
      name: "Quick Slash",
      description: "Attack twice with reduced damage (75% per hit).",
      levelRequirement: 3,
      effect: (player, target) => {
        const damage = Math.floor(player.stats.attack * 0.75);
        target.hp -= damage * 2;
        return damage * 2;
      },
    },
    {
      name: "Defensive Stance",
      description: "Increase defense for the next 3 turns.",
      levelRequirement: 4,
      effect: (player) => {
        player.stats.defense += 3;
        player.buffTurns = 3;
        return "Defense increased!";
      },
    },
  ];

  const weapons = [
    {
      name: "Dagger",
      attack: 2,
      speed: 2,
      ability: {
        name: "Backstab",
        description: "Deal 200% damage if the target is unaware.",
        effect: (player, target) => {
          const damage = Math.floor(player.stats.attack * 2);
          target.hp -= damage;
          return damage;
        },
      },
    },
    {
      name: "Great Axe",
      attack: 6,
      speed: -2,
      ability: {
        name: "Cleave",
        description: "Deal damage to all enemies in range.",
        effect: (player, targets) => {
          const damage = Math.floor(player.stats.attack);
          targets.forEach((target) => {
            target.hp -= damage;
          });
          return damage;
        },
      },
    },
  ];

  
  const blockAction = {
    name: "Block",
    description: "Reduce incoming damage by 50% this turn.",
    effect: (player) => {
      player.blocking = true; // Set a blocking flag.
      return "Blocking...";
    },
  };

  
