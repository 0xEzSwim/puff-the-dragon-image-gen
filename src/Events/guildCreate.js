import { Events } from "discord.js"
import guildApplicationCommandsOnce from "../Utils/CommandRegister/guildApplicationCommandsOnce.js"

export default client => {

    // Event to run when the bot joins a guild
    client.on(Events.GuildCreate, async (guild) => {

        // Register the commands in the guild
        await guildApplicationCommandsOnce(client, guild.id)

    })

}