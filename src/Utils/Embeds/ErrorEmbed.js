import { EmbedBuilder } from "discord.js";

export const RedEmbed = (description) => new EmbedBuilder().setDescription(description).setColor("Red")
export const GreenEmbed = (description) => new EmbedBuilder().setDescription(description).setColor("Green")
export const YellowEmbed = (description) => new EmbedBuilder().setDescription(description).setColor("Yellow")
export const WhiteEmbed = (description) => new EmbedBuilder().setDescription(description).setColor("White")