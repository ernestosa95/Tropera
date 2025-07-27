import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CampoDetallePage } from './campo-detalle.page';

const routes: Routes = [
  {
    path: '',
    component: CampoDetallePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CampoDetallePageRoutingModule {}
