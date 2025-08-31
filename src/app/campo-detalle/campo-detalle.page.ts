import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, Platform, AlertController, ModalController, LoadingController } from '@ionic/angular'; // Importa AlertController y ModalController
import { DatabaseService, Campo,Ganado } from '../services/database.service';
import { CrearCampoModalPage } from '../crear-campo-modal/crear-campo-modal.page'; // Importa el modal de creación/edición
import { GanadoModalPage } from '../ganado-modal/ganado-modal.page';

// Define la misma interfaz Campo que usas en HomePage
/*interface Campo {
  id: string;
  descripcion: string;
  hectareas: number;
  ubicacion: string;
  ultimaActualizacion: Date;
}*/

@Component({
  selector: 'app-campo-detalle',
  templateUrl: './campo-detalle.page.html',
  styleUrls: ['./campo-detalle.page.scss'],
})
export class CampoDetallePage implements OnInit {

  campoId: number | null = null;
  campoActual: Campo | undefined; // Para almacenar los datos del campo
  ganadoActual: Ganado | undefined; // <-- ¡NUEVA PROPIEDAD PARA EL GANADO!


  constructor(
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    private dbService: DatabaseService, // <-- ¡INYECTA DATABASE SERVICE!
    private platform: Platform, // Inyecta Platform
    private router: Router, // Inyecta Router
    private alertCtrl: AlertController, // Inyecta AlertController
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController 
  ) { }

  async ngOnInit() {
    // Asegúrate de que la plataforma y la DB estén listas
    await this.platform.ready();
    await this.dbService.createDatabase().catch(e => console.error("Error al asegurar DB lista en detalle de campo", e));

    // Suscríbete a los parámetros de la ruta para obtener el ID
    this.activatedRoute.paramMap.subscribe(async params => {
      const idParam = params.get('id');
      if (idParam) {
        this.campoId = parseInt(idParam, 10); // Convierte el string del parámetro a número
        if (!isNaN(this.campoId)) { // Asegúrate de que la conversión fue exitosa
          await this.cargarDatosDelCampo(this.campoId);
          await this.cargarDatosDeGanado(this.campoId);
        } else {
          console.error('ID de campo inválido en la URL:', idParam);
          this.showErrorAndGoBack('ID de campo no válido.');
        }
      } else {
        console.warn('No se proporcionó ID de campo en la URL.');
        this.showErrorAndGoBack('No se especificó un campo.');
      }
    });
  }

  async cargarDatosDelCampo(id: number) {
    try {
      const campo = await this.dbService.getCampoById(id); // <-- ¡LLAMA AL NUEVO MÉTODO!
      if (campo) {
        this.campoActual = campo;
        console.log('Detalles del campo cargados:', this.campoActual);
      } else {
        console.warn(`Campo con ID ${id} no encontrado en la base de datos.`);
        this.showErrorAndGoBack('Campo no encontrado.');
      }
    } catch (error) {
      console.error(`Error al cargar los detalles del campo con ID ${id}:`, error);
      this.showErrorAndGoBack('Error al cargar los detalles del campo.');
    }
  }

  // Método para editar el campo
  async editarCampo() {
    if (!this.campoActual) {
      console.warn('No hay campo para editar.');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: CrearCampoModalPage,
      componentProps: {
        campoExistente: this.campoActual, // Pasamos el campo actual al modal
        userId: this.campoActual.user_id // Asegúrate de pasar el userId también
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      console.log('Campo editado (retornado del modal):', data);
      // Recargar los datos del campo actual para reflejar los cambios
      await this.cargarDatosDelCampo(this.campoActual.id!); // El ID ya existe
      this.dbService.toastController.create({
        message: 'Campo actualizado con éxito.',
        duration: 2000,
        color: 'success'
      }).then(toast => toast.present());
    } else {
      console.log('Modal de edición cerrado sin guardar.');
    }
  }

  // Método para eliminar el campo
  async eliminarCampo() {
    if (!this.campoActual || this.campoActual.id === undefined) {
      console.warn('No hay campo para eliminar o ID no definido.');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que quieres eliminar el campo "${this.campoActual.nombre}"? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Eliminación cancelada');
          },
        },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ // <-- ¡USANDO loadingCtrl INYECTADO AQUÍ!
              message: 'Eliminando campo...',
            });
            await loading.present();

            try {
              const success = await this.dbService.deleteCampo(this.campoActual!.id!);
              await loading.dismiss();

              if (success) {
                const toast = await this.dbService.toastController.create({
                  message: 'Campo eliminado con éxito.',
                  duration: 2000,
                  color: 'success'
                });
                await toast.present();
                this.router.navigateByUrl('/home'); // Redirige a Home después de eliminar
              } else {
                const toast = await this.dbService.toastController.create({
                  message: 'No se pudo eliminar el campo.',
                  duration: 2000,
                  color: 'danger'
                });
                await toast.present();
              }
            } catch (error) {
              await loading.dismiss();
              console.error('Error al eliminar campo:', error);
              const toast = await this.dbService.toastController.create({
                message: 'Error al eliminar el campo.',
                duration: 2000,
                color: 'danger'
              });
              await toast.present();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  // Método para volver a la página anterior (Home)
  goBack() {
    this.navCtrl.back();
  }

  private async showErrorAndGoBack(message: string) {
    const toast = await this.dbService.toastController.create({ // Usar toastController del dbService si está expuesto, sino inyectarlo aquí.
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
    this.navCtrl.back(); // Vuelve a la página anterior
  }

  async cargarDatosDeGanado(campoId: number) {
    try {
      const ganado = await this.dbService.getGanadoByCampoId(campoId);
      if (ganado) {
        this.ganadoActual = ganado;
        console.log('Datos de ganado cargados:', this.ganadoActual);
      } else {
        // Si no hay registro de ganado, inicializa uno con ceros PERO SIN ID
        this.ganadoActual = {
          campo_id: campoId,
          vacas: 0,
          toros: 0,
          terneros: 0,
          terneras: 0
        };
        console.log('No se encontró registro de ganado, inicializando a cero (sin ID):', this.ganadoActual);
      }
    } catch (error) {
      console.error(`Error al cargar los datos de ganado para campo ID ${campoId}:`, error);
      this.ganadoActual = {
        campo_id: campoId,
        vacas: 0,
        toros: 0,
        terneros: 0,
        terneras: 0
      };
    }
  }

  async editarGanado() {
    if (!this.campoActual || this.campoActual.id === undefined) {
      console.warn('No se puede editar ganado sin un campo válido.');
      return;
    }

    // --- DEBUG LOGS ---
    console.log('CampoDetallePage - editarGanado: ganadoActual ANTES de abrir modal:', this.ganadoActual);
    // --- FIN DEBUG LOGS ---

    const modal = await this.modalCtrl.create({
      component: GanadoModalPage,
      componentProps: {
        campoId: this.campoActual.id,
        ganadoExistente: this.ganadoActual // Pasamos los datos de ganado actuales (pueden ser ceros o con ID)
      }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      console.log('CampoDetallePage - editarGanado: Datos de ganado actualizados (retornados del modal):', data);
      // ¡CRUCIAL! Actualiza la propiedad ganadoActual con los nuevos datos, incluyendo el ID si fue una inserción
      this.ganadoActual = data;
      // --- DEBUG LOGS ---
      console.log('CampoDetallePage - editarGanado: ganadoActual DESPUÉS de actualizar:', this.ganadoActual);
      // --- FIN DEBUG LOGS ---

      const toast = await this.dbService.toastController.create({
        message: 'Inventario de ganado actualizado con éxito.',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } else {
      console.log('CampoDetallePage - editarGanado: Modal de edición de ganado cerrado sin guardar.');
    }
  }
}