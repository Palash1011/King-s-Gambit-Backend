import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "/KING'S GAMBIT BACKEND/db.js";

// Sign-up logic
export const signup = async (req, res) => {
  const { username, email, password } = req.body;

  const checkUserQuery = `SELECT * FROM users WHERE email = ? OR username = ?`;
  db.query(checkUserQuery, [email, username], async (err, results) => {
    if (err) {
      console.error("Error checking user:", err);
      return res.status(500).json({ message: "Error checking user" });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: "Username or email already exists" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the users table
      const insertUserQuery = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
      db.query(insertUserQuery, [username, email, hashedPassword], (err, result) => {
        if (err) {
          console.error("Error inserting user:", err);
          return res.status(500).json({ message: "Error registering user" });
        }

        // Create the stats record for the user
        const insertStatsQuery = `INSERT INTO stats (username, total_games_played, total_wins, win_percentage) VALUES (?, 0, 0, 0)`;
        db.query(insertStatsQuery, [username], (err) => {
          if (err) {
            console.error("Error creating stats:", err);
            return res.status(500).json({ message: "Error creating stats" });
          }

          // Respond only after both user and stats are inserted
          res.status(201).json({ message: "User registered successfully" });
        });
      });
    } catch (error) {
      console.error("Error hashing password:", error);
      return res.status(500).json({ message: "Error hashing password" });
    }
  });
};

// Signing (login) logic
export const signing = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const userQuery = `SELECT * FROM users WHERE email = ?`;
  db.query(userQuery, [email], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, results[0].password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: results[0].id, email: results[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      userId: results[0].id,
      token,
      username: results[0].username,
      email: results[0].email,
    });
  });
};

// Delete user account
export const deleteUser = (req, res) => {
  const { userId } = req.params;

  const query = `DELETE FROM users WHERE id = ?`;
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Account deleted successfully" });
  });
};

export const updateStats = async (req, res) => {
  const { username, status } = req.body; // status: "won" or "lost"

  try {
    // Get the existing stats for the user
    const query = 'SELECT * FROM stats WHERE username = ?';
    db.query(query, [username], (err, results) => {
      if (err) {
        console.error("Error fetching stats:", err);
        return res.status(500).json({ message: "Error fetching stats", error: err.message });
      }

      let total_games_played = 1;
      let total_wins = 0;

      if (results.length > 0) {
        // If stats exist, update them
        total_games_played = results[0].total_games_played + 1;
        total_wins = results[0].total_wins + (status === 'won' ? 1 : 0);
      }

      const win_percentage = (total_wins / total_games_played) * 100;

      // Update or insert the stats record
      const updateQuery = 'UPDATE stats SET total_games_played = ?, total_wins = ?, win_percentage = ? WHERE username = ?';
      if (results.length > 0) {
        db.query(updateQuery, [total_games_played, total_wins, win_percentage.toFixed(2), username], (err) => {
          if (err) {
            console.error("Error updating stats:", err);
            return res.status(500).json({ message: "Error updating stats", error: err.message });
          }
          res.status(200).json({ message: 'Stats updated successfully' });
        });
      } else {
        // Insert new stats if not found
        const insertQuery = 'INSERT INTO stats (username, total_games_played, total_wins, win_percentage) VALUES (?, ?, ?, ?)';
        db.query(insertQuery, [username, total_games_played, total_wins, win_percentage.toFixed(2)], (err) => {
          if (err) {
            console.error("Error inserting stats:", err);
            return res.status(500).json({ message: "Error inserting stats", error: err.message });
          }
          res.status(200).json({ message: 'Stats updated successfully' });
        });
      }
    });
  } catch (err) {
    console.error("Error updating stats:", err);
    res.status(500).json({ message: "Error updating stats", error: err.message });
  }
};

// Fetch player stats
export const playerStats = async (req, res) => {
  const { username } = req.query; // Username passed as a query parameter

  try {
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Fetch stats for the given username
    const query = 'SELECT * FROM stats WHERE username = ?';
    db.query(query, [username], (err, results) => {
      if (err) {
        console.error("Error fetching player stats:", err);
        return res.status(500).json({ message: "Error fetching player stats", error: err.message });
      }

      if (results.length > 0) {
        return res.status(200).json(results[0]); // Return the first (and only) record
      } else {
        return res.status(404).json({ message: 'Player stats not found' });
      }
    });
  } catch (err) {
    console.error("Error fetching player stats:", err);
    return res.status(500).json({ message: 'Error fetching player stats', error: err.message });
  }
};
