import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { IonicModule } from '@ionic/angular';

import { RegistroModalPageRoutingModule } from './registro-modal-routing.module';

import { RegistroModalPage } from './registro-modal.page';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegistroModalPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [RegistroModalPage]
})
export class RegistroModalPageModule {}
