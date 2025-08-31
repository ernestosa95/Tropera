import { Injectable } from '@angular/core';
import { Platform, ToastController } from '@ionic/angular';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';

// Interfaz para la tabla de usuarios (ya la tenías o la añadimos para consistencia)
export interface User {
  id: number;
  username: string;
  firebase_uid?: string;
  password?: string; 
}

export interface Campo {
  id?: number; // El ID será autoincremental, así que es opcional al crear
  nombre: string;
  hectareas: number;
  activo: boolean; // Usaremos 1 para true, 0 para false en SQLite
  user_id: number;
}

export interface Ganado {
  id?: number; // ID de la fila en la tabla de ganado
  campo_id: number; // ID del campo al que pertenece este ganado
  vacas: number;
  toros: number;
  terneros: number;
  terneras: number;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private dbInstance: SQLiteObject;

  constructor(
    private platform: Platform, 
    private sqlite: SQLite, 
    public toastController: ToastController) {
    this.platform.ready().then(() => {
      this.createDatabase();
    });
  }

  // --- Método auxiliar para obtener la instancia de la DB de forma segura ---
  // Esto asegura que la DB esté lista antes de cualquier operación.
  private async getDbInstance(): Promise<SQLiteObject> {
    if (!this.dbInstance) {
      await this.createDatabase();
    }
    return this.dbInstance;
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
          password TEXT,
          email TEXT NOT NULL,
          firebase_uid TEXT
        )`, []
      );

      console.log('Tabla users creada o ya existente');

       // Creación de la nueva tabla 'campos'
       await this.dbInstance.executeSql(
        `CREATE TABLE IF NOT EXISTS campos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL UNIQUE, -- UNIQUE para evitar campos con el mismo nombre
          hectareas INTEGER NOT NULL,
          activo INTEGER NOT NULL, -- Usaremos 1 para true, 0 para false
          user_id INTEGER NOT NULL
        )`, []
      );
      console.log('Tabla campos creada o ya existente');

      // Tabla ganado
      await this.dbInstance.executeSql(
        `CREATE TABLE IF NOT EXISTS ganado (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          campo_id INTEGER NOT NULL UNIQUE, -- UNIQUE para que cada campo tenga solo una entrada de ganado
          vacas INTEGER NOT NULL DEFAULT 0,
          toros INTEGER NOT NULL DEFAULT 0,
          terneros INTEGER NOT NULL DEFAULT 0,
          terneras INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (campo_id) REFERENCES campos(id) ON DELETE CASCADE -- Si se borra el campo, se borra su ganado
        )`, []
      );
      console.log('Tabla ganado creada o ya existente');

    } catch (error) {
      console.error('Error creando o abriendo la base de datos:', error);
      // Podrías lanzar el error o manejarlo de otra forma
      throw new Error('No se pudo inicializar la base de datos.');
    }
  }

  // Método opcional para insertar un usuario
  async addUser(username: string, password: string, email: string) {
    try {
      const result = await this.dbInstance.executeSql(
        `INSERT INTO users (username, password, email) VALUES (?, ?, ?)`, 
        [username, password, email]
      );
      console.log('Usuario insertado');
      return result;
    } catch (error) {
      console.error('Error insertando usuario', error);
    }
  }

  /**
   * Agrega un nuevo campo a la base de datos.
   * @param campo El objeto Campo a agregar (sin ID si es nuevo).
   * @returns El ID del campo insertado.
   */
  async addCampo(campo: Campo): Promise<number> {
    try {
      const db = await this.getDbInstance();
      const result = await db.executeSql(
        `INSERT INTO campos (nombre, hectareas, activo, user_id) VALUES (?, ?, ?, ?)`,
        [campo.nombre, campo.hectareas, campo.activo ? 1 : 0, campo.user_id] // Convertir boolean a 1/0
      );
      console.log('Campo insertado. ID:', result.insertId);
      return result.insertId;
    } catch (error) {
      console.error('Error insertando campo:', error);
      throw error;
    }
  }

  /**
   * Obtiene un campo específico por su ID.
   * @param id El ID del campo a buscar.
   * @returns El objeto Campo si se encuentra, de lo contrario, undefined.
   */
  async getCampoById(id: number): Promise<Campo | undefined> {
    try {
      const db = await this.getDbInstance();
      const data = await db.executeSql(
        `SELECT id, nombre, hectareas, activo, user_id FROM campos WHERE id = ?`,
        [id]
      );

      if (data.rows.length > 0) {
        const item = data.rows.item(0);
        const campo: Campo = {
          id: item.id,
          nombre: item.nombre,
          hectareas: item.hectareas,
          activo: item.activo === 1,
          user_id: item.user_id
        };
        console.log(`Campo ID ${id} encontrado:`, campo);
        return campo;
      } else {
        console.log(`Campo con ID ${id} no encontrado.`);
        return undefined;
      }
    } catch (error) {
      console.error(`Error al obtener campo por ID ${id}:`, error);
      return undefined; // En caso de error, el campo no se encontró
    }
  }

  /**
   * Obtiene todos los campos de la base de datos.
   * @returns Un array de objetos Campo.
   */
  async getCampos(userId: number): Promise<Campo[]> {
    try {
      const db = await this.getDbInstance();
      const data = await db.executeSql(`SELECT id, nombre, hectareas, activo FROM campos`, []);
      const campos: Campo[] = [];
      for (let i = 0; i < data.rows.length; i++) {
        const item = data.rows.item(i);
        campos.push({
          id: item.id,
          nombre: item.nombre,
          hectareas: item.hectareas,
          activo: item.activo === 1, // Convertir 1/0 a boolean
          user_id: item.user_id
        });
      }
      console.log('Campos obtenidos:', campos);
      return campos;
    } catch (error) {
      console.error('Error obteniendo campos:', error);
      return [];
    }
  }

  /**
   * Actualiza un campo existente en la base de datos.
   * @param campo El objeto Campo con los datos actualizados (requiere ID).
   * @returns True si la actualización fue exitosa, false en caso contrario.
   */
  async updateCampo(campo: Campo): Promise<boolean> {
    if (campo.id === undefined) {
      console.error('Para actualizar un campo, se requiere el ID.');
      return false;
    }
    try {
      const db = await this.getDbInstance();
      const result = await db.executeSql(
        `UPDATE campos SET nombre = ?, hectareas = ?, activo = ? WHERE id = ?`,
        [campo.nombre, campo.hectareas, campo.activo ? 1 : 0, campo.id]
      );
      console.log('Campo actualizado. Filas afectadas:', result.rowsAffected);
      return result.rowsAffected > 0;
    } catch (error) {
      console.error('Error actualizando campo:', error);
      throw error;
    }
  }

  /**
   * Cambia el estado (activo/desactivado) de un campo específico.
   * @param id El ID del campo a modificar.
   * @param activo El nuevo estado (true para activar, false para desactivar).
   * @returns True si la actualización fue exitosa, false en caso contrario.
   */
  async setCampoActivo(id: number, activo: boolean): Promise<boolean> {
    try {
      const db = await this.getDbInstance();
      const result = await db.executeSql(
        `UPDATE campos SET activo = ? WHERE id = ?`,
        [activo ? 1 : 0, id]
      );
      console.log(`Campo ID ${id} ${activo ? 'activado' : 'desactivado'}. Filas afectadas:`, result.rowsAffected);
      return result.rowsAffected > 0;
    } catch (error) {
      console.error('Error al cambiar el estado del campo:', error);
      throw error;
    }
  }

  /**
   * Elimina un campo de la base de datos.
   * @param id El ID del campo a eliminar.
   * @returns True si la eliminación fue exitosa, false en caso contrario.
   */
  async deleteCampo(id: number): Promise<boolean> {
    try {
      const db = await this.getDbInstance();
      const result = await db.executeSql(`DELETE FROM campos WHERE id = ?`, [id]);
      console.log(`Campo ID ${id} eliminado. Filas afectadas:`, result.rowsAffected);
      return result.rowsAffected > 0;
    } catch (error) {
      console.error('Error eliminando campo:', error);
      throw error;
    }
  }

  /**
   * Verifica las credenciales de un usuario en la base de datos.
   * @param username El nombre de usuario a verificar.
   * @param password La contraseña a verificar.
   * @returns El objeto User si las credenciales son correctas, de lo contrario, null.
   */
  async getUserByCredentials(username: string, password_plain: string): Promise<User | null> {
    try {
      const db = await this.getDbInstance();
      // NOTA DE SEGURIDAD: En un entorno real, las contraseñas deberían estar hasheadas
      const data = await db.executeSql(
        `SELECT id, username FROM users WHERE username = ? AND password = ?`,
        [username, password_plain]
      );

      if (data.rows.length > 0) {
        const user = data.rows.item(0);
        console.log('Usuario encontrado:', user);
        return { id: user.id, username: user.username, firebase_uid: undefined };
      } else {
        console.log('Credenciales no válidas para:', username);
        return null;
      }
    } catch (error) {
      console.error('Error al buscar usuario por credenciales:', error);
      return null;
    }
  }


  /**
   * Agrega un nuevo registro de ganado para un campo.
   * @param ganado El objeto Ganado a agregar (sin ID si es nuevo).
   * @returns El ID del registro de ganado insertado.
   */
  async addGanado(ganado: Ganado): Promise<number> {
    try {
      const db = await this.getDbInstance();
      const result = await db.executeSql(
        `INSERT INTO ganado (campo_id, vacas, toros, terneros, terneras) VALUES (?, ?, ?, ?, ?)`,
        [ganado.campo_id, ganado.vacas, ganado.toros, ganado.terneros, ganado.terneras]
      );
      console.log('Registro de ganado insertado. ID:', result.insertId);
      return result.insertId;
    } catch (error) {
      console.error('Error insertando registro de ganado:', error);
      throw error;
    }
  }

  /**
   * Obtiene el registro de ganado para un campo específico.
   * @param campoId El ID del campo.
   * @returns El objeto Ganado si se encuentra, de lo contrario, undefined.
   */
  async getGanadoByCampoId(campoId: number): Promise<Ganado | undefined> {
    try {
      const db = await this.getDbInstance();
      const data = await db.executeSql(
        `SELECT id, campo_id, vacas, toros, terneros, terneras FROM ganado WHERE campo_id = ?`,
        [campoId]
      );

      if (data.rows.length > 0) {
        const item = data.rows.item(0);
        const ganado: Ganado = {
          id: item.id,
          campo_id: item.campo_id,
          vacas: item.vacas,
          toros: item.toros,
          terneros: item.terneros,
          terneras: item.terneras
        };
        console.log(`Ganado para campo ID ${campoId} encontrado:`, ganado);
        return ganado;
      } else {
        console.log(`No se encontró registro de ganado para campo ID ${campoId}.`);
        return undefined;
      }
    } catch (error) {
      console.error(`Error al obtener ganado para campo ID ${campoId}:`, error);
      return undefined;
    }
  }

  /**
   * Actualiza un registro de ganado existente.
   * @param ganado El objeto Ganado con los datos actualizados (requiere ID).
   * @returns True si la actualización fue exitosa, false en caso contrario.
   */
  async updateGanado(ganado: Ganado): Promise<boolean> {
    if (ganado.campo_id === undefined) {
      console.error('Para actualizar un registro de ganado, se requiere el ID.');
      return false;
    }
    try {
      const db = await this.getDbInstance();
      const result = await db.executeSql(
        `UPDATE ganado SET vacas = ?, toros = ?, terneros = ?, terneras = ? WHERE campo_id = ?`,
        [ganado.vacas, ganado.toros, ganado.terneros, ganado.terneras, ganado.campo_id]
      );
      console.log('Registro de ganado actualizado. Filas afectadas:', result.rowsAffected);
      return result.rowsAffected > 0;
    } catch (error) {
      console.error('Error actualizando registro de ganado:', error);
      throw error;
    }
  }

  // METODOS DE USUARIOS
  async addUserFromFirebase(firebase_uid: string, username: string, email: string): Promise<number | null> {
    try {
      const db = await this.getDbInstance();
      const result = await db.executeSql(
        'INSERT INTO users (username, email, firebase_uid) VALUES (?, ?, ?)',
        [username, email, firebase_uid]
      );
      // 'INSERT OR IGNORE' no lanza error si la clave ya existe
      if (result.insertId) {
        return result.insertId;
      }
      // Si la fila ya existía, insertId será 0
      console.log('Usuario con este UID ya existe. No se insertó nada.');
      return null;
    } catch (error) {
      console.error('Error insertando usuario desde Firebase:', error);
      throw error;
    }
  }

  async getUserByFirebaseUID(firebase_uid: string): Promise<User | undefined> {
    try {
      const db = await this.getDbInstance();
      const data = await db.executeSql('SELECT id, username, password, email, firebase_uid FROM users WHERE firebase_uid = ?', [firebase_uid]);
      if (data.values.length > 0) {
        return data.values[0] as User;
      }
      return undefined;
    } catch (error) {
      console.error('Error obteniendo usuario por Firebase UID:', error);
      return undefined;
    }
  }

  async checkUserExists(firebase_uid: string): Promise<boolean> {
    try {
      const db = await this.getDbInstance();
      const data = await db.executeSql(
        'SELECT id FROM users WHERE firebase_uid = ?',
        [firebase_uid]
      );
  
      // Si la consulta devuelve al menos una fila, el usuario existe.
      if (data.rows.length > 0) {
        console.log('Usuario con UID ${firebase_uid} encontrado.');
        return true;
      } else {
        console.log('Usuario con UID ${firebase_uid} no encontrado.');
        return false;
      }
    } catch (error) {
      console.error('Error al verificar la existencia del usuario:', error);
      // Devuelve false en caso de cualquier error para evitar fallos inesperados.
      return false;
    }
  }

  // Inside your DatabaseService class

/**
 * Gets the local database ID of a user from their Firebase UID.
 * @param firebase_uid The UID from Firebase Authentication.
 * @returns The user's local ID (number) if found, otherwise undefined.
 */
async getUserIdByFirebaseUid(firebase_uid: string): Promise<number | undefined> {
  try {
    const db = await this.getDbInstance();
    const data = await db.executeSql(
      'SELECT id FROM users WHERE firebase_uid = ?',
      [firebase_uid]
    );

    if (data.rows.length > 0) {
      const user = data.rows.item(0);
      console.log(`Local user ID found for Firebase UID: ${user.id}`);
      return user.id;
    } else {
      console.log(`No user found for Firebase UID: ${firebase_uid}`);
      return undefined;
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
    return undefined;
  }
}

}
