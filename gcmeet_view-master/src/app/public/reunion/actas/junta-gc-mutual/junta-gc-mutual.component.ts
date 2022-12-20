import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { environment } from 'src/environments/environment';

import { SignaturePad } from 'angular2-signaturepad';
import { Socket } from 'socket.io-client';

import { AccesoReunionService, Convocado, ConvocadoLogueado, Respuesta } from 'src/app/services/acceso-reunion.service';
import { Meeting, MeetingType, MeetUtilitiesService } from 'src/app/services/templateServices/meet-utilities.service';
import { SocketServiceService } from 'src/app/services/socket.service';
import { MeetsService } from 'src/app/services/meets.service';

import { UncommentHtmlPipe } from 'src/app/pipes/uncomment-html.pipe';

import { ASProgram } from '../../meeting-room/meeting-room.component';
import { Reuniones } from 'src/app/interfaces/reuniones.interface';

declare const alertify: any;

@Component({
    templateUrl: './junta-gc-mutual.component.html',
    styleUrls: ['./junta-gc-mutual.component.scss'],
    selector: 'app-junta-gc-mutual',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [UncommentHtmlPipe]
})
export class JuntaGcMutualComponent implements OnInit, OnDestroy {

    /** Referencia componente de signaturepad Presidente */
    @ViewChild(SignaturePad) signaturePadPresidente!: SignaturePad;
    /** Referencia componente de signaturepad Secretario */
    @ViewChild(SignaturePad) signaturePadSecretario!: SignaturePad;

    public env = environment;

    /** Persona en sesión */
    public identificador!: string;

    private userInfo!: Partial<Meeting<MeetingType>>
    public get summonedUser(): Partial<Meeting<'Convocado' | 'Invitado'>> { return this.userInfo; }
    public get adminUser(): Partial<Meeting<'Administrador'>> { return this.userInfo; }

    /** Rol durante la reunión */
    public rol!: MeetingType;

    public meet: Reuniones = {
        fecha_actualizacion: '',
        fecha_finalizacion: '',
        id_tipo_reunion: 0,
        fecha_reunion: '',
        descripcion: '',
        id_reunion: 0,
        plantilla: '',
        id_grupo: 0,
        estado: '2',
        acta: null,
        quorum: '',
        titulo: '',
        grupo: '',
        hora: '',
        logo: '',
    };

    public announcementDate = new Date();
    public meetDate = new Date();
    public endDate = new Date();
    public consecutivoActa = 0;

    public summonedLoggedinList: ConvocadoLogueado[] = [];
    public invitedLoggedinList: ConvocadoLogueado[] = [];
    public summonedList: Convocado[] = [];

    public participation = 0;

    public programmingList: ASProgram[] = [];
    public answerList: Respuesta[] = [];

    public dayOrderMessage = 'el orden del día mediante votación en la plataforma por el ';
    public spanStart = '<span style="text-transform: capitalize;">';
    public spanEnd = '</span>';

    public pageHeight = 0;

    public Presidente: { is: boolean; sign: string | undefined; } = { sign: undefined, is: false };

    public Secretario: { is: boolean; sign: string | undefined; } = { sign: undefined, is: false };

    /** Objeto de configuración para el contenedor de la firma */
    public signaturePadOptions = {
        'canvasHeight': 200,
        'canvasWidth': 300,
        'minWidth': 5
    };

    constructor(
        private meetUtilities: MeetUtilitiesService,
        private socketService: SocketServiceService,
        private accesoService: AccesoReunionService,
        private uncommentHtml: UncommentHtmlPipe,
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
        this.logIn();
        this.getMeetInfo();
        this.getSummonedList();
        this.getSummonedLoggedinList();
        this.setStyles();
        this.getProgramming();
        this.getAnswers();
        this.getSignList();

        if (this.socketService.socket instanceof Socket) {
            this.socketService.socket.on('addSign-acta-emit', (data: { path: string; rol: string; }) => {
                switch (data.rol) {
                    case 'Presidente': this.Presidente.sign = data.path; break;
                    case 'Secretario': this.Secretario.sign = data.path; break;
                }
                this.rol === 'Administrador' && alertify.message(`El ${data.rol} ha firmado`);
                this.cdr.markForCheck();
            });

            this.socketService.socket.on('remove-acta-emit', () => {
                this.meetUtilities.removeMeeting(this.identificador);
                this.router.navigateByUrl(`/public/reunion/salir-sala/${this.meet.estado}`);
                return alertify.message(`La reunión se encuentra ${+this.meet.estado === 2 ? 'finalizada' : 'cancelada'}`);
            });
        }
    }

    private setRol() {
        if (!this.userInfo.id_reunion) { return this.logout('Sus credenciales han expirado'); };
        if (this.userInfo.id_usuario) {
            this.rol = 'Administrador';
        } else if (this.userInfo.identificacion && this.userInfo.id_convocado_reunion && this.userInfo.convocatoria?.length) {
            this.rol = this.userInfo.tipo_usuario || 'Invitado';
        } else { return this.logout('Sus credenciales han expirado'); }
        this.cdr.markForCheck();
    }

    private logIn() {
        const data: Partial<Record<'id_usuario' | 'id_reunion' | 'id_convocado_reunion', any>> = { id_reunion: this.adminUser.id_reunion };
        this.rol === 'Administrador' && (data.id_usuario = this.adminUser.id_usuario);
        this.rol !== 'Administrador' && (data.id_convocado_reunion = this.adminUser.id_convocado_reunion);
        if (this.socketService.socket instanceof Socket) {
            this.socketService.socket.emit('login-acta', data);
        }
    }

    private getMeetInfo() {
        this.meetService.getReunion(this.adminUser.id_reunion as number).subscribe({
            next: (data: Reuniones[]) => {
                this.meet = data[0];

                if ([0, 1, 3].includes(+this.meet.estado)) {
                    switch (+this.meet.estado) {
                        case 0: this.router.navigateByUrl(this.rol === 'Administrador' ? '/private/meets' : `/public/reunion/sala-espera/${this.meet.estado}`); break;
                        case 1: this.router.navigateByUrl(`/public/reunion/meeting-room/${this.meet.estado}`); break;
                        case 3:
                            this.meetUtilities.removeMeeting(this.identificador);
                            this.router.navigateByUrl(`/public/reunion/salir-sala/${this.meet.estado}`);
                            break;
                    }
                    return alertify.message(`La reunión se encuentra ${+this.meet.estado === 2 ? 'finalizada' : 'cancelada'}`);
                }

                if (this.meet.acta) {
                    this.meetUtilities.removeMeeting(this.identificador);
                    this.router.navigateByUrl(`/public/reunion/salir-sala/${this.meet.estado}`);
                    return alertify.message('Ya se ha generado el acta de esta reunión');
                }

                const fecha = this.meet.fecha_reunion.split('-');
                const hora = this.meet.hora.split(':');
                this.meetDate = new Date(+fecha[0], +fecha[1] - 1, +fecha[2], +hora[0], +hora[1], +hora[2]);

                if (this.meet.fecha_finalizacion) {
                    const endDateTime = this.meet.fecha_finalizacion.split(' ');
                    const endDate = endDateTime[0].split('-');
                    const endTime = endDateTime[1].split(':');
                    this.endDate = new Date(+endDate[0], +endDate[1] - 1, +endDate[2], +endTime[0], +endTime[1], +endTime[2]);
                }

                this.accesoService.getNumeroActa(this.meet.id_tipo_reunion as number).subscribe(response => {
                    if (!response.status) { return alertify.error(response.message); }
                    this.consecutivoActa = response.message;
                    this.cdr.markForCheck();
                });
            }
        });
        this.accesoService.getAnnouncementDate(this.adminUser.id_reunion as number).subscribe((data) => {
            if (!data.status) { return alertify.error(data.message); }
            this.announcementDate = new Date(data.message);
            this.cdr.markForCheck();
        });
    }

    private getSummonedList() {
        this.accesoService.getListaConvocados(this.userInfo?.id_reunion as number).subscribe(data => {
            if (!data.ok) { return alertify.error('Ha ocurrido un error, por favor comuníquese con un asesor {Convocados}'); }
            this.summonedList = data.response.map(item => ({ ...item, nombre: item.nombre.toLowerCase() }));
            this.cdr.markForCheck();
        });
    }

    private getSummonedLoggedinList() {
        this.accesoService.getSummonedLoggedinList(this.adminUser.id_reunion as number).subscribe(data => {
            if (!data.status) { return alertify.error(data.message); }
            data.message.forEach(item => this[+item.tipo === 1 ? 'invitedLoggedinList' : 'summonedLoggedinList'].push(item));
            this.participation = this.summonedLoggedinList.reduce((result, item) => result + (item.participacion ? +item.participacion : 0), 0);
            this.cdr.markForCheck();
        });
    }

    /** Genera el elemento de estilos con las reglas */
    private setStyles() {
        const styleTag: HTMLStyleElement = document.createElement('style');
        styleTag.id = 'asamblea-general-ordinaria-accionistas-style-tag';
        styleTag.setAttribute('type', 'text/css');

        const [height, width] = [1054.4881889764, 816.37795275591];
        styleTag.appendChild(document.createTextNode(`
            * {
                font-family: Montserrat;
            }
            .page-break {
                background-color: #ffffff;
            }
            img {
                display: inline-block;
            }
            p {
                font-size: 1rem;
                color: #545454;
            }
            h5 {
                font-size: 1.25rem;
                line-height: 1.2;
            }
            h4 {
                font-size: 1.5rem;
                line-height: 1.2;
            }
            h2 {
                line-height: 1.2;
                font-size: 2rem;
            }
            h6 {
                font-size: 1rem;
                line-height: 1.2;
            }
            .row-pdf {
                width: 100%;
                margin: 0;
            }
            .col-pdf-3 {
                padding-right: 0 !important;
                padding-left: 0 !important;
                float: left;
                width: 25%;
            }
            .col-pdf-4 {
                padding-right: 0 !important;
                padding-left: 0 !important;
                width: 33.33%;
                float: left;
            }
            .col-pdf-5 {
                padding-right: 0 !important;
                padding-left: 0 !important;
                width: 41.6%;
                float: left;
            }
            .col-pdf-6 {
                padding-right: 0 !important;
                padding-left: 0 !important;
                float: left;
                width: 50%;
            }
            .col-pdf-7 {
                padding-right: 0 !important;
                padding-left: 0 !important;
                width: 58.3%;
                float: left;
            }
            .col-pdf-8 {
                padding-right: 0 !important;
                padding-left: 0 !important;
                width: 66.66%;
                float: left;
            }
            .col-pdf-9 {
                padding-right: 0 !important;
                padding-left: 0 !important;
                float: left;
                width: 75%;
            }
            .col-pdf-12 {
                padding-right: 0 !important;
                padding-left: 0 !important;
                float: left;
                width: 100%;
            }
            .col-pdf-2-10 {
                padding-right: 0 !important;
                padding-left: 0 !important;
                float: left;
                width: 20%;
            }
            .row-end {
                display: table;
                clear: both;
            }
            table {
                width: 100%;
            }
            table thead tr th {
                background: #171717;
                padding: 0.625rem;
                border-radius: 0;
                font-size: 1rem;
                color: #ffffff;
                border: none;
            }
            table tbody tr:nth-child(odd) {
                background: #ffffff;
            }
            table tbody tr:nth-child(even) {
                background: #f4f4f4;
            }
            table tbody tr td {
                padding: 0.625rem;
                border-radius: 0;
                font-size: 1rem;
                color: #545454;
                border: none;
            }
            ul {
                list-style-type: decimal;
                display: inline-block;
                padding-left: 2rem;
            }
            ul li {
                list-style-type: decimal;
                padding-bottom: 0.5rem;
                margin-bottom: 0.5rem;
                font-weight: bold;
                font-size: 1rem;
                color: #545454;
            }
            #page-1 {
                background-position: center bottom;
                background-repeat: no-repeat;
                background-image-resize: 4;
            }
        `));

        const styleTag2: HTMLStyleElement = document.createElement('style');
        styleTag2.id = 'asamblea-general-ordinaria-accionistas-private-style-tag';
        styleTag2.setAttribute('type', 'text/css');

        styleTag2.appendChild(document.createTextNode(`
            .page-break, .pdf-page {
                min-height: ${height}px;
                width: ${width}px;
            }
        `));

        document.head.appendChild(styleTag);
        document.head.appendChild(styleTag2);
    }

    private logout(error: string | undefined = undefined) {
        this.meetUtilities.removeMeeting(this.identificador);
        this.router.navigateByUrl('/public/home');
        error && alertify.error(error);
    }

    public download(action: 'save' | 'download') {
        const style = document.querySelector('#asamblea-general-ordinaria-accionistas-style-tag') as HTMLElement;
        const data1 = document.querySelector('#page-1') as HTMLElement;
        const data2 = document.querySelector('#body-page') as HTMLElement;

        const newContainer: HTMLElement = document.createElement("div");
        newContainer.innerHTML = this.uncommentHtml.transform(data1.outerHTML);

        const newContainer2: HTMLElement = document.createElement("div");
        newContainer2.innerHTML = this.uncommentHtml.transform(data2.innerHTML);
        newContainer2.querySelectorAll('.signature-pad-container').forEach(item => item.remove());

        this.accesoService.downloadActa({ style: style.outerHTML, headerContent: newContainer.innerHTML, pageContent: newContainer2.innerHTML, action, id_reunion: this.adminUser.id_reunion as number }).subscribe((file: Blob) => {
            switch (action) {
                case 'download':
                    // currentDate: Fecha y hora actuales
                    const currentDate = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toJSON().slice(0, 19).replace(/[-:]/g, '').replace(/[T]/g, '_');
                    // link: Elemento HTML para la descarga
                    const link: HTMLAnchorElement = document.createElement('a');
                    // ↓ Agrega la url del archivo al link
                    link.href = window.URL.createObjectURL(file);
                    // ↓ Asigna el nombre del archivo
                    link.download = `${currentDate}-acta-asamblea-general-ordinaria-accionistas.pdf`;
                    // ↓ Ejecuta la descarga
                    document.body.appendChild(link); link.click(); link.remove();
                    break;
                case 'save':
                    if (this.socketService.socket instanceof Socket) {
                        this.socketService.socket.emit('remove-acta', this.adminUser);
                    }
                    break;
            }
        });
        newContainer.remove();
    }

    public getProgramming = () => {
        this.accesoService.getProgramacionReunion(this.userInfo?.id_reunion as number, this.summonedUser.id_convocado_reunion).subscribe({
            next: (data) => {
                if (!data.ok) { return alertify.error('Ha ocurrido un error, por favor comuníquese con un asesor {Orden del día}'); }
                this.programmingList = data.response.map(item => ({
                    ...item, opciones: item.opciones.sort((a, b) => +a.orden - +b.orden),
                })).sort((a, b) => +a.orden - +b.orden);

                if (this.rol === 'Convocado') {
                    const elections = this.programmingList.filter(program => +program.tipo === 5 && ['Presidente', 'Secretario'].includes(program.rol_acta_descripcion as string));
                    const Presidente = elections.find(program => program.rol_acta_descripcion === 'Presidente');
                    const Secretario = elections.find(program => program.rol_acta_descripcion === 'Secretario');
                    Presidente && this.summonedUser.convocatoria?.includes(Presidente.id_convocado_reunion as number) && (this.Presidente.is = true);
                    Secretario && this.summonedUser.convocatoria?.includes(Secretario.id_convocado_reunion as number) && (this.Secretario.is = true);
                }
                this.cdr.markForCheck();
            }
        });
    };

    private getAnswers = () => {
        this.accesoService.getRespuestasReunion(this.adminUser.id_reunion as number).subscribe(data => {
            if (!data.status) { return alertify.error(data.message); }
            this.answerList = this.answerList.concat(...data.message);
            this.cdr.markForCheck();
        });
    }

    private getSignList() {
        this.accesoService.getSignList(this.adminUser.id_reunion as number)
            .subscribe(data => {
                if (!data.status) { return alertify.error(data.message); }
                data.message.forEach(sign => {
                    switch (sign.rol) {
                        case 'Presidente': this.Presidente.sign = sign.path; break;
                        case 'Secretario': this.Secretario.sign = sign.path; break;
                    }
                });
                this.cdr.markForCheck();
            });
    }

    public limpiarPresidente = () => this.signaturePadPresidente.clear();

    public limpiarSecretario = () => this.signaturePadSecretario.clear();

    /** Función encargada de capturar base64 de la imagen generada al firmar */
    public drawCompletePresidente() {
        if (this.signaturePadPresidente.isEmpty()) { return alertify.error('Debe añadir una firma'); }
        if (this.socketService.socket instanceof Socket) {
            this.socketService.socket.emit('addSign-acta', { id_reunion: this.summonedUser.id_reunion, sign: this.signaturePadPresidente.toDataURL(), rol: 'Presidente' });

        }
    }

    public drawCompleteSecretario() {
        if (this.signaturePadSecretario.isEmpty()) { return alertify.error('Debe añadir una firma'); }
        if (this.socketService.socket instanceof Socket) {
            this.socketService.socket.emit('addSign-acta', { id_reunion: this.summonedUser.id_reunion, sign: this.signaturePadSecretario.toDataURL(), rol: 'Secretario' });

        }
    }

    ngOnDestroy(): void {
        document.querySelectorAll('#asamblea-general-ordinaria-accionistas-style-tag, #asamblea-general-ordinaria-accionistas-private-style-tag').forEach(item => item.remove());
        this.socketService.disconnect();
    }

}
