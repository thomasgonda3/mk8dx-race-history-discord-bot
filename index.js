import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import "dotenv/config";

import commands from "./commands.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

for (const command of commands) {
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

client.once(Events.ClientReady, () => {
  console.log("Ready!");
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isAutocomplete())
    return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    if (interaction.isAutocomplete()) command.autocomplete(interaction);
    else await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.TOKEN_ID);
