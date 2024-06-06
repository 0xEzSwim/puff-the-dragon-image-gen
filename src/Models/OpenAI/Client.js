import "dotenv/config"
import OpenAI, { BadRequestError, OpenAIError } from "openai"
import { ImageSize, Model, NumberOfImages, Quality, ResponseFormat, Style } from "./Config.js"

export class Client {
    
    static openAi = new OpenAI({

        apiKey : process.env.OPENAI_API_KEY,
        organization : process.env.OPENAI_ORGANIZATION
    
    })

    static NUMBER_OF_IMAGES = NumberOfImages
    static IMAGE_SIZE = ImageSize
    static RESPONSE_FORMAT = ResponseFormat
    static MODEL = Model
    static QUALITY = Quality
    static STYLE = Style

    static generate = async (prompt, id) => {

        return await Client.openAi.images.generate({
            prompt : prompt,
            n : Client.NUMBER_OF_IMAGES,
            size : Client.IMAGE_SIZE,
            response_format : Client.RESPONSE_FORMAT,
            model : Client.MODEL,
            quality : Client.QUALITY,
            style : Client.STYLE,
            user: id
        }).then((response) => {
            return response.data[0]
        }).catch(error => {
            if(process.env.DEBUG) console.error(error)
            if(error instanceof BadRequestError) return {
                error : "Bad Request Error",
                code : 400
            }
            if(error instanceof OpenAIError) return {
                code : 500,
                error : "OpenAI Error"
            }
            return {
                error : "Unknown Error",
                code : 501
            }
        })


    }

    static convert = async (response) => {
        try {
            if (response.b64_json) {
                return Buffer.from(response.b64_json, "base64")
            } else if (response.url) {
                const image = await fetch(response.url)
                return Buffer.from(await image.arrayBuffer())
            } else {
                if (process.env.DEBUG) console.error("Invalid response format")
                return null
            }
        } catch (e) {
            if (process.env.DEBUG) console.error(e)
            return null
        }
    }

    static imagineDragon = async (userPrompt, userId) => {

        var prompt = `create animated baby ${userPrompt} dragon puff and end with  Its endearing pose and expressive eyes add to its whimsical charm, making it a perfect character for a family-friendly animated film. Make backgroudn that resonates with dragon style. FOCUS IS on DRAGON.`

        var generatedImage = await Client.generate(prompt, userId)

        if(generatedImage.error) return new Error(generatedImage.code || 501)

        var imageBuffer = await Client.convert(generatedImage)

        if(!imageBuffer) return new Error(501)

        return {
            buffer : imageBuffer,
            code : 200,
            revisedPrompt : generatedImage.revised_prompt || null
        }

    }


}