import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";

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

    await db.execute(`
      CREATE TABLE IF NOT EXISTS layers (
        layer TEXT PRIMARY KEY,
        style TEXT,
        is_visible BOOLEAN DEFAULT TRUE,
        UNIQUE (layer)
      );`);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS proj_defs (
        key TEXT,
        data TEXT
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
}

export const db = DatabaseService.getInstance();
