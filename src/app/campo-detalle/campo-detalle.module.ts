import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CampoDetallePageRoutingModule } from './campo-detalle-routing.module';

import { CampoDetallePage } from './campo-detalle.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CampoDetallePageRoutingModule
  ],
  declarations: [CampoDetallePage]
})
export class CampoDetallePageModule {}
