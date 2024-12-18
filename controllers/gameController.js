import db from "/KING'S GAMBIT BACKEND/db.js";

const assignRandomRoles = () => {
    const roles = ["Chancellor", "Royal Guard", "Jester", "Assassin"];
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