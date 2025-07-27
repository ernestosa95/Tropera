import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegistroModalPage } from './registro-modal.page';

const routes: Routes = [
  {
    path: '',
    component: RegistroModalPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroModalPageRoutingModule {}
