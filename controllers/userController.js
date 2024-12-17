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

      const insertUserQuery = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
      db.query(insertUserQuery, [username, email, hashedPassword], (err) => {
        if (err) {
          console.error("Error inserting user:", err);
          return res.status(500).json({ message: "Error registering user" });
        }
        res.status(201).json({ message: "User registered successfully" });
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
