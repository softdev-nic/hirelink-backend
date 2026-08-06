const mongoose = require("mongoose");
const MailSchema = new mongoose.Schema({
companyName: {
    type: String,
    required: true,
  },    
  email: {
    type: String,
    required: true,
    },
    upvote:{
    type: Number,
    default: 0,
    },
    downvote:{
    type: Number,
    default: 0,
    }, 
    postedBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    },
    createdAt: {
    type: Date,
    default: Date.now,

    },    
    } 
  )
module.exports = mongoose.model("Mail", MailSchema);