const mongoose = require("mongoose")
const domainSchema = mongoose.Schema({
    companyName:{
        type:"string",
        unique:true
    },
    domain:{
        type:String,
        unique:true
    }
})

module.exports = mongoose.model("validDomains",domainSchema)