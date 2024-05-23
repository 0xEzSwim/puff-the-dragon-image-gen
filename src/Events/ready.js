import { Events } from "discord.js"
import guildApplicationCommands from "../Utils/CommandRegister/guildApplicationCommands.js";

export default client => {

    // Event to run when the bot is ready
    client.once(Events.ClientReady, async (cl) => {
        // Log the bot's tag
        console.log(`Logged in as ${cl.user.tag}`);
        
        // Load the commands (should only update once but for now we do this)
        console.log("Loading commands...");
        await guildApplicationCommands(client);
        console.log("Commands loaded!");

    })

}