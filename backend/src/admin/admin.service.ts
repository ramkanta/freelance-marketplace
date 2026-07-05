import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdminService {
  async getMigrationsList() {
    const migrationsPath = path.join(process.cwd(), 'supabase', 'migrations');
    if (!fs.existsSync(migrationsPath)) {
      return [];
    }
    
    const files = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to run chronologically

    return files.map(file => {
      const filePath = path.join(migrationsPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        name: file,
        sql: content,
      };
    });
  }

  async runMigrations() {
    const migrations = await this.getMigrationsList();
    if (migrations.length === 0) {
      return { message: 'No migration files found.' };
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    await client.connect();

    const results: any[] = [];
    try {
      // 1. Create a table to track which migrations have run (if it doesn't exist)
      await client.query(`
        CREATE TABLE IF NOT EXISTS _executed_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Query already executed migrations
      const { rows } = await client.query('SELECT name FROM _executed_migrations');
      const executedSet = new Set(rows.map(r => r.name));

      // 3. Run pending migrations one by one
      for (const migration of migrations) {
        if (executedSet.has(migration.name)) {
          results.push({ name: migration.name, status: 'SKIPPED', detail: 'Already executed' });
          continue;
        }

        try {
          await client.query(migration.sql);
          await client.query('INSERT INTO _executed_migrations (name) VALUES ($1)', [migration.name]);
          results.push({ name: migration.name, status: 'SUCCESS' });
        } catch (err: any) {
          results.push({ name: migration.name, status: 'FAILED', error: err.message });
          throw new Error(`Migration ${migration.name} failed: ${err.message}`);
        }
      }

      return {
        success: true,
        results,
      };
    } catch (error: any) {
      throw new InternalServerErrorException({
        message: 'Migration run failed',
        error: error.message,
        results,
      });
    } finally {
      await client.end();
    }
  }
}
