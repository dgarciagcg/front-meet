import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';

import { Acta, MeetManagementService } from 'src/app/services/meet-management.service';
import { RedirectingService } from 'src/app/templates/redirecting/redirecting.service';
import { AccesoReunionService } from 'src/app/services/acceso-reunion.service';

import { UncommentHtmlPipe } from 'src/app/pipes/uncomment-html.pipe';
import { GetFormArrayPipe } from 'src/app/pipes/get-form-array.pipe';

import { ConvocadoAdicional, Programas, Reuniones, RolesActas } from 'src/app/interfaces/reuniones.interface';
import { TipoReunion } from 'src/app/interfaces/tipos-reuniones.interface';
import { Recursos } from 'src/app/interfaces/recursos.interface';
import { Grupos } from 'src/app/interfaces/grupos.interface';
import { Roles } from 'src/app/interfaces/roles.interface';
import { firstValueFrom } from 'rxjs';

// Alertify
declare let alertify: any;
declare let bootstrap: any;

interface ProgramasForm extends Omit<Programas, 'opciones' | 'archivos'> {
    opciones: {
        listadoOpciones: Programas['opciones'];
        opcion_descripcion: string;
    }
    archivos: {
        listadoArchivos: Programas['archivos'];
        text_input: string;
    }
}

type Nullable<T> = { [P in keyof T]?: T[P] | null; }

@Component({
    selector: 'app-meet-management',
    templateUrl: './meet-management.component.html',
    styleUrls: ['./meet-management.component.scss'],
    providers: [DatePipe, GetFormArrayPipe, UncommentHtmlPipe]
})
export class MeetManagementComponent implements OnInit {

    informacionReunion!: { formData: FormData, id_reunion: number };

    eliminado!: { index: number, convocado: ConvocadoAdicional, zona: 'arrayConvocadosA' | 'arrayConvocadosI' };
    programaEliminado!: { form: FormArray; control: FormGroup; index: number; };
    recursoActaToRemove!: number;

    formularioAgregarProgramas = new FormGroup({});
    formularioAgregarAsistente = new FormGroup({});
    formularioReunion = new FormGroup({});

    // Actas
    rolesActas: RolesActas[] = [];
    actas: Acta[] = [];

    // Grupos
    id_grupo: number | undefined;
    grupo!: Grupos;

    // Reunion
    id_reunion: number | undefined;
    reunion?: Reuniones;

    validaExistenciaFirmaProgramacion = false;
    validaVacioFirmaProgramacion = false;

    // Tipos Reunión
    tiposReuniones: TipoReunion[] = [];
    tiposReunionesFilter: TipoReunion[] = [];
    searchFilter: string = '';
    id_tipo_reunion?: number;

    // Recursos
    dataCompleta: Recursos[] = [];
    entidadesUnicas: Recursos[] = [];
    recursos: Recursos[] = [];
    entidades: Recursos[] = [];
    recursosGc_MeetYGcm: Recursos[] = [];
    recursos_gcm: Recursos[] = [];

    // Convocados
    convocadosMeet: ConvocadoAdicional[] = [];
    arrayConvocadosA: ConvocadoAdicional[] = [];
    arrayConvocadosI: ConvocadoAdicional[] = [];
    arrayCompleto: ConvocadoAdicional[] = [];
    array_id_convocados: number[] = [];

    // Roles
    arrayRoles: Roles[] = [];

    get archivos(): FormArray { return this.formularioAgregarProgramas.get('formulario')?.get('archivos')?.get('listadoArchivos') as FormArray; };

    /** Consulta todos los programas */
    get programas(): ProgramasForm[] { return this.formularioAgregarProgramas.get('programas')?.value; }

    constructor(
        private meetManagementService: MeetManagementService,
        private accesoService: AccesoReunionService,
        private uncommentHtml: UncommentHtmlPipe,
        private activatedRoute: ActivatedRoute,
        public redirecting: RedirectingService,
        public getFormArray: GetFormArrayPipe,
        public domSanitizer: DomSanitizer,
        private datePipe: DatePipe,
        private fb: FormBuilder,
    ) { }

    ngOnInit(): void {
        this.initFormReunion();
        this.initFormAgregarPrograma();
        this.initFormAgregarConvocado();
        switch (this.activatedRoute.snapshot.params['action']) {
            case 'registrar':
                this.id_grupo = +this.activatedRoute.snapshot.params['id'];
                this.id_reunion = undefined;
                this.getReunionRegistrar();
                break;
            case 'modificar':
                this.id_reunion = +this.activatedRoute.snapshot.params['id'];
                this.getReunionModificar();
                break;
        }
    }

    /** Inicializa el formulario de reunión con sus valores por defecto y validaciones */
    initFormReunion = () => {
        this.formularioReunion = this.fb.group({
            titulo: [{ disabled: false, value: '' }, [Validators.required]],
            descripcion: ['', [Validators.maxLength(5000)]],
            fecha_reunion: ['', [Validators.required]],
            hora: ['', [Validators.required]],
            id_reunion: [this.id_reunion],
            checkProgramacionFirmada: [],
            id_grupo: [this.id_grupo],
            id_tipo_reunion: [''],
            programacion: [],
            id_acta: ['0'],
            estado: ['0'],
            quorum: [],
        });
        this.formularioReunion.get('id_acta')?.valueChanges.subscribe(this.getRolesActas);
    }

    getRolesActas = (id_acta: string): any => {
        if (+id_acta === 0) { return this.rolesActas = []; }
        this.meetManagementService.getRolesActas(id_acta).subscribe((data: RolesActas[]) => {
            this.rolesActas = data;
        });
    }

    /** Inicializa el formulario */
    initFormAgregarPrograma = () => {
        this.formularioAgregarProgramas = this.fb.group({
            formulario: this.crearFormularioPrograma(),
            programas: this.fb.array([])
        });
        this.updateInputFile(this.archivos);
    }

    /** Da el formato de la estructura del formulario con las validaciones y valores por defecto */
    crearFormularioPrograma = (): FormGroup => {
        // this.id_reunion = this.activatedRoute.snapshot.params.id;
        return this.fb.group({
            titulo: ['', [Validators.required, Validators.maxLength(500)]],
            descripcion: ['', [Validators.maxLength(5000)]],
            tipo: ['1', [Validators.required]],
            id_programa: [null],
            estado: ['0'],
            opciones: this.fb.group({
                listadoOpciones: this.fb.array([]),
                opcion_descripcion: ['']
            }),
            archivos: this.fb.group({
                listadoArchivos: this.fb.array([]),
                text_input: ['']
            }),
            rolesActas: this.fb.group({
                descripcion: ['', [Validators.maxLength(100)]],
                firma: [false],
                acta: [false],
            }),
        })
    }

    /** Actualiza el titulo puesto cuando se seleccionan archivos para un programa */
    updateInputFile = (archivos: AbstractControl) => archivos.valueChanges.subscribe(() => this.updateInputLength(this.archivos.length, 'text_input', 'archivos'));

    /** Actualiza el titulo puesto cuando se seleccionan archivos para un programa */
    updateInputLength(length: number, name: string, groupName?: string) {
        const input = document.querySelector((groupName !== undefined ? `[formgroupname="${groupName}"] > ` : '') + `[formcontrolname="${name}"]`) as HTMLInputElement;
        const label = input.parentElement as HTMLElement;
        const fileName: string | undefined = length > 0 ? `${length} archivos seleccionados` : '';
        if (![undefined, null, ''].includes(fileName)) {
            label.setAttribute('file-message', fileName as string);
        } else if (label.hasAttribute('file-message')) {
            label.removeAttribute('file-message');
        }
    }

    /** Inicializa el formulario para agregar un asistente a la reunión, se inicia con valores por defecto y validaciones */
    initFormAgregarConvocado = () => {
        this.formularioAgregarAsistente = this.fb.group({
            identificacion: ['', [Validators.required, Validators.maxLength(20)]],
            nombre: ['', [Validators.required, Validators.maxLength(100)]],
            correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
            telefono: ['', [Validators.maxLength(20)]],
            tipo: ['0'],
            rol: ['', [Validators.required, Validators.maxLength(50)]],
            nit: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(20)]],
            razon_social: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(100)]],
            participacion: [{ value: '', disabled: true }, [Validators.required]],
            firma: ['0'],
            acta: ['0'],
        });
        this.formularioAgregarAsistente.get('tipo')?.valueChanges.subscribe(this.toggle);
    }

    toggle = (type: string) => {
        // habilitar/deshabilitar inputs de "nit" y "razón social"
        document.querySelectorAll('.entity-input').forEach(item => {
            const name = item.getAttribute('formcontrolname') as string;
            if (+type === 2) {
                this.formularioAgregarAsistente.get(name)?.enable();
                item.setAttribute('type', 'text');
            } else {
                this.formularioAgregarAsistente.get(name)?.disable();
                item.setAttribute('type', +type === 2 ? 'text' : 'hidden');
            }
        });

        // habilitar/deshabilitar input de "participación"
        const require: boolean = (document.querySelector('[formcontrolname="quorum"]') as HTMLInputElement).checked;
        const participationInput = document.querySelector('[formcontrolname="participacion"]') as HTMLInputElement;
        if (require === true && +type !== 1) {
            this.formularioAgregarAsistente.get('participacion')?.enable();
            participationInput.setAttribute('type', 'text');
        } else {
            this.formularioAgregarAsistente.get('participacion')?.disable();
            participationInput.setAttribute('type', 'hidden');
        }
    }

    getReunionRegistrar() {
        if (this.id_grupo) {
            /** Consulta los roles con una relacion que tiene en comun un grupo */
            this.meetManagementService.getRolesRegistrar(this.id_grupo).subscribe(roles => this.arrayRoles = roles);

            // Reunion
            this.getReunion();
        }
    }

    getReunionModificar() {
        if (this.id_reunion) {
            // Reunion
            const reunionPromise = firstValueFrom(this.meetManagementService.getReunion(this.id_reunion));
            const convocadosPromise = firstValueFrom(this.meetManagementService.getConvocadosMeet(this.id_reunion));

            Promise.all([reunionPromise, convocadosPromise]).then(([reunion, convocados]) => {
                // Reunion
                this.reunion = reunion[0];

                if (this.reunion.programacion !== '') {
                    this.validaExistenciaFirmaProgramacion = true;
                }
                if (this.reunion.programacion === '') {
                    this.validaVacioFirmaProgramacion = true;
                }

                this.setValueReunion(this.reunion);
                this.formularioReunion.get('titulo')?.disable();

                // Convocados
                this.setConvocadosMeet(convocados);

                // Reunion
                this.getReunion();
            });

            // Programas
            this.meetManagementService.getProgramas(this.id_reunion).subscribe(this.setProgramas)

            // Roles
            this.meetManagementService.getRoles(this.id_reunion).subscribe(roles => this.arrayRoles = roles);
        }
    }

    setConvocadosMeet = (convocados: ConvocadoAdicional[]) => {
        /** Consulta los convocados de una reunión en especifico */
        this.convocadosMeet = convocados;
        for (let i = 0; i < this.convocadosMeet.length; i++) {
            if (this.convocadosMeet[i].tipo === '0' || this.convocadosMeet[i].tipo === '2') {
                this.arrayConvocadosA.push(this.convocadosMeet[i]);
            } else {
                this.arrayConvocadosI.push(this.convocadosMeet[i]);
            }
        }
    }

    getReunion() {
        const grupoPromise = firstValueFrom(this.meetManagementService.getGrupo(this.id_grupo || this.reunion?.id_grupo as number));
        const tipoReunionPromise = firstValueFrom(this.meetManagementService.getTiposReuniones(this.id_grupo || this.reunion?.id_grupo as number));

        Promise.all([grupoPromise, tipoReunionPromise]).then(([grupo, tipoReunion]) => {
            // Grupo
            this.grupo = grupo[0];

            // Tipo reunión
            this.tiposReuniones = tipoReunion;
            this.tiposReunionesFilter = this.tiposReuniones;
            this.asignar(this.reunion ? this.reunion.id_tipo_reunion : undefined, true);
        });

        const recursosPromise = firstValueFrom(this.meetManagementService.getRecursos(this.id_grupo || this.reunion?.id_grupo));
        const recursosGCMPromise = firstValueFrom(this.meetManagementService.getRecursosGcm());

        Promise.all([recursosPromise, recursosGCMPromise]).then(([recursos, recursos_gcm]) => {
            // Recursos
            this.dataCompleta = recursos;
            this.dataCompleta.sort(function (a, b) {
                if (a.nombre < b.nombre) { return -1; }
                if (a.nombre > b.nombre) { return 1; }
                return 0;
            });

            // this.recursosParaVerificar = this.dataCompleta;
            // this.recursos = this.dataCompleta;

            this.entidadesUnicas = this.dataCompleta.filter(elm => elm.nit !== null).sort((a, b) => {
                if (!a.fecha || !b.fecha) { return 1; }
                let fechaA = new Date(+a.fecha.slice(0, 4), +a.fecha.slice(5, 7) - 1, +a.fecha.slice(8, 10), +a.fecha.slice(11, 13), +a.fecha.slice(14, 16), +a.fecha.slice(17, 19)).getTime();
                let fechaB = new Date(+b.fecha.slice(0, 4), +b.fecha.slice(5, 7) - 1, +b.fecha.slice(8, 10), +b.fecha.slice(11, 13), +b.fecha.slice(14, 16), +b.fecha.slice(17, 19)).getTime();
                return fechaA >= fechaB ? -1 : 1;
            });

            this.entidadesUnicas = Array.from(new Set(this.entidadesUnicas.map(item => `${item.nit}`))).map(item => this.entidadesUnicas.find(elm => `${elm.nit}` === item)) as Recursos[];
            this.arrayCompleto = [...this.arrayConvocadosA, ...this.arrayConvocadosI];

            this.dataCompleta.forEach(item => {
                if (!this.arrayCompleto.find(elm => elm.identificacion === item.identificacion)) {
                    this.recursos.push(item);
                }
            });

            this.entidadesUnicas.forEach(item => {
                if (!this.arrayCompleto.find(elm => elm.identificacion === item.identificacion)) {
                    this.entidades.push(item);
                }
            });

            // Recursos GCM
            this.recursos_gcm = recursos_gcm;
            this.recursosGc_MeetYGcm = [...this.recursos, ...this.recursos_gcm];
        });

        this.meetManagementService.getActas().subscribe(actas => {
            if (!actas.status) { alertify.error(actas.message); }
            this.actas = actas.message;
        });
    }

    /** Al ser ejecutada recorre el formulario de reuniones y le ingresa los valores que le llegan en el objeto reunión
     * @param reunion Aqui viene el valor de cada parametro de la reunion
     * @returns Entrega el formulario diligenciado con la información que se obtuvo
     */
    setValueReunion = (reunion: Reuniones) => (Object.keys(reunion) as (keyof Reuniones)[]).forEach(elm => {
        // Cuando el elm es quorum y su valor es 1 actualiza el valor del campo a true sino lo pone en false
        switch (elm) {
            case 'quorum': this.formularioReunion.get(elm)?.setValue(reunion[elm] === '1' ? true : false); break;
            case 'id_acta': this.formularioReunion.get(elm)?.setValue(reunion[elm] || 0); break;
            case 'programacion':
                this.formularioReunion.get('checkProgramacionFirmada')?.setValue(reunion['programacion'] === '' || reunion['programacion'] !== null ? true : false);
                this.formularioReunion.get(elm)?.setValue(reunion[elm]);
                break;
            default: this.formularioReunion.get(elm)?.setValue(reunion[elm]); break;
        }
    });

    /** Cuando estoy creando una reunion nueva debo seleccionar un tipo del cual obtengo el id_tipo_reunion el cual voy almacenar junto con los demas datos de la reunión
     * @param id_tipo_reunion Aqui va el id_tipo_reunion seleccionado
     */
    asignar = (id_tipo_reunion: number | undefined, first = false) => {
        this.id_tipo_reunion = id_tipo_reunion;
        const tipo_reunion = this.tiposReuniones.filter(elm => elm.id_tipo_reunion === this.id_tipo_reunion);
        this.cargarSoloTipo(tipo_reunion, first, this.searchFilter);
    }

    /** CREANDO Se crea una nueva reunion unicamente con el campo titulo diligenciado de la ultima reunion de este tipo, los demas siguen vaios */
    cargarSoloTipo = (tipo_reunion: TipoReunion[], first = false, searchFilter: any) => {
        !first && alertify.success('Tipo cargado correctamente.');
        if (tipo_reunion?.length > 0) {
            this.formularioReunion.get('id_tipo_reunion')?.setValue(tipo_reunion[0].id_tipo_reunion);
            this.formularioReunion.get('titulo')?.setValue(tipo_reunion[0].titulo);
            this.formularioReunion.get('id_grupo')?.setValue(tipo_reunion[0].id_grupo);
            this.searchFilter = '';
        } else {
            this.formularioReunion.get('id_tipo_reunion')?.setValue('');
            this.formularioReunion.get('titulo')?.setValue(searchFilter);
            if (this.grupo && this.grupo.id_grupo) {
                this.formularioReunion.get('id_grupo')?.setValue(this.grupo?.id_grupo);
            }
            this.searchFilter = '';
        }
    }

    /** Toma los programas consultados y los muestra en la vista
     * @param programas Aqui llegan los programas consultados
     */
    setProgramas = (programas: Programas[]) => {
        this.formularioAgregarProgramas.removeControl('programas');
        this.formularioAgregarProgramas.addControl('programas', this.fb.array(
            programas.map(programa => this.fb.group({
                titulo: [programa.titulo, [Validators.required, Validators.maxLength(500)]],
                descripcion: [programa.descripcion, [Validators.maxLength(5000)]],
                tipo: [programa.tipo, [Validators.required]],
                id_programa: [programa.id_programa], // Para poder modificarlo
                estado: [programa.estado],
                opciones: this.fb.group({
                    opcion_descripcion: [''],
                    listadoOpciones: this.fb.array(programa.opciones ? programa.opciones.map(opcion => this.fb.group({
                        titulo: [opcion.titulo, [Validators.maxLength(500)]],
                        descripcion: [opcion.descripcion, [Validators.maxLength(5000)]],
                        id_programa: [opcion.id_programa], // Para poder modificarlo
                        estado: [opcion.estado],
                        archivos: this.fb.group({
                            text_input: [''],
                            listadoArchivos: this.fb.array(opcion.archivos ? opcion.archivos.map(archivoOpcion => this.fb.group({
                                file: { size: archivoOpcion.peso, name: archivoOpcion.descripcion },
                                id_archivo_programacion: [archivoOpcion.id_archivo_programacion],
                                id_programa: [archivoOpcion.id_programa],
                                url: archivoOpcion.url
                            })) : [])
                        }),
                    })) : [])
                }),
                archivos: this.fb.group({
                    text_input: [''],
                    listadoArchivos: this.fb.array(programa.archivos ? programa.archivos.map(archivoPrograma => this.fb.group({
                        file: { size: archivoPrograma.peso, name: archivoPrograma.descripcion },
                        id_archivo_programacion: [archivoPrograma.id_archivo_programacion],
                        id_programa: [archivoPrograma.id_programa],
                        url: archivoPrograma.url
                    })) : [])
                }),
                rolesActas: this.fb.group({
                    descripcion: [programa.rol_acta_descripcion, [Validators.maxLength(100)]],
                    firma: [+(programa.rol_acta_firma as string) === 1 ? true : false],
                    acta: [+(programa.rol_acta_acta as string) === 1 ? true : false],
                }),
            }))
        ));
    }

    /** Al ser ejecutada recorre el array de tipos de reunion y iguala los tipos del filter con el resultado del filtro realizado
     * @param reunion Aqui viene cada caracter escrito en el input
     * @returns Entrega un array de tipos de reuniones actualizado con los resultados obtenidos
     */
    filtroTipoReuniones = (filter: any) => {
        this.searchFilter = filter;
        const creditos = this.tiposReuniones;
        this.tiposReunionesFilter = creditos.filter((val) => val.titulo.toLowerCase().indexOf(filter.toLowerCase()) > -1);
    }

    /** Toma la fecha selecionada y le da el formato necesario para enviarlo a base de datos
     * @param event Aqui viene la fecha seleccionada
     */
    cambiarFecha = (event: any) => {
        const fecha = this.datePipe.transform(event, 'yyyy-MM-dd');
        this.formularioReunion.get('fecha_reunion')?.setValue(fecha);
    }

    toggleParticipation(require: boolean) {
        // habilitar/deshabilitar input de "participación"
        const participationInput = document.querySelector('[formcontrolname="participacion"]') as HTMLInputElement;
        const type: string = (document.querySelector('[formcontrolname="tipo"]') as HTMLInputElement).value;
        if (require === true && +type !== 1) {
            this.formularioAgregarAsistente.get('participacion')?.enable();
            participationInput.setAttribute('type', 'text');
        } else {
            this.formularioAgregarAsistente.get('participacion')?.disable();
            participationInput.setAttribute('type', 'hidden');
        }
    }

    /** Detecta el archivo seleccionado en la firma de la programacion */
    onFileChange(event: Event) {
        let files = (event.target as HTMLInputElement).files;
        if (files!.length > 0) {
            const file = files![0];
            this.formularioReunion.get('programacion')?.setValue(file);
        }
    }

    /** Descargar documento PDF de la programacion de una reunion */
    downloadPDFProgramming = () => {
        let html = document.querySelector('#programming-preview') as HTMLElement;
        let data = this.uncommentHtml.transform(html.outerHTML);
        const styles = `.primary-list {
          list-style-type: none;
          padding-left: 0;
          margin: 0;
        }
        .primary-list li {
          padding-bottom: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #171717;
        }
        .primary-list li .primary-list {
          border-top: 0.0625rem solid #cbcbcb;
          list-style-type: U+2014;
          padding-bottom: 0;
          margin-top: 1rem;
        }
        .primary-list li .primary-list li {
          border-bottom: 0.0625rem solid #cbcbcb;
          padding-left: 1.5rem;
          padding-top: 1rem;
        }`;

        this.meetManagementService.descargarPDFProgramacion({ data, styles }).subscribe((file: Blob) => {
            // currentDate: Fecha y hora actuales
            const currentDate = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toJSON().slice(0, 19).replace(/[-:]/g, '').replace(/[T]/g, '_');
            // link: Elemento HTML para la descarga
            const link: HTMLAnchorElement = document.createElement('a');
            // ↓ Agrega la url del archivo al link
            link.href = window.URL.createObjectURL(file);
            // ↓ Asigna el nombre del archivo
            link.download = `${currentDate}${'programacion'}.pdf`;
            // ↓ Ejecuta la descarga
            document.body.appendChild(link);
            link.click(); link.remove();
            // ↓ Comparte la promesa
            alertify.success('Se ha descargado la programación exitosamente');
        });
    }

    /** En esta función se validan los campos de la reunión */
    validateFields = () => {
        if (this.formularioReunion.get('titulo')?.value === '') {
            return alertify.error('El campo del tipo es obligatorio');
        }

        const valor_formulario_reunion = { ...this.formularioReunion.value, titulo: this.formularioReunion.get('titulo')?.value };

        const hoy = new Date();
        const fecha_hoy = this.datePipe.transform(hoy, 'yyyy-MM-dd');
        const fecha_reunion = valor_formulario_reunion.fecha_reunion;

        if (fecha_reunion < fecha_hoy!) {
            return alertify.error(`Estas ingresando una fecha inferior al dia actual`);
        }

        if (!this.formularioReunion.valid) {
            const controles = Object.keys(this.formularioReunion.controls);
            for (let index = 0; index < controles.length; index++) {
                if (this.formularioReunion.get(controles[index])?.invalid) {
                    return alertify.error(`El campo: ${controles[index]} no es válido`);
                }
            }
            return alertify.error('Faltan campos por diligenciar');
        }

        const modalConfirmacion = document.querySelector('#guardar-confirm-modal') as HTMLElement;
        const modalToOpenInstance = bootstrap.Modal.getOrCreateInstance(modalConfirmacion);
        modalToOpenInstance?.show();
    }

    /** CREANDO Se crea una reunion nueva con todos los datos de la ultima reunion con el mismo tipo */
    cargarTodo = () => {
        const fechaAnterior = this.formularioReunion.get('fecha_reunion')?.value;
        const horaAnterior = this.formularioReunion.get('hora')?.value;

        this.meetManagementService.traerReunion(this.id_tipo_reunion as number).subscribe(data => {
            if (!data.length) {
                const tipo_reunion = this.tiposReuniones.filter(elm => elm.id_tipo_reunion === this.id_tipo_reunion);
                this.formularioReunion.get('id_tipo_reunion')?.setValue(tipo_reunion[0].id_tipo_reunion);
                this.formularioReunion.get('titulo')?.setValue(tipo_reunion[0].titulo);
                this.formularioReunion.get('id_grupo')?.setValue(tipo_reunion[0].id_grupo);
                return alertify.success('No hay reuniones registradas con este tipo');
            }

            const idReunion = data[0].id_reunion; // Guarda el id por que después se eliminirá

            this.reunion = data[0];
            this.reunion.id_reunion = this.id_reunion as number;
            this.reunion.estado = '0';
            this.setValueReunion(this.reunion);

            this.formularioReunion.get('fecha_reunion')?.setValue(fechaAnterior);
            this.formularioReunion.get('hora')?.setValue(horaAnterior);

            this.arrayConvocadosA = [];
            this.arrayConvocadosI = [];

            this.meetManagementService.getConvocadosMeet(idReunion).subscribe(this.setConvocadosMeet);

            this.meetManagementService.getProgramas(idReunion).subscribe(programas => {
                programas.forEach((programa: Nullable<Programas>) => {
                    programa.id_programa = null;
                    programa.estado = '0';
                    programa.opciones?.forEach((opcion: Nullable<Programas>) => {
                        opcion.id_programa = null;
                        opcion.estado = '0';
                    });
                });
                this.setProgramas(programas);
            });

            alertify.success('Se cargaron los datos exitosamente')
        });
    }

    /** En esta función envio los datos de una reunion completa(datos de la reunion, de los convocados y de la programacion), estos datos se utilizan ya sea para actualizar una reunión o crearla desde cero
     * @returns Mensaje con la confirmacion o la posible falla en la insercion o actualizacion de la reunion
     */
    saveMeeting = () => {
        const formData = new FormData();

        this.arrayCompleto = [...this.arrayConvocadosA, ...this.arrayConvocadosI];

        const valor_formulario_reunion = { ...this.formularioReunion.value }; // Usa los ... para no modificar el objeto principal

        valor_formulario_reunion.titulo = this.formularioReunion.get('titulo')?.value; // Trae el valor si el campo está deshabilitado
        valor_formulario_reunion.quorum = valor_formulario_reunion.quorum === true ? '1' : '0';

        if (valor_formulario_reunion.checkProgramacionFirmada && valor_formulario_reunion.programacion === null) {
            valor_formulario_reunion.programacion = '';
        } else if (!valor_formulario_reunion.checkProgramacionFirmada) {
            valor_formulario_reunion.programacion = null;
        } else if (valor_formulario_reunion.checkProgramacionFirmada && valor_formulario_reunion.programacion !== '') {
            if (valor_formulario_reunion.programacion instanceof File) {
                formData.append(`programacion`, valor_formulario_reunion.programacion);
            }
        }

        Object.entries(valor_formulario_reunion).forEach(([key, value]) => value === undefined && (valor_formulario_reunion[key] = null));

        // Asigno el id_grupo para enviarlo en la funcion de enviar correo
        this.id_grupo = valor_formulario_reunion.id_grupo;

        formData.append('reunion', JSON.stringify(valor_formulario_reunion));
        formData.append('convocados', JSON.stringify(this.arrayCompleto));

        // De esta forma agrego campo por campo al formData
        const programas = this.formularioAgregarProgramas.value.programas;

        programas.forEach((programa: Record<string, any>, i: number) => {
            formData.append('id_programa[]', programa['id_programa'] || null);
            formData.append('titulo[]', programa['titulo']);
            formData.append('descripcion[]', programa['descripcion']);
            formData.append('tipo[]', programa['tipo']);
            formData.append('estado[]', programa['estado']);
            formData.append('rol_acta_descripcion[]', programa['rolesActas'].descripcion);
            formData.append('rol_acta_firma[]', programa['rolesActas'].firma ? '1' : '0');
            formData.append('rol_acta_acta[]', programa['rolesActas'].acta ? '1' : '0');

            ((programa['opciones'].listadoOpciones || []) as Record<string, any>[]).forEach((opcion, j) => {
                formData.append(`opcion_id_programa${i}[]`, opcion['id_programa'] || null);
                formData.append(`opcion_titulo${i}[]`, opcion['titulo']);
                formData.append(`opcion_descripcion${i}[]`, opcion['descripcion']);
                formData.append(`opcion_estado${i}[]`, opcion['estado']);

                ((opcion['archivos'].listadoArchivos || []) as Record<string, any>[]).forEach(archivo => {
                    if (archivo['file'] instanceof File) {
                        formData.append(`opcion_file${i}_${j}[]`, archivo['file']);
                    } else {
                        const fileOpcion = { id_archivo_programacion: archivo['id_archivo_programacion'] || null, url: archivo['url'], ...archivo['file'], };
                        formData.append(`opcion_file_viejo${i}_${j}[]`, JSON.stringify(fileOpcion));
                    }
                });
            });

            ((programa['archivos'].listadoArchivos || []) as Record<string, any>[]).forEach(archivo => {
                if (archivo['file'] instanceof File) {
                    formData.append(`file${i}[]`, archivo['file']);
                } else {
                    const fileOpcion = { id_archivo_programacion: archivo['id_archivo_programacion'] || null, url: archivo['url'], ...archivo['file'], };
                    formData.append(`file_viejo${i}[]`, JSON.stringify(fileOpcion));
                }
            });
        });

        this.meetManagementService.insertarReunion(formData).subscribe(res => {
            this.array_id_convocados = res.data;

            const formDataCorreo = new FormData();
            formDataCorreo.append('summonedList', JSON.stringify({ ids: this.array_id_convocados, id_grupo: this.id_grupo, titulo: valor_formulario_reunion.titulo }));
            alertify.success('La reunión se actualizo exitosamente.');

            if (
                (this.arrayCompleto.length > 0 && valor_formulario_reunion.checkProgramacionFirmada && valor_formulario_reunion.programacion !== '') ||
                (this.arrayCompleto.length > 0 && !valor_formulario_reunion.checkProgramacionFirmada && valor_formulario_reunion.programacion === null)
            ) {
                this.informacionReunion = { formData: formDataCorreo, id_reunion: res.id_reunion };
                const modalConfirmacion = document.querySelector('#invitation-confirm-modal') as HTMLElement;
                const modalToOpenInstance = bootstrap.Modal.getOrCreateInstance(modalConfirmacion);
                modalToOpenInstance?.show();
            } else if (this.arrayCompleto.length > 0 && valor_formulario_reunion.checkProgramacionFirmada && valor_formulario_reunion.programacion === '') {
                alertify.success('Recuerde cargar la programación, para asi poder enviar la invitación');
            } else { this.redirecting.navigate('/private/meet-management/modificar/' + res.id_reunion); }
        });
    }

    /** En esta función se valida que NO fueron enviados los correos de invitación de la reunión a los convocados de esta */
    notSendEmails = () => {
        if (this.informacionReunion) {
            this.redirecting.navigate('/private/meet-management/modificar/' + this.informacionReunion.id_reunion);
            alertify.error('No fue enviada la invitación a los convocados');
        }
    }

    /** En esta función se envian los correos de invitación de la reunión a los convocados de esta */
    sendEmails = () => {
        if (this.informacionReunion) {
            this.accesoService.sendMailToSummon(this.informacionReunion.formData).subscribe(response => {
                this.redirecting.navigate('/private/meet-management/modificar/' + this.informacionReunion.id_reunion);
                if (!response.status) { return alertify.error(response.message); }
                alertify.success('Se ha enviado una notificación al correo');
            });
        }
    }

    /** Deja en el lugar que estaba del array al convocado que se elimino */
    recuperarConvocado = () => {
        if (this.eliminado) {
            this[this.eliminado.zona].splice(this.eliminado.index, 0, this.eliminado.convocado);
        }
    }

    /** Toma el convocado que fue eliminado y lo regresa al array que pertenece, ya sea recursos o entidades */
    convocadoEliminado = () => {
        if (this.eliminado) {
            const convocado = this.dataCompleta.find(elm => elm.identificacion === this.eliminado.convocado.identificacion);
            if (convocado) {
                if (this.eliminado.convocado.nit || convocado.nit) {
                    this.entidades.push({ ...convocado, ...this.eliminado.convocado });
                    this.recursos.push({ ...convocado, ...this.eliminado.convocado });
                } else {
                    this.recursos.push({ ...convocado, ...this.eliminado.convocado });
                }
            } else {
                if (this.eliminado.convocado.nit) {
                    this.entidades.push(this.eliminado.convocado);
                    this.recursos.push(this.eliminado.convocado);
                } else {
                    this.recursos.push(this.eliminado.convocado);
                }
            }
            alertify.success('Convocado eliminado correctamente.');
        }
    }

    /** Deja en el lugar que estaba del array al programa que se elimino */
    recuperarPrograma = () => {
        this.programaEliminado && this.programaEliminado.form.insert(this.programaEliminado.index, this.programaEliminado.control);
    }

    /** Alerta de la correcta eliminación de un programa */
    programaEliminadoCorrectamente = () => {
        this.programaEliminado && alertify.success('Programa eliminado correctamente.');

    }

    /** Alerta de la correcta eliminación de una opción*/
    opcionEliminada = () => {
        this.programaEliminado && alertify.success('Opción eliminada correctamente.');
    }

    /** Agrega un participante o invitado a un array temporal dependiendo del tipo */
    agregarAsistente = () => {
        if (this.formularioAgregarAsistente.valid) {
            const enabled = this.formularioAgregarAsistente.get('nit')?.enabled;
            this.formularioAgregarAsistente.get('nit')?.enable();
            this.formularioAgregarAsistente.get('razon_social')?.enable();

            if (+this.formularioAgregarAsistente.value.tipo === 2) {
                /** Verifica que no se agreguen recursos que representen a varias entidades */
                const recurso = this.dataCompleta.find(elm => elm.identificacion === this.formularioAgregarAsistente.value.identificacion);
                if (recurso && recurso.nit && recurso.nit !== this.formularioAgregarAsistente.value.nit) {
                    return alertify.error(`La persona seleccionada ya es representante legal de la entidad (${recurso.nit} - ${recurso.razon_social})`);
                }
                /** Verifica que no se registren varios representantes legales en la misma entidad */
                const entidad = this.dataCompleta.find(elm => elm.nit === this.formularioAgregarAsistente.value.nit);
                if (entidad && entidad.identificacion !== this.formularioAgregarAsistente.value.identificacion) {
                    return alertify.error(`La entidad seleccionada ya tiene un representante legal (${entidad.identificacion} - ${entidad.nombre})`);
                }
            }

            if (!enabled) {
                this.formularioAgregarAsistente.get('nit')?.disable();
                this.formularioAgregarAsistente.get('razon_social')?.disable();
            }

            this.arrayCompleto = [...this.arrayConvocadosA, ...this.arrayConvocadosI];
            let filtro = this.arrayCompleto.filter(elm => elm.identificacion === this.formularioAgregarAsistente.value.identificacion);
            let roles = this.arrayRoles.filter(elm => elm.descripcion === this.formularioAgregarAsistente.value.rol);

            if (!filtro.length) {
                if (!roles.length) {
                    this.arrayRoles.push({ id_rol: 0, descripcion: this.formularioAgregarAsistente.value.rol, relacion: 0, estado: '1' });
                }

                let elm = this.recursos.findIndex(elm => elm.identificacion === this.formularioAgregarAsistente.value.identificacion);
                if (elm != -1) {
                    this.recursos.splice(elm, 1);
                }
                let elm2 = this.entidades.findIndex(elm2 => elm2.identificacion === this.formularioAgregarAsistente.value.identificacion);
                if (elm2 != -1) {
                    this.entidades.splice(elm2, 1);
                }

                if (this.formularioAgregarAsistente.value.tipo == 0) {
                    this.arrayConvocadosA.push(this.formularioAgregarAsistente.value);
                    alertify.success('Participante agregado', 2);
                    this.setValueAsistente({ identificacion: '', nombre: '', telefono: '', correo: '', tipo: '0', nit: '', razon_social: '', participacion: '', firma: '0', acta: '0' });

                } else if (this.formularioAgregarAsistente.value.tipo == 2) {

                    this.arrayConvocadosA.push(this.formularioAgregarAsistente.value);
                    alertify.success('Entidad agregada', 2);
                    this.setValueAsistente({ identificacion: '', nombre: '', telefono: '', correo: '', tipo: '2', nit: '', razon_social: '', participacion: '', firma: '0', acta: '0' });

                } else if (this.formularioAgregarAsistente.value.tipo == 1) {

                    this.arrayConvocadosI.push(this.formularioAgregarAsistente.value);
                    alertify.success('Invitado agregado', 2);
                    this.setValueAsistente({ identificacion: '', nombre: '', telefono: '', correo: '', tipo: '1', nit: '', razon_social: '', participacion: '', firma: '0', acta: '0' });
                }
            } else {
                if (this.formularioAgregarAsistente.value.tipo == 0 || this.formularioAgregarAsistente.value.tipo == 2) {
                    let elm1 = this.arrayConvocadosA.findIndex(elm => elm.identificacion === this.formularioAgregarAsistente.value.identificacion);
                    let elm2 = this.arrayConvocadosI.findIndex(elm => elm.identificacion === this.formularioAgregarAsistente.value.identificacion);
                    if (elm1 != -1) {
                        this.arrayConvocadosA.splice(elm1, 1);
                    }
                    if (elm2 != -1) {
                        this.arrayConvocadosI.splice(elm2, 1);
                    }
                    this.arrayConvocadosA.push(this.formularioAgregarAsistente.value);
                } else if (this.formularioAgregarAsistente.value.tipo == 1) {
                    let elm1 = this.arrayConvocadosI.findIndex(elm => elm.identificacion === this.formularioAgregarAsistente.value.identificacion);
                    let elm2 = this.arrayConvocadosA.findIndex(elm => elm.identificacion === this.formularioAgregarAsistente.value.identificacion);
                    if (elm1 != -1) {
                        this.arrayConvocadosI.splice(elm1, 1);
                    }
                    if (elm2 != -1) {
                        this.arrayConvocadosA.splice(elm2, 1);
                    }
                    this.arrayConvocadosI.push(this.formularioAgregarAsistente.value);
                }
                alertify.success('Convocado actualizado', 2);
                this.setValueAsistente({ identificacion: '', nombre: '', telefono: '', correo: '', tipo: '0', nit: '', razon_social: '', participacion: '', firma: '0', acta: '0' });
            }
        } else {
            const controles = Object.keys(this.formularioAgregarAsistente.controls);
            for (let index = 0; index < controles.length; index++) {
                if (this.formularioAgregarAsistente.get(controles[index])?.invalid) {
                    return alertify.error(`El campo: ${controles[index]} no es válido`);
                }
            }
            alertify.error('Faltan campos por diligenciar');
        }
    }

    /** Cuando es ejecutado, recorre el formulario y asigna los valores en cada parametro
     * @param recurso Aqui viene un objeto con clave valor de cada parametro del recurso
     * @returns Retorna un formulario diligenciado con los datos obtenidos
     */
    setValueAsistente = (recurso: any) => Object.keys(recurso).forEach(elm =>
        this.formularioAgregarAsistente.get(elm)?.setValue(recurso[elm])
    );

    /** Al escribir una identificacion o darle click a alguna de las listadas para auto completar de inmediato me consulta los registros pertenecientes a ese recurso y los auto completa en el formulario
     * @param value Aqui llega la identificacion que fue escrita o seleccionada
     */
    autocompletar = (value: string) => {
        const info = this.recursosGc_MeetYGcm.find(elm => elm.identificacion === value);
        this.setValueAsistente(info ? info : { identificacion: value, nombre: '', correo: '', telefono: '', rol: '', tipo: '0', nit: '', razon_social: '', participacion: '', firma: '0', acta: '0' });
        if (info?.nit && info?.razon_social) {
            this.formularioAgregarAsistente.get('nit')?.disable();
            this.formularioAgregarAsistente.get('razon_social')?.disable();
        }
    }

    /** Al escribir un nit o darle click a alguna de las opciones listadas para auto completar de inmediato me consulta los registros pertenecientes a ese recurso y los auto completa en el formulario
     * @param nit Aqui llega el nit que fue escrita o seleccionado
     */
    autocompletarPorNit = (nit: string) => {
        const info = this.entidades.find(elm => elm.nit === nit);
        if (info) { this.setValueAsistente(info ? info : { identificacion: '', nombre: '', correo: '', telefono: '', rol: '', tipo: '0', nit: nit, razon_social: '', participacion: '', firma: '0', acta: '0' }); }
    }

    /** Obtiene un elemento por el que se intercambiará otro
   * @param item Elemento objetivo
   */
    getRealContainer = (item: HTMLElement): HTMLElement | null => { return item ? (item.draggable === true ? item : (item.parentElement ? this.getRealContainer(item.parentElement as HTMLElement) : null)) : null; }

    /** Verifica que lo que se está arrastrando no sea un archivo
     * @param event
     * @returns
     */
    containsFiles = (event: DragEvent): boolean => {
        if (event.dataTransfer && event.dataTransfer.types) {
            for (var i = 0; i < event.dataTransfer.types.length; i++) {
                if (event.dataTransfer.types[i] == "Files") { return true; }
            }
        } return false;
    }

    /** Obtiene un elemento que que espera otro
     * @param item Elemento objetivo
     */
    getTargetContainer = (item: HTMLElement): HTMLElement | null => { return item ? (item.getAttribute('droppable') !== null ? item : (item.parentElement ? this.getTargetContainer(item.parentElement as HTMLElement) : null)) : null; }

    /** Habilita la opciónde soltar en las zonas de destino de los convocados */
    allowDropItem = (event: DragEvent) => {
        event.preventDefault();
        if (event.dataTransfer) { event.dataTransfer.dropEffect = 'move'; }
    }

    /** Añade la sección de "Suelte aquí" a los elementos de lista
    * @param event Información del evento
    * @param enable Habilitar/Deshabilitar
    */
    seItemDropArea = (event: DragEvent, enable: boolean, selector = '') => {
        if (!this.containsFiles(event)) {
            /** @type {HTMLElement} */
            const element = this.getRealContainer(event.target as HTMLElement);
            if (element) {
                /** Añade un contador al elemento contenedor de la lista (Se usa para que el evento de los nodos hijos no afecten el del nodo padre) */
                const counter = element.getAttribute('data-counter');
                if (enable) {
                    /** Aumenta el contador cada vez que ingresa al método */
                    counter === null ? element.setAttribute('data-counter', '0') : element.setAttribute('data-counter', `${+counter + 1}`);
                    element.classList.add(`${selector}item-droppable-area`);
                } else {
                    /** Reduce el contador cada vez que ingresa al método */
                    counter !== null && element.setAttribute('data-counter', `${+counter - 1}`);
                    if ([null, 0, '0'].includes(counter)) {
                        element.classList.remove(`${selector}item-droppable-area`);
                        element.removeAttribute('data-counter');
                    }
                }
            }
        }
    }

    /** Agrega un programa al array de programas */
    agregarPrograma = () => {
        if (this.formularioAgregarProgramas.get('formulario')?.valid) {

            if (+this.formularioAgregarProgramas.value.formulario.tipo === 5 && !this.formularioAgregarProgramas.value.formulario.rolesActas.descripcion) {
                return alertify.error('El campo rol a elegir no debe estar vacío');
            }

            if (this.formularioAgregarProgramas.value.formulario.opciones.opcion_descripcion.length !== 0) {
                return alertify.error('La opción diligenciada aun no ha sido agregada');
            }

            const inputIndice: HTMLInputElement | null = document.querySelector('#programming-form #index-programa [data-value]');

            if (inputIndice === null) {
                this.formularioAgregarProgramas.get('formulario')?.get('archivos')?.get('text_input')?.setValue('');
                (this.formularioAgregarProgramas.get('formulario')?.get('opciones')?.get('listado_opciones') as FormArray)?.controls.forEach(control => control.get('archivos')?.get('text_input')?.setValue(''));
                (this.formularioAgregarProgramas.get('programas') as FormArray).push(this.formularioAgregarProgramas.get('formulario') as FormGroup);
                this.formularioAgregarProgramas.removeControl('formulario');
                this.formularioAgregarProgramas.addControl('formulario', this.crearFormularioPrograma());
                this.updateInputLength(this.archivos.length, 'text_input', 'archivos');
                this.updateInputFile(this.archivos);
                alertify.success('Programa agregado correctamente');
            } else {
                const index = inputIndice.getAttribute('data-value') as string;
                (this.formularioAgregarProgramas.get('programas') as FormArray).removeAt(+index);

                this.formularioAgregarProgramas.get('formulario')?.get('archivos')?.get('text_input')?.setValue('');
                (this.formularioAgregarProgramas.get('formulario')?.get('opciones')?.get('listado_opciones') as FormArray)?.controls.forEach(control => control.get('archivos')?.get('text_input')?.setValue(''));

                (this.formularioAgregarProgramas.get('programas') as FormArray).insert(+index, this.formularioAgregarProgramas.get('formulario') as FormGroup);

                alertify.success('Programa actualizado correctamente');
                this.cancelarModificacion();
            }
        } else {
            const controles = Object.keys((this.formularioAgregarProgramas.get('formulario') as FormGroup).controls);
            for (let index = 0; index < controles.length; index++) {
                if (this.formularioAgregarProgramas.get('formulario')?.get(controles[index])?.invalid) {
                    return alertify.error(`El campo: ${controles[index]} no es válido`);
                }
            }
            alertify.error('Faltan campos por diligenciar');
        }
    }

    /** Cancela la modificación */
    cancelarModificacion = () => {
        const contenedorInput = document.querySelector('#programming-form #index-programa') as HTMLElement;
        const inputIndice = contenedorInput.querySelector('input') as HTMLInputElement;
        contenedorInput.hidden = true;
        inputIndice.removeAttribute('data-value')
        inputIndice.value = '';

        this.formularioAgregarProgramas.removeControl('formulario');
        this.formularioAgregarProgramas.addControl('formulario', this.crearFormularioPrograma());
        document.querySelector('#programming-list-update')?.classList.add('fade');
    }

    /** Detecta los archivos seleccionados y les hace un push al array de archivos ya sea de un programa o una opcion */
    detectFiles = (event: Event, archivos: FormArray) => {
        let files = (event.target as HTMLInputElement).files;
        if (files) {
            for (let file of Array.from(files)) {
                let reader = new FileReader();
                reader.onload = (e: any) => archivos.push(this.createItem({ file, url: e.target.result }));
                reader.readAsDataURL(file);
            }
        }
    }

    /** Retorna Una lista de archivos actualizada */
    createItem(data: any): FormGroup { return this.fb.group(data); }

    /** Elimina alguno de los archivos seleccionados y listados
     * @param i Indice del archivo
     * @param archivos Información completa del archivo, de aqui se toma el indice
     */
    removeArchivo = (i: number, archivos: FormArray) => { archivos.removeAt(i); }

    /** Agrega una opcion al array de opciones que tiene un programa */
    agregarOpcion = () => {
        const valor = this.formularioAgregarProgramas.value.formulario.opciones.opcion_descripcion;
        if (this.formularioAgregarProgramas.get('formulario')?.get('opciones')?.get('opcion_descripcion')?.valid && valor !== '') {
            (this.formularioAgregarProgramas.get('formulario')?.get('opciones')?.get('listadoOpciones') as FormArray).push(this.fb.group({
                titulo: [`${this.formularioAgregarProgramas.value.formulario.opciones.opcion_descripcion}`, [Validators.required, Validators.maxLength(500)]],
                descripcion: ['', [Validators.maxLength(5000)]],
                estado: ['0'],
                archivos: this.fb.group({
                    listadoArchivos: this.fb.array([]),
                    text_input: [''],
                }),
            }));
            alertify.success('Se agrego la opción');
            this.formularioAgregarProgramas.get('formulario')?.get('opciones')?.get('opcion_descripcion')?.setValue('');
        } else { alertify.error('El valor ingresado no es valido'); }
    }

    /** Agrega una opcion al array de opciones que tiene un programa */
    agregarRecursoActa = (identificacion: string) => {
        const valor = this.arrayConvocadosA.find(item => item.identificacion === identificacion);
        if (!valor) { return alertify.error('El valor ingresado no es valido'); }

        const listadoOpciones = this.formularioAgregarProgramas.get('formulario')?.get('opciones')?.get('listadoOpciones') as FormArray;
        if (listadoOpciones.value.find((item: { titulo: string; }) => item.titulo === valor.identificacion)) {
            return alertify.error('El convocado ya ha sido postulado');
        };

        listadoOpciones.push(this.fb.group({
            titulo: [valor.identificacion, [Validators.required, Validators.maxLength(500)]],
            descripcion: [valor.nombre, [Validators.maxLength(5000)]],
            estado: ['0'],
            archivos: this.fb.group({
                listadoArchivos: this.fb.array([]),
                text_input: [''],
            }),
        }));
        alertify.success('Se apostuló al convocado');
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

    removerRecursoActa() {
        alertify.success('Postulación eliminada correctamente');
        const optionList = this.formularioAgregarProgramas.get('formulario')?.get('opciones')?.get('listadoOpciones') as FormArray;
        optionList.removeAt(this.recursoActaToRemove);
        this.openModal('#programming-modal', '#recurso-acta-remove-confirm-modal');
    }

}
