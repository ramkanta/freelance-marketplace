import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdminService {
  private getDbClient() {
    return new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  async getMigrationsList() {
    const migrationsPath = path.join(process.cwd(), 'supabase', 'migrations');
    if (!fs.existsSync(migrationsPath)) {
      return [];
    }
    
    const files = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Connect to database to check which migrations have already been run
    let executedSet = new Set<string>();
    const client = this.getDbClient();
    try {
      await client.connect();
      // Ensure executed migrations table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS _executed_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      const { rows } = await client.query('SELECT name FROM _executed_migrations');
      executedSet = new Set(rows.map(r => r.name));
    } catch (err) {
      // If DB is not connected yet, fall back to empty execution set
      console.error('Database connection failed while fetching migrations status:', err.message);
    } finally {
      await client.end();
    }

    return files.map(file => {
      const filePath = path.join(migrationsPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      return {
        name: file,
        sql: content,
        executed: executedSet.has(file),
      };
    });
  }

  async runSingleMigration(name: string) {
    const migrationsPath = path.join(process.cwd(), 'supabase', 'migrations');
    const filePath = path.join(migrationsPath, name);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Migration file ${name} not found.`);
    }

    const sql = fs.readFileSync(filePath, 'utf-8');
    const client = this.getDbClient();
    await client.connect();

    try {
      // 1. Ensure tracker table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS _executed_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Check if already executed
      const { rows } = await client.query('SELECT id FROM _executed_migrations WHERE name = $1', [name]);
      if (rows.length > 0) {
        throw new BadRequestException(`Migration ${name} has already been executed.`);
      }

      // 3. Execute SQL
      await client.query(sql);
      await client.query('INSERT INTO _executed_migrations (name) VALUES ($1)', [name]);

      return {
        success: true,
        name,
        status: 'SUCCESS',
      };
    } catch (err: any) {
      throw new BadRequestException({
        message: `Migration ${name} failed to execute.`,
        error: err.message,
        status: 'FAILED',
      });
    } finally {
      await client.end();
    }
  }

  async runMigrations() {
    const migrations = await this.getMigrationsList();
    const pendingMigrations = migrations.filter(m => !m.executed);

    if (pendingMigrations.length === 0) {
      return { message: 'All migrations are already executed.', results: [] };
    }

    const client = this.getDbClient();
    await client.connect();

    const results: any[] = [];
    try {
      // Run pending migrations one by one
      for (const migration of pendingMigrations) {
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
