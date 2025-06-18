import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular'; // Import ToastController
import { DatabaseService } from '../services/database.service';

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
    private dbService: DatabaseService
  ) { }

  ngOnInit() {
    // Puedes inicializar algo aquí si es necesario al cargar la página
  }

  // Método para manejar el clic del botón
  async recuperarDatos() {
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
  }
}