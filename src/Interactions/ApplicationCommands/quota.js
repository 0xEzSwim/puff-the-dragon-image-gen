import { SlashCommandBuilder } from "discord.js";
import { User } from "../../Models/User/Client.js";

export default {
    data : new SlashCommandBuilder()
    .setName("quota")
    .setDescription("Check your daily quota"),
    execute : async interaction => {

        await interaction.reply({ content : `${interaction.client?.user?.displayName || "Bot"} is checking your daily quota...`,ephemeral : true})

        var user = new User(interaction.user.id, interaction.member._roles)
        
        var quota = await user.getDailyLimit()
        var usage = await user.getDailyUsage()
        var remaining = quota - usage.length

        if(quota == 0){
            return interaction.editReply({ content : `You have no daily quota. Please upgrade your role.`, ephemeral : true })
        }

        if(remaining <= 0 ){

            var sorted = usage.sort((a,b) => a.timestamp - b.timestamp)
            var firstTime = sorted[0].timestamp
            var nextTime = firstTime + 24 * 60 * 60 * 1000

            return interaction.editReply({ content : `You have reached your daliy limit as ${usage.length} out of ${quota} images have been generated. You can generate more images after <t:${parseInt(nextTime / 1000)}>`, ephemeral : true })

        }

        return interaction.editReply({ content : `You have ${remaining} of ${quota} images left to generate.`, ephemeral : true })

    }
}