import { Component } from '@angular/core';

import { AccesoReunionService } from 'src/app/services/acceso-reunion.service';

/**
 * Variable para manejo de alertas
 */
declare let alertify: any;
declare let bootstrap: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  constructor(private accesoReunion: AccesoReunionService) { }

  searchResult: undefined | boolean;

  /**
   * Variable para capturar documento de identidad
   */
  documentoIdentidad: string = '';

  /**
   * Función encargado de enviar invitación para un recurso
   * */
  enviarInvitacion() {

    /**
     * Validación para el documento requerido
     */
    if (!this.documentoIdentidad.trim()) {
      return alertify.error('El documento de identidad no puede ser vacío.');
    }

    /**
     * Se consume servicio encargado de enviar invitaciones para el respectivo recurso
     */
    this.accesoReunion.buscarInvitacion(this.documentoIdentidad.trim()).subscribe({
      next: (data) => {
        this.searchResult = data.ok ? true : false;
        this.openModal('#meeting-sent-modal', '#get-meets-modal');
      }
    })

  }

  /**
   * Abre una ventana de diálogo
   * @param {Event} event Información del evento submit
   * @param {string} modalToOpen Identificador de la ventana de diálogo que se abrirá
   * @param {string} modalToClose Identificador de la ventana de diálogo que se cerrará
   */
  openModal(modalToOpen: string, modalToClose: string) {
    /** @type {HTMLElement} Etiqueta del cuadro de diálogo a abrir */
    const modalElementToOpen = document.querySelector(modalToOpen);
    /** @type {bootstrap.Modal} Instancia del cuadro de diálogo a abrir */
    const modalToOpenInstance = bootstrap.Modal.getOrCreateInstance(modalElementToOpen);

    /** @type {HTMLElement} Etiqueta del cuadro de diálogo a cerrar */
    const modalElementToClose = document.querySelector(modalToClose) as HTMLElement;
    /** @type {bootstrap.Modal} Instancia del cuadro de diálogo a cerrar */
    const modalToCloseInstance = bootstrap.Modal.getOrCreateInstance(modalElementToClose);
    modalToCloseInstance && modalToCloseInstance.hide();

    modalToOpenInstance && modalToOpenInstance.show();
  }

}
