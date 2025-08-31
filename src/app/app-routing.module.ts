import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: '',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'campo-detalle/:id', 
    loadChildren: () => import('./campo-detalle/campo-detalle.module').then( m => m.CampoDetallePageModule)
  },
  {
    path: 'crear-campo-modal',
    loadChildren: () => import('./crear-campo-modal/crear-campo-modal.module').then( m => m.CrearCampoModalPageModule)
  },
  {
    path: 'campo-detalle',
    loadChildren: () => import('./campo-detalle/campo-detalle.module').then( m => m.CampoDetallePageModule)
  },
  {
    path: 'registro-modal',
    loadChildren: () => import('./registro-modal/registro-modal.module').then( m => m.RegistroModalPageModule)
  },
  {
    path: 'ganado-modal',
    loadChildren: () => import('./ganado-modal/ganado-modal.module').then( m => m.GanadoModalPageModule)
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
