import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private dbInstance: SQLiteObject;

  constructor(private platform: Platform, private sqlite: SQLite) {
    this.platform.ready().then(() => {
      this.createDatabase();
    });
  }

  async createDatabase() {
    try {
      this.dbInstance = await this.sqlite.create({
        name: 'database.db',
        location: 'default'
      });

      console.log('Base de datos creada');

      await this.dbInstance.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          password TEXT NOT NULL
        )`, []
      );

      console.log('Tabla users creada o ya existente');

    } catch (error) {
      console.error('Error creando la base de datos', error);
    }
  }

  // Método opcional para insertar un usuario
  async addUser(username: string, password: string) {
    try {
      const result = await this.dbInstance.executeSql(
        `INSERT INTO users (username, password) VALUES (?, ?)`, 
        [username, password]
      );
      console.log('Usuario insertado');
      return result;
    } catch (error) {
      console.error('Error insertando usuario', error);
    }
  }

}
