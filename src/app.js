import { Client, GatewayIntentBits } from "discord.js";
import { readdir } from "fs/promises";
import "dotenv/config";
import mongoose from "mongoose";

// Login to the database
// Exit if the connection fails
// Uncomment the code below to connect to the database
console.log("Connecting to the database...");
await mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_URL}`).catch((err) => {
    if(process.env.DEBUG) console.error(err);
    console.error("Could not connect to the database. Exiting...");
    process.exit(1)
})
console.log("Connected to the database.");

// Create a new client instance
// Required intents are passed as an array
const client = new Client({
    intents : [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// Create a new property to store the interactions
client.interactions = {
    applicationCommands : new Map(),
    messageComponents : new Map(),
    modalSubmits : new Map()
}

// Import application commands
// Read the application commands from the ApplicationCommands folder
// Loop through the files and import them
// Store the command in the applicationCommands property
const commandFiles = await readdir("./src/Interactions/ApplicationCommands").catch(() => {
    console.error("ApplicationCommands folder not found. Skipping command loading.");
    return [];
})
for (const file of commandFiles) {
    const command = await import(`./Interactions/ApplicationCommands/${file}`);
    if("data" in command.default && "execute" in command.default)
    client.interactions.applicationCommands.set(command.default.data.name, command.default);
    else console.error(`Command ${file} is not loaded properly. Please check the file.`);
}

// Import message components
// Read the message components from the MessageComponents folder
// Loop through the files and import them
// Store the message component in the messageComponents property
const messageComponentFiles = await readdir("./src/Interactions/MessageComponents").catch(() => {
    console.error("MessageComponents folder not found. Skipping message component loading.");
    return [];
})
for (const file of messageComponentFiles) {
    const messageComponent = await import(`./Interactions/MessageComponents/${file}`);
    if("customId" in messageComponent.default && "execute" in messageComponent.default)
    client.interactions.messageComponents.set(messageComponent.default.customId, messageComponent.default);
    else console.error(`Message Component ${file} is not loaded properly. Please check the file.`);
}

// Import modal submits
// Read the modal submits from the ModalSubmits folder
// Loop through the files and import them
// Store the modal submit in the modalSubmits property
const modalSubmitFiles = await readdir("./src/Interactions/ModalSubmits").catch(() => {
    console.error("ModalSubmits folder not found. Skipping modal submit loading.");
    return [];
})
for(const file of modalSubmitFiles){
    const modalSubmit = await import(`./Interactions/ModalSubmits/${file}`);
    if("customId" in modalSubmit.default && "execute" in modalSubmit.default)
    client.interactions.modalSubmits.set(modalSubmit.default.customId, modalSubmit.default);
    else console.error(`Modal Submit ${file} is not loaded properly. Please check the file.`);
}

// Import event handlers
// Read the events from the Events folder
// Loop through the files and import them
// Call the default function with the client instance
const eventFiles = await readdir("./src/Events").catch(() => {
    console.error("Events folder not found. Skipping event loading.");
    return [];
})
for (const file of eventFiles) {
    const event = await import(`./Events/${file}`);
    event.default(client);
}

// Login to the client
// Exit if the login fails
console.log("Logging in...");
await client.login(process.env.NODE_ENV === "development" ? process.env.TEST_BOT_TOKEN : process.env.BOT_TOKEN)