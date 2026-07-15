import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Pool } from "pg";
import { getConfig } from "../config/app.config.js";

@Injectable()
export class DatabaseReadinessService implements OnModuleDestroy {
  private readonly pool = new Pool({
    connectionString: getConfig().databaseUrl,
    max: 2,
  });

  async isReady(): Promise<boolean> {
    const result = await this.pool.query<{ ready: number }>("select 1 as ready");
    return result.rows[0]?.ready === 1;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
