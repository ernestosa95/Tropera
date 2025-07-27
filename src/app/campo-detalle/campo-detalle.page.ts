// src/app/campo-detalle/campo-detalle.page.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Importa Router también, por si quieres redirigir
import { NavController, Platform } from '@ionic/angular'; // Importa Platform
import { DatabaseService, Campo } from '../services/database.service'; // <-- ¡IMPORTA TU DATABASE SERVICE Y CAMPO!

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

  constructor(
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    private dbService: DatabaseService, // <-- ¡INYECTA DATABASE SERVICE!
    private platform: Platform, // Inyecta Platform
    private router: Router // Inyecta Router
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
}