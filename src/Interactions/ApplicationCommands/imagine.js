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

        if(!userPrompt) return interaction.reply({ content : "Please provide a prompt", ephemeral : true })

        await interaction.reply({ content : `${interaction.client?.user?.displayName || "Bot"} is checking your daily quota...`,ephemeral : true})

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

            return interaction.editReply({ content : `You have reached your daliy limit as ${usage.length} out of ${quota} images have been generated. You can generate more images after <t:${parseInt(nextTime / 1000)}>`, ephemeral : true })

        }

        var doc = await user.createDocument(userPrompt)

        if(!doc) return interaction.editReply({ content : `The bot is a little confused, we would appreciate it if you let us know the error code!\n\nError Code: 0x1`})

        await interaction.editReply({ content : `${interaction.client?.user?.displayName || "Bot"} is thinking about **${userPrompt}**...`, ephemeral : true})

        const image = await Client.imagineDragon(userPrompt, interaction.user.id)

        if(image instanceof Error){
            await user.deleteDocument(doc).then(() => {
                return interaction.editReply({ content : `Someone is filling your daily quota! Let us know immediately!\n\nError Code : 0x2\n_id${doc._id}`})
            })
            if(image.code == 400){
                return interaction.editReply({ content : `The bot thinks this prompt is harmful. Please try another prompt.\n\nPrompt : ${userPrompt}`, ephemeral : true})
            }else if(image.code == 500){
                return interaction.editReply({ content : `The bot is on vacation. Please try again later.`, ephemeral : true})
            }else if(image.code == 429){
                return interaction.editReply({ content : `The bot is a little tired. Please try again later.`, ephemeral : true})
            }else if(image.code == 501){
                return interaction.editReply({ content : `The bot is a little confused. Please try again later.`, ephemeral : true})
            }
        }


        return await interaction.channel.send({ content : `${interaction.user}'s Puff Dragon!`, files : [image.buffer] }).then(async (message) => {
            await interaction.editReply({ content : `${interaction.client?.user?.displayName || "Bot"} successfully imagined ${userPrompt}.\nDescription : ${userPrompt}\nYour Quota (Daily) = ${usage.length+1}/${quota} `, ephemeral : true })
            await user.updateDocument(doc, message.id, userPrompt, image.revisedPrompt, message.attachments?.first()?.url || null)
        }).catch(async err => {
            if(process.env.DEBUG) console.error(err)
            await interaction.editReply({ content : `Bot wants to show this perfect picture he made, just to you!`, ephemeral : true, files : [image.buffer]})
        })
        

    }
}