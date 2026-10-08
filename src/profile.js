import express from "express";
import { pool } from "./db.js";
import { authUser } from "./auth.js";

const router = express.Router();

// This route handles the "Save profile" button from the frontend
router.put("/profile", authUser, async (req, res) => {
  try {
    const { display_name, profile_photo } = req.body;
    const userId = req.user.id;

    // Update the user in PostgreSQL
    const result = await pool.query(
      `UPDATE users 
       SET display_name = $1, profile_photo = $2 
       WHERE id = $3 
       RETURNING id, email, role, display_name, profile_photo`,
      [display_name, profile_photo, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send the updated user object back to the frontend
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
