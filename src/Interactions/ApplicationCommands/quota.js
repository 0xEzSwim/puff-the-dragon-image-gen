import { SlashCommandBuilder } from "discord.js";
import { User } from "../../Models/User/Client.js";
import { WhiteEmbed, OrangeEmbed } from "../../Utils/Embeds/ErrorEmbed.js";

export default {
    data : new SlashCommandBuilder()
    .setName("quota")
    .setDescription("Check your daily quota"),
    execute : async interaction => {

        await interaction.reply({ embeds : [WhiteEmbed(`I am checking your daily quota...`)], ephemeral : true })

        var user = new User(interaction.user.id, interaction.member._roles)
        
        var quota = await user.getDailyLimit()
        var usage = await user.getDailyUsage()
        var remaining = quota - usage.length

        if(quota == 0){
            return interaction.editReply({ embeds : [OrangeEmbed(`You have no daily quota. Please upgrade your role.`)], ephemeral : true })
        }

        if(remaining <= 0 ){

            var sorted = usage.sort((a,b) => a.timestamp - b.timestamp)
            var firstTime = sorted[0].timestamp
            var nextTime = firstTime + 24 * 60 * 60 * 1000

            return interaction.editReply({ embeds : [OrangeEmbed(`You have reached your daliy limit!\nI can imagine more images for you after <t:${parseInt(nextTime / 1000)}>\n\n📜 Daily quota - ${usage.length} / ${quota}`)], ephemeral : true })

        }

        return interaction.editReply({ embeds : [WhiteEmbed(`📜 Daily quota - ${usage.length} / ${quota}`)], ephemeral : true })

    }
}