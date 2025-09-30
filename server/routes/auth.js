const express = require("express");
const {
  register,
  login,
  logout,
  getMe,
  refreshToken,
  checkExists,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/check-exists", checkExists);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.post("/refresh-token", refreshToken);
router.get("/me", protect, getMe);
// Password reset via email OTP
router.post('/password/forgot', requestPasswordReset);
router.post('/password/verify', verifyResetCode);
router.post('/password/reset', resetPassword);

module.exports = router;
