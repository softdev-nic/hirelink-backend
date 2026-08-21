
const isCreator = (req,res,next)=>{
    const {postedBy} = req.body

    if(postedBy.toString()!==req.user._id.toString())
    {
        return res.status(403).json("you have not created the post")
    }
    next()
}  
module.exports = isCreator