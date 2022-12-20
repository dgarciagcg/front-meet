import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Validators, FormBuilder, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from 'src/environments/environment';

import { Socket } from 'socket.io-client';

import { Meeting, MeetUtilitiesService } from 'src/app/services/templateServices/meet-utilities.service';
import { NotificationService } from 'src/app/services/templateServices/notification.service';
import { AccesoReunionService } from 'src/app/services/acceso-reunion.service';
import { SocketServiceService } from 'src/app/services/socket.service';
import { MeetsService } from 'src/app/services/meets.service';

import { Archivos, Programas } from 'src/app/interfaces/reuniones.interface';

interface Convocado {
  id_convocado_reunion: number;
  id_reunion: number;
  representacion?: any;
  id_relacion: number;
  fecha: string;
  tipo: string;
  nit?: any;
  razon_social?: any;
  participacion?: any;
  soporte?: any;
  fecha_envio_invitacion: string;
  firma: string;
  acta: string;
  estado: string;
  id_grupo: number;
  id_rol: number;
  id_recurso: number;
  identificacion: string;
  nombre: string;
  telefono: string;
  correo: string;
}

declare let alertify: any;
declare let bootstrap: any;

@Component({
  selector: 'app-sala-espera',
  templateUrl: './sala-espera.component.html',
  styleUrls: ['./sala-espera.component.scss']
})
export class SalaEsperaComponent implements OnInit, OnDestroy {

  storage = `${environment.storage}/`;

  /**
   * Variable para capturar id_convocado_reunion desde la url
   */
  idConvocadoReunion: string = '';

  /** tiempo que falta para iniciar una reunión en espera */
  timeDifference: undefined | { days: number; hours: number; minutes: number; };
  /** Actualiza el valor de {timeDifference} cada minuto */
  meetTimer = 0;

  /**
   * Variable para capturar información de la reunión actual
   */
  dataReunion: any;

  fechaReunion: Date | undefined;

  /**
   * Variable para capturar información del convocado a la reunión
   */
  dataConvocado!: Convocado[];

  /**
   * Array con la descripción de los diferentes estados que puede tener una reunión
   */
  estadosReunion: string[] = ['En espera', 'En curso', 'Terminada', 'Cancelada'];

  /**
   * FormBuilder para formulario de registro representante
   */
  formRepresentante: any;

  /**
   * Variable para capturar número de celular al cual se enviará SMS
   */
  numeroTelefono!: string;

  /**
   * Variable para capturar información guardada en localstorage
   */
  dataStorage?: Partial<Meeting<'Convocado' | 'Invitado'>>;

  /**
   * Bandera para mostrar restricciones de invitación a representante
   */
  showRestricciones: boolean = false;

  /**
   * Variable para almacenar dichas restricciones
   */
  restricciones?: any[];

  /**
   * Bandera para deshabilitar botón de envío SMS
   */
  disabledBtnSMS: boolean = false;

  /**
   * Variable para mostrar texto en el proceso de firma
   */
  txtFirma: string = '';

  /**
   * Variable para almacenar información de un representante
   */
  dataRepresentante: any;

  /**
   * Bandera para mostrar información de representante
   */
  showRepresentante: boolean = false;

  /**
   * Variable para almacenar información de representados
   */
  dataRepresentados: any;

  /**
   * Bandera para mostrar información de representados
   */
  showRepresentados: boolean = false;

  /**
   * Bandera para habilitar botón de cancelar representaciones
   */
  showBtnCancelar: boolean = false;

  /**
   * Ruta donde se almacenan las imágenes de firmas
   */
  pathFirma: string = environment.storage;

  /**
   * Variable para almacenar porcentaje de avance de la reunión actual en curso
   */
  porcentajeAvanceReunion: number = 0;

  /**
   * Variable para almacenar número de programas terminados de la reunión actual en curso
   */
  programasTerminados: number = 0;

  /**
   * Variable para almacenar número total de programas de la reunión actual en curso
   */
  totalProgramasReunion: number = 0;

  /**
   * Bandera para mostrar contenedor de porcentaje de avance de la reunión actual
   */
  showDivReunion: boolean = false;

  /**
   * Bandera para mostrar botón de ingresar a la reunión actual en curso
   */
  showBtnReunion: boolean = false;

  /**
   * Array para almacenar listado de reuniones a las que está convocado el usuario (No incluye la reunión actual)
   */
  listadoReuniones: any[] = [];

  /**
   * Variable para guardar diferentes grupos de las reuniones a las que está convocado el usuario
  */
  listaGruposReuniones!: any[];

  /**
   * Variable que filtra las diferentes reuniones a las que está convocado el usuario según un grupo seleccionado
   */
  filterSelected!: any[];

  archivos: Archivos[] = [];

  programas: Programas[] = []

  /**
   * Referencia botón HTML para cerrar modal
   */
  @ViewChild('closemodal', { static: false }) closemodal!: ElementRef<HTMLButtonElement>;

  constructor(
    private socketService: SocketServiceService,
    private accesoReunion: AccesoReunionService,
    private meetUtilities: MeetUtilitiesService,
    private notification: NotificationService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private reunion: MeetsService,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.socketService.connect();

    this.socketService.socket?.on('register-emit', (data) => {
      if (!data.status) { return alertify.error(data.message); }
      this.dataReunion.estado = 1;
      this.saveLocalStorage();
      this.getAvanceReunion();
      if (this.showBtnReunion && !this.showRepresentante) {
        this.notification.showAlert('El administrador ha habilitado el acceso a la sala de reuniones');
        this.openModal('#join-the-meet-modal');
      }
    });

    this.idConvocadoReunion = this.route.snapshot.params['id_convocado_reunion'];

    /**
     * Se inicializa formulario
     */
    this.initForm();

    this.dataStorage = this.meetUtilities.getMeet(this.idConvocadoReunion);

    if (this.meetUtilities.checkExpiration(this.dataStorage)) {
      this.meetUtilities.removeMeeting(this.idConvocadoReunion);
      this.dataStorage = undefined;
    }

    /**
     * Se valida que la data de localstorage tenga las propiedades requeridas
     */
    if (this.dataStorage && 'identificacion' in this.dataStorage && 'id_reunion' in this.dataStorage) {

      /**
       * Servicio para obtener los id_convocados_reunion del convocado
       */
      this.accesoReunion.getIdConvocado(
        this.dataStorage.identificacion as string,
        this.dataStorage.id_reunion as number
      ).subscribe({
        next: (data) => {

          if (data.ok) {
            this.meetUtilities.currentToken = this.idConvocadoReunion;

            /**
             * Fue convocado a la reunión
             */

            this.dataConvocado = data.response;

            if (this.dataStorage) {
              this.dataStorage.id_convocado_reunion = this.dataConvocado[0].id_convocado_reunion;
              this.dataStorage.convocatoria = this.dataConvocado.map(item => item.id_convocado_reunion);
              this.dataStorage.tipo_usuario = this.dataConvocado.some(item => [0, 2].includes(+item.tipo)) ? 'Convocado' : 'Invitado';
              this.meetUtilities.setMeeting(this.idConvocadoReunion, this.dataStorage);
            }

            if (this.dataConvocado.length > 1) {
              /**
               * Se valida si un convocado es convocado y representante para una misma reunión
               */
              const arrayRepresentaciones = data.response.map((row: any) => row.representacion);
              const numRepresentacionesNull = arrayRepresentaciones.filter((row: any) => row === null).length;
              const numRepresentaciones = arrayRepresentaciones.filter((row: any) => row !== null).length;

              /**
               * En caso de que sea convocado y representante, se habilita botón para cancelar representaciones
               */
              this.showBtnCancelar = (numRepresentacionesNull > 0 && numRepresentaciones > 0) ? true : false;
            }

            /**
             * Servicio para obtener información de reunión
             */
            this.reunion.getReunion(this.dataStorage?.id_reunion as number).subscribe({
              next: (data: any) => {

                const estadoReunion = +data[0].estado;

                /**
                 * Reunión en espera o en curso
                 */
                this.dataReunion = data[0];
                /**
                 * Si la reunión tiene estado Terminada/Cancelada, se redirige a otro componente
                 */
                if (estadoReunion === 3 || (estadoReunion === 2 && (!this.dataReunion.id_acta || this.dataReunion.acta))) {
                  this.meetUtilities.removeMeeting(this.idConvocadoReunion);
                  this.router.navigateByUrl(`/public/reunion/salir-sala/${estadoReunion}`);
                } else if (estadoReunion === 2 && this.dataReunion.id_acta && !this.dataReunion.acta) { // Validar que se haya guardado
                  this.router.navigateByUrl(`/public/reunion/actas/${this.dataReunion.plantilla}/${this.idConvocadoReunion}`);
                } else {
                  const fecha = this.dataReunion.fecha_reunion.split('-');
                  const hora = this.dataReunion.hora.split(':');
                  this.fechaReunion = new Date(+fecha[0], +fecha[1] - 1, +fecha[2], +hora[0], +hora[1], +hora[2]);

                  const setTime = () => {
                    const seconds = (this.fechaReunion as Date).getTime() - new Date().getTime();
                    if (seconds <= 60e3) { clearInterval(this.meetTimer); this.timeDifference = undefined; return; }
                    const days = Math.floor(seconds / 864e5);
                    const hours = Math.floor((seconds - (days * 864e5)) / 36e5);
                    const minutes = Math.floor((seconds - (days * 864e5) - (hours * 36e5)) / 60e3);
                    this.timeDifference = { days, hours, minutes };
                  }

                  this.meetTimer = window.setInterval(setTime, 60e3);
                  setTime();

                  this.getRepresentante();
                  this.getRepresentados();
                  this.saveLocalStorage();
                  this.getListadoReuniones();
                  this.getProgramas();
                }
              }
            });

          } else {
            /** No fue convocado a la reunión */
            this.meetUtilities.removeMeeting(this.idConvocadoReunion);
            alertify.error(data.response);
            this.router.navigateByUrl('/public/home');
          }
        }
      });
    } else {
      /**
       * No existe data en localstorage
       */
      this.router.navigateByUrl('/public/home');
    }

  }

  /**
   * Función encargada de guardar en localstorage los diferentes id_convocado_reunion que pueda tener un convocado
   */
  saveLocalStorage = (): void => {

    /**
     * Valida que la reunión esté en curso
     */
    if (+this.dataReunion.estado === 1) {
      this.showBtnReunion = true;
    } else {
      this.showBtnReunion = false;
    }
    if (this.dataStorage) {
      this.dataStorage.convocatoria = this.dataConvocado.map(row => row.id_convocado_reunion);
      this.meetUtilities.setMeeting(this.idConvocadoReunion, this.dataStorage as Partial<Meeting>);
    }
  }

  /**
   * Función encargada de inicializar formulario de registro de representante
   */
  initForm(): void {
    this.formRepresentante = this.formBuilder.group({
      identificacion: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
      nombre: new FormControl('', [Validators.required]),
      correo: new FormControl('', [Validators.required, Validators.email])
    });
  }

  /**
   * Función encargada de abrir modal para envío de SMS para firma
   */
  abrirModal = (): void => {

    /**Valida que el formulario sea válido */
    if (this.formRepresentante.valid) {
      this.numeroTelefono = this.dataConvocado[0].telefono;
      this.txtFirma = `Estamos enviando un mensaje al teléfono ${this.numeroTelefono}, por favor espere un momento.`;

      /**
       * Servicio para buscar si el convocado tiene restricciones
       */
      const restriccionesTipoReunionPromise = firstValueFrom(this.accesoReunion.getRestricciones(
        this.dataConvocado[0].id_convocado_reunion,
        this.formRepresentante.value.identificacion
      ));

      const otrasRestricciones = firstValueFrom(this.accesoReunion.getRestriccionesPoder(
        this.dataConvocado[0].id_convocado_reunion,
        this.formRepresentante.value.identificacion
      ));

      Promise.all([restriccionesTipoReunionPromise, otrasRestricciones]).then(([tipo, otro]) => {
        if (tipo.ok || otro.ok) {
          /**Tiene restricciones */
          this.showRestricciones = true;
          this.restricciones = [];
          this.formRepresentante.value.identificacion === this.dataStorage?.identificacion && (this.restricciones.push({ descripcion: 'No es posible designarse a uno mismo como representante' }));
          tipo.ok && (this.restricciones.push(...tipo.response));
          otro.ok && (this.restricciones.push(...otro.response));
        } else if (this.formRepresentante.value.identificacion === this.dataStorage?.identificacion) {
          this.showRestricciones = true;
          this.restricciones = [{ descripcion: 'No es posible designarse a uno mismo como representante' }]
        } else {
          /**No tiene restricciones */
          this.showRestricciones = false;
          this.restricciones = undefined;
        }
      });

    }

  }

  /**
   * Función encargada de enviar SMS con LINK para realizar firma
   */
  enviarSMS = (): void => {

    /**Se valida longitud para el número de celular */
    if (this.numeroTelefono.toString().length === 10) {

      this.openModal('#signature-waiting-modal', '#signature-modal')

      /**Se deshabilita botón de enviar durante 60 segundos */
      this.disabledBtnSMS = true;
      setTimeout(() => this.disabledBtnSMS = false, 60000);

      /**
       * Servicio para envío de SMS
       */
      this.accesoReunion.enviarSMSInvitacion(
        this.dataConvocado[0].id_convocado_reunion,
        this.numeroTelefono
      ).subscribe({
        next: (data) => {
          if (data.ok) {

            /**
             * SMS enviado correctamente
             */

            /**
             * Se emite socket para informar que el convocado va proceder a realizar la firma
             */
            this.socketService.socket instanceof Socket && this.socketService.socket.emit('registro-representante', {
              idConvocadoReunion: this.dataConvocado[0].id_convocado_reunion
            });

            /**
             * Se informa que se inició proceso de firma
             */
            this.txtFirma = 'Estamos esperando la recepción de la firma, por favor mantenga esta ventana abierta mientras finaliza el proceso.';
            alertify.success('Mensaje de texto enviado correctamente.');

            /**
             * Escucha socket que informa cuando el convocado 
             * ya realizó el proceso de firma desde su celular
             */
            this.socketService.socket instanceof Socket && this.socketService.socket.on('fin-firma', (data: any) => {

              /**
               * Se informa que finalizó el proceso de firma
               */
              this.txtFirma = 'Se ha recibido la firma satisfactoriamente, espere un momento mientras guardamos la información.';

              /**
               * Se construye objeto con información necesaria
               * para el registro del representante
               */
              const dataFormulario = {
                ...this.formRepresentante.value,
                url_firma: data.url,
                id_convocado_reunion: this.dataConvocado[0].id_convocado_reunion,
                id_grupo: this.dataConvocado[0].id_grupo,
                id_rol: 3,
                id_reunion: this.dataConvocado[0].id_reunion,
                nombreAnfitrion: this.dataConvocado[0].nombre,
                celular: this.numeroTelefono
              };

              /**
               * Servicio para registrar representante
               */
              this.accesoReunion.registrarRepresentante(
                dataFormulario
              ).subscribe({
                next: (data) => {
                  if (data.ok) {
                    /**
                     * Se organiza objeto para mostrar info. del reprsentante registrado
                     */
                    const objectInfo = { ...data.response.recurso, ...data.response.convocado };
                    this.showRepresentante = true;
                    this.dataRepresentante = objectInfo;
                    alertify.success('El poder se ha designado correctamente');

                    /**Se cierra modal */
                    this.closeModal('#signature-waiting-modal');

                    /**Se limpia formulario */
                    this.cleanForm();
                  }
                }
              });

            });

          } else {
            /**Falló envío SMS */
            alertify.error(data.response);
          }
        }, error: () => { this.disabledBtnSMS = false; }
      });

    } else {
      alertify.error('El número no tiene la longitud requerida (10 caracteres)');
    }
  }

  /**
   * Función encargada de limpiar formulario para registro de representante
   */
  cleanForm = () => {
    const controles = Object.keys(this.formRepresentante.controls);
    for (let index = 0; index < controles.length; index++) {
      this.formRepresentante.get(controles[index]).setValue('');
    }
  }

  getProgramas = () => {
    this.reunion.getProgramas(this.dataReunion.id_reunion).subscribe((data: Programas[]) => {
      this.programas = data;
      this.getAvanceReunion();
      if (data.length > 0) {
        this.archivos = [];

        for (let i = 0; i < data.length; i++) {
          if (data[i].archivos && data[i].archivos!.length > 0) {
            this.archivos = this.archivos.concat(data[i].archivos || []);
          }
          if (data[i].opciones && data[i].opciones!.length > 0) {
            for (let k = 0; k < data[i].opciones!.length; k++) {
              if (data[i].opciones![k].archivos!.length > 0) {
                this.archivos = this.archivos.concat(data[i].opciones![k].archivos || []);
              }
            }
          }
        }
      }
    });
  }

  /**
   * Función encargada de consultar si el convocado
   * tiene un representante para la reunión actual
   */
  getRepresentante = (): void => {
    this.accesoReunion.getRepresentante(this.dataConvocado[0].id_convocado_reunion).subscribe({
      next: (data) => {
        if (data.ok) {
          this.showRepresentante = true;
          this.dataRepresentante = data.response;
        } else {
          this.showRepresentante = false;
          this.dataRepresentante = [];
        }
      }
    })
  }

  /**
   * Función encargada de consultar si el convocado
   * es representante de otros convocados
   */
  getRepresentados = (): void => {
    const id_convocado_reunion = this.dataConvocado.map((elm: any) => +elm.id_convocado_reunion);
    this.accesoReunion.getRepresentados(
      id_convocado_reunion
    ).subscribe({
      next: (data) => {
        if (data.ok) {
          this.showRepresentados = true;
          this.dataRepresentados = data.response;
        }
      }
    });
  }

  /**
   * Función encargada de cancelar la designación de poder realizada por el convocado
   */
  cancelarInvitacion = (): void => {
    this.accesoReunion.cancelarInvitacion(
      this.dataRepresentante.id_convocado_reunion
    ).subscribe({
      next: (data) => {
        if (data.ok) {
          this.showRepresentante = false;
          this.dataRepresentante = [];
          alertify.success(data.response);
        } else {
          alertify.error(data.response);
        }
      }
    });
  }

  /**
   * Función encargada de cancelar las designaciones de poder
   * que otros invitados le han hecho al convocado
   * 
   * Nota: esta función solo se ejecuta cuando
   * un convocado ejerce como convocado y representante
   * para la misma reunión
   */
  cancelarRepresentacion = (): void => {

    /**
     * Se obtienen los diferentes id_convocado_reunion que tenga el convado
     */
    const convocadosCancelar = this.dataConvocado.filter((row: any) => row.representacion !== null);

    // Se construye array con los datos necesarios para la cancelación de dichas representaciones
    const cancelaciones = convocadosCancelar.map(row => ({
      id_convocado_reunion: row.id_convocado_reunion,
      correo: this.dataRepresentados.filter((elm: any) => row.representacion == elm.id_convocado_reunion)[0].correo,
      nombreRepresentado: this.dataRepresentados.filter((elm: any) => row.representacion == elm.id_convocado_reunion)[0].nombre,
      nombreRepresentante: row.nombre
    }));

    /**
     * Se consulta los id_convocado_reunion almacenados en localstorage
     */
    let dataLS = this.dataStorage?.convocatoria;

    /**
     * Variable para almacenar los nuevos id_convocados_reunion después de las cancelaciones
     */
    let newDataLS: number[] = [];

    /**Servicio para cancelar representaciones */
    this.accesoReunion.cancelarRepresentaciones(cancelaciones).subscribe({
      next: (data: any) => {
        if (data.ok) {
          alertify.success(data.response);
          this.showRepresentados = false;
          this.dataRepresentados = [];

          /**
           * Se guarda en el array el id_convocado_reunion que no fue cancelado
           */
          cancelaciones.forEach((row: any) => {
            (dataLS as number[]).forEach((elm: number) => {
              if (+row.id_convocado_reunion !== elm) {
                newDataLS.push(elm);
              }
            });
          });

          if (this.dataStorage) {
            this.dataStorage.convocatoria = newDataLS;
            this.dataStorage.id_convocado_reunion = newDataLS[0];
            this.meetUtilities.setMeeting(this.idConvocadoReunion, this.dataStorage);
          }

        } else {
          alertify.error('Ha ocurrido un error...');
        }
      }
    });

  }

  /**
   * Función encargada de consultar la programación de una reunión en curso
   * para calcular el porcentaje de avance de la misma
   */
  getAvanceReunion = (): void => {
    if (+this.dataReunion.estado === 1) {
      // this.accesoReunion.getAvanceReunion(this.dataConvocado[0].id_convocado_reunion).subscribe({
      // next: (data) => {
      if (this.programas.length) {
        const programming = this.programas.reduce((result, program) => {
          if (![3, 4].includes(+program.estado)) {
            result.push(program);
            program.opciones?.forEach(option => ![3, 4].includes(+option.estado) && result.push(option));
          }
          return result;
        }, [] as Programas[]);

        this.showDivReunion = true;
        this.totalProgramasReunion = programming.length;
        this.programasTerminados = programming.filter((row: any) => +row.estado === 2).length;
        this.porcentajeAvanceReunion = programming.length ? (+((this.programasTerminados / programming.length) * 100).toFixed(2)) : 0;
      } else {
        this.showDivReunion = false;
      }
      // }
      // });
    }
  }

  /**
   * Función encargada de obtener las reuniones en espera ó en curso, diferentes a la actual, 
   * a las que el convocado está invitado
   */
  getListadoReuniones = (): void => {
    this.accesoReunion.getListadoReuniones(this.dataStorage?.identificacion as string, this.dataStorage?.id_reunion as number).subscribe({
      next: (data: any) => {
        if (data.ok) {

          let hash: any = [];

          /**Se asigna array de reunuiones */
          this.listadoReuniones = data.response;

          setTimeout(() => {
            /** Select de lista de grupos */
            const listaReunionesSelect = document.querySelector('.form-select[name="group"]') as HTMLSelectElement;

            /** Se crea array con la estructura requerida para mostrar en el select */
            this.listaGruposReuniones = data.response.map((row: any) => ({
              id: row.id_grupo,
              descripcion: row.descripcion_grupo
            }));

            /**Se eliminan grupos repetidos */
            this.listaGruposReuniones = this.listaGruposReuniones.filter((current: any) => {
              const exists = !hash[current.descripcion];
              hash[current.descripcion] = true;
              return exists;
            });

            /**
             * Se establece por defecto en el select el primer item del array
             */
            setTimeout(() => {
              if (this.listaGruposReuniones.length > 0) {
                listaReunionesSelect.value = this.listaGruposReuniones[0].id;
                listaReunionesSelect.dispatchEvent(new Event('change'));
              }
            }, 0); // Esera el ngFor de las opciones
          }, 0); // Espera el ngIf del seelct

        }
      }
    });
  }

  /**
   * Función encargada de aplicar filtro de reuniones con base en el grupo seleccionado
   * 
   * @param event => change
   */
  changeListaReuniones = (event: Event): void => {
    const selected = (event.target as HTMLSelectElement).value;
    this.filterSelected = this.listadoReuniones.filter((row: any) => row.id_grupo == selected).map(item => {
      const fecha = item.fecha_reunion.split('-');
      const hora = item.hora.split(':');
      return { ...item, date: new Date(+fecha[0], +fecha[1] - 1, +fecha[2], +hora[0], +hora[1], +hora[2]) };
    });
  }

  logout() {
    this.meetUtilities.removeMeeting(this.idConvocadoReunion);
    this.router.navigateByUrl('/public/home');
  }

  /**
   * Abre una ventana de diálogo
   * @param {string} modalToOpen Identificador de la ventana de diálogo que se abrirá
   * @param {string} modalToClose Identificador de la ventana de diálogo que se cerrará
   */
  openModal(modalToOpen: string, modalToClose: string | undefined = undefined) {
    /** @type {HTMLElement} Etiqueta del cuadro de diálogo a abrir */
    const modalElementToOpen = document.querySelector(modalToOpen);
    /** @type {bootstrap.Modal} Instancia del cuadro de diálogo a abrir */
    const modalToOpenInstance = bootstrap.Modal.getOrCreateInstance(modalElementToOpen);
    if (modalToClose) {
      /** @type {HTMLElement} Etiqueta del cuadro de diálogo a cerrar */
      const modalElementToClose = document.querySelector(modalToClose);
      /** @type {bootstrap.Modal} Instancia del cuadro de diálogo a cerrar */
      const modalToCloseInstance = bootstrap.Modal.getOrCreateInstance(modalElementToClose);
      modalToCloseInstance && modalToCloseInstance.hide();
    }
    modalToOpenInstance && modalToOpenInstance.show();
  }

  /**
   * cierra una ventana de diálogo
   * @param {string} modalToClose Identificador de la ventana de diálogo que se cerrará
   */
  closeModal(modalToClose: string) {
    /** @type {HTMLElement} Etiqueta del cuadro de diálogo a cerrar */
    const modalElementToClose = document.querySelector(modalToClose);
    /** @type {bootstrap.Modal} Instancia del cuadro de diálogo a cerrar */
    const modalToCloseInstance = bootstrap.Modal.getOrCreateInstance(modalElementToClose);
    modalToCloseInstance && modalToCloseInstance.hide();
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
    clearTimeout(this.meetTimer);
  }

}
