import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CrearCampoModalPageRoutingModule } from './crear-campo-modal-routing.module';

import { CrearCampoModalPage } from './crear-campo-modal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CrearCampoModalPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [CrearCampoModalPage]
})
export class CrearCampoModalPageModule {}
