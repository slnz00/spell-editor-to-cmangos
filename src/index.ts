import knex from 'knex';
import { Kysely, SqliteDialect } from 'kysely';
import * as fs from 'node:fs';
import * as path from 'node:path'
import * as process from 'node:process'
import { config, ExportConfig } from './config';
import Database from 'better-sqlite3';
import { DBMapping, dbMappings } from './db/mappings';
import { DB as SpellEditorDB } from './db/schemas/editor';

const OUTPUT_DIR_PATH = path.resolve(__dirname, '../output')
const SPELL_EDITOR_DB_PATH = path.resolve(process.env.SPELL_EDITOR_PATH, 'SpellEditor.db')

const db = new Kysely<SpellEditorDB>({
  dialect: new SqliteDialect({
    database: new Database(SPELL_EDITOR_DB_PATH),
  }),
});

const qb = knex({ client: 'mysql' });

let outputSql = ''

const toSqlOutput = <TTable extends keyof typeof dbMappings>(
  cmangosTable: TTable,
  cmangosId: keyof typeof dbMappings[TTable],
  type: ExportConfig['type']
)=> (editorEntry: Record<string, any>) => {
  const mapping: DBMapping = dbMappings[cmangosTable]
  const data: Record<string, any> = {};

  Object.entries(mapping).forEach(([cmangosColumn, editorColumn]) => {
    if (!editorColumn) {
      return;
    }

    const value = typeof editorColumn === 'string' ? editorEntry[editorColumn] : editorColumn.value(editorEntry);

    if (value === undefined) {
      return;
    }

    data[cmangosColumn] = value;
  });

  if (type === 'insert') {
    outputSql += qb(cmangosTable)
      .insert(data)
      .toString() + ';\n';
  } else {
    const id = data[cmangosId as string]

    if (id === undefined || id === null) {
      throw new Error(`ID not found for ${cmangosTable}.${cmangosId as string}`);
    }

    delete data[cmangosId as string];

    outputSql += qb(cmangosTable)
      .update(data)
      .where({
        [cmangosId]: id
      })
      .toString() + ';\n';
  }
}

const exportSpells = async () => {
  const { ids, type } = config.spells

  const editorSpells = await db
    .selectFrom('spell')
    .selectAll()
    .where('ID', 'in', ids.map(id => id.toString()))
    .execute();

  if (!editorSpells.length) {
    return
  }

  outputSql += '-- Spell exports:\n'
  editorSpells.forEach(toSqlOutput('spell_template', 'Id', type))
  outputSql += '\n';
}

const main = async () => {
  if (!fs.existsSync(SPELL_EDITOR_DB_PATH)) {
    console.error('SpellEditor.db file not found. Please make sure the SPELL_EDITOR_PATH environment variable is correctly set in your .env file and you are using an SQLite database for SpellEditor.')
    console.error(`Loaded SPELL_EDITOR_PATH=${process.env.SPELL_EDITOR_PATH}`)
    process.exit(1)
  }

  fs.mkdirSync(OUTPUT_DIR_PATH, { recursive: true });

  await exportSpells();

  if (!outputSql) {
    console.log('Nothing to export...')
    return;
  }

  outputSql = [
    `-- Export config: ${JSON.stringify(config)}\n`,
    outputSql
  ].join('\n');

  const outputFile = `${new Date().getTime()}.sql`

  fs.writeFileSync(path.join(OUTPUT_DIR_PATH, outputFile), outputSql)

  console.log(`SQL successfully exported to: ./output/${outputFile}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1)
  })
