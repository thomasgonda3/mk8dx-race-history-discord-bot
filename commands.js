import { SlashCommandBuilder } from "discord.js";
import sql from "mssql";
import { generateApiKey } from "generate-api-key";
import "dotenv/config";

const dbName =
  process.env.IS_PRODUCTION === "true"
    ? process.env.DATABASE_NAME
    : process.env.TEST_DATABASE_NAME;

const config = {
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: dbName,
  server: process.env.DATABASE_SERVER,
  timeout: 10000000,
  pool: {
    max: 1000,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    trustServerCertificate: true,
    trustedConnection: true,
    multipleActiveResultSets: true,
    encrypt: false,
  },
};

sql.connect(config);

const insertUserQuery = `INSERT INTO [${dbName}].[dbo].[Players] 
	  ([Name]
      ,[Discord_ID]
      ,[Discord_Name]
      ,[Team])
VALUES
	  (@Name
	  ,@Discord_ID
	  ,@Discord_Name
	  ,@Team)
      SELECT SCOPE_IDENTITY();`;

const newUser = {
  data: new SlashCommandBuilder()
    .setName("newuser")
    .setDescription("Creates new user on race-tracker website")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Display Name for race-tracker website")
        .setRequired(true)
        .setMaxLength(50)
    )
    .addStringOption((option) =>
      option.setName("team").setDescription("Team").setMaxLength(50)
    ),
  async execute(interaction) {
    try {
      const ps = new sql.PreparedStatement();
      ps.input("Name", sql.NVarChar(50));
      ps.input("Discord_ID", sql.VarChar(25));
      ps.input("Discord_Name", sql.NVarChar(50));
      ps.input("Team", sql.NVarChar(50));
      await ps.prepare(insertUserQuery);
      const Name = interaction.options.getString("name");
      const Team = interaction.options.getString("team");
      const callback = await ps.execute({
        Name,
        Discord_ID: interaction.user.id,
        Discord_Name: interaction.user.username,
        Team,
      });
      await ps.unprepare();
      await interaction.reply(
        `New User created, profile page ${process.env.WEBSITE_URL}/player/${callback.recordset[0][""]}`
      );
    } catch (e) {
      if (e.message.includes("Violation of UNIQUE KEY constraint"))
        await interaction.reply("ERROR: User already exists");
      else {
        console.log(e);
      }
    }
  },
};

const insertAPIKeyQuery = `UPDATE [${dbName}].[dbo].[Players] 
	  SET [API_Key] = @API_KEY
    WHERE [Discord_ID] = @Discord_ID;`;

const generateAPIKey = {
  data: new SlashCommandBuilder()
    .setName("generate_apikey")
    .setDescription("generates an apikey for use on race tracker website"),
  async execute(interaction) {
    try {
      const ps = new sql.PreparedStatement();
      ps.input("API_Key", sql.NVarChar(50));
      ps.input("Discord_ID", sql.VarChar(25));
      await ps.prepare(insertAPIKeyQuery);
      const API_Key = generateApiKey({ method: "uuidv4", dashes: false });
      await ps.execute({
        API_Key,
        Discord_ID: interaction.user.id,
      });
      await ps.unprepare();
      await interaction.reply({
        content: `${API_Key}`,
        ephemeral: true,
      });
    } catch (e) {
      if (e.message.includes("Violation of UNIQUE KEY constraint"))
        await interaction.reply("ERROR: Try again.");
      else {
        console.log(e);
      }
    }
  },
};

const playerIDQuery = `SELECT TOP (1) [ID]
      FROM [${dbName}].[dbo].[Players]
      WHERE [Discord_ID] = @Discord_ID`;

const insertRaceQuery = `INSERT INTO [${dbName}].[dbo].[Races] 
	  ([PlayerID]
      ,[Discord_ID]
      ,[Track]
      ,[Mode]
      ,[Result])
VALUES
	  (@PlayerID
      ,@Discord_ID  
	  ,@Track
	  ,@Mode
	  ,@Result)
      SELECT SCOPE_IDENTITY();`;

const tracksLowercaseMap = {
  mks: "MKS",
  wp: "WP",
  ssc: "SSC",
  tr: "TR",
  mc: "MC",
  th: "TH",
  tm: "TM",
  sgf: "SGF",
  sa: "SA",
  ds: "DS",
  ed: "Ed",
  mw: "MW",
  cc: "CC",
  bdd: "BDD",
  bc: "BC",
  rr: "RR",
  rmmm: "rMMM",
  rmc: "rMC",
  rccb: "rCCB",
  rtt: "rTT",
  rddd: "rDDD",
  rdp3: "rDP3",
  rrry: "rRRy",
  rdkj: "rDKJ",
  rws: "rWS",
  rsl: "rSL",
  rmp: "rMP",
  ryv: "rYV",
  rttc: "rTTC",
  rpps: "rPPS",
  rgv: "rGV",
  rrrd: "rRRd",
  dyc: "dYC",
  dea: "dEA",
  ddd: "dDD",
  dmc: "dMC",
  dwgm: "dWGM",
  drr: "dRR",
  diio: "dIIO",
  dhc: "dHC",
  dbp: "dBP",
  dcl: "dCL",
  dww: "dWW",
  dac: "dAC",
  dnbc: "dNBC",
  drir: "dRiR",
  dsbs: "dSBS",
  dbb: "dBB",
  bpp: "bPP",
  btc: "bTC",
  bcmo: "bCMo",
  bcma: "bCMa",
  btb: "bTB",
  bsr: "bSR",
  bsg: "bSG",
  bnh: "bNH",
  bnym: "bNYM",
  bmc3: "bMC3",
  bkd: "bKD",
  bwp: "bWP",
  bss: "bSS",
  bsl: "bSL",
  bmg: "bMG",
  bshs: "bSHS",
  bll: "bLL",
  bbl: "bBL",
  brrm: "bRRM",
  bmt: "bMT",
  bbb: "bBB",
  bpg: "bPG",
  bmm: "bMM",
  brr7: "bRR7",
  bad: "bAD",
  brp: "bRP",
  bdks: "bDKS",
  byi: "bYI",
  bbr: "bBR",
  bmc: "bMC",
  bws: "bWS",
  bssy: "bSSy",
  batd: "bAtD",
  bdc: "bDC",
  bmh: "bMH",
  bscs: "bSCS",
  blal: "bLAL",
  bsw: "bSW",
  bkc: "bKC",
  bvv: "bVV",
  bra: "bRA",
  bdkm: "bDKM",
  bdct: "bDCt",
  bppc: "bPPC",
  bmd: "bMD",
  briw: "bRIW",
  bbc3: "bBC3",
  brrw: "bRRw",
};

const tracksMap = {
  MKS: "Mario Kart Stadium",
  WP: "Water Park",
  SSC: "Sweet Sweet Canyon",
  TR: "Thwomp Ruins",
  MC: "Mario Circuit",
  TH: "Toad Harbor",
  TM: "Twisted Mansion",
  SGF: "Shy Guy Falls",
  SA: "Sunshine Airport",
  DS: "Dolphin Shoals",
  Ed: "Electrodrome",
  MW: "Mount Wario",
  CC: "Cloudtop Cruise",
  BDD: "Bone-Dry Dunes",
  BC: "Bowser's Castle",
  RR: "Rainbow Road",
  rMMM: "Wii Moo Moo Meadows",
  rMC: "GBA Mario Circuit",
  rCCB: "DS Cheep Cheep Beach",
  rTT: "N64 Toad's Turnpike",
  rDDD: "GCN Dry Dry Desert",
  rDP3: "SNES Donut Plains 3",
  rRRy: "N64 Royal Raceway",
  rDKJ: "3DS DK Jungle",
  rWS: "DS Wario Stadium",
  rSL: "GCN Sherbet Land",
  rMP: "3DS Music Park",
  rYV: "N64 Yoshi Valley",
  rTTC: "DS Tick-Tock Clock",
  rPPS: "3DS Piranha Plant Slide",
  rGV: "Wii Grumble Volcano",
  rRRd: "N64 Rainbow Road",
  dYC: "GCN Yoshi Circuit",
  dEA: "Excitebike Arena",
  dDD: "Dragon Driftway",
  dMC: "Mute City",
  dWGM: "Wii Wario's Gold Mine",
  dRR: "SNES Rainbow Road",
  dIIO: "Ice Ice Outpost",
  dHC: "Hyrule Circuit",
  dBP: "GCN Baby Park",
  dCL: "GBA Cheese Land",
  dWW: "Wild Woods",
  dAC: "Animal Crossing",
  dNBC: "3DS Neo Bowser City",
  dRiR: "GBA Ribbon Road",
  dSBS: "Super Bell Subway",
  dBB: "Big Blue",
  bPP: "Tour Paris Promenade",
  bTC: "3DS Toad Circuit",
  bCMo: "N64 Choco Mountain",
  bCMa: "Wii Coconut Mall",
  bTB: "Tour Tokyo Blur",
  bSR: "DS Shroom Ridge",
  bSG: "GBA Sky Garden",
  bNH: "Tour Ninja Hideaway",
  bNYM: "Tour New York Minute",
  bMC3: "SNES Mario Circuit 3",
  bKD: "N64 Kalimari Desert",
  bWP: "DS Waluigi Pinball",
  bSS: "Tour Sydney Sprint",
  bSL: "GBA Snow Land",
  bMG: "Wii Mushroom Gorge",
  bSHS: "Sky-High Sundae",
  bLL: "Tour London Loop",
  bBL: "GBA Boo Lake",
  bRRM: "3DS Rock Rock Mountain",
  bMT: "Wii Maple Treeway",
  bBB: "Tour Berlin Byways",
  bPG: "DS Peach Gardens",
  bMM: "Tour Merry Mountain",
  bRR7: "3DS Rainbow Road",
  bAD: "Tour Amsterdam Drift",
  bRP: "GBA Riverside Park",
  bDKS: "Wii DK Summit",
  bYI: "Yoshi's Island",
  bBR: "Tour Bangkok Rush",
  bMC: "DS Mario Circuit",
  bWS: "GCN Waluigi Stadium",
  bSSy: "Tour Singapore Speedway",
  bAtD: "Tour Athens Dash",
  bDC: "GCN Daisy Cruiser",
  bMH: "Wii Moonview Highway",
  bSCS: "Squeaky Clean Sprint",
  bLAL: "Tour Los Angeles Laps",
  bSW: "GBA Sunset Wilds",
  bKC: "Wii Koopa Cape",
  bVV: "Tour Vancouver Velocity",
  bRA: "Tour Rome Avanti",
  bDKM: "GCN DK Mountain",
  bDCt: "Wii Daisy Circuit",
  bPPC: "Piranha Plant Cove",
  bMD: "Tour Madrid Drive",
  bRIW: "3DS Rosalina's Ice World",
  bBC3: "SNES Bowser Castle 3",
  bRRw: "Wii Rainbow Road",
};

const tracks = Object.keys(tracksMap);

const rankingMap = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
];

const newRace = {
  data: new SlashCommandBuilder()
    .setName("newrace")
    .setDescription("Creates new race on race-tracker website")
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Type of Race")
        .setRequired(true)
        .addChoices(
          { name: "Casual", value: "Casual" },
          { name: "Mogi", value: "Mogi" },
          { name: "Tournament", value: "Tournament" },
          { name: "War", value: "War" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("track")
        .setDescription("Track abbreviation of current race")
        .setRequired(true)
        .setAutocomplete(true)
        .setMaxLength(50)
    )
    .addIntegerOption((option) =>
      option
        .setName("result")
        .setDescription("User's Placement in race")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(12)
    ),
  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused();
      let filtered = tracks.filter((choice) => choice.startsWith(focusedValue));
      if (filtered.length > 25) filtered = filtered.slice(0, 25);

      await interaction.respond(
        filtered.map((choice) => ({ name: choice, value: choice }))
      );
    } catch (e) {
      console.log(e);
    }
  },
  async execute(interaction) {
    try {
      let Track = interaction.options.getString("track").toLowerCase();
      if (tracksLowercaseMap[Track] == null) {
        return await interaction.reply("Invalid Track Name.");
      } else Track = tracksLowercaseMap[Track];
      let ps = new sql.PreparedStatement();
      ps.input("Discord_ID", sql.VarChar(25));
      await ps.prepare(playerIDQuery);
      let query = await ps.execute({
        Discord_ID: interaction.user.id,
      });
      await ps.unprepare();
      if (query.recordset.length === 0) {
        return await interaction.reply(
          "User does not exist, and cannot create races.  Use command /newuser."
        );
      }
      const PlayerID = query.recordset[0].ID;
      const Mode = interaction.options.getString("mode");
      const Result = interaction.options.getInteger("result");
      ps = new sql.PreparedStatement();
      ps.input("PlayerID", sql.Int);
      ps.input("Discord_ID", sql.VarChar(25));
      ps.input("Track", sql.NVarChar(50));
      ps.input("Mode", sql.NVarChar(50));
      ps.input("Result", sql.Int);
      await ps.prepare(insertRaceQuery);
      const callback = await ps.execute({
        PlayerID,
        Discord_ID: interaction.user.id,
        Track,
        Mode,
        Result,
      });
      await ps.unprepare();
      await interaction.reply(
        `Inserted Race ID: ${callback.recordset[0][""]}, ${
          rankingMap[Result - 1]
        } on ${tracksMap[Track]}`
      );
    } catch (e) {
      console.log(e);
    }
  },
};

const casualRace = {
  data: new SlashCommandBuilder()
    .setName("c_race")
    .setDescription("Creates new casual race on race-tracker website")
    .addStringOption((option) =>
      option
        .setName("track")
        .setDescription("Track abbreviation of current race")
        .setRequired(true)
        .setAutocomplete(true)
        .setMaxLength(50)
    )
    .addIntegerOption((option) =>
      option
        .setName("result")
        .setDescription("User's Placement in race")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(12)
    ),
  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused();
      let filtered = tracks.filter((choice) => choice.startsWith(focusedValue));
      if (filtered.length > 25) filtered = filtered.slice(0, 25);

      await interaction.respond(
        filtered.map((choice) => ({ name: choice, value: choice }))
      );
    } catch (e) {
      console.log(e);
    }
  },
  async execute(interaction) {
    try {
      let Track = interaction.options.getString("track").toLowerCase();
      if (tracksLowercaseMap[Track] == null) {
        return await interaction.reply("Invalid Track Name.");
      } else Track = tracksLowercaseMap[Track];
      let ps = new sql.PreparedStatement();
      ps.input("Discord_ID", sql.VarChar(25));
      await ps.prepare(playerIDQuery);
      let query = await ps.execute({
        Discord_ID: interaction.user.id,
      });
      await ps.unprepare();
      if (query.recordset.length === 0) {
        return await interaction.reply(
          "User does not exist, and cannot create races.  Use command /newuser."
        );
      }
      const PlayerID = query.recordset[0].ID;
      const Result = interaction.options.getInteger("result");
      ps = new sql.PreparedStatement();
      ps.input("PlayerID", sql.Int);
      ps.input("Discord_ID", sql.VarChar(25));
      ps.input("Track", sql.NVarChar(50));
      ps.input("Mode", sql.NVarChar(50));
      ps.input("Result", sql.Int);
      await ps.prepare(insertRaceQuery);
      const callback = await ps.execute({
        PlayerID,
        Discord_ID: interaction.user.id,
        Track,
        Mode: "Casual",
        Result,
      });
      await ps.unprepare();
      await interaction.reply(
        `Inserted Race ID: ${callback.recordset[0][""]}, ${
          rankingMap[Result - 1]
        } on ${tracksMap[Track]}`
      );
    } catch (e) {
      console.log(e);
    }
  },
};

const mogiRace = {
  data: new SlashCommandBuilder()
    .setName("m_race")
    .setDescription("Creates new mogi race on race-tracker website")
    .addStringOption((option) =>
      option
        .setName("track")
        .setDescription("Track abbreviation of current race")
        .setRequired(true)
        .setAutocomplete(true)
        .setMaxLength(50)
    )
    .addIntegerOption((option) =>
      option
        .setName("result")
        .setDescription("User's Placement in race")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(12)
    ),
  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused();
      let filtered = tracks.filter((choice) => choice.startsWith(focusedValue));
      if (filtered.length > 25) filtered = filtered.slice(0, 25);

      await interaction.respond(
        filtered.map((choice) => ({ name: choice, value: choice }))
      );
    } catch (e) {
      console.log(e);
    }
  },
  async execute(interaction) {
    try {
      let Track = interaction.options.getString("track").toLowerCase();
      if (tracksLowercaseMap[Track] == null) {
        return await interaction.reply("Invalid Track Name.");
      } else Track = tracksLowercaseMap[Track];
      let ps = new sql.PreparedStatement();
      ps.input("Discord_ID", sql.VarChar(25));
      await ps.prepare(playerIDQuery);
      let query = await ps.execute({
        Discord_ID: interaction.user.id,
      });
      await ps.unprepare();
      if (query.recordset.length === 0) {
        return await interaction.reply(
          "User does not exist, and cannot create races.  Use command /newuser."
        );
      }
      const PlayerID = query.recordset[0].ID;
      const Result = interaction.options.getInteger("result");
      ps = new sql.PreparedStatement();
      ps.input("PlayerID", sql.Int);
      ps.input("Discord_ID", sql.VarChar(25));
      ps.input("Track", sql.NVarChar(50));
      ps.input("Mode", sql.NVarChar(50));
      ps.input("Result", sql.Int);
      await ps.prepare(insertRaceQuery);
      const callback = await ps.execute({
        PlayerID,
        Discord_ID: interaction.user.id,
        Track,
        Mode: "Mogi",
        Result,
      });
      await ps.unprepare();
      await interaction.reply(
        `Inserted Race ID: ${callback.recordset[0][""]}, ${
          rankingMap[Result - 1]
        } on ${tracksMap[Track]}`
      );
    } catch (e) {
      console.log(e);
    }
  },
};

const tournamentRace = {
  data: new SlashCommandBuilder()
    .setName("t_race")
    .setDescription("Creates new tournament race on race-tracker website")
    .addStringOption((option) =>
      option
        .setName("track")
        .setDescription("Track abbreviation of current race")
        .setRequired(true)
        .setAutocomplete(true)
        .setMaxLength(50)
    )
    .addIntegerOption((option) =>
      option
        .setName("result")
        .setDescription("User's Placement in race")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(12)
    ),
  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused();
      let filtered = tracks.filter((choice) => choice.startsWith(focusedValue));
      if (filtered.length > 25) filtered = filtered.slice(0, 25);

      await interaction.respond(
        filtered.map((choice) => ({ name: choice, value: choice }))
      );
    } catch (e) {
      console.log(e);
    }
  },
  async execute(interaction) {
    try {
      let Track = interaction.options.getString("track").toLowerCase();
      if (tracksLowercaseMap[Track] == null) {
        return await interaction.reply("Invalid Track Name.");
      } else Track = tracksLowercaseMap[Track];
      let ps = new sql.PreparedStatement();
      ps.input("Discord_ID", sql.VarChar(25));
      await ps.prepare(playerIDQuery);
      let query = await ps.execute({
        Discord_ID: interaction.user.id,
      });
      await ps.unprepare();
      if (query.recordset.length === 0) {
        return await interaction.reply(
          "User does not exist, and cannot create races.  Use command /newuser."
        );
      }
      const PlayerID = query.recordset[0].ID;
      const Result = interaction.options.getInteger("result");
      ps = new sql.PreparedStatement();
      ps.input("PlayerID", sql.Int);
      ps.input("Discord_ID", sql.VarChar(25));
      ps.input("Track", sql.NVarChar(50));
      ps.input("Mode", sql.NVarChar(50));
      ps.input("Result", sql.Int);
      await ps.prepare(insertRaceQuery);
      const callback = await ps.execute({
        PlayerID,
        Discord_ID: interaction.user.id,
        Track,
        Mode: "Tournament",
        Result,
      });
      await ps.unprepare();
      await interaction.reply(
        `Inserted Race ID: ${callback.recordset[0][""]}, ${
          rankingMap[Result - 1]
        } on ${tracksMap[Track]}`
      );
    } catch (e) {
      console.log(e);
    }
  },
};

const warRace = {
  data: new SlashCommandBuilder()
    .setName("w_race")
    .setDescription("Creates new war race on race-tracker website")
    .addStringOption((option) =>
      option
        .setName("track")
        .setDescription("Track abbreviation of current race")
        .setRequired(true)
        .setAutocomplete(true)
        .setMaxLength(50)
    )
    .addIntegerOption((option) =>
      option
        .setName("result")
        .setDescription("User's Placement in race")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(12)
    ),
  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused();
      let filtered = tracks.filter((choice) => choice.startsWith(focusedValue));
      if (filtered.length > 25) filtered = filtered.slice(0, 25);

      await interaction.respond(
        filtered.map((choice) => ({ name: choice, value: choice }))
      );
    } catch (e) {
      console.log(e);
    }
  },
  async execute(interaction) {
    try {
      let Track = interaction.options.getString("track").toLowerCase();
      if (tracksLowercaseMap[Track] == null) {
        return await interaction.reply("Invalid Track Name.");
      } else Track = tracksLowercaseMap[Track];
      let ps = new sql.PreparedStatement();
      ps.input("Discord_ID", sql.VarChar(25));
      await ps.prepare(playerIDQuery);
      let query = await ps.execute({
        Discord_ID: interaction.user.id,
      });
      await ps.unprepare();
      if (query.recordset.length === 0) {
        return await interaction.reply(
          "User does not exist, and cannot create races.  Use command /newuser."
        );
      }
      const PlayerID = query.recordset[0].ID;
      const Result = interaction.options.getInteger("result");
      ps = new sql.PreparedStatement();
      ps.input("PlayerID", sql.Int);
      ps.input("Discord_ID", sql.VarChar(25));
      ps.input("Track", sql.NVarChar(50));
      ps.input("Mode", sql.NVarChar(50));
      ps.input("Result", sql.Int);
      await ps.prepare(insertRaceQuery);
      const callback = await ps.execute({
        PlayerID,
        Discord_ID: interaction.user.id,
        Track,
        Mode: "War",
        Result,
      });
      await ps.unprepare();
      await interaction.reply(
        `Inserted Race ID: ${callback.recordset[0][""]}, ${
          rankingMap[Result - 1]
        } on ${tracksMap[Track]}`
      );
    } catch (e) {
      console.log(e);
    }
  },
};

const checkRaceDiscordIDQuery = `SELECT [Discord_ID]
FROM [${dbName}].[dbo].[Races]
WHERE [ID] = @ID`;

const deleteRaceQuery = `DELETE FROM [${dbName}].[dbo].[Races]
WHERE [ID] = `;

const deleteRace = {
  data: new SlashCommandBuilder()
    .setName("delete_race")
    .setDescription("Deletes Race from race-tracker website")
    .addIntegerOption((option) =>
      option
        .setName("id")
        .setDescription("The Race ID to delete")
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
      const ID = interaction.options.getInteger("id");
      const ps = new sql.PreparedStatement();
      ps.input("ID", sql.Int);
      await ps.prepare(checkRaceDiscordIDQuery);
      const result = await ps.execute({
        ID,
      });
      await ps.unprepare();
      if (result.recordset.length === 0) {
        return await interaction.reply(`Race ID does not exist.`);
      }
      if (result.recordset[0].Discord_ID != interaction.user.id) {
        return await interaction.reply(`User does not own this race.`);
      }
      await sql.query(deleteRaceQuery + ID);
      await interaction.reply(`Deleted Race of ID: ${ID}`);
    } catch (e) {
      console.log(e);
    }
  },
};

const commands = [
  newUser,
  generateAPIKey,
  newRace,
  casualRace,
  mogiRace,
  tournamentRace,
  warRace,
  deleteRace,
];

export default commands;
