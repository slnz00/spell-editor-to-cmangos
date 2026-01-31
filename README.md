## WoW Spell Editor to CMaNGOS Exporter

A script for bridging the gap between [Stoneharry's Spell Editor](https://github.com/stoneharry/WoW-Spell-Editor) and the CMaNGOS database.

Reads directly from the Spell Editor's SQLite database and generates CMaNGOS-compatible SQL `INSERT` or `UPDATE` statements for the specific Spell IDs you define.

### Requirements
- **Node.js v24** (or higher)

### Setup
1. Install dependencies, run from the project root: `npm i`
2. Create a .env file in the project root (see: `.env.example`):
```
# Path to the Spell Editor's directory on your machine
SPELL_EDITOR_PATH=C:/Path/To/WoW-Spell-Editor

# CMaNGOS database connection string
# Optional: Only required for db schema generation
CMANGOS_DB_URL=mysql://user:password@localhost:3306/mangos
```
### Usage
- Your Spell Editor must be configured to use SQLite as script reads directly from the local .db file.
- Open `src/config.ts` and add the IDs of the spells you wish to export to the `spells.ids` array.
- A timestamped SQL file is generated in the `output/` directory. You can run this file directly on your CMaNGOS database.
