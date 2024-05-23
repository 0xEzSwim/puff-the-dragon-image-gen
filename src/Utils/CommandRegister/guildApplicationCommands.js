import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { readdir } from "fs/promises";
import "dotenv/config";

export default async client => {

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

    // Fetch the guilds the bot is in
    // Loop through the guilds
    // Create the commands in the guilds
    console.log("Fetching guilds...");
    const guilds = await client.guilds.fetch();
    console.log(`Fetched ${guilds.size} guilds.`)
    console.log(`Creating commands in ${guilds.size} guilds...`);
    for (let guild of guilds){
        guild = guild[1];
        try{
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, guild.id),
                { body : commands }
            )
        }catch(e){
            if (process.env.DEBUG) console.error(e);
            console.error(`Could not create commands in guild ${guild.id}`);
        }
  
    }
    console.log("Commands created in all guilds!");

}