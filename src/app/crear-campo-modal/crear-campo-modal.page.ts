// src/app/crear-campo-modal/crear-campo-modal.page.ts

import { Component, OnInit, Input } from '@angular/core';
import { ModalController, AlertController, LoadingController } from '@ionic/angular'; // Importa ModalController
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; // Importa para Formularios Reactivos
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 
import { DatabaseService, Campo } from '../services/database.service'; 

@Component({
  selector: 'app-crear-campo-modal',
  templateUrl: './crear-campo-modal.page.html',
  styleUrls: ['./crear-campo-modal.page.scss'],
})
export class CrearCampoModalPage implements OnInit {

  @Input() userId!: number; 
  formCampo!: FormGroup; // Define el FormGroup

  constructor(
    private modalCtrl: ModalController, // Inyecta ModalController
    private fb: FormBuilder, // Inyecta FormBuilder
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private dbService: DatabaseService 
  ) { }

  ngOnInit() {
    if (this.userId === undefined || this.userId === null) {
      console.error('CrearCampoModalPage se abrió sin userId.');
      // Considera mostrar un error o cerrar el modal
      this.modalCtrl.dismiss(null, 'error');
      return;
    }

    this.formCampo = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      hectareas: ['', [Validators.required, Validators.min(0.1)]],
      activo: [true, Validators.required] // Por defecto un nuevo campo está activo
    });
  }

  // Método para cerrar el modal sin guardar (cuando se presiona la 'X' o se cancela)
  cancelar() {
    return this.modalCtrl.dismiss(null, 'cancel'); // 'cancel' es un rol opcional
  }

  // Método para guardar los datos del formulario
  async guardar() {
    if (this.formCampo.valid) {
      const loading = await this.loadingCtrl.create({
        message: 'Guardando campo...',
      });
      await loading.present();

      const nuevoCampo: Campo = {
        nombre: this.formCampo.value.nombre,
        hectareas: this.formCampo.value.hectareas,
        activo: this.formCampo.value.activo,
        user_id: this.userId // <-- ¡ASIGNA EL USER_ID RECIBIDO!
      };

      try {
        const insertedId = await this.dbService.addCampo(nuevoCampo);
        await loading.dismiss();
        console.log('Campo guardado con ID:', insertedId);
        // El modal se cierra pasando el campo recién creado (con su ID)
        this.modalCtrl.dismiss({ ...nuevoCampo, id: insertedId }, 'confirm');

      } catch (error) {
        await loading.dismiss();
        console.error('Error al guardar campo:', error);

        let errorMessage = 'Ocurrió un error al guardar el campo.';
        if (error && (error as any).message && (error as any).message.includes('UNIQUE constraint failed')) {
            errorMessage = 'Ya existe un campo con este nombre para tu usuario. Por favor, elige otro nombre.';
        }

        const alert = await this.alertCtrl.create({
          header: 'Error al Guardar',
          message: errorMessage,
          buttons: ['OK']
        });
        await alert.present();
      }
    } else {
      console.warn('Formulario de campo inválido.');
      this.formCampo.markAllAsTouched();
      const alert = await this.alertCtrl.create({
        header: 'Formulario Incompleto',
        message: 'Por favor, completa todos los campos requeridos.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

}