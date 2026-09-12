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
  passwordChangedAt:{
 type: Date,
 default: null,
},
template:{
  subject:{
    type:String
  },
  text:{
    type:String
  }
},

otpChallenge: {
  challengeId: { type: String, default: null },
  otp: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  attempts: { type: Number, default: 0 },
},
 


});
userSchema.index({"otpChallenge.challengeId":1},{sparse:true})
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.otpChallenge;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);        