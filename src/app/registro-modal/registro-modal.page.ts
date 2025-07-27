// src/app/registro-modal/registro-modal.page.ts

import { Component, OnInit } from '@angular/core';
import { ModalController, LoadingController, AlertController, Platform} from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-registro-modal',
  templateUrl: './registro-modal.page.html',
  styleUrls: ['./registro-modal.page.scss'],
})
export class RegistroModalPage implements OnInit {

  formRegistro!: FormGroup;

  constructor(
    private modalCtrl: ModalController,
    private databaseService: DatabaseService,
    private fb: FormBuilder,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private platform: Platform 
  ) { }

  ngOnInit() {
    this.formRegistro = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator }); // Añadimos un validador personalizado
  }

  // Validador personalizado para comparar contraseñas
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  cancelar() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  async guardar() {
    if (this.formRegistro.valid) {
      const loading = await this.loadingCtrl.create({
        message: 'Registrando usuario...',
      });
      await loading.present();

      // Extrae los datos que tu método addUser espera
      const { username, password, email } = this.formRegistro.value; // El email no se guarda en tu tabla `users` actual

      try {
        // Llama a tu método addUser del DatabaseService
        await this.databaseService.addUser(username, password, email);

        await loading.dismiss();
        console.log('Usuario registrado con éxito en SQLite.');

        const alert = await this.alertCtrl.create({
          header: '¡Éxito!',
          message: 'Usuario registrado correctamente en el dispositivo. Ahora puedes iniciar sesión.',
          buttons: ['OK']
        });
        await alert.present();

        // Cierra el modal y pasa los datos del usuario registrado (sin contraseña)
        this.modalCtrl.dismiss({ success: true, username: username }, 'confirm');

      } catch (error) {
        await loading.dismiss();
        console.error('Error al registrar usuario en SQLite:', error);

        let errorMessage = 'Ocurrió un error al registrar el usuario.';
        // Aquí podrías añadir lógica para errores específicos de SQLite
        // Por ejemplo, si el username ya existe y tienes una restricción UNIQUE.
        // SQLite usualmente lanza un error de Constraint Violation.
        if (error && (error as any).message && (error as any).message.includes('UNIQUE constraint failed')) {
            errorMessage = 'El nombre de usuario ya existe. Por favor, elige otro.';
        }

        const alert = await this.alertCtrl.create({
          header: 'Error de Registro',
          message: errorMessage,
          buttons: ['OK']
        });
        await alert.present();
      }

    } else {
      console.warn('Formulario de registro inválido. Revise los campos.');
      this.formRegistro.markAllAsTouched(); // Para mostrar errores de validación

      const alert = await this.alertCtrl.create({
        header: 'Formulario Incompleto',
        message: 'Por favor, completa todos los campos requeridos y asegúrate de que las contraseñas coincidan.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

}