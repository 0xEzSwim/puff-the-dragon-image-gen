import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { readdir } from "fs/promises";
import "dotenv/config";

export default async (client, guildId) => {

    // Create a new REST instance
    const rest = new REST().setToken(process.env.NODE_ENV === "development" ? process.env.TEST_BOT_TOKEN : process.env.BOT_TOKEN)

    // Create an array to store the commands
    const commands = []

    // Read the commands from the commands folder
    // Loop through the files and import them
    // Push the command object to the commands array
    const commandFiles = await readdir("./src/Interactions/ApplicationCommands").catch(() => {
        console.error("ApplicationCommands folder not found. Skipping command loading.");
        return [];
    })
    for (const file of commandFiles) {
        const command = await import(`../../Interactions/ApplicationCommands/${file}`);
            commands.push(command.default.data.toJSON());
    }

    // Warn if some commands are not loaded properly
    if(commandFiles.length != commands.length){
        console.error("Some commands are not loaded properly. Please check the commands.");
    }

    // Create the commands in the guild
    try{
        const data = await rest.put( 
            Routes.applicationGuildCommands(client.user.id, guildId),
            { body : commands }
        )
        return data
    }catch(e){
        if (process.env.DEBUG) console.error(`Could not create commands in guild ${guildId}`);
        return null
    }




}