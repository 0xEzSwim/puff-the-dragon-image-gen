import { SlashCommandBuilder } from "discord.js";
import { User } from "../../Models/User/Client.js";
import { Client } from "../../Models/OpenAI/Client.js";
import { YellowEmbed } from "../../Utils/Embeds/ErrorEmbed.js";

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

        var executeTime = Date.now()

        const userPrompt = interaction.options.getString("description")

        if(!userPrompt) return interaction.reply({ content : "", embeds : [YellowEmbed("Please provide a prompt")], ephemeral : true })

        await interaction.reply({ content : `I am checking your daily quota...`, ephemeral : true})

        var user = new User(interaction.user.id, interaction.member._roles)

        var isPending = await user.isDescriptionPending()

        if(isPending) return interaction.editReply({ content : ``, embeds : [YellowEmbed("You have a pending request. Please wait for the previous request to be completed.")], ephemeral : true })

        var quota = await user.getDailyLimit()

        if(quota == 0){
            return interaction.editReply({ content : ``, embeds : [YellowEmbed("You have no daily quota. Please upgrade your role.")], ephemeral : true })
        }

        var usage = await user.getDailyUsage()
        var remaining = quota - usage.length

        if(remaining <= 0 ){

            var sorted = usage.sort((a,b) => a.timestamp - b.timestamp)
            var firstTime = sorted[0].timestamp
            var nextTime = firstTime + 24 * 60 * 60 * 1000

            return interaction.editReply({ content : `🟠 You have reached your daliy limit!\nI can imagine more images for you after <t:${parseInt(nextTime / 1000)}>\n\n📜 Daily quota - ${usage.length} / ${quota}`, ephemeral : true })

        }

        var doc = await user.createDocument(userPrompt)

        if(!doc) return interaction.editReply({ content : `🔴 I am a little confused, contact support with the error code!\n\nError Code: 0x1`})

        await interaction.editReply({ content : `I am thinking about **${userPrompt}**...`, ephemeral : true})

        const image = await Client.imagineDragon(userPrompt, interaction.user.id)

        if(image instanceof Error){
            await user.markError(doc, image.message).catch(() => {
                return interaction.editReply({ content : `🔴 Someone is filling your daily quota! Contact the support immediately!\n\nError Code : 0x2\n_id${doc._id}`})
            })
            if(image.message == 400){
                return interaction.editReply({ content : `🔴 Copyright fail! watch-out for any IP or specific character names or references in your description:\n **${userPrompt}**`, ephemeral : true})
            }else if(image.message == 500){
                return interaction.editReply({ content : `🔴 I am on vacation. Please wait a few minutes and try again.`, ephemeral : true})
            }else if(image.message == 429){
                return interaction.editReply({ content : `🔴 I am a little tired. Please try again later.`, ephemeral : true})
            }else if(image.message == 501){
                return interaction.editReply({ content : `🔴 I am a little confused. Please try again later.`, ephemeral : true})
            }
        }

        var end = Date.now()

        if(process.env.DEBUG) console.log(`Execution time: ${end - executeTime}ms`)

        return await interaction.channel.send({ content : `Here is ${interaction.user}'s Dragon!`, files : [image.buffer] }).then(async (message) => {
            await interaction.editReply({ content : `🟢 I successfully imagined **${userPrompt}**.\n\n📜 Daily quota - ${usage.length+1} / ${quota} `, ephemeral : true })
            await user.updateDocument(doc, message.id, userPrompt, image.revisedPrompt, message.attachments?.first()?.url || null)
        }).catch(async err => {
            if(process.env.DEBUG) console.error(err)
            await interaction.editReply({ content : `🟢 I am showing my artwork just to you!`, ephemeral : true, files : [image.buffer]})
        })
        

    }
}