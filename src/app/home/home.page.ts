import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ModalController, Platform } from '@ionic/angular'; // Importa Platform
import { CrearCampoModalPage } from '../crear-campo-modal/crear-campo-modal.page';
import { DatabaseService, Campo } from '../services/database.service'; // Importa DatabaseService y Campo


// Define una interfaz para la estructura de un "Campo"
/*interface Campo {
  id: string;
  descripcion: string;
  hectareas: number;
  ubicacion: string; // Añadimos una ubicación para más detalle
  ultimaActualizacion: Date; // Usamos un tipo Date para la fecha
}*/

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  //userName: string = 'Usuario';
  campos: Campo[] = []; // Array para almacenar los campos
  currentUserId: number | null = null;
  currentUsername: string | null = null;


  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private dbService: DatabaseService, // Inyecta DatabaseService
    private platform: Platform // Inyecta Platform
  ) { }

  async ngOnInit() {
    // Asegúrate de que la plataforma esté lista antes de interactuar con la DB
    await this.platform.ready();

    // Carga el ID y username del usuario actual desde localStorage
    const userIdString = localStorage.getItem('currentUserId');
    if (userIdString) {
      this.currentUserId = parseInt(userIdString, 10);
    }
    this.currentUsername = localStorage.getItem('currentUsername');

    if (this.currentUserId === null) {
      console.warn('No hay user_id en localStorage. Redirigiendo a login.');
      this.router.navigateByUrl('/login'); // Redirige si no hay ID de usuario
      return;
    }

    console.log(`Usuario ${this.currentUsername} (ID: ${this.currentUserId}) logueado.`);
    await this.cargarCamposDelUsuario(); // Carga los campos al iniciar la página
  }

  async cargarCamposDelUsuario() {
    if (this.currentUserId !== null) {
      try {
        this.campos = await this.dbService.getCampos(this.currentUserId);
        console.log('Campos cargados para el usuario:', this.campos);
      } catch (error) {
        console.error('Error al cargar campos del usuario:', error);
        // Podrías mostrar un toast o alerta de error
      }
    }
  }

  /*cargarCamposDeEjemplo() {
    this.campos = [
      {
        id: 'FLD001',
        descripcion: 'Campo La Esperanza',
        hectareas: 150.5,
        ubicacion: 'Ruta 3 km 25, Buenos Aires',
        ultimaActualizacion: new Date('2025-06-28T10:30:00')
      },
      {
        id: 'FLD002',
        descripcion: 'Parcela Los Álamos',
        hectareas: 75.0,
        ubicacion: 'Calle Falsa 123, Córdoba',
        ultimaActualizacion: new Date('2025-06-29T14:00:00')
      },
      // Puedes añadir más campos de ejemplo aquí
      // {
      //   id: 'FLD003',
      //   descripcion: 'Estancia El Rodeo',
      //   hectareas: 320.0,
      //   ubicacion: 'Camino Real s/n, Mendoza',
      //   ultimaActualizacion: new Date('2025-06-30T09:15:00')
      // }
    ];
  }*/

    async crearCampo() {
      if (this.currentUserId === null) {
        console.error('No se puede crear campo sin user_id.');
        // Puedes mostrar una alerta o redirigir
        return;
      }
  
      const modal = await this.modalCtrl.create({
        component: CrearCampoModalPage,
        // Pasa el user_id al modal como un prop
        componentProps: {
          userId: this.currentUserId
        }
      });
  
      await modal.present();
  
      const { data, role } = await modal.onWillDismiss();
  
      if (role === 'confirm' && data) {
        console.log('Campo creado (retornado del modal):', data);
        // Después de crear un campo, recarga la lista para que se vea el nuevo
        await this.cargarCamposDelUsuario();
      } else {
        console.log('Modal cerrado sin crear campo.');
      }
  }

  async verDetallesCampo(campoId: string) {
    console.log(`Navegando a detalles del campo con ID: ${campoId}`);
    // Navega a la nueva página, pasando el ID como parte de la URL
    await this.router.navigate(['/campo-detalle', campoId]);
  }

  /**
   * Función para cerrar la sesión del usuario.
   * Por ahora, solo redirige a la página de login.
   * En una aplicación real, aquí también limpiarías tokens de autenticación,
   * datos de usuario en localStorage/sessionStorage, etc.
   */
  logout() {
    console.log('Cerrando sesión...');
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUsername');
    this.currentUserId = null;
    this.currentUsername = null;
    this.campos = []; // Limpia los campos mostrados
    this.router.navigateByUrl('/');
  }

}
