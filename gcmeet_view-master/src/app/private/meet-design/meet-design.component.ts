import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';

import { environment } from 'src/environments/environment';

import { MeetManagementService } from 'src/app/services/meet-management.service';

import { ConvocadoAdicional, Programas, Reuniones } from 'src/app/interfaces/reuniones.interface';
import { TipoReunion } from 'src/app/interfaces/tipos-reuniones.interface';
import { Recursos } from 'src/app/interfaces/recursos.interface';
import { Grupos } from 'src/app/interfaces/grupos.interface';
import { firstValueFrom } from 'rxjs';

declare const alertify: any;

@Component({
  providers: [DatePipe],
  templateUrl: './meet-design.component.html',
  styleUrls: ['./meet-design.component.scss'],
  selector: 'app-meet-design'
})
export class MeetDesignComponent implements OnInit {

  env = environment;

  // Grupos
  id_grupo: number | undefined;
  grupo!: Grupos;

  // Reunion
  id_reunion: number | undefined;
  reunion?: Reuniones;

  // Tipos Reunión
  tiposReuniones: TipoReunion[] = [];
  id_tipo_reunion?: number;

  // Convocados
  arrayConvocadosA: ConvocadoAdicional[] = [];
  arrayConvocadosI: ConvocadoAdicional[] = [];
  convocadosMeet: ConvocadoAdicional[] = [];
  arrayCompleto: ConvocadoAdicional[] = [];

  // Recursos
  recursosGc_MeetYGcm: Recursos[] = [];
  entidadesUnicas: Recursos[] = [];
  dataCompleta: Recursos[] = [];
  recursos_gcm: Recursos[] = [];
  entidades: Recursos[] = [];
  recursos: Recursos[] = [];

  formularioAgregarProgramas = new FormGroup({});
  formularioAgregarAsistente = new FormGroup({});
  formularioReunion = new FormGroup({});

  constructor(
    private meetManagementService: MeetManagementService,
    private activatedRoute: ActivatedRoute,
    private builder: FormBuilder,
    private datePipe: DatePipe,
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
    this.formularioReunion = this.builder.group({
      descripcion: ['', [Validators.maxLength(5000)]],
      fecha_reunion: ['', [Validators.required]],
      titulo: ['', [Validators.required]],
      hora: ['', [Validators.required]],
      id_reunion: [this.id_reunion],
      id_grupo: [this.id_grupo],
      programacion: [], // Programación firmada
      estado: ['0'],
    });
  }

  /** Inicializa el formulario */
  initFormAgregarPrograma = () => {
    this.formularioAgregarProgramas = this.builder.group({
      // formulario: this.crearFormularioPrograma(),
      titulo: ['', [Validators.maxLength(500)]],
      orden: [1],
      programas: this.builder.array([]),
    });
    // this.updateInputFile(this.archivos);
  }

  agregarPrograma() {
    const value = this.formularioAgregarProgramas.value;
    if (this.formularioAgregarProgramas.get('titulo')?.invalid || value.titulo.trim() === '') { return alertify.error('La pregunta no es válida'); }

    const programming = this.formularioAgregarProgramas.get('programas') as FormArray;
    const orden = (+value.orden - 1) > programming.controls.length ? programming.controls.length : ((+value.orden - 1) < 0 ? 0 : (+value.orden - 1));
    programming.insert(orden, this.crearFormularioPrograma(value.titulo.trim(), orden + 1));

    this.formularioAgregarProgramas.get('orden')?.setValue(programming.controls.length + 1);
    this.formularioAgregarProgramas.get('titulo')?.setValue('');

    setTimeout(() => (
      (document.querySelectorAll('.program-description-fc')[orden] as HTMLInputElement | null)?.focus(),
      document.querySelectorAll('.program-fc')[orden]?.dispatchEvent(new Event('resize')),
      document.querySelector('#program-adder')?.dispatchEvent(new Event('resize'))
    ), 0);

    this.reindexProgramming();
  }

  agregarOpcion(programIndex: number) {
    const programming = this.formularioAgregarProgramas.get('programas') as FormArray;
    const program = programming.get(`${programIndex}`) as FormGroup;
    const programOption = program.get('opciones') as FormGroup;

    const value = program.value.opciones;

    if (programOption.get('opcion_titulo')?.invalid || value.opcion_titulo.trim() === '') { return alertify.error('La pregunta no es válida'); }

    const optionList = programOption.get('listadoOpciones') as FormArray;
    const orden = (+value.opcion_orden - 1) > optionList.controls.length ? optionList.controls.length : ((+value.opcion_orden - 1) < 0 ? 0 : (+value.opcion_orden - 1));
    optionList.insert(orden, this.crearFormularioPrograma(value.opcion_titulo.trim(), orden + 1));

    programOption.get('opcion_orden')?.setValue(optionList.controls.length + 1);
    programOption.get('opcion_titulo')?.setValue('');

    setTimeout(() => (
      (document.querySelectorAll(`.odfc-${programIndex}`)[orden] as HTMLInputElement | null)?.focus(),
      document.querySelectorAll(`.ofc-${programIndex}`)[orden]?.dispatchEvent(new Event('resize')),
      document.querySelector(`#option-adder-${programIndex}`)?.dispatchEvent(new Event('resize'))
    ), 0);

    this.reindexOption(optionList);
  }

  updateProgramOrder(currentIndex: number) {
    const programming = this.formularioAgregarProgramas.get('programas') as FormArray;
    const program = programming.get(`${currentIndex}`) as FormGroup;
    const targetIndex: number = (+program.value.orden - 1) > programming.controls.length ? programming.controls.length : ((+program.value.orden - 1) < 0 ? 0 : (+program.value.orden - 1));
    if (currentIndex !== targetIndex) {
      programming.removeAt(+currentIndex);
      programming.insert(targetIndex, program);
      this.reindexProgramming();
    }
  }

  updateOptionOrder(programIndex: number, currentIndex: number) {
    const programming = this.formularioAgregarProgramas.get('programas') as FormArray;
    const program = programming.get(`${programIndex}`) as FormGroup;
    const optionList = program.get('opciones')?.get('listadoOpciones') as FormArray;
    const option = optionList.get(`${currentIndex}`) as FormGroup;
    const targetIndex: number = (+option.value.orden - 1) > optionList.controls.length ? optionList.controls.length : ((+option.value.orden - 1) < 0 ? 0 : (+option.value.orden - 1));
    if (currentIndex !== targetIndex) {
      optionList.removeAt(+currentIndex);
      optionList.insert(targetIndex, option);
      this.reindexOption(optionList);
    }
  }

  reindexProgramming() {
    const programas = this.formularioAgregarProgramas.get('programas') as FormArray;
    programas.controls.forEach((control, i) => control.get('orden')?.setValue(i + 1));
  }

  reindexOption(optionList: FormArray) {
    optionList.controls.forEach((control, i) => control.get('orden')?.setValue(i + 1));
  }

  crearFormularioPrograma = (titulo = '', orden = 1): FormGroup => {
    return this.builder.group({
      titulo: [titulo, [Validators.required, Validators.maxLength(500)]],
      descripcion: ['', [Validators.maxLength(5000)]],
      tipo: ['1', [Validators.required]],
      id_programa: [null],
      orden: [orden],
      estado: ['0'],
      opciones: this.builder.group({
        listadoOpciones: this.builder.array([]),
        opcion_titulo: [''],
        opcion_orden: [1]
      }),
      archivos: this.builder.group({
        listadoArchivos: this.builder.array([]),
        text_input: ['']
      }),
    })
  }

  /** Toma la fecha selecionada y le da el formato necesario para enviarlo a base de datos
   * @param event Aqui viene la fecha seleccionada
   */
  cambiarFecha = (event: any) => {
    const fecha = this.datePipe.transform(event, 'yyyy-MM-dd');
    this.formularioReunion.get('fecha_reunion')?.setValue(fecha);
  }

  getReunionRegistrar() {
    if (this.id_grupo) {
      /** Consulta los roles con una relacion que tiene en comun un grupo */
      // this.meetManagementService.getRolesRegistrar(this.id_grupo).subscribe(roles => this.arrayRoles = roles);

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

        // if (this.reunion.programacion !== '') {
        //   this.validaExistenciaFirmaProgramacion = true;
        // }
        // if (this.reunion.programacion === '') {
        //   this.validaVacioFirmaProgramacion = true;
        // }
        this.setValueReunion(this.reunion);
        // this.asignar(this.reunion?.titulo || '', true);

        // Convocados
        this.setConvocadosMeet(convocados);

        // Reunion
        this.getReunion();
      });

      // Programas
      this.meetManagementService.getProgramas(this.id_reunion).subscribe(this.setProgramas);

      // Roles
      // this.meetManagementService.getRoles(this.id_reunion).subscribe(roles => this.arrayRoles = roles);
    }
  }

  setConvocadosMeet = (convocados: ConvocadoAdicional[]) => {
    /** Consulta los convocados de una reunión en especifico */
    this.convocadosMeet = convocados;
    for (let i = 0; i < this.convocadosMeet.length; i++) {
      if (this.convocadosMeet[i].tipo === '0' || this.convocadosMeet[i].tipo === '2') {
        this.arrayConvocadosA = [...this.arrayConvocadosA, this.convocadosMeet[i]];
      } else {
        this.arrayConvocadosI = [...this.arrayConvocadosI, this.convocadosMeet[i]];
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

      //   // Recursos GCM
      this.recursos_gcm = recursos_gcm;
      this.recursosGc_MeetYGcm = [...this.recursos, ...this.recursos_gcm];
    });

    // this.meetManagementService.getActas().subscribe(actas => {
    //   if (!actas.status) { alertify.error(actas.message); }
    //   this.actas = actas.message;
    // });
  }

  /** Cuando estoy creando una reunion nueva debo seleccionar un tipo del cual obtengo el id_tipo_reunion el cual voy almacenar junto con los demas datos de la reunión
   * @param id_tipo_reunion Aqui va el id_tipo_reunion seleccionado
   */
  asignar = (titulo: string, first = false) => {
    const tipo_reunion = this.tiposReuniones.find(itme => itme.titulo === titulo)
    this.id_tipo_reunion = tipo_reunion?.id_tipo_reunion || undefined;
    this.cargarSoloTipo(tipo_reunion, first);
  }

  /** CREANDO Se crea una nueva reunion unicamente con el campo titulo diligenciado de la ultima reunion de este tipo, los demas siguen vacios */
  cargarSoloTipo = (tipo_reunion: TipoReunion | undefined, first = false) => {
    if (tipo_reunion) {
      this.formularioReunion.get('id_tipo_reunion')?.setValue(tipo_reunion.id_tipo_reunion);
      this.formularioReunion.get('id_grupo')?.setValue(tipo_reunion.id_grupo);
      this.formularioReunion.get('titulo')?.setValue(tipo_reunion.titulo);
    }
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

  /** Inicializa el formulario para agregar un asistente a la reunión, se inicia con valores por defecto y validaciones */
  initFormAgregarConvocado = () => {
    this.formularioAgregarAsistente = this.builder.group({
      nit: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(20)]],
      razon_social: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(100)]],
      identificacion: ['', [Validators.required, Validators.maxLength(20)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      telefono: ['', [Validators.maxLength(20)]],
      participacion: [{ value: '', disabled: true }, [Validators.required]],
      tipo: ['0'],
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
    // const require: boolean = (document.querySelector('[formcontrolname="quorum"]') as HTMLInputElement).checked;
    const require = true;
    const participationInput = document.querySelector('[formcontrolname="participacion"]') as HTMLInputElement;
    if (require === true && +type !== 1) {
      this.formularioAgregarAsistente.get('participacion')?.enable();
      participationInput.setAttribute('type', 'text');
    } else {
      this.formularioAgregarAsistente.get('participacion')?.disable();
      participationInput.setAttribute('type', 'hidden');
    }
  }

  /** Agrega un participante o invitado a un array temporal dependiendo del tipo */
  agregarAsistente = () => {
    if (this.formularioAgregarAsistente.valid) {
      const isEnabled = this.formularioAgregarAsistente.get('nit')?.enabled;
      this.formularioAgregarAsistente.get('nit')?.enable();
      this.formularioAgregarAsistente.get('razon_social')?.enable();

      const value = this.formularioAgregarAsistente.value;

      if (!isEnabled) {
        this.formularioAgregarAsistente.get('nit')?.disable();
        this.formularioAgregarAsistente.get('razon_social')?.disable();
      }

      this.arrayCompleto = [...this.arrayConvocadosA, ...this.arrayConvocadosI];
      const filtro = this.arrayCompleto.find(elm => (value.nit && elm.nit === value.nit) || (elm.identificacion === value.identificacion && elm.nit === value.nit));

      if (filtro) { return alertify.error('Ya se ha convocado'); }

      this[value.tipo === '1' ? 'arrayConvocadosI' : 'arrayConvocadosA'].push(value);
      this.setValueAsistente({ tipo: value.tipo, nit: '', razon_social: '', identificacion: '', nombre: '', correo: '', telefono: '', participacion: '' });
      alertify.success(`${value.tipo === '1' ? 'Convocado' : 'Invitado'} agregado correctamente`, 2);

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
    this.formularioAgregarAsistente.get(elm)?.setValue(recurso[elm]));

  /** Al escribir una identificacion o darle click a alguna de las listadas para auto completar de inmediato me consulta los registros pertenecientes a ese recurso y los auto completa en el formulario
  * @param value Aqui llega la identificacion que fue escrita o seleccionada
  */
  autocompletar = (value: string, tipoPersona: string) => {
    let info = this.recursosGc_MeetYGcm.find(elm => elm.identificacion === value);
    info && (info = { ...info, nit: this.formularioAgregarAsistente.value.nit, razon_social: this.formularioAgregarAsistente.value.razon_social, tipo: tipoPersona });
    this.setValueAsistente(info || { identificacion: value, nombre: '', correo: '', telefono: '', rol: '', tipo: tipoPersona, nit: '', razon_social: '', participacion: '', firma: '0', acta: '0' });
    if (+tipoPersona === 2) {
      this.formularioAgregarAsistente.get('nit')?.enable();
      this.formularioAgregarAsistente.get('razon_social')?.enable();
    } else {
      this.formularioAgregarAsistente.get('nit')?.disable();
      this.formularioAgregarAsistente.get('razon_social')?.disable();
    }
  }

  /** Al escribir un nit o darle click a alguna de las opciones listadas para auto completar de inmediato me consulta los registros pertenecientes a ese recurso y los auto completa en el formulario
   * @param nit Aqui llega el nit que fue escrita o seleccionado
   */
  autocompletarPorNit = (nit: string) => {
    const info = this.entidades.find(elm => elm.nit === nit);
    if (info) { this.setValueAsistente(info ? info : { identificacion: '', nombre: '', correo: '', telefono: '', rol: '', tipo: '2', nit: nit, razon_social: '', participacion: '', firma: '0', acta: '0' }); }
  }

  /** Toma los programas consultados y los muestra en la vista
   * @param programas Aqui llegan los programas consultados
   */
  setProgramas = (programas: Programas[]) => {
    this.formularioAgregarProgramas.removeControl('programas');
    this.formularioAgregarProgramas.addControl('programas', this.builder.array(
      programas.map((programa, i) => this.builder.group({
        titulo: [programa.titulo, [Validators.required, Validators.maxLength(500)]],
        descripcion: [programa.descripcion, [Validators.maxLength(5000)]],
        tipo: [programa.tipo, [Validators.required]],
        id_programa: [programa.id_programa], // Para poder modificarlo
        estado: [programa.estado],
        orden: [i + 1],
        opciones: this.builder.group({
          opcion_titulo: [''],
          opcion_orden: [(programa.opciones || []).length + 1],
          listadoOpciones: this.builder.array((programa.opciones || []).map((opcion, j) => this.builder.group({
            descripcion: [opcion.descripcion, [Validators.maxLength(5000)]],
            titulo: [opcion.titulo, [Validators.maxLength(500)]],
            id_programa: [opcion.id_programa], // Para poder modificarlo
            estado: [opcion.estado],
            orden: [j + 1],
            archivos: this.builder.group({
              text_input: [''],
              listadoArchivos: this.builder.array(opcion.archivos ? opcion.archivos.map(archivoOpcion => this.builder.group({
                file: { size: archivoOpcion.peso, name: archivoOpcion.descripcion },
                id_archivo_programacion: [archivoOpcion.id_archivo_programacion],
                id_programa: [archivoOpcion.id_programa],
                url: archivoOpcion.url
              })) : [])
            }),
          })))
        }),
        archivos: this.builder.group({
          text_input: [''],
          listadoArchivos: this.builder.array(programa.archivos ? programa.archivos.map(archivoPrograma => this.builder.group({
            file: { size: archivoPrograma.peso, name: archivoPrograma.descripcion },
            id_archivo_programacion: [archivoPrograma.id_archivo_programacion],
            id_programa: [archivoPrograma.id_programa],
            url: archivoPrograma.url
          })) : [])
        }),
      }))
    ));

    this.formularioAgregarProgramas.get('orden')?.setValue(programas.length + 1);

    setTimeout(() => {
      document.querySelectorAll('.program-description-fc').forEach(item => item.dispatchEvent(new Event('resize')));
      document.querySelectorAll('.option-description-fc').forEach(item => item.dispatchEvent(new Event('resize')));
      document.querySelectorAll('.program-fc').forEach(item => item.dispatchEvent(new Event('resize')));
      document.querySelectorAll('.option-fc').forEach(item => item.dispatchEvent(new Event('resize')));
    }, 0);
  }

}
