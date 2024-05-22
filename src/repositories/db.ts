import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import formatFid from "../utils/formatFid";

export class DatabaseService {
  private static instance: DatabaseService;
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private nameDb: string;

  private constructor(nameDb: string) {
    this.nameDb = nameDb;
  }

  public static getInstance(nameDb: string = "mydatabase.db"): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService(nameDb);
    }
    return DatabaseService.instance;
  }

  private async connDatabase(): Promise<SQLiteDBConnection> {
    const ret = await this.sqlite.checkConnectionsConsistency();
    const isConn = (await this.sqlite.isConnection(this.nameDb, false)).result;

    if (ret.result && isConn) {
      return this.sqlite.retrieveConnection(this.nameDb, false);
    } else {
      return this.sqlite.createConnection(
        this.nameDb,
        false,
        "no-encryption",
        1,
        false,
      );
    }
  }

  public async createDefaultTables(): Promise<void> {
    const db = await this.connDatabase();
    await db.open();

    await db.execute(`CREATE TABLE IF NOT EXISTS data (
      fid TEXT PRIMARY KEY,
      layer TEXT,
      data TEXT,
      UNIQUE(layer, fid)
    );`);
  }

  public async query(sql: string, params?: any[]): Promise<any> {
    const db = await this.connDatabase();
    await db.open();

    try {
      const result = await db.query(sql, params);
      return result;
    } finally {
      // await db.close();
    }
  }

  public async execute(sql: string, params?: any[]): Promise<any> {
    const db = await this.connDatabase();
    await db.open();

    try {
      const result = await db.execute(sql);
      return result;
    } finally {
      // await db.close();
    }
  }

  /**
   * Atualiza ou insere dados em uma tabela específica no banco de dados.
   *
   * @async
   * @param {(ILote | IImobiliario | IImobiliarioEdificacao | IEdificacao | IPessoa | IImobiliarioPessoa | IVisitas | IMensagens | IMidia)} data - Os dados a serem atualizados ou inseridos.
   * @param {NomeTabela} table - O nome da tabela onde os dados serão atualizados ou inseridos.
   * @param {string} fid - O ID do registro a ser atualizado ou inserido.
   * @returns {Promise<any>} Uma Promise que resolve quando a operação é concluída.
   */
  public async upsert(
    data: { [key: string]: any },
    table: string,
    fid: string,
  ): Promise<any> {
    console.log(`upserting -> ${fid}@${table}`);
    const db = await this.connDatabase();
    await db.open();

    try {
      let query = `INSERT OR REPLACE INTO data (fid,data,layer,geom) VALUES
      (${formatFid(fid)},'${JSON.stringify(data)}','${table}','${JSON.stringify(
        data.geometry,
      )}');`;

      // console.log(`upserting -> ${query}`)
      return await db.execute(query);
    } finally {
      // await db.close();
    }
  }

  public async getDefaults(table: string): Promise<any> {
    const db = await this.connDatabase();
    await db.open();

    try {
      const row = await db.query(
        `SELECT * FROM data WHERE table = ${table} LIMIT 1`,
      );

      if (row && row.values && row.values[0]) {
        var data = JSON.parse(row.values[0].data);

        var newData: any = {};
        var newRow: any = {};

        for (const key in data) {
          newData[key] = null;
        }

        for (const key in row!.values[0]) {
          newRow[key] = null;
        }

        return { ...newRow, data: newData };
      } else {
        throw new Error(`Nao foi possivel gerar a estrutura para o dado`);
      }
    } finally {
      // await db.close();
    }
  }
}

export const db = DatabaseService.getInstance();
