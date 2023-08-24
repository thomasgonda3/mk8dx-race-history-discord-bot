import { REST, Routes } from "discord.js";
import commands from "./commands.js";
import "dotenv/config";

const commandJSONs = [];

for (const command of commands) {
  if ("data" in command && "execute" in command) {
    commandJSONs.push(command.data.toJSON());
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

const rest = new REST().setToken(process.env.TOKEN_ID);

(async () => {
  try {
    console.log(
      `Started refreshing ${commandJSONs.length} application (/) commands.`
    );

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commandJSONs }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();
