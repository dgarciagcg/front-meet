import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SignaturePad } from 'angular2-signaturepad';

import { AccesoReunionService } from 'src/app/services/acceso-reunion.service';

declare let alertify: any;

@Component({
  selector: 'app-firma',
  templateUrl: './firma.component.html',
  styleUrls: ['./firma.component.scss']
})
export class FirmaComponent implements OnInit {

  /**
   * Referencia componnte de signaturepad
   */
  @ViewChild(SignaturePad) signaturePad!: SignaturePad;

  /**
   * Bandera para mostrar contenedor de firma
   */
  showSignatureDiv: boolean = false;

  /**
   * Variable para capturar documento de identidad
   */
  documentoIdentidad: string = '';

  /**
   * Variable para capturar id_convocado_reunion encriptado en la URL
   */
  idConvocadoReunion: string = '';

  /**
   * Objeto de configuración para el contenedor de la firma
   */
  public signaturePadOptions = {
    'canvasWidth': window.innerWidth > 666 ? (23.5 * 16) : ((window.innerWidth * .9) - (4 * 16)),
    'canvasHeight': 300,
    'minWidth': 5
  };

  constructor(
    private accesoReunion: AccesoReunionService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    /**Se captura id_convocado_reunion de la URL */
    this.idConvocadoReunion = this.route.snapshot.params['id_convocado_reunion'];
  }

  /**
   * Función encargada de capturar base64 de la imagen generada al firmar
   */
  drawComplete() {
    /**Se valida que no esté vacío el contenedor de firma */
    if (!this.signaturePad.isEmpty()) {
      this.accesoReunion.enviarFirma(
        this.idConvocadoReunion,
        this.signaturePad.toDataURL()
      ).subscribe({
        next: (data: { ok: boolean; id_convocado_reunion: string; url_firma: string; response?: string; }) => {
          if (data.ok) {
            this.accesoReunion.getUrlFirma(data.id_convocado_reunion, data.url_firma).subscribe(response => {
              if (!response.ok) { return alertify.error('Esta opción ha dejado de estar disponible'); }
              this.router.navigateByUrl('public/login');
              alertify.success('La firma se ha enviado correctamente.');
            });
          } else if (data.response === 'Proceso finalizado por el usuario') {
            alertify.error('Esta opción ha dejado de estar disponible');
          }
        }
      });
    } else {
      alertify.error('Debe añadir una firma');
    }
  }

  /**
   * Función encargada de limpiar contenedor de firma
   * 
   * @returns clear()
   */
  limpiar = () => this.signaturePad.clear();

  /**
   * Función encargada de validar si el documento de identidad corresponde
   * con el id_convocado_reunion encriptado y si el convocado puede realizar la firma
   */
  enviarDocumento = () => {

    if (!this.documentoIdentidad.trim()) {
      return alertify.error('El documento de identidad no puede ser vacío.');
    }

    this.accesoReunion.validacionConvocado(
      this.documentoIdentidad.trim(),
      this.idConvocadoReunion
    ).subscribe({
      next: (data) => {
        if (data.ok) {
          this.accesoReunion.permitirFirma(this.idConvocadoReunion).subscribe({
            next: (data) => {
              if (data.ok) {
                this.showSignatureDiv = true;
              } else {
                this.showSignatureDiv = false;
                this.router.navigateByUrl('public/login');
                alertify.error(data.response);
              }
            }
          })
        } else {
          alertify.error(data.response);
          this.showSignatureDiv = false;
        }
      }
    });

  }

}
