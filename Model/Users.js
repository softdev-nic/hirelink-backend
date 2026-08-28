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
    enum: ["superAdmin","admin", "user","moderator"],
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
  reportedArray: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mail",
    },
  ],  
  isModerator: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  moderatorSelectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },  
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },  
template:{
  subject:{
    type:String
  },
  text:{
    type:String
  }
},
challengeId:{
  type:String,
  default :null
},
otpChallenge:{
  challengeId:{
    type:String,
    default:null
  },
  otp:{
  type:String,
  default: null
},
otpExpiresAt: {
  type:Date
}
}

});

module.exports = mongoose.model("User", userSchema);        