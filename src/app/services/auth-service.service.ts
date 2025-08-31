import { Injectable, NgZone } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged, User, signInWithCredential, AuthCredential } from 'firebase/auth';
import { DatabaseService } from './database.service';
import { Platform } from '@ionic/angular';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth: any;
  public currentUser: User | null = null;
  public authStateReady: boolean = false;

  constructor(
    private dbService: DatabaseService,
    private platform: Platform,
    private ngZone: NgZone
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      const firebaseConfig = {
        apiKey: "AIzaSyBmF4Kg8NGleUTUqVPltqSVmJsxslHcRGs",
        authDomain: "tropera-9e91c.firebaseapp.com",
        projectId: "tropera-9e91c",
        storageBucket: "tropera-9e91c.firebasestorage.app",
        messagingSenderId: "72150045403",
        appId: "1:72150045403:web:3ce102762c741b844af2fe",
        measurementId: "G-WZHV7F5MQ9"
      };

      const app = initializeApp(firebaseConfig);
      this.auth = getAuth(app);

      onAuthStateChanged(this.auth, user => {
        this.ngZone.run(() => {
          this.currentUser = user;
          this.authStateReady = true;
          console.log('Firebase Auth State Changed:', this.currentUser);
        });
      });
    });
  }

  async initializeGoogleAuth() {
    if (this.platform.is('android') || this.platform.is('ios')) {
      // Usamos el ID de cliente web para la autenticación en Android
      const webClientId = '72150045403-adao5osb3hok55hl8igaevve6l7kh62g.apps.googleusercontent.com';

      await GoogleAuth.initialize({
        clientId: webClientId,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true
      });
      console.log('Google Auth plugin inicializado.');
    }
  }

  async signInWithCredentialAndSync(credential: AuthCredential): Promise<number> {
    try {
      const result = await signInWithCredential(this.auth, credential);
      const user = result.user;

      if (user) {
        console.log('Usuario autenticado con Firebase:', user);
        // Usar el UID de Firebase como clave principal para la DB local
        //const userExists = await this.dbService.getUserByFirebaseUID(user.uid);
        const userExists = this.dbService.checkUserExists(user.uid);
        console.log('ue:' + userExists);
        if (userExists) {
          await this.dbService.addUserFromFirebase(user.uid, user.displayName || '', user.email || '');
          
          console.log('Nuevo usuario creado en SQLite para el UID:', user.uid);
        }

        localStorage.setItem('currentUser', JSON.stringify(user));
        const idBD = this.dbService.getUserIdByFirebaseUid(user.uid);
        console.log('idBD' + (await idBD).toString());
        localStorage.setItem('currentUserId', idBD.toString()); // Convertir a string para localStorage
        localStorage.setItem('currentUsername', user.displayName); // También puedes guardar el username

        return idBD;
      }
      return null;
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      throw error;
    }
  }

  async signOut() {
    await signOut(this.auth);
  }
}
