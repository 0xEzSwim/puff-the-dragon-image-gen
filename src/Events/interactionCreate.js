import { Events } from "discord.js"
import "dotenv/config";

export default client => {

    // Event to run when the bot receives an interaction
    client.on(Events.InteractionCreate, async (interaction) => {

        let command = null

        // Switch the interaction type
        // 2 = Slash Command
        // 3 = Message Component
        // 5 = Modal Submit
        switch(interaction.type) {
            case 2:
                // Get the command from the applicationCommands property
                command = client.interactions.applicationCommands.get(interaction.commandName);
                break;
            case 3:
                // Get the command from the messageComponents property
                command = client.interactions.messageComponents.get(interaction.customId);
                break;
            case 5:
                // Get the command from the modalSubmits property
                command = client.interactions.modalSubmits.get(interaction.customId);
                break;
            default:
                // If the interaction type is not found, set the command to null and break
                command = null;
                break;
        }

        // Report if the command is not found
        if(command == null || command == undefined){
            if(process.env.NODE_ENV === 'development' || process.env.DEBUG) console.error(`Command ${interaction.commandName || interaction.customId} is not found.`);
            return;
        }

        try {
            // Execute the command
            await command.execute(interaction);
        } catch (error) {
            // Log the error to the console
            if(process.env.DEBUG) console.error(error);
            // Send an error message to the user
            // Check if the interaction is replied or deferred
            // If the interaction is replied or deferred, follow up with the error message
            // If the interaction is not replied or deferred, reply to the interaction with the error message
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true }).catch(() => {});
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true }).catch(() => {});
            }
        }

    })

}