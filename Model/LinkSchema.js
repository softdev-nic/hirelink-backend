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
    status:{
      type:String,
      enum:["pending","approved","rejected"],
      default:"pending"
    },
    category:{
      type:String,
      enum:["IT","Marketing","Sales","HR","Finance","Operations","Other","DevOps","Design","Legal","Customer Support","Product Management","Business Development","Data Science","Quality Assurance","Research and Development  ","Public Relations","Training and Development","Procurement","Logistics","Administration","Strategy and Planning","Risk Management","Compliance","Investor Relations","Corporate Communications","Event Management","Facilities Management","Sustainability and CSR"],
      required:true
    },
    AttendedBy:{
      type:mongoose.Schema.ObjectId,
      ref:"user"
    },
    expiresAt:{
      type:Date,
      default:null
    }
    } 
  )
  MailSchema.index({
    expiresAt:1,
    expireAfterSeconds:0
  })
module.exports = mongoose.model("Mail", MailSchema);