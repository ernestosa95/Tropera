import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CrearCampoModalPage } from './crear-campo-modal.page';

const routes: Routes = [
  {
    path: '',
    component: CrearCampoModalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CrearCampoModalPageRoutingModule {}
