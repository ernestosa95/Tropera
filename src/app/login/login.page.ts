import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular'; // Import ToastController
import { DatabaseService } from '../services/database.service';
import { ModalController } from '@ionic/angular';
import { RegistroModalPage } from '../registro-modal/registro-modal.page';

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
    private modalCtrl: ModalController 
  ) { }

  ngOnInit() {
    // Puedes inicializar algo aquí si es necesario al cargar la página
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
}