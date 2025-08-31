import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GanadoModalPage } from './ganado-modal.page';

const routes: Routes = [
  {
    path: '',
    component: GanadoModalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GanadoModalPageRoutingModule {}
