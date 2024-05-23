import mongoose from "mongoose";

export default mongoose.model("Generations", new mongoose.Schema({
    
    userId : { type : String, required : true },
    prompt : { type : String, default : null },
    revisedPrompt : { type : String, default : null },
    messageId : { type : String, default : null },
    imageUri : { type : String, default : null },
    timestamp : { type : Number, default : null },

}))