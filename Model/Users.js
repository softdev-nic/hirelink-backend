const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "user","moderator"],
    default: "user",
  },
  upvoteArray: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mail",
    },
  ],
  downvoteArray: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mail",
    },
  ],    
  ReportedArray: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mail",
    },
  ],  
  isModerator: {
    type: Boolean,
    default: false,
  },
  moderatorSelectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },  

});

module.exports = mongoose.model("User", userSchema);        