// src/app/crear-campo-modal/crear-campo-modal.page.ts

import { Component, OnInit, Input } from '@angular/core';
import { ModalController, AlertController, LoadingController } from '@ionic/angular'; // Importa ModalController
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; // Importa para Formularios Reactivos
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 
import { DatabaseService, Campo, Ganado } from '../services/database.service'; 

@Component({
  selector: 'app-crear-campo-modal',
  templateUrl: './crear-campo-modal.page.html',
  styleUrls: ['./crear-campo-modal.page.scss'],
})
export class CrearCampoModalPage implements OnInit {

  @Input() userId!: number; 
  @Input() campoExistente: Campo | undefined; // Para la edición de campos existentes
  formCampo!: FormGroup; // Define el FormGroup
  modalTitle: string = 'Crear Nuevo Campo'; // Título dinámico del modal

  constructor(
    private modalCtrl: ModalController, // Inyecta ModalController
    private fb: FormBuilder, // Inyecta FormBuilder
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private dbService: DatabaseService 
  ) { }

  ngOnInit() {
    // --- DEBUG LOGS ---
    console.log('CrearCampoModalPage - ngOnInit: campoExistente recibido:', this.campoExistente);
    console.log('CrearCampoModalPage - ngOnInit: userId recibido:', this.userId);
    // --- FIN DEBUG LOGS ---
    // Si estamos editando, el userId viene del campoExistente
    // Si estamos creando, el userId viene de componentProps
    if (this.userId === undefined && this.campoExistente && this.campoExistente.user_id !== undefined) {
        this.userId = this.campoExistente.user_id;
        console.error('CrearCampoModalPage se abrió sin userId.');
    }

    if (this.userId === undefined || this.userId === null) {
      console.error('CrearCampoModalPage se abrió sin userId.');
      this.modalCtrl.dismiss(null, 'error');
      return;
    }

    this.formCampo = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      hectareas: ['', [Validators.required, Validators.min(0.1)]],
      activo: [true, Validators.required]
    });

    // Si se pasó un campo existente, precargar el formulario y cambiar el título
    if (this.campoExistente) {
      this.modalTitle = 'Editar Campo';
      this.formCampo.patchValue({
        nombre: this.campoExistente.nombre,
        hectareas: this.campoExistente.hectareas,
        activo: this.campoExistente.activo
      });
      // --- DEBUG LOGS ---
      console.log('CrearCampoModalPage - ngOnInit: Modo Edición. ID del campo existente:', this.campoExistente.id);
      // --- FIN DEBUG LOGS ---
    }
  }

  // Método para cerrar el modal sin guardar (cuando se presiona la 'X' o se cancela)
  cancelar() {
    return this.modalCtrl.dismiss(null, 'cancel'); // 'cancel' es un rol opcional
  }

  // Método para guardar los datos del formulario
  async guardar() {
    // --- DEBUG LOGS ---
    console.log('CrearCampoModalPage - guardar: campoExistente al guardar:', this.campoExistente);
    console.log('CrearCampoModalPage - guardar: campoExistente.id al guardar:', this.campoExistente?.id);
    // --- FIN DEBUG LOGS ---

    if (this.formCampo.valid) {
      const loading = await this.loadingCtrl.create({
        message: this.campoExistente ? 'Actualizando campo...' : 'Guardando campo...',
      });
      await loading.present();

      const campoData: Campo = {
        nombre: this.formCampo.value.nombre,
        hectareas: this.formCampo.value.hectareas,
        activo: this.formCampo.value.activo,
        user_id: this.userId
      };

      try {
        let result;
        if (this.campoExistente && this.campoExistente.id !== undefined && this.campoExistente.id !== null) { // <-- ¡Asegúrate de que el ID no sea null!
          // Si estamos editando un campo existente
          campoData.id = this.campoExistente.id; // Asigna el ID existente
          // --- DEBUG LOGS ---
          console.log('CrearCampoModalPage - guardar: Llamando a updateCampo con ID:', campoData.id, 'y datos:', campoData);
          // --- FIN DEBUG LOGS ---
          result = await this.dbService.updateCampo(campoData);
          if (result) {
            console.log('Campo actualizado con éxito.');
            this.modalCtrl.dismiss(campoData, 'confirm');
          } else {
            throw new Error('No se pudo actualizar el campo.');
          }
        } else {
          // Si estamos creando un nuevo campo
          // --- DEBUG LOGS ---
          console.log('CrearCampoModalPage - guardar: Llamando a addCampo con datos:', campoData);
          // --- FIN DEBUG LOGS ---
          const insertedId = await this.dbService.addCampo(campoData);

          // ¡NUEVA LÓGICA: Insertar registro de ganado con ceros para el nuevo campo!
           const ganadoInicial: Ganado = {
            campo_id: insertedId, // Usamos el ID del campo recién creado
            vacas: 0,
            toros: 0,
            terneros: 0,
            terneras: 0
          };
          await this.dbService.addGanado(ganadoInicial); // Insertamos el registro de ganado
          console.log(`Registro de ganado inicial creado para el campo ID: ${insertedId}`);


          console.log('Campo guardado con ID:', insertedId);
          this.modalCtrl.dismiss({ ...campoData, id: insertedId }, 'confirm');
        }
        await loading.dismiss();

      } catch (error) {
        await loading.dismiss();
        console.error('Error al guardar/actualizar campo:', error);

        let errorMessage = 'Ocurrió un error al guardar el campo.';
        if (error && (error as any).message && (error as any).message.includes('UNIQUE constraint failed')) {
            errorMessage = 'Ya existe un campo con este nombre para tu usuario. Por favor, elige otro nombre.';
        }

        const alert = await this.alertCtrl.create({
          header: 'Error',
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