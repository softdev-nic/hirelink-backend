const user = require("../Model/Users");
const crypto = require("crypto");
const mailer = require("../mailer");
const bcrypt = require("bcryptjs");
const forgotPassword = async (req, res) => {
  
  try {
    const { email } = req.body;

    const existingUser = await user.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const resetToken = crypto.randomBytes(20).toString("hex");
    existingUser.resetPasswordToken = resetToken;
    existingUser.resetPasswordExpires = Date.now() + 300000; // Token expires in 5 minutes
    await existingUser.save();
    
    await mailer.sendEmail(existingUser.email, "Password Reset", `Hi ${existingUser.name}, you have requested a password reset. Please click the link to reset your password: https://hirelink.atmex.site/reset-password/${resetToken}`);
    res.status(200).json({ message: "Password reset token sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });

  }
};

const resetPassword = async (req, res) => {
  try {
const params = req.params;
    const { token } = params;
    const { newPassword } = req.body;

    const existingUser = await user.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!existingUser) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    existingUser.password = await bcrypt.hash(newPassword, 10);
    existingUser.resetPasswordToken = undefined;
    existingUser.resetPasswordExpires = undefined;
    await existingUser.save();
    mailer.sendEmail(existingUser.email, "Password Reset Successful", `Hi ${existingUser.name}, your password has been reset successfully. If you did not initiate this change, please contact support immediately.`);

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error",
      message:error.message
     });
  }
};

module.exports = { forgotPassword, resetPassword };
