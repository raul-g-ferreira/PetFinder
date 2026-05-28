import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { PetCard } from '../models/pet-card.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private readonly DB_NAME = 'petfinder_db'

  public isDbReady = new BehaviorSubject<boolean>(false)

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite)
  }

  async inicializarBanco(): Promise<void> {
    try {
      await this.sqlite.checkConnectionsConsistency()

      const isCon = await this.sqlite.isConnection(this.DB_NAME, false);

      if (isCon.result) {
        this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
      } else {
        this.db = await this.sqlite.createConnection(this.DB_NAME, false, 'no-encryption', 1, false);
      }

      this.db.open()

      const schema = `
        CREATE TABLE IF NOT EXISTS pets (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          description TEXT,
          photoUrl TEXT,
          latitude REAL,
          longitude REAL,
          contact TEXT,
          timestamp TEXT NOT NULL
        );
      `

      await this.db.execute(schema)

      this.isDbReady.next(true)

      console.log('Banco de dados inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar o SQLite', error)
    }
  }

  async adicionarCard(pet: PetCard): Promise<void> {
    const query = `
      INSERT INTO pets (id, type, description, photoUrl, latitude, longitude, contact, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `

    const values = [
      pet.id,
      pet.type,
      pet.description || '',
      pet.photoUrl || '',
      pet.latitude,
      pet.longitude,
      pet.contact,
      pet.timestamp.toISOString()
    ]

    await this.db.run(query, values)
  }

  async obterCards(): Promise<PetCard[]> {
    const query = `SELECT * FROM pets ORDER BY timestamp DESC`
    const resultado = await this.db.query(query)

    if (resultado.values && resultado.values.length > 0) {
      return resultado.values.map(row => ({
        id: row.id,
        type: row.type,
        description: row.description,
        photoUrl: row.photoUrl,
        latitude: row.latitude,
        longitude: row.longitude,
        contact: row.contact,
        timestamp: new Date(row.timestamp)
      }))
    }

    return []
  }

  async deletarCard(id: string): Promise<void> {
    const query = `DELETE FROM pets WHERE id = ?`
    await this.db.run(query, [id])
  }
}
