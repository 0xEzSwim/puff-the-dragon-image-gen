import { DailyLimits } from "./Config.js"
import DB from "./Model.js"

var LIMITATIONS = DailyLimits


export class User {


    constructor(userId, roles = []) {
        this.userId = userId,
            this.roles = roles
    }

    getDailyLimit = async () => {

        var limit = 0
        for (var role of this.roles) {
            if (LIMITATIONS[role]) {
                var roleLimit = LIMITATIONS[role]
                if (roleLimit > limit) {
                    limit = roleLimit
                }
            }
        }

        return limit
    }

    getDailyUsage = async () => {

        // 24 hrs ago
        var startDate = new Date().getTime() - 24 * 60 * 60 * 1000
        var endDate = new Date().getTime()

        try {
            return await DB.find({ userId: this.userId, timestamp: { $gte: startDate, $lte: endDate }, status: 200 })
        } catch (err) {
            if (process.env.DEBUG) console.error(err)
            return -1
        }

    }

    isDescriptionPending = async () => {

        try {
            var doc = await DB.findOne({ userId: this.userId }).sort({ timestamp: -1 })
            if (!doc) return false
            if (doc.status == null) {
                if (Date.now() - doc.timestamp > 130000) {
                    return false
                }
                return true
            }
            return false
        } catch (err) {
            if (process.env.DEBUG) console.error(err)
            return null
        }

    }


    createDocument = async (prompt) => {

        try {
            return await new DB({ userId: this.userId, prompt: prompt, timestamp: Date.now() }).save()
        } catch (err) {
            if (process.env.DEBUG) console.error(err)
            return null
        }

    }

    markError = async (doc, code) => {

        try {
            return await DB.updateOne({ _id: doc._id }, { status : code})
        } catch (err) {
            if (process.env.DEBUG) console.error(err)
            return null
        }
    }

    updateDocument = async (doc, messageId, prompt, revisedPrompt, imageUrl) => {

        try {
            return await DB.updateOne({ _id: doc._id }, {
                $set: {
                    prompt: prompt,
                    revisedPrompt: revisedPrompt,
                    messageId: messageId,
                    imageUri: imageUrl,
                    status : 200
                }
            })
        } catch (err) {
            if (process.env.DEBUG) console.error(err)
            return null
        }

    }



}