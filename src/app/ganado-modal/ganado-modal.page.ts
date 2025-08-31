// src/app/ganado-modal/ganado-modal.page.ts

import { Component, OnInit, Input } from '@angular/core';
import { ModalController, AlertController, LoadingController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatabaseService, Ganado } from '../services/database.service'; // Importa Ganado

@Component({
  selector: 'app-ganado-modal',
  templateUrl: './ganado-modal.page.html',
  styleUrls: ['./ganado-modal.page.scss'],
})
export class GanadoModalPage implements OnInit {

  @Input() campoId!: number; // Recibe el ID del campo al que pertenece este ganado
  @Input() ganadoExistente: Ganado | undefined; // Recibe los datos de ganado si estamos editando

  formGanado!: FormGroup;
  modalTitle: string = 'Registrar Ganado'; // Título dinámico del modal

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private dbService: DatabaseService // Inyecta DatabaseService
  ) { }

  ngOnInit() {
    if (this.campoId === undefined || this.campoId === null) {
      console.error('GanadoModalPage se abrió sin campoId.');
      this.modalCtrl.dismiss(null, 'error');
      return;
    }

    this.formGanado = this.fb.group({
      vacas: [0, [Validators.required, Validators.min(0)]],
      toros: [0, [Validators.required, Validators.min(0)]],
      terneros: [0, [Validators.required, Validators.min(0)]],
      terneras: [0, [Validators.required, Validators.min(0)]]
    });

    // Si se pasó un registro de ganado existente, precargar el formulario y cambiar el título
    if (this.ganadoExistente) {
      this.modalTitle = 'Editar Inventario';
      this.formGanado.patchValue({
        vacas: this.ganadoExistente.vacas,
        toros: this.ganadoExistente.toros,
        terneros: this.ganadoExistente.terneros,
        terneras: this.ganadoExistente.terneras
      });
    }
  }

  cancelar() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  async guardar() {
    if (this.formGanado.valid) {
      const loading = await this.loadingCtrl.create({
        message: this.ganadoExistente ? 'Actualizando inventario...' : 'Guardando inventario...',
      });
      await loading.present();

      const ganadoData: Ganado = {
        campo_id: this.campoId,
        vacas: this.formGanado.value.vacas,
        toros: this.formGanado.value.toros,
        terneros: this.formGanado.value.terneros,
        terneras: this.formGanado.value.terneras
      };

      try {
        let result;
        
        if (this.ganadoExistente && this.ganadoExistente.campo_id !== undefined && this.ganadoExistente.campo_id !== null) {
          // Si estamos editando un registro de ganado existente
          ganadoData.campo_id = this.ganadoExistente.campo_id; // Asigna el ID existente
          result = await this.dbService.updateGanado(ganadoData);
          if (result) {
            console.log('Inventario de ganado actualizado con éxito.');
            this.modalCtrl.dismiss(ganadoData, 'confirm'); // Devuelve los datos actualizados
          } else {
            throw new Error('No se pudo actualizar el inventario de ganado.');
          }
        } else {
          // Si estamos creando un nuevo registro de ganado (primera vez para este campo)
          const insertedId = await this.dbService.addGanado(ganadoData);
          console.log('Inventario de ganado guardado con ID:', insertedId);
          this.modalCtrl.dismiss({ ...ganadoData, id: insertedId }, 'confirm'); // Devuelve el nuevo registro con ID
        }
        await loading.dismiss();

      } catch (error) {
        await loading.dismiss();
        console.error('Error al guardar/actualizar inventario de ganado:', error);

        let errorMessage = 'Ocurrió un error al guardar el inventario.';
        if (error && (error as any).message && (error as any).message.includes('UNIQUE constraint failed')) {
            errorMessage = 'Este campo ya tiene un registro de ganado. Por favor, edítalo en lugar de intentar crear uno nuevo.';
        }

        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: errorMessage,
          buttons: ['OK']
        });
        await alert.present();
      }
    } else {
      console.warn('Formulario de ganado inválido.');
      this.formGanado.markAllAsTouched();
      const alert = await this.alertCtrl.create({
        header: 'Formulario Incompleto',
        message: 'Por favor, ingresa solo números enteros y positivos.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }
}