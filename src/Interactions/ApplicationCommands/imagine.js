import { SlashCommandBuilder } from "discord.js";
import { User } from "../../Models/User/Client.js";
import { Client } from "../../Models/OpenAI/Client.js";

export default {
    data : new SlashCommandBuilder()
    .setName("imagine")
    .setDescription("Generates a DRAGON PP from your description")
    .addStringOption(option => option
        .setName("description")
        .setDescription("Describe the DRAGON you want to generate.")
        .setRequired(true)
        .setMaxLength(2500)),
    execute : async interaction => {

        const userPrompt = interaction.options.getString("description")

        const botName = `${interaction.client?.user?.displayName || "Bot"}`;

        if(!userPrompt) return interaction.reply({ content : "Please provide a prompt", ephemeral : true })

        await interaction.reply({ content : `${botName} is checking your daily quota...`,ephemeral : true})

        var user = new User(interaction.user.id, interaction.member._roles)

        var quota = await user.getDailyLimit()

        if(quota == 0){
            return interaction.editReply({ content : `You have no daily quota. Please upgrade your role.`, ephemeral : true })
        }

        var usage = await user.getDailyUsage()
        var remaining = quota - usage.length

        if(remaining <= 0 ){

            var sorted = usage.sort((a,b) => a.timestamp - b.timestamp)
            var firstTime = sorted[0].timestamp
            var nextTime = firstTime + 24 * 60 * 60 * 1000

            return interaction.editReply({ content : `You have reached your daliy limit as ${usage.length} out of ${quota} images have been imagined.\n${botName} can imagine more images for you after <t:${parseInt(nextTime / 1000)}>`, ephemeral : true })

        }

        var doc = await user.createDocument(userPrompt)

        if(!doc) return interaction.editReply({ content : `${botName} is a little confused, contact support with the error code!\n\nError Code: 0x1`})

        await interaction.editReply({ content : `${botName} is thinking about **${userPrompt}**...`, ephemeral : true})

        const image = await Client.imagineDragon(userPrompt, interaction.user.id)

        if(image instanceof Error){
            await user.deleteDocument(doc).then(() => {
                return interaction.editReply({ content : `Someone is filling your daily quota! Contact the support immediately!\n\nError Code : 0x2\n_id${doc._id}`})
            })
            if(image.code == 400){
                return interaction.editReply({ content : `${botName} thinks this prompt is harmful. Please try another prompt.\n\nPrompt : ${userPrompt}`, ephemeral : true})
            }else if(image.code == 500){
                return interaction.editReply({ content : `${botName} is on vacation. Please try again later.`, ephemeral : true})
            }else if(image.code == 429){
                return interaction.editReply({ content : `${botName} is a little tired. Please try again later.`, ephemeral : true})
            }else if(image.code == 501){
                return interaction.editReply({ content : `${botName} is a little confused. Please try again later.`, ephemeral : true})
            }
        }


        return await interaction.channel.send({ content : `Here is ${interaction.user}'s Dragon!`, files : [image.buffer] }).then(async (message) => {
            await interaction.editReply({ content : `${botName} successfully imagined **${userPrompt}**.\n\n📜 Daily quota - ${usage.length+1} / ${quota} `, ephemeral : true })
            await user.updateDocument(doc, message.id, userPrompt, image.revisedPrompt, message.attachments?.first()?.url || null)
        }).catch(async err => {
            if(process.env.DEBUG) console.error(err)
            await interaction.editReply({ content : `${botName} is showing his artwork just to you!`, ephemeral : true, files : [image.buffer]})
        })
        

    }
}