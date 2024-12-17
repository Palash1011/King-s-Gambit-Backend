import db from "/KING'S GAMBIT BACKEND/db.js";

// Fetch user account details
export const getUserDetails = (req, res) => {
  const { userId } = req.params;
  const query = `SELECT username, email, profile_picture_url FROM users WHERE id = ?`;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(results[0]);
  });
};
