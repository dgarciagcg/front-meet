import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { environment } from 'src/environments/environment';

import { RedirectingService } from 'src/app/templates/redirecting/redirecting.service';
import { MeetsService } from 'src/app/services/meets.service';

import { Archivos, ConvocadoAdicional, Programas, Reuniones } from 'src/app/interfaces/reuniones.interface';
import { TipoReunion } from 'src/app/interfaces/tipos-reuniones.interface';
import { Grupos } from 'src/app/interfaces/grupos.interface';

/* Alertify y Bootstrap */
declare let alertify: any;
declare let bootstrap: any;

@Component({
  templateUrl: './meets.component.html',
  styleUrls: ['./meets.component.scss'],
  providers: [DatePipe],
  selector: 'app-meets',
})
export class MeetsComponent implements OnInit {

  storage = `${environment.storage}/`;

  // Grupos
  grupos: Grupos[] = [];

  // Reuniones
  reuniones: Record<string, Reuniones[]> = {};
  reunion!: Reuniones & TipoReunion & Grupos & { token: string };
  id_reunion!: number;

  // Preguntas
  programas: Programas[] = [];
  archivos: Archivos[] = [];

  // Convocados
  convocados: ConvocadoAdicional[] = [];
  array_convocados_seleccionados: ConvocadoAdicional[] = [];
  arrayConvocadosA: ConvocadoAdicional[] = [];
  arrayConvocadosI: ConvocadoAdicional[] = [];
  convocadosSinInvitar: ConvocadoAdicional[][] = [];

  // Formulario
  formularioCorreos = new FormGroup({});
  formularioReprogramar = new FormGroup({});


  constructor(
    public redirecting: RedirectingService,
    private meetsService: MeetsService,
    public domSanitizer: DomSanitizer,
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initFormReprogramar();
    this.initFormCorreos();
    this.getGrupos();
  }

  /**
   * Inicializa el formulario de correos
   */
  initFormCorreos = () => {
    this.formularioCorreos = this.fb.group({
      correos: this.fb.array([]),
    });
  }

  /**
   * Consulta todos los grupos registrados
   */
  getGrupos = () => {
    this.meetsService.getGrupos().subscribe((data: Grupos[]) => {
      this.grupos = data;
    });
  }

  /**
   * Consulta las reuniones que tiene en su tipo un grupo en comun
   * @param element Evento del collapsable
   * @param id_grupo Aqui va el id del grupo el que se van a filtrar las reuniones
   */
  getReuniones = (element: Element | null, id_grupo: number) => {
    if (!(id_grupo in this.reuniones)) {
      this.reuniones[id_grupo] = [];
      this.meetsService.getReuniones(id_grupo).subscribe((data: Reuniones[]) => {
        this.reuniones[id_grupo] = data;
        let totalConsultas = 0;

        for (let i = 0; i < this.reuniones[id_grupo].length; i++) {
          this.meetsService.getConvocados(this.reuniones[id_grupo][i].id_reunion).subscribe((data: ConvocadoAdicional[]) => {
            totalConsultas++;
            this.convocados = data;
            this.reuniones[id_grupo][i].validacion = this.convocados.filter(elm => elm.fecha_envio_invitacion === null);
            if (totalConsultas === this.reuniones[id_grupo].length) {
              if (element instanceof Element) {
                setTimeout(() => { element.dispatchEvent(new Event('toggleCollapsable')); }, 0);
              }
            }
          });
        }

        if (!this.reuniones[id_grupo].length) {
          if (element instanceof Element) {
            setTimeout(() => { element.dispatchEvent(new Event('toggleCollapsable')); }, 0);
          }
        }

      });
    } else {
      if (element instanceof Element) {
        element.dispatchEvent(new Event('toggleCollapsable'));
      } else {
        this.meetsService.getReuniones(id_grupo).subscribe((data: Reuniones[]) => {
          this.reuniones[id_grupo] = data;
        });
      }
    }
  }

  /**
   * Consulta los datos de una reunión en especifico
   * @param id_reunion Aqui va el id de la reunión a consultar
   */
  getReunion = (id_reunion: number) => {

    const arrayConvocadosA: ConvocadoAdicional[] = [];
    const arrayConvocadosI: ConvocadoAdicional[] = [];

    // Limpiar el array de correos
    (this.formularioCorreos.get('correos') as FormArray).clear();

    this.meetsService.getReunion(id_reunion).subscribe((data: any) => {
      this.reunion = data[0];
    });

    this.meetsService.getConvocados(id_reunion).subscribe((data: ConvocadoAdicional[]) => {
      this.convocados = data;
      for (let i = 0; i < this.convocados.length; i++) {
        (this.formularioCorreos.get('correos') as FormArray).push(this.fb.group({
          id_convocado_reunion: [this.convocados[i].id_convocado_reunion],
          correo: [this.convocados[i].correo],
        }));

        if (this.convocados[i].tipo === '0' || this.convocados[i].tipo === '2') {
          arrayConvocadosA.push(this.convocados[i]);
        } else {
          arrayConvocadosI.push(this.convocados[i]);
        }
      }
      this.arrayConvocadosA = arrayConvocadosA;
      this.arrayConvocadosI = arrayConvocadosI;
    });

    this.meetsService.getProgramas(id_reunion).subscribe((data: Programas[]) => {
      this.programas = data;
      if (this.reunion.estado == '2' && this.programas.length > 0) {
        this.archivos = [];

        for (let i = 0; i < this.programas.length; i++) {
          if (this.programas[i].archivos && this.programas[i].archivos!.length > 0) {
            this.archivos = this.archivos.concat(this.programas[i].archivos || []);
          }
          if (this.programas[i].opciones && this.programas[i].opciones!.length > 0) {
            for (let k = 0; k < this.programas[i].opciones!.length; k++) {
              if (this.programas[i].opciones![k].archivos!.length > 0) {
                this.archivos = this.archivos.concat(this.programas[i].opciones![k].archivos || []);
              }
            }
          }
        }
      }
    });
  }


  // LISTA DE CONVOCADOS SELECCIONADOS PARA ENVIAR CORREOS

  /**
   * Se encarga de enviar la invitacion a una cantidad de convocados seleccionados, ademas si en el envio el correo se cambia tambien lo envia para que sea actualizado
   */
  enviar_invitacion = () => {

    const inputs: NodeListOf<HTMLInputElement> = document.querySelectorAll('input[name="correo_convocado"]');
    let permitido = true;
    const filtro = Array.from(inputs).filter(elm => elm.checked).map(element => {

      const correo: HTMLInputElement = document.querySelector('input[data-convocado="' + element.value + '"]') as HTMLInputElement;
      if (correo.value === '') {
        correo.classList.add('bcl-danger-i');
        permitido = false;
      } else {
        correo.classList.remove('bcl-danger-i');
      }
      return { id_convocado: element.value, correo: correo.value, };
    });

    if (filtro.length > 0) {
      if (permitido) {
        this.meetsService.reenviarCorreos({ correos: filtro, id_reunion: this.reunion.id_reunion, id_grupo: this.reunion.id_grupo }).subscribe((res: any) => {
          alertify.success('Se han reenviado la invitación exitosamente');
        });
      } else {
        alertify.error('Los campos de correo de un convocado seleccionado no deben estar vacío');
      }
    } else {
      alertify.error('No se ha seleccionado ninguno de los convocados');
    }
  }

  /**
   * Se encarga de iniciar la reunión osea cambiarle el estado como tal
   */
  iniciarReunion = () => {
    this.meetsService.iniciarReunion(this.reunion.id_reunion).subscribe((res: any) => {
      this.getReunion(this.reunion.id_reunion);
      this.getReuniones(null, this.reunion.id_grupo);
      // Aqui va la redirección a la vista donde se esta ejecutando la reunion
      this.meetsService.registerMeet(this.reunion.id_reunion).subscribe(data => {
        if (!data.status) { return alertify.error('No se pudo comunicar a los convocados que la reunión inició'); }
        alertify.success('Se avisará a los convocados para que ingresen a la reunión');
        this.router.navigateByUrl(`/public/reunion/meeting-room/${this.reunion.token}`);
      })
    });
  }

  /**
   * Se encarga de carcelar la reunión osea cambiarle el estado como tal
   */
  cancelarReunion = () => {
    this.meetsService.cancelarReunion({ id_reunion: this.reunion.id_reunion }).subscribe((res: any) => {
      this.getReunion(this.reunion.id_reunion);
      this.getReuniones(null, this.reunion.id_grupo);
      alertify.success('Se ha cancelado la reunión exitosamente');
      if (this.convocados.length > 0) {
        const modalConfirmacion = document.querySelector('#email-reunion-cancelada-modal') as HTMLElement;
        const modalToOpenInstance = bootstrap.Modal.getOrCreateInstance(modalConfirmacion);
        modalToOpenInstance?.show();
      }
    });
  }

  /**
   * Aqui se envía el correo dando informe de la cancelación de una reunión
   */
  correoCancelacion = () => {
    this.meetsService.correoCancelacion({ convocados: this.convocados, id_reunion: this.reunion.id_reunion, id_grupo: this.reunion.id_grupo }).subscribe((res: any) => {
      alertify.success('Se ha enviado el correo de cancelación exitosamente');
    });
  }

  /**
   * Se encarga de eliminar una reunión y todo los registros asociados que tenga
   */
  eliminarReunion = () => {
    this.meetsService.eliminarReunion(this.reunion.id_reunion).subscribe((res: any) => {
      this.getReunion(this.reunion.id_reunion);
      this.getReuniones(null, this.reunion.id_grupo);
      alertify.success('Se ha eliminado la reunión exitosamente');
    });
  }

  /**
   * Inicia validaciones y valores por defecto del formulario para reprogramar una reunión
   */
  initFormReprogramar = () => {
    this.formularioReprogramar = this.fb.group({
      fecha_reunion: [this.reunion?.fecha_reunion, [Validators.required]],
      hora: [this.reunion?.hora, [Validators.required]],
    });
  }

  /**
   * Al ser ejecutada recorre el formulario de reprogramar reuniones y le ingresa los valores que le llegan en el objeto reunión
   * @param reunion Aqui viene el valor de cada parametro de la reunion
   * @returns Entrega el formulario diligenciado con la información que se obtuvo
   */
  setValueFormReprogramar = (reunion: any) => Object.keys(reunion).forEach(elm => {
    this.formularioReprogramar.get(elm)?.setValue(reunion[elm]);
  })

  /**
   * Consulta los datos de la reunión que se va reprogramar y ejecuta la función para llenarlos
   */
  datosReprogramarReunion = () => {
    this.setValueFormReprogramar(this.reunion);
  }

  /**
   * Reprograma la reunión, es decir actualiza tanto la fecha la hora y el estado de una reunión
   * @returns
   */
  reprogramarReunion = () => {
    const hoy = new Date();
    const fecha_hoy = this.datePipe.transform(hoy, 'yyyy-MM-dd');
    const fecha_reunion = this.formularioReprogramar.value.fecha_reunion;
    const hora = this.formularioReprogramar.value.hora;

    if (this.formularioReprogramar.valid) {

      if (fecha_reunion < fecha_hoy!) {
        alertify.error(`Estas ingresando una fecha inferior al dia actual`);
        return;
      }

      if (hora < '07:00:00') {
        alertify.error(`El rango para la ejecución de las reuniones debe ser entre las 7 a.m. y las 6 p.m.`);
        return;
      }

      const datos = {
        id_reunion: this.reunion.id_reunion,
        id_grupo: this.reunion.id_grupo,
        fecha_reunion: this.formularioReprogramar.value.fecha_reunion,
        hora: this.formularioReprogramar.value.hora,
        convocados: this.convocados,
      };

      this.meetsService.reprogramarReunion(datos).subscribe((res: any) => {
        this.getReunion(this.reunion?.id_reunion);
        this.getReuniones(null, this.reunion?.id_grupo);
        alertify.success('Se ha actualizado la fecha exitosamente');
      });
    }
  }

  /**
   * Actualiza un checkbox individual y el grupal con base en los individuales
   * @param event Información del evento
   */
  toggleSummon = (event: Event) => {
    const allUserInput = document.querySelector('[name="correo_convocados"]') as HTMLInputElement;
    const userList: HTMLInputElement[] = Array.from(document.querySelectorAll('[name="correo_convocado"]'));
    // → Actualiza el input de seleccionar todos
    const allChecked = userList.every(elm => elm.checked);
    if (allChecked) {
      allUserInput.indeterminate = false;
      allUserInput.checked = true;
    } else {
      const noOneChecked = userList.every(elm => !elm.checked);
      if (noOneChecked) {
        allUserInput.indeterminate = false;
        allUserInput.checked = false;
      } else {
        allUserInput.checked = false;
        allUserInput.indeterminate = true;
      }
    }
    // ← Actualiza el input de seleccionar todos
    this.updateEmailInput(event.target as HTMLInputElement);
  }

  /**
   * Actualiza un checkbox individual y el grupal con base en los individuales
   * @param event Información del evento
   */
  toggleSummonList = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const userList: NodeListOf<HTMLInputElement> = document.querySelectorAll('[name="correo_convocado"]');
    userList.forEach(item => {
      item.checked = target.checked;
      this.updateEmailInput(item);
    })
  }

  /**
   * Actualiza los input del correo de acuerdo al input de chequeo
   * @param target Input de checkeo
   */
  updateEmailInput(target: HTMLInputElement) {
    /** @type {HTMLInputElement} */
    const emailInput = target.parentElement?.querySelector('input[type="email"]');
    if (target.checked) {
      emailInput?.removeAttribute('disabled');
      emailInput?.setAttribute('required', 'required');
    } else {
      emailInput?.setAttribute('disabled', 'disabled');
      emailInput?.removeAttribute('required');
    }
  }

  /**
   * Valida si se seleccionó al menos un convocado y abre una ventana de diálogo
   * @param event Información del evento submit
   * @param modalToOpen Identificador de la ventana de diálogo que se abrirá
   * @param modalToClose Identificador de la ventana de diálogo que se cerrará
   */
  checkInvitations(event: Event, modalToOpen: string, modalToClose: string) {
    const userList: HTMLInputElement[] = Array.from(document.querySelectorAll('[name="correo_convocado"]'));
    const checkedList: HTMLInputElement[] = userList.filter(item => item.checked);
    if (checkedList.length > 0) {
      let permitido = true;
      for (let i = 0; i < checkedList.length; i++) {
        const correo: HTMLInputElement = document.querySelector('input[data-convocado="' + checkedList[i].value + '"]') as HTMLInputElement;
        if (correo.value === '') {
          correo.classList.add('bcl-danger-i');
          permitido = false;
        } else {
          correo.classList.remove('bcl-danger-i');
        }
      }

      if (permitido) {
        this.openModal(event, modalToOpen, modalToClose);
      } else {
        alertify.error('Los campos de correo de un convocado seleccionado no deben estar vacío');
      }

    } else { alertify.error('No se ha seleccionado ninguno de los convocados'); }
  }

  /**
 * Abre una ventana de diálogo
 * @param event Información del evento submit
 * @param modalToOpen Identificador de la ventana de diálogo que se abrirá
 * @param modalToClose Identificador de la ventana de diálogo que se cerrará
 */
  openModal(event: Event, modalToOpen: string, modalToClose: string) {
    event.preventDefault();
    event.stopPropagation();
    /** Etiqueta del cuadro de diálogo a abrir */
    const modalElementToOpen = document.querySelector(modalToOpen) as HTMLElement;
    /** @type {bootstrap.Modal} Instancia del cuadro de diálogo a abrir */
    const modalToOpenInstance = bootstrap.Modal.getOrCreateInstance(modalElementToOpen);
    /** Etiqueta del cuadro de diálogo a cerrar */
    const modalElementToClose = document.querySelector(modalToClose) as HTMLElement;
    /** @type {bootstrap.Modal} Instancia del cuadro de diálogo a cerrar */
    const modalToCloseInstance = bootstrap.Modal.getOrCreateInstance(modalElementToClose);
    modalToCloseInstance && modalToCloseInstance.hide();

    modalToOpenInstance && modalToOpenInstance.show();
  }

  validateInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    let correo = target.value;
  }

  /**
   * Valida si se seleccionó al menos un convocado y abre una ventana de diálogo
   * @param event Información del evento submit
   * @param modalToOpen Identificador de la ventana de diálogo que se abrirá
   * @param modalToClose Identificador de la ventana de diálogo que se cerrará
   */
  checkReschedule = (event: Event, modalToOpen: string, modalToClose: string) => {
    const hoy = new Date();
    const fecha_hoy = this.datePipe.transform(hoy, 'yyyy-MM-dd');
    const fecha_reunion = this.formularioReprogramar.value.fecha_reunion;

    if (fecha_reunion < fecha_hoy!) {
      alertify.error(`Estas ingresando una fecha inferior al dia actual`);
    } else if (this.formularioReprogramar.valid) {
      this.openModal(event, modalToOpen, modalToClose);
    } else {
      alertify.error(`Formulario no valido`);
    }
  }

  /**
   * Descarga en documento pdf el acta de una reunión
   */
  downloadPDFDocument = () => {
    let data = this.reunion;
    this.meetsService.downloadPDFDocument({ data }).subscribe((file: Blob) => {
      // currentDate: Fecha y hora actuales
      const currentDate = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toJSON().slice(0, 19).replace(/[-:]/g, '').replace(/[T]/g, '_');
      // link: Elemento HTML para la descarga
      const link: HTMLAnchorElement = document.createElement('a');
      // ↓ Agrega la url del archivo al link
      link.href = window.URL.createObjectURL(file);
      // ↓ Asigna el nombre del archivo
      link.download = `${currentDate}${'orden_del_dia'}.pdf`;
      // ↓ Ejecuta la descarga
      document.body.appendChild(link);
      link.click(); link.remove();
      // ↓ Comparte la promesa
      alertify.success('Se ha descargado la acta exitosamente');
    });
  }

}
