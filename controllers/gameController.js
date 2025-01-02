import db from "/KING'S GAMBIT BACKEND/db.js";

const assignRandomRoles = () => {
  const roles = ["Chancellor", "Knight", "Jester", "Assassin"];
  const bots = ["Player 2", "Player 3", "Player 4", "Player 5"];

  // Shuffle roles array to randomly assign roles to bots
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]]; // Swap elements
  }

  // Create the roles array with the player being the King and bots being the other roles
  const assignedRoles = [
    { name: "King", controlledBy: "Player", status: "alive" }
  ];

  // Assign the remaining roles to bots
  bots.forEach((bot, index) => {
    assignedRoles.push({
      name: roles[index],
      controlledBy: bot,
      status: "alive"
    });
  });

  return assignedRoles;
};

// Function to start a new game
export const startGame = (req, res) => {
  const { playerName } = req.body;
  // Randomly assign roles to the player and bots
  const roles = assignRandomRoles();
  
  // Initial game state in JSON
  const initialGameState = {
    phase: "day",
    roles: roles,
    eliminated: []
  };

  const query = `
      INSERT INTO single_player_games (player_name, player_role, game_state)
      VALUES (?, ?, ?)
  `;

  db.query(query, [playerName, "King", JSON.stringify(initialGameState)], (err, result) => {
    if (err) {
      console.error("Error starting game:", err);
      return res.status(500).json({ message: "Error starting game" });
    }

    res.status(201).json({
      message: "Game started successfully",
      gameId: result.insertId,
      playerName: playerName,
      roles: initialGameState.roles
    });
  });
};

// Function to get the current game state
export const getGameState = (req, res) => {
  const { gameId } = req.params;

  const query = "SELECT game_state FROM single_player_games WHERE id = ?";
  db.query(query, [gameId], (err, results) => {
    if (err) {
      console.error("Error retrieving game state:", err);
      return res.status(500).json({ message: "Error retrieving game state" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.status(200).json({ gameState: JSON.parse(results[0].game_state) });
  });
};

// Function to update the game state
export const updateGameState = (req, res) => {
  const { gameId } = req.params;
  const { gameState } = req.body; // Expect JSON for updated game state

  const query = `
      UPDATE single_player_games
      SET game_state = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
  `;

  db.query(query, [JSON.stringify(gameState), gameId], (err, result) => {
    if (err) {
      console.error("Error updating game state:", err);
      return res.status(500).json({ message: "Error updating game state" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.status(200).json({ message: "Game state updated successfully" });
  });
};

export const assassinAction = (req, res) => {
  const { gameId } = req.params;

  const query = "SELECT game_state FROM single_player_games WHERE id = ?";
  db.query(query, [gameId], (err, results) => {
    if (err) {
      console.error("Error retrieving game state:", err);
      return res.status(500).json({ error: "Internal server error." });
    }

    if (results.length === 0) {
      console.error("Game not found.");
      return res.status(404).json({ error: "Game not found." });
    }

    let gameState;
    try {
      gameState = JSON.parse(results[0].game_state);
    } catch (parseErr) {
      console.error("Error parsing game state:", parseErr);
      return res.status(500).json({ error: "Failed to parse game state." });
    }

    const potentialTargets = gameState.roles.filter(
      (role) => role.name !== "King" && role.name !== "Assassin"
    );

    if (potentialTargets.length === 0) {
      console.error("No valid targets for the assassin.");
      return res.status(400).json({ error: "No valid targets for the assassin." });
    }

    const randomIndex = Math.floor(Math.random() * potentialTargets.length);
    const target = potentialTargets[randomIndex];

    // Eliminate the target
    gameState.roles = gameState.roles.map((role) =>
      role.name === target.name ? { ...role, status: "eliminated" } : role
    );

    if (!gameState.eliminated) gameState.eliminated = [];
    gameState.eliminated.push(target.name);

    const updateQuery = `
      UPDATE single_player_games
      SET game_state = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    db.query(updateQuery, [JSON.stringify(gameState), gameId], (updateErr) => {
      if (updateErr) {
        console.error("Error updating game state:", updateErr);
        return res.status(500).json({ error: "Failed to update game state." });
      }

      console.log(`${target.name} has been eliminated by the Assassin.`);
      return res.status(200).json({
        message: `${target.name} has been eliminated.`,
        target: target,
        updatedRoles: gameState.roles,
      });
    });
  });
};