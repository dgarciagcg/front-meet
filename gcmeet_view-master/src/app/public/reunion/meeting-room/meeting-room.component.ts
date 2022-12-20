import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormGroup } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { Socket } from 'socket.io-client';

import { environment } from 'src/environments/environment';

import { AccesoReunionService, Convocado, Elected, Programacion, Respuesta } from 'src/app/services/acceso-reunion.service';
import { Meeting, MeetingType, MeetUtilitiesService } from 'src/app/services/templateServices/meet-utilities.service';
import { NotificationService } from 'src/app/services/templateServices/notification.service';
import { SocketServiceService } from 'src/app/services/socket.service';
import { MeetsService } from 'src/app/services/meets.service';

import { ConvocadoAdicional, Reuniones } from 'src/app/interfaces/reuniones.interface';

declare const bootstrap: any;
declare const alertify: any;

interface AnsweredProgram {
  response: undefined | any;
}

type ASOption = Programacion & AnsweredProgram;
export type ASProgram = Omit<Programacion, 'response'> & AnsweredProgram;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meeting-room.component.html',
  styleUrls: ['./meeting-room.component.scss'],
  selector: 'app-meeting-room',
})
export class MeetingRoomComponent implements OnInit, OnDestroy {

  eliminado!: { index: number, convocado: ConvocadoAdicional, zona: 'arrayConvocadosA' | 'arrayConvocadosI' };
  programaEliminado!: { form: FormArray; control: FormGroup; index: number; };

  public programToSave: undefined | Programacion;

  public storage = `${environment.storage}/`;

  /** Persona en sesión */
  public identificador!: string;

  /** Rol durante la reunión */
  public rol!: MeetingType;

  /** */
  private userInfo!: Partial<Meeting<MeetingType>>

  public get summonedUser(): Partial<Meeting<'Convocado' | 'Invitado'>> { return this.userInfo; }

  public get adminUser(): Partial<Meeting<'Administrador'>> { return this.userInfo; }

  public allSummoned: (Convocado & { hasLoggedin: number; })[] = [];
  /** Listado de convocados, además de su estado de conexión y respuesta */
  public summonList: (Convocado & { isLoggedin: boolean, response: any })[] = [];
  /** Almacena los convocados conectados hasta que el listado de convocados esté disponible */
  public summonLoggedWaitingList: number[] = [];

  public programmingList: ASProgram[] = [];

  public meet!: Reuniones;

  public program: number = Infinity;
  public option: number = Infinity;

  public currentProgram?: ASProgram;
  public currentOption?: ASOption;

  public advanceText = 'Siguiente';

  public chooseInfo?: { program: ASOption | ASProgram; type: Programacion['tipo']; response: any | { votacion: boolean; }; };

  public answerList: Respuesta[] = [];

  public orderTarget?: number;

  public programToCancel?: number;

  public electItem?: { element: Elected, key: number; };
  public checkElection?: Record<string, Elected>;
  public selectedElectItem?: number;

  public totalQuorum = 0;

  constructor(
    private meetUtilities: MeetUtilitiesService,
    private socketService: SocketServiceService,
    private accesoService: AccesoReunionService,
    private notification: NotificationService,
    private meetService: MeetsService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.identificador = this.route.snapshot.params['identificador'];

    let userInfo = this.meetUtilities.getMeet(this.identificador);
    if (!userInfo) {
      this.accesoService.getDataAdmin(this.identificador).subscribe(data => {
        if (!data.ok) {
          alertify.error('sus credenciales han expirado');
          this.meetUtilities.removeMeeting(this.identificador);
          this.router.navigateByUrl('/public/home');
          return;
        }

        userInfo = { id_reunion: +data.response.id_reunion, id_usuario: data.response.id_usuario };
        this.meetUtilities.setMeeting(this.identificador, userInfo);
        this.userInfo = userInfo;
        this.init();
      });
    } else if (userInfo && this.meetUtilities.checkExpiration(userInfo)) {
      return this.logout('Sus credenciales han expirado');
    } else {
      this.userInfo = userInfo;
      this.init();
    }
  }

  init() {
    this.socketService.connect();
    this.setRol();
    this.getMeetInfo();
    this.getSummonList();
    this.getProgrammingList();
    this.logIn();
    this.getAnswers();

    if (this.socketService.socket instanceof Socket) {
      this.socketService.socket.on('login-emit', (id_convocado_reunion: number) => this.updateLoginStatus(id_convocado_reunion, true));
      this.socketService.socket.on('logout-emit', (id_convocado_reunion: number) => this.updateLoginStatus(id_convocado_reunion, false));
      this.socketService.socket.on('advanceProgram-emit', (data: { id_programa: number; open: boolean | undefined; status: string; }) => {
        data.open && this.notification.showAlert('El administrador ha cambiado de pregunta', 5);
        const programmingList = this.programmingList.reduce((result, program) => {
          program.opciones.forEach(option => result.push(option));
          result.push(program);
          return result;
        }, [] as (ASOption | ASProgram)[]);
        const program = programmingList.find(item => +item.id_programa === +data.id_programa);
        if (program) {
          program.estado = data.status;
          this.cdr.markForCheck();
          data.open !== undefined && this.toggleProgramming(program, data.open);
        }
      });
      this.socketService.socket.on('answerQuestion-emit', (data: Respuesta) => {
        this.answerList = this.answerList.concat(data);
        const summoned = this.summonList.find(elm => +elm.id_convocado_reunion === +data.id_convocado_reunion);
        summoned?.isLoggedin === false && (summoned.isLoggedin = true);
        if ((this.currentOption && +this.currentOption.id_programa === +data.id_programa) || (this.currentProgram && +this.currentProgram.id_programa === +data.id_programa)) {
          summoned && (summoned.response = JSON.parse(data.descripcion));
        }
        this.cdr.markForCheck();
      });
      this.socketService.socket.on('changeMeetStatus-emit', async (data: string) => {
        alertify.message(`El moderador ha ${+data === 2 ? 'finalizado' : 'cancelado'} la reunión`);
        if (this.meet.id_acta && this.rol !== 'Invitado' && +data === 2) {
          if (this.rol === 'Administrador') { this.router.navigateByUrl(`/public/reunion/actas/${this.meet.plantilla}/${this.identificador}`); }
          else {
            this.accesoService.checkFirmaActa(this.adminUser.id_reunion as number).subscribe(response => {
              if (response.status === false) { return alertify.error(response.message); }
              const signList = response.message.signList;
              if (signList.some((item: Convocado) => this.summonedUser.convocatoria?.includes(+item.id_convocado_reunion) || this.summonedUser.convocatoria?.includes(+(item.representacion as number)))) {
                this.router.navigateByUrl(`/public/reunion/actas/${this.meet.plantilla}/${this.identificador}`);
              } else {
                this.router.navigateByUrl(`/public/reunion/salir-sala/${data}`);
                this.meetUtilities.removeMeeting(this.identificador);
              }
            });
          }
        } else {
          this.router.navigateByUrl(`/public/reunion/salir-sala/${data}`);
          this.meetUtilities.removeMeeting(this.identificador);
        }
      });
      this.socketService.socket.on('updateRoom-emit', () => this.updateRoom());
    }
  }

  updateRoom() {
    this.summonLoggedWaitingList = this.summonList.filter(item => item.isLoggedin).map(item => item.id_convocado_reunion);
    this.programmingList = [];
    this.allSummoned = [];
    this.summonList = [];
    this.answerList = [];
    this.getMeetInfo();
    this.getSummonList();
    this.getProgrammingList();
    this.getAnswers();
  }

  setRol() {
    if (!this.userInfo.id_reunion) { return this.logout('Sus credenciales han expirado'); };
    if (this.userInfo.id_usuario) {
      this.rol = 'Administrador';
    } else if (this.userInfo.identificacion && this.userInfo.id_convocado_reunion && this.userInfo.convocatoria?.length) {
      this.rol = this.userInfo.tipo_usuario || 'Invitado';
    } else { return this.logout('Sus credenciales han expirado'); }
    this.cdr.markForCheck();
  }

  getMeetInfo() {
    this.meetService.getReunion(this.adminUser.id_reunion as number).subscribe({
      next: (data: Reuniones[]) => {
        this.meet = data[0];
        if ([2, 3].includes(+this.meet.estado)) {
          this.meetUtilities.removeMeeting(this.identificador);
          this.router.navigateByUrl(`/public/reunion/salir-sala/${this.meet.estado}`);
          alertify.message(`La reunión se encuentra ${+this.meet.estado === 2 ? 'finalizada' : 'cancelada'}`);
        }
        this.cdr.markForCheck();
      }
    });
  }

  getSummonList() {
    const summonListService = this.accesoService.getListaConvocados(this.userInfo?.id_reunion as number);
    const allSummonListService = this.accesoService.getAllSummonedList(this.userInfo?.id_reunion as number);

    Promise.all([firstValueFrom(summonListService), firstValueFrom(allSummonListService)]).then(([data, all]) => {
      if (!all.ok) { return alertify.error('Ha ocurrido un error, por favor comuníquese con un asesor {Convocados}'); }
      if (!data.ok) { return alertify.error('Ha ocurrido un error, por favor comuníquese con un asesor {Convocados}'); }
      const allSummoned: typeof all['response'] = [];
      all.response.forEach(item => {
        const isLoggedin = this.summonLoggedWaitingList.indexOf(item.id_convocado_reunion);
        isLoggedin !== -1 && (item.hasLoggedin = 1); // Lo marca como que estuvo conectado
        if (allSummoned.find(elm => elm.representacion === item.id_convocado_reunion)) { return; }  //  Si hay un convocado representando al convocado(acttual del bucle), entonces no se agrega
        const representante = allSummoned.findIndex(elm => elm.id_convocado_reunion === item.representacion);
        representante !== -1 && allSummoned.splice(representante, 1); // Si un convocado está representando a alguien se elimina el convocado principal
        allSummoned.push(item);
      });
      this.allSummoned = allSummoned;

      this.summonList = data.response.map(item => {
        const isLoggedin = this.summonLoggedWaitingList.indexOf(item.id_convocado_reunion);
        isLoggedin !== -1 && this.summonLoggedWaitingList.splice(isLoggedin, 1);

        let summonResponse = undefined;
        if (this.currentOption || this.currentProgram) {
          const answer = this.answerList.find(elm => +elm.id_convocado_reunion === +item.id_convocado_reunion && (elm.id_programa === this.currentOption?.id_programa || elm.id_programa == this.currentProgram?.id_programa));
          answer && (summonResponse = JSON.parse(answer.descripcion));
        }

        return {
          ...item,
          nombre: item.nombre.toLowerCase(),
          isLoggedin: isLoggedin !== -1,
          response: summonResponse
        }
      });

      this.calculateQuorum();

      this.accesoService.getSummonedList(this.adminUser.id_reunion as number)
        .subscribe(data => data.message.forEach(item => this.updateLoginStatus(item, true, false)));
    });
  }

  calculateQuorum() {
    this.totalQuorum = (!this.meet || !(+this.meet.quorum)) ? 100 :
      this.summonList.filter(summon => summon.isLoggedin).reduce((total, summon) => total + (summon.participacion ? +summon.participacion : (100 / this.summonList.length)), 0);
    this.cdr.markForCheck();
  }

  getProgrammingList() {
    this.accesoService.getProgramacionReunion(this.userInfo?.id_reunion as number, this.summonedUser.id_convocado_reunion).subscribe({
      next: (data) => {
        if (!data.ok) { return alertify.error('Ha ocurrido un error, por favor comuníquese con un asesor {Orden del día}'); }
        this.programmingList = data.response.map(item => ({
          ...item,
          opciones: item.opciones.map(elm => ({ ...elm, response: elm.response ? JSON.parse(elm.response) : undefined })).sort((a, b) => +a.orden - +b.orden),
          response: item.response ? JSON.parse(item.response) : undefined,
        })).sort((a, b) => +a.orden - +b.orden);
        this.cdr.markForCheck();

        setTimeout(() => this.checkNextProgram(), 0);
      }
    });
  }

  checkNextProgram() {
    // Empieza desde el primer en curso
    this.program = Infinity;
    for (let index = 0; index < this.programmingList.length; index++) {
      if ([0, 1].includes(+this.programmingList[index].estado)) {
        this.program = index;
        index = this.programmingList.length;
      } else if (+this.programmingList[index].estado === 2) {
        if (this.programmingList[index].opciones.some(opt => [0, 1].includes(+opt.estado))) {

          this.program = index;
          index = this.programmingList.length;
        }
      }
    }

    const program = this.programmingList[this.program];

    if (program) {
      if (+program.estado === 0) {
        this.advanceText = 'Comenzar';
        this.cdr.markForCheck();
        return;
      }

      this.toggleProgramming(program, true);

      if (+program.estado === 2) {
        this.advanceText = 'Comenzar';
        this.cdr.markForCheck();
        return;
      }

      if ([0, 1, 4].includes(+program.tipo)) {
        // Empieza desde el primer en curso
        this.option = Infinity;
        for (let index = 0; index < program.opciones.length; index++) {
          if (+program.opciones[index].estado === 1 || (+program.estado === 2 && +program.opciones[index].estado === 0)) {
            this.option = index;
            index = program.opciones.length;
          }
        }

        const option = program.opciones[this.option];
        if (option) { this.toggleProgramming(option, true); }

        if (this.program === this.programmingList.length - 1) {
          if (!program.opciones.length || (option && +option.estado !== 0 && this.option === program.opciones.length - 1)) {
            this.advanceText = 'Finalizar';
          }
        }
      } else {
        if (!((this.program + 1) in this.programmingList)) { this.advanceText = 'Finalizar'; }
      }
    } else { this.advanceText = 'Finalizar'; }
  }

  updateAdvanceInfo(program: ASOption | ASProgram) {
    for (let i = 0; i < this.programmingList.length; i++) {
      const item = this.programmingList[i];
      if (item.id_programa === program.id_programa) {
        this.program = i;
        i = this.programmingList.length;
      } else {
        for (let j = 0; j < item.opciones.length; j++) {
          if (item.opciones[j].id_programa === program.id_programa) {
            i = this.programmingList.length;
            this.option = j;
            j = item.opciones.length;
          }
        }
      }
    }

    const programItem = this.programmingList[this.program];
    if (programItem) {
      this.currentProgram = programItem;

      if ([0, 1, 4].includes(+programItem.tipo)) {

        const optionItem = programItem.opciones[this.option];
        if (optionItem) {
          this.currentOption = optionItem;
          this.advanceText = ((this.option + 1) in programItem.opciones || (this.program + 1) in this.programmingList) ? 'Siguiente' : 'Finalizar'
        } else { this.currentOption = undefined; }

      } else {
        this.currentOption = undefined;
        this.advanceText = (this.program + 1) in this.programmingList ? 'Siguiente' : 'Finalizar';
      }
    }

    let answerList: Respuesta[] = [];
    if (this.currentOption) {
      answerList = this.answerList.filter(answer => +answer.id_programa === +(this.currentOption as ASOption).id_programa);
    } else if (this.currentProgram) {
      answerList = this.answerList.filter(answer => +answer.id_programa === +(this.currentProgram as ASProgram).id_programa);
    }
    answerList.forEach(item => {
      const summoned = this.summonList.find(elm => elm.id_convocado_reunion === item.id_convocado_reunion);
      summoned && (summoned.response = JSON.parse(item.descripcion));
    });
  }

  toggleProgramming(program: ASOption | ASProgram, open: boolean) {
    this.rol === 'Administrador' && open === true && this.updateAdvanceInfo(program);
    !open && (this.currentProgram = undefined);
    this.cdr.markForCheck();
    setTimeout(() => {
      const collapsable = document.querySelector(`#collapsable-of-${program.id_programa}`);
      collapsable && collapsable.dispatchEvent(new Event(`${open ? 'open' : 'close'}Collapsable`));
    }, 0);
  }

  logIn() {
    const data: Partial<Record<'id_usuario' | 'id_reunion' | 'id_convocado_reunion', any>> = { id_reunion: this.adminUser.id_reunion };
    this.rol === 'Administrador' && (data.id_usuario = this.adminUser.id_usuario);
    this.rol !== 'Administrador' && (data.id_convocado_reunion = this.adminUser.id_convocado_reunion);
    this.socketService.socket instanceof Socket && this.socketService.socket.emit('login', data);
    if (this.rol !== 'Administrador') {
      this.accesoService.saveLogin(data.id_convocado_reunion).subscribe(data => {
        if (!data.status) { alertify.error(data.message); }
      });
    }
  }

  updateLoginStatus(id_convocado_reunion: number, status: boolean, message = true) {
    const summoned = this.summonList.find(item => item.id_convocado_reunion === id_convocado_reunion);
    const summoned2 = this.allSummoned.find(item => item.id_convocado_reunion === id_convocado_reunion);
    message && summoned && alertify.message(`${summoned.nombre} ha ${status ? 'entrado en' : 'salido de'} la reunión`);
    if (!status) {
      if (!summoned) {
        const summonedIndex = this.summonLoggedWaitingList.indexOf(id_convocado_reunion);
        summonedIndex !== -1 && this.summonLoggedWaitingList.splice(summonedIndex, 1);
      } else { summoned.isLoggedin = status; }
    } else {
      summoned ? (summoned.isLoggedin = status) : this.summonLoggedWaitingList.push(id_convocado_reunion);
      summoned2 && (summoned2.hasLoggedin = 1);
    }
    this.calculateQuorum();
  }

  advanceProgramming(): any {
    this.summonList.forEach(item => (item.response = undefined));

    const lastProgram = this.program;

    this.program = Infinity;
    this.option = Infinity;

    for (let index = 0; index < this.programmingList.length; index++) {
      if ([0, 1].includes(+this.programmingList[index].estado)) {
        this.program = index;
        index = this.programmingList.length;
      } else if (+this.programmingList[index].estado === 2) {
        if (this.programmingList[index].opciones.some(opt => [0, 1].includes(+opt.estado))) {
          this.program = index;
          index = this.programmingList.length;
        }
      }
    }

    const program = this.programmingList[this.program];

    if (program) {

      if ([0, 2].includes(+program.estado)) {
        const lastStatus = +program.estado;
        this.updateProgrammingStatus(program.id_programa, '1', lastStatus === 2 ? undefined : true);
        program.estado = '1';
        this.advanceText = (this.program + 1) in this.programmingList || program.opciones.length ? 'Siguiente' : 'Finalizar';
        this.cdr.markForCheck();
        lastStatus === 2 && this.advanceProgramming();
        return;
      }

      if ([0, 1, 4].includes(+program.tipo)) {
        for (let index = 0; index < program.opciones.length; index++) {
          if ([0, 1].includes(+program.opciones[index].estado)) {
            this.option = index;
            index = program.opciones.length;
          }
        }

        const option = program.opciones[this.option];

        if (option) {
          if (+option.estado === 0) {
            this.updateProgrammingStatus(option.id_programa, '1', true);
            option.estado = '1';
            this.advanceText = ((this.option + 1) in program.opciones || (this.program + 1) in this.programmingList) ? 'Siguiente' : 'Finalizar';
            this.cdr.markForCheck();
          } else if (+option.estado === 1) {
            this.updateProgrammingStatus(option.id_programa, '2', false);
            option.estado = '2';
            option.opciones.forEach(opt => {
              this.updateProgrammingStatus(opt.id_programa, '2', undefined)
              opt.estado = '2';
            });
            this.cdr.markForCheck();
            this.advanceProgramming();
          }
        } else {
          this.updateProgrammingStatus(program.id_programa, '2', false);
          program.estado = '2';
          this.cdr.markForCheck();
          this.advanceProgramming();
        }
      } else {
        this.updateProgrammingStatus(program.id_programa, '2', false);
        program.estado = '2';
        program.opciones.forEach(option => {
          this.updateProgrammingStatus(option.id_programa, '2', undefined)
          option.estado = '2';
        });
        this.cdr.markForCheck();
        this.advanceProgramming();
      }
    } else {
      if (lastProgram >= (this.programmingList.length - 1)) {
        this.meetEnd();
      } else {
        this.advanceText = 'Finalizar';
        this.program = this.programmingList.length - 1;
      }
    }
  }

  updateProgrammingStatus(id_programa: number, status: string, open: boolean | undefined) {
    this.accesoService.actualizarEstadoPrograma(id_programa, status).subscribe({
      next: (data) => {
        if (!data.ok) { return alertify.error('Ha ocurrido un errror, coumíquese con un asesor (updateProgrammingStatus)'); }
        if (this.socketService.socket instanceof Socket) {
          this.socketService.socket.emit('advanceProgram', { id_reunion: this.adminUser.id_reunion, id_programa, open, status });
        }
      }
    });
  }

  choose() {
    if (this.chooseInfo) {
      const { program, type, response } = this.chooseInfo;
      if (this.rol !== 'Convocado') { return alertify.error('Usted no puede responder preguntas'); }
      document.querySelectorAll('.response-element').forEach(trigger => trigger.classList.add('blocked'));
      this.accesoService.answerQuestion(this.summonedUser.convocatoria as number[], program.id_programa, response).subscribe(data => {
        if (!data.status) {
          document.querySelectorAll('.response-element').forEach(trigger => trigger.classList.remove('blocked'));
          return alertify.error(data.message);
        }
        alertify.success('Su respuesta se guardado correctamente');
        program.response = response;
        this.cdr.markForCheck();
        if (this.socketService.socket instanceof Socket) {
          this.socketService.socket.emit('answerQuestion', { user: this.summonedUser, type, id_programa: program.id_programa, response: JSON.stringify(response) });
        }
      });
    }
  }

  getAnswers() {
    if (this.rol === 'Administrador') {
      this.accesoService.getRespuestasReunion(this.adminUser.id_reunion as number).subscribe(data => {
        if (!data.status) { return alertify.error(data.message); }
        this.answerList = this.answerList.concat(...data.message);

        let answerList: Respuesta[] = [];
        if (this.currentOption) {
          answerList = data.message.filter(answer => +answer.id_programa === +(this.currentOption as ASOption).id_programa);
        } else if (this.currentProgram) {
          answerList = data.message.filter(answer => +answer.id_programa === +(this.currentProgram as ASProgram).id_programa);
        }
        answerList.forEach(item => {
          const summoned = this.summonList.find(elm => elm.id_convocado_reunion === item.id_convocado_reunion);
          summoned && (summoned.response = JSON.parse(item.descripcion));
        });

        this.cdr.markForCheck();
      });
    }
  }

  logout(error: string | undefined = undefined) {
    this.meetUtilities.removeMeeting(this.identificador);
    this.router.navigateByUrl('/public/home');
    error && alertify.error(error);
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

  meetCancel() {
    if (this.rol === 'Administrador') {
      this.meetService.cancelarReunion({ id_reunion: this.adminUser.id_reunion }).subscribe(() => {
        alertify.success('Se ha cancelado la reunión exitosamente');
        if (this.socketService.socket instanceof Socket) {
          this.socketService.socket.emit('changeMeetStatus', { id_reunion: this.adminUser.id_reunion, status: '3' });
        }
      });
    }
  }

  meetEnd() {
    if (!this.meet.id_acta) { return this.finalizarReunion(); }
    this.accesoService.checkElection(this.adminUser.id_reunion as number).subscribe(data => {
      if (data.status === false) { return alertify.error(data.message); }
      this.checkElection = data.message;
      this.checkElectionFn();
    });
  }

  finalizarReunion() {
    this.accesoService.finalizarReunion(this.adminUser.id_reunion as number, 2).subscribe((data) => {
      if (data.ok === false) { return alertify.error(data.message); }
      alertify.success('Se ha finalizado la reunión exitosamente');
      if (this.socketService.socket instanceof Socket) {
        this.socketService.socket.emit('changeMeetStatus', { id_reunion: this.adminUser.id_reunion, status: '2' });
      }
    });
  }

  async checkElectionFn() {
    if (this.checkElection) {
      const electionList = Object.keys(this.checkElection);
      for (let index = 0; index < electionList.length; index++) {
        const element = this.checkElection[electionList[index]];
        if (element.elected.length > 1) {
          this.electItem = { element, key: +electionList[index] };
          index = electionList.length;
          this.cdr.markForCheck();
          return this.openModal('#elect-modal');
        }
      }

      if (electionList.length) {
        const responseElection = await firstValueFrom(this.accesoService.saveElection(this.checkElection));
        if (!responseElection.status) { return alertify.error('Ha ocurrido un error, comuníquese con un asesor.'); }
        if (electionList.some(key => +(this.checkElection as Record<string, Elected>)[key].elected[0].id_programa === 0)) {
          if (this.socketService.socket instanceof Socket) {
            this.socketService.socket.emit('updateRoom', this.adminUser.id_reunion);
            return;
          }
        }
      }

      this.finalizarReunion();
    }
  }

  async confirmElected() {
    if (this.selectedElectItem === undefined) { return alertify.error('Debe seleccionar una de las opciones'); }
    this.closeModal('#elect-modal');
    if (!this.electItem || !this.checkElection) { return alertify.error('Ha ocurrido un error'); }
    if (this.selectedElectItem === 0) {
      const updated = await firstValueFrom(this.accesoService.actualizarEstadoPrograma(this.selectedElectItem, '3'));
      if (!updated.ok) {
        this.openModal('#elect-modal');
        return alertify.error('Ha ocurrido un errror, coumíquese con un asesor (updateProgrammingStatus)');
      }
      delete this.checkElection[this.electItem.key];
      alertify.success('Pregunta cancelada correctamente');
    }
    if (this.selectedElectItem !== 0) {
      const selected = this.checkElection[this.electItem.key].elected.find(element => element.id_programa === this.selectedElectItem);
      selected && (this.checkElection[this.electItem.key].elected = [selected]);
      alertify.success('Convocado elegido correctamente');
    }
    this.selectedElectItem = undefined;
    this.electItem = undefined;
    this.cdr.markForCheck();
    setTimeout(() => this.checkElectionFn(), 501);
  }

  saveProgramming() {
    this.closeModal('#programming-modal');
    this.programToSave = undefined;
    this.orderTarget = undefined;
    if (this.socketService.socket instanceof Socket) {
      this.socketService.socket.emit('updateRoom', this.adminUser.id_reunion);
    }
  }

  saveSummoned() {
    if (this.socketService.socket instanceof Socket) {
      this.socketService.socket.emit('updateRoom', this.adminUser.id_reunion);
    }
  }

  programCancel() {
    const program = this.programmingList.find(item => item.id_programa === this.programToCancel);
    if (!program) { return alertify.error('Pregunta no encontrada'); }
    const promiseList = [firstValueFrom(this.accesoService.actualizarEstadoPrograma(program.id_programa, '4'))];
    program.opciones.forEach(option => promiseList.push(firstValueFrom(this.accesoService.actualizarEstadoPrograma(option.id_programa, '4'))));
    Promise.all(promiseList).then(data => {
      for (let index = 0; index < data.length; index++) {
        if (!data[index].ok) {
          index = data.length;
          return alertify.error(`${index}: ${data[index].response}`);
        }
      }
      alertify.success('Pregunta eliminada correctamente');
      if (this.socketService.socket instanceof Socket) {
        this.socketService.socket.emit('updateRoom', this.adminUser.id_reunion);
      }
    });
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }

  /**
   * Deja en el lugar que estaba del array al programa que se elimino
   */
  recuperarPrograma = () => {
    if (this.programaEliminado) {
      this.programaEliminado.form.insert(this.programaEliminado.index, this.programaEliminado.control);
      this.cdr.markForCheck();
    }
  }

  /**
   * Alerta de la correcta eliminación de una opción
   */
  opcionEliminada = () => {
    if (this.programaEliminado) {
      alertify.success('Opción eliminada correctamente.');
      this.cdr.markForCheck();
    }
  }

}
