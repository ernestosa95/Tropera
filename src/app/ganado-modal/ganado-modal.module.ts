import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { GanadoModalPageRoutingModule } from './ganado-modal-routing.module';

import { GanadoModalPage } from './ganado-modal.page';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GanadoModalPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [GanadoModalPage]
})
export class GanadoModalPageModule {}
