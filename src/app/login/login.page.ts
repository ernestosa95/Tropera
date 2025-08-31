import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular'; // Import ToastController
import { DatabaseService } from '../services/database.service';
import { ModalController, AlertController, LoadingController } from '@ionic/angular';
import { RegistroModalPage } from '../registro-modal/registro-modal.page';
import { AuthService } from '../services/auth-service.service'; // Importar el nuevo servicio
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'

@Component({
  selector: 'app-login', // This matches the selector in your HTML
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  username: string = '';
  password: string = '';

  constructor(
    private router: Router,
    private toastController: ToastController,
    private dbService: DatabaseService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private authService: AuthService // Inyectar el servicio de autenticación
  ) { }

  async ngOnInit() {
    // Espera a que el estado de autenticación de Firebase esté listo.
    await this.authService.authStateReady;
    if (this.authService.currentUser) {
      this.router.navigateByUrl('/home');
    }
  }

  // Método para manejar el clic del botón
  /*async recuperarDatos() {
    console.log('Usuario:', this.username);
    console.log('Contraseña:', this.password);

    // Aquí puedes agregar tu lógica para validar los datos, enviar a un servicio, etc.
    if (this.username === 'admin' && this.password === '123') {
      const toast = await this.toastController.create({
        message: '¡Bienvenido!',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      toast.present();
      this.dbService.addUser(this.username, this.password)
      this.router.navigate(['/home']); // Redirige a la página 'home' después del login exitoso
    } else {
      const toast = await this.toastController.create({
        message: 'Usuario o contraseña incorrectos.',
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      toast.present();
    }
  }*/

  async recuperarDatos() {
      console.log('Intentando iniciar sesión con Usuario:', this.username, 'Contraseña:', this.password);
  
      if (!this.username || !this.password) {
          const toast = await this.toastController.create({
              message: 'Por favor, ingresa tu usuario y contraseña.',
              duration: 2000,
              position: 'bottom',
              color: 'warning'
          });
          await toast.present();
          return; // Detiene la ejecución si los campos están vacíos
      }
  
      try {
        // Llama al nuevo método del DatabaseService
        const user = await this.dbService.getUserByCredentials(this.username, this.password);
  
        if (user) {
          const toast = await this.toastController.create({
            message: `¡Bienvenido, ${user.username}!`,
            duration: 2000,
            position: 'bottom',
            color: 'success'
          });
          await toast.present();
  
          // Opcional: Podrías guardar el ID o el nombre de usuario en un servicio de autenticación
          // o en localStorage para mantener la sesión
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('currentUserId', user.id.toString()); // Convertir a string para localStorage
          localStorage.setItem('currentUsername', user.username); // También puedes guardar el username
  
          this.router.navigate(['/home']); // Redirige a la página 'home' después del login exitoso
        } else {
          const toast = await this.toastController.create({
            message: 'Usuario o contraseña incorrectos.',
            duration: 2000,
            position: 'bottom',
            color: 'danger'
          });
          await toast.present();
        }
      } catch (error) {
        console.error('Error durante el proceso de login:', error);
        const toast = await this.toastController.create({
          message: 'Ocurrió un error al intentar iniciar sesión.',
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
        await toast.present();
      }
  }
  
  // Modifica la función irARegistro para abrir el modal
  async irARegistro() {
    const modal = await this.modalCtrl.create({
      component: RegistroModalPage, // El componente que se mostrará en el modal
    });

    await modal.present(); // Muestra el modal

    // Espera a que el modal se cierre y obtén los datos
    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      console.log('Usuario registrado (simulado):', data);
      // Aquí manejarías la respuesta del registro, por ejemplo:
      // - Mostrar un mensaje de éxito al usuario
      // - Redirigirlo automáticamente al login o al home
      // - Intentar iniciar sesión con las credenciales recién creadas
      alert(`¡Usuario ${data.username} registrado con éxito!`);
      // Opcional: Podrías intentar loguear al usuario aquí
      // this.username = data.username;
      // this.password = 'la_contraseña_que_no_tenemos_aqui'; // No se devuelve la contraseña por seguridad
      // this.recuperarDatos();
    } else {
      console.log('Modal de registro cerrado sin guardar.');
    }
  }

  async loginWithGoogle() {
    const loading = await this.loadingCtrl.create({
      message: 'Iniciando sesión con Google...',
    });
    await loading.present();

    try {
      // Paso crucial: Inicializar Google Auth antes de usarlo.
      await this.authService.initializeGoogleAuth(); 

      const result = await GoogleAuth.signIn();
      console.log('resulto googleauth:', result);
      const idToken = result.authentication.idToken;
      console.log('idToken:', idToken);
      
      const credential = GoogleAuthProvider.credential(idToken);
      console.log('Credential google:', credential);

      const idDB = await this.authService.signInWithCredentialAndSync(credential);
      localStorage.setItem('currentUserId', idDB.toString());

      await loading.dismiss();
      this.router.navigateByUrl('/home');
    } catch (error) {
      await loading.dismiss();
      console.error('Error al iniciar sesión con Google:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error de Autenticación',
        message: 'No se pudo iniciar sesión con Google. Por favor, revisa la configuración de Firebase y Android.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }
}
