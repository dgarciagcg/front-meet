import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { AccesoReunionService } from 'src/app/services/acceso-reunion.service';

declare let alertify: any;

@Component({
  selector: 'app-acceso-reunion',
  templateUrl: './acceso-reunion.component.html',
  styleUrls: ['./acceso-reunion.component.scss']
})
export class AccesoReunionComponent implements OnInit {

  /**
   * Variable para capturar documento de identidad
   */
  documentoIdentidad: string = '';

  /**
   * Variable para capturar id_convocado_reunion desde la url
   */
  idConvocadoReunion: string = '';

  constructor(
    private accesoReunion: AccesoReunionService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.idConvocadoReunion = this.route.snapshot.params['id_convocado_reunion'];
    this.documentoIdentidad = this.route.snapshot.params['identificacion'];
    this.documentoIdentidad && this.accederReunion();
  }

  /**
   * Función encargada de permitir o no el acceso a una reunión para un recurso específico
   * 
   * @returns void
   */
  accederReunion(): void {

    /**
     * Validación para el documento requerido
     */
    if (!this.documentoIdentidad.trim()) {
      return alertify.error('El documento de identidad no puede ser vacío.');
    }

    /**
     * Servicio para permitir acceso a un recurso en una reunión
     */
    this.accesoReunion.validacionConvocado(
      this.documentoIdentidad.trim(),
      this.idConvocadoReunion
    ).subscribe({
      next: (data) => {
        if (data.ok) {

          const storedMeets = localStorage.getItem('meeting-rooms');
          const meets: Record<string, any> = storedMeets ? JSON.parse(storedMeets) : {};

          /** Se guarda respuesta en localStorage */
          meets[this.idConvocadoReunion] = {
            id_reunion: data.response.id_reunion,
            identificacion: data.response.identificacion,
            expiration: Date.now() + 72e5
          }

          localStorage.setItem('meeting-rooms', JSON.stringify(meets));

          /**
           * Se redirige al componente de sala de espera
           */
          this.router.navigateByUrl(`public/reunion/sala-espera/${this.idConvocadoReunion}`);
        } else {

          /**
           * Respuesta de error
           */
          alertify.error(data.response);
        }
      }
    })

  }

}
