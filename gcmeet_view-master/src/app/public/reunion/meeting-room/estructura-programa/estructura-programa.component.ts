import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { environment } from 'src/environments/environment';

import { AccesoReunionService, Convocado, Programacion } from 'src/app/services/acceso-reunion.service';
import { MeetManagementService } from 'src/app/services/meet-management.service';

import { GetFormArrayPipe } from 'src/app/pipes/get-form-array.pipe';

import { Reuniones, RolesActas } from 'src/app/interfaces/reuniones.interface';

declare const alertify: any;
declare const bootstrap: any;

@Component({
  templateUrl: './estructura-programa.component.html',
  styleUrls: ['./estructura-programa.component.scss'],
  selector: 'app-estructura-programa',
  providers: [GetFormArrayPipe]
})
export class EstructuraProgramaComponent implements OnChanges {

  @Input() meet?: Reuniones;

  @Input() program: Programacion | undefined;

  @Input() id_reunion?: number;
  @Input() orden?: number;

  @Output() eliminado = new EventEmitter<{ form: FormArray; control: FormGroup; index: number; }>();
  @Output() saved = new EventEmitter<boolean>();

  @Input() summonList: Convocado[] = [];

  public storage = `${environment.storage}/`;

  public programmingForm = this.defaultForm();

  public rolesActas: RolesActas[] = [];

  constructor(
    private meetManagementService: MeetManagementService,
    private accesoService: AccesoReunionService,
    public getFormArray: GetFormArrayPipe,
    private cdr: ChangeDetectorRef,
    private builder: FormBuilder,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if ('orden' in changes) {
      const order: (Reuniones | undefined) = changes['orden'].currentValue;
      if (order) { this.programmingForm = this.defaultForm(); }
    }
    if ('meet' in changes) {
      const meet: (Reuniones | undefined) = changes['meet'].currentValue;
      if (meet && meet.id_acta) {
        this.meetManagementService.getRolesActas(meet.id_acta).subscribe((data: RolesActas[]) => {
          this.rolesActas = data;
        });
      }
    }
    if ('program' in changes) {
      const program: (Programacion | undefined) = changes['program'].currentValue;
      if (program) {
        this.programmingForm = this.builder.group({
          titulo: [program.titulo, [Validators.required, Validators.maxLength(500)]],
          descripcion: [program.descripcion, [Validators.maxLength(5000)]],
          tipo: [{ disabled: +program.estado === 1, value: program.tipo }, [Validators.required]],
          id_convocado_reunion: [program.id_convocado_reunion],
          id_rol_acta: [program.id_rol_acta],
          id_programa: [program.id_programa],
          estado: [program.estado],
          orden: [program.orden, [Validators.required]], // Probablemente lo quite
          opciones: this.builder.group({
            opcion_descripcion: [''],
            listadoOpciones: this.builder.array((program.opciones || []).map(option => this.builder.group({
              titulo: [option.titulo, [Validators.required, Validators.maxLength(500)]],
              descripcion: [option.descripcion, [Validators.maxLength(5000)]],
              id_convocado_reunion: [option.id_convocado_reunion],
              id_rol_acta: [option.id_rol_acta],
              tipo: [option.tipo, [Validators.required]],
              id_programa: [option.id_programa],
              estado: [option.estado],
              opciones: this.builder.group({
                opcion_descripcion: [''],
                listadoOpciones: this.builder.array((option.opciones || []).map(opt => this.builder.group({
                  titulo: [opt.titulo, [Validators.required, Validators.maxLength(500)]],
                  descripcion: [opt.descripcion, [Validators.maxLength(5000)]],
                  tipo: [opt.tipo, [Validators.required]],
                  id_programa: [opt.id_programa],
                  estado: [opt.estado],
                })))
              }),
              archivos: this.builder.group({
                text_input: [''],
                listadoArchivos: this.builder.array((option.archivos || []).map(archivoOpcion => this.builder.group({
                  file: { size: archivoOpcion.peso, name: archivoOpcion.descripcion },
                  id_archivo_programacion: [archivoOpcion.id_archivo_programacion],
                  id_programa: [archivoOpcion.id_programa],
                  url: archivoOpcion.url
                })))
              }),
            })
            ))
          }),
          archivos: this.builder.group({
            text_input: [''],
            listadoArchivos: this.builder.array((program.archivos || []).map(archivoPrograma => this.builder.group({
              file: { size: archivoPrograma.peso, name: archivoPrograma.descripcion },
              id_archivo_programacion: [archivoPrograma.id_archivo_programacion],
              id_programa: [archivoPrograma.id_programa],
              url: archivoPrograma.url
            })))
          }),
          rolesActas: this.builder.group({
            descripcion: [program.rol_acta_descripcion, [Validators.maxLength(100)]],
            firma: [+(program.rol_acta_firma as string) === 1 ? true : false],
            acta: [+(program.rol_acta_acta as string) === 1 ? true : false],
          }),
        });
      } else {
        this.programmingForm = this.defaultForm();
      }
    }
  }

  getArchivos(): FormArray {
    return this.programmingForm?.get('archivos')?.get('listadoArchivos') as FormArray;
  };

  agregarPrograma() {
    if (this.programmingForm.value.opciones.opcion_descripcion.length) {
      return alertify.error('La opción diligenciada aun no ha sido agregada');
    }

    if (!this.programmingForm.valid) {
      const controles = Object.keys((this.programmingForm as FormGroup).controls);
      for (let index = 0; index < controles.length; index++) {
        if (this.programmingForm?.get(controles[index])?.invalid) {
          return alertify.error(`El campo: ${controles[index]} no es válido`);
        }
      }
      return alertify.error('Faltan campos por diligenciar');
    }

    if (+this.programmingForm.value.tipo === 5 && !this.programmingForm.value.rolesActas.descripcion) {
      return alertify.error('El campo rol a elegir no debe estar vacío');
    }

    const formData = new FormData();
    const program = this.programmingForm.value;

    formData.append('id_acta', `${this.meet?.id_acta}`);
    formData.append('id_reunion', `${this.id_reunion}`);
    formData.append('id_programa', program.id_programa);
    formData.append('id_convocado_reunion', program.id_convocado_reunion);
    formData.append('id_rol_acta', program.id_rol_acta);
    formData.append('titulo', program.titulo);
    formData.append('descripcion', program.descripcion);
    formData.append('orden', program.orden);
    formData.append('tipo', this.programmingForm.get('tipo')?.value); // Se obtiene así debido a la habilitación del disabled
    formData.append('estado', program.estado);
    formData.append('rol_acta_descripcion', program.rolesActas.descripcion);
    formData.append('rol_acta_firma', program.rolesActas.firma ? '1' : '0');
    formData.append('rol_acta_acta', program.rolesActas.acta ? '1' : '0');

    for (let j = 0; j < program.opciones.listadoOpciones!.length; j++) {

      const option = program.opciones.listadoOpciones[j];

      formData.append(`opcion_id_convocado_reunion[]`, option['id_convocado_reunion']);
      formData.append(`opcion_id_rol_acta[]`, option['id_rol_acta']);
      formData.append(`opcion_id_programa[]`, option['id_programa']);
      formData.append(`opcion_titulo[]`, option['titulo']);
      formData.append(`opcion_descripcion[]`, option['descripcion']);
      formData.append(`opcion_estado[]`, option['estado']);
      formData.append(`opcion_tipo[]`, option['tipo']);

      // formData.append('opcion_rol_acta_descripcion[]', +option['tipo'] === 5 ? option['titulo'] : '');
      // formData.append('opcion_rol_acta_firma[]', +option['tipo'] === 5 ? '1' : '0');
      // formData.append('opcion_rol_acta_acta[]', '0');

      for (let d = 0; d < option.archivos.listadoArchivos!.length; d++) {
        if (option.archivos.listadoArchivos[d]['file'] instanceof File) {
          formData.append(`opcion_file_${j}[]`, option.archivos.listadoArchivos[d]['file']);
        } else {
          const fileOpcion = {
            id_archivo_programacion: option.archivos.listadoArchivos[d]['id_archivo_programacion'],
            url: option.archivos.listadoArchivos[d]['url'],
            ...option.archivos.listadoArchivos[d]['file'],
          };
          formData.append(`opcion_file_viejo_${j}[]`, JSON.stringify(fileOpcion));
        }
      }

      for (let k = 0; k < option.opciones.listadoOpciones.length; k++) {

        const optionChild = option.opciones.listadoOpciones[k];

        formData.append(`opcion_id_programa_${j}[]`, optionChild['id_programa']);
        formData.append(`opcion_titulo_${j}[]`, optionChild['titulo']);
        formData.append(`opcion_descripcion_${j}[]`, optionChild['descripcion']);
        formData.append(`opcion_estado_${j}[]`, optionChild['estado']);
        formData.append(`opcion_tipo_${j}[]`, optionChild['tipo']);

      }

    }

    for (let j = 0; j < program.archivos.listadoArchivos!.length; j++) {
      if (program.archivos.listadoArchivos[j]['file'] instanceof File) {
        formData.append(`file[]`, program.archivos.listadoArchivos[j]['file']);
      } else {
        const filePrograma = {
          id_archivo_programacion: program.archivos.listadoArchivos[j]['id_archivo_programacion'],
          url: program.archivos.listadoArchivos[j]['url'],
          ...program.archivos.listadoArchivos[j]['file'],
        };
        formData.append(`file_viejo[]`, JSON.stringify(filePrograma));
      }
    }

    this.accesoService.saveProgram(formData).subscribe(data => {
      if (!data.status) { alertify.error(data.message); }
      this.programmingForm = this.defaultForm();
      this.saved.emit(true);
    });
  }

  defaultForm(): FormGroup {
    return this.builder.group({
      titulo: ['', [Validators.required, Validators.maxLength(500)]],
      descripcion: ['', [Validators.maxLength(5000)]],
      orden: [this.orden, [Validators.required]],
      tipo: ['1', [Validators.required]],
      id_convocado_reunion: [null],
      id_rol_acta: [null],
      id_programa: [null],
      estado: ['0'],
      opciones: this.builder.group({
        opcion_descripcion: [''],
        listadoOpciones: this.builder.array([])
      }),
      archivos: this.builder.group({
        text_input: [''],
        listadoArchivos: this.builder.array([])
      }),
      rolesActas: this.builder.group({
        descripcion: ['', [Validators.maxLength(100)]],
        firma: [false],
        acta: [false],
      }),
    })
  }

  autocompletarRolActa = (value: string) => {
    const rolActa = this.rolesActas.find(elm => elm.id_rol_acta === +value);
    if (rolActa) { this.programmingForm.get('rolesActas')?.get('descripcion')?.setValue(rolActa?.descripcion); }
  }

  removerRecursoActa(index: number) {
    alertify.success('Postulación eliminada correctamente');
    const optionList = this.programmingForm.get('opciones')?.get('listadoOpciones') as FormArray;
    optionList.removeAt(index);
  }

  removerRecursoActaOpcion(option: FormGroup, index: number) {
    alertify.success('Postulación eliminada correctamente');
    const optionList = option.get('opciones')?.get('listadoOpciones') as FormArray;
    optionList.removeAt(index);
  }

  /**
   * Detecta los archivos seleccionados y les hace un push al array de archivos ya sea de un programa o una opcion
   */
  detectFiles = (event: Event, archivos: FormArray) => {
    let files = (event.target as HTMLInputElement).files;
    if (files) {
      for (let file of Array.from(files)) {
        let reader = new FileReader();
        reader.onload = (e: any) => {
          archivos.push(this.builder.group(({ file, url: e.target.result })));
          this.cdr.markForCheck();
        };
        reader.readAsDataURL(file);
      }
    }
  }

  /**
   * Elimina alguno de los archivos seleccionados y listados
   * @param i Indice del archivo
   * @param archivos Información completa del archivo, de aqui se toma el indice
   */
  removeArchivo = (i: number, archivos: FormArray) => {
    archivos.removeAt(i);
  }

  /**
   * Agrega una opcion al array de opciones que tiene un programa
   */
  agregarOpcion = () => {
    const valor = this.programmingForm.value.opciones.opcion_descripcion;
    if (this.programmingForm.get('opciones')?.get('opcion_descripcion')?.valid && valor !== '') {
      (this.programmingForm.get('opciones')?.get('listadoOpciones') as FormArray).push(this.builder.group({
        titulo: [`${this.programmingForm.value.opciones.opcion_descripcion}`, [Validators.required, Validators.maxLength(500)]],
        descripcion: ['', [Validators.maxLength(5000)]],
        tipo: ['1', [Validators.required]],
        estado: ['0'],
        id_rol_acta: [null],
        id_convocado_reunion: [null],
        opciones: this.builder.group({
          opcion_descripcion: [''],
          listadoOpciones: this.builder.array([])
        }),
        archivos: this.builder.group({
          text_input: [''],
          listadoArchivos: this.builder.array([])
        }),
      }));
      alertify.success('Se agrego la opción');
      this.programmingForm.get('opciones')?.get('opcion_descripcion')?.setValue('');
    } else {
      alertify.error('El valor ingresado no es valido');
    }
  }

  /**
   * Habilita la opciónde soltar en las zonas de destino de los convocados
   * @param {DragEvent} event
   */
  allowOptionDropItem = (event: DragEvent) => {
    const eventTarget = event.target as HTMLElement;
    (eventTarget.tagName !== 'INPUT' || (event.dataTransfer && event.dataTransfer.effectAllowed === 'copyLink')) && event.preventDefault();
  }

  /**
   * Actualiza el diseño de las areas de soltar
   * @param {DragEvent} event
   */
  dropOptionDragItem = (event: DragEvent) => {
    if (!this.containsFiles(event)) {
      event.preventDefault();
      if (event.dataTransfer && event.dataTransfer.items.length > 0) {
        event.dataTransfer.items[0].getAsString((jsonData) => {
          const data = JSON.parse(jsonData);
          /** @type {?HTMLElement} */
          const element = this.getRealContainer(event.target as HTMLElement) as HTMLElement;
          /** @type {?HTMLElement} */
          const target = this.getTargetContainer(event.target as HTMLElement) as HTMLElement;
          const targetZone = target.getAttribute('droppable');
          if (element) {
            element.classList.remove('form-option-item-droppable-area');
            element.removeAttribute('data-counter');
            this.changeOptionUbication({
              objective: { item: element.getAttribute('data-index'), zone: targetZone },
              drag: { item: data.dragItem, zone: data.dropZone }
            });
            if (target) {
              target.classList.remove('container-droppable-area');
              target.classList.remove('target-droppable-area');
              target.removeAttribute('data-counter');
            }
          } else {
            if (target) {
              target.classList.remove('container-droppable-area');
              target.classList.remove('target-droppable-area');
              target.removeAttribute('data-counter');
              this.changeOptionUbication({
                objective: { item: null, zone: targetZone !== 'delete-option' ? targetZone : null },
                drag: { item: data.dragItem, zone: data.dropZone }
              });
            }
          }
        });
      }
    }
  }

  /**
   * Verifica que lo que se está arrastrando no sea un archivo
   * @param {DragEvent} event
   * @returns
   */
  containsFiles = (event: DragEvent): boolean => {
    if (event.dataTransfer && event.dataTransfer.types) {
      for (var i = 0; i < event.dataTransfer.types.length; i++) {
        if (event.dataTransfer.types[i] == "Files") { return true; }
      }
    } return false;
  }

  /**
   * Obtiene un elemento por el que se intercambiará otro
   * @param {HTMLElement} item Elemento objetivo
   */
  getRealContainer = (item: HTMLElement): HTMLElement | null => { return item ? (item.draggable === true ? item : (item.parentElement ? this.getRealContainer(item.parentElement as HTMLElement) : null)) : null; }

  /**
   * Obtiene un elemento que que espera otro
   * @param {HTMLElement} item Elemento objetivo
   */
  getTargetContainer = (item: HTMLElement): HTMLElement | null => { return item ? (item.getAttribute('droppable') !== null ? item : (item.parentElement ? this.getTargetContainer(item.parentElement as HTMLElement) : null)) : null; }

  /** Actualiza la ubicaciión del elemento movido */
  changeOptionUbication = ({ drag, objective }: { drag: { zone: string, item: string }, objective: { zone: string | null, item: string | null } }) => {
    if (drag.item !== objective.item) {
      const optionList = this.programmingForm.get('opciones')?.get('listadoOpciones') as FormArray;
      const dragItemElement = optionList.controls[+drag.item] as FormGroup;
      optionList.removeAt(+drag.item);
      if (objective.zone) {
        const targetItemIndex = objective.item !== null ? (+objective.item > +drag.item ? (+objective.item - 1) : +objective.item) : optionList.length;
        optionList.insert(targetItemIndex, dragItemElement);
        alertify.success('Elemento movido correctamente');
      } else {
        this.eliminado.emit({ form: optionList, index: +drag.item, control: dragItemElement });

        const modalConfirmacion = document.querySelector('#programming-option-remove-modal') as HTMLElement;
        const modalToOpenInstance = bootstrap.Modal.getOrCreateInstance(modalConfirmacion);

        const modalConvocatoria = document.querySelector('#programming-modal') as HTMLElement;
        const modalToCloseInstance = bootstrap.Modal.getOrCreateInstance(modalConvocatoria);
        modalToCloseInstance?.hide();

        modalToOpenInstance?.show();

        modalConfirmacion.addEventListener('hidden.bs.modal', (event: any) => {
          this.abrirModalOpciones();
        });
      }
      optionList.updateValueAndValidity();
    }
  }

  abrirModalOpciones = () => {
    const modalConfirmacion = document.querySelector('#programming-option-remove-modal') as HTMLElement;
    const modalToOpenInstance = bootstrap.Modal.getOrCreateInstance(modalConfirmacion);
    modalToOpenInstance?.hide();

    const modalConvocatoria = document.querySelector('#programming-modal') as HTMLElement;
    const modalToCloseInstance = bootstrap.Modal.getOrCreateInstance(modalConvocatoria);
    modalToCloseInstance?.show();
  }

  /**
 * Añade la sección de "Suelte aquí" a los contenedores de lista y borde a los contenedores de caída
 * @param {DragEvent} event Información del evento
 * @param {boolean} enable Habilitar/Deshabilitar
 */
  setOptionContainerDropArea = (event: DragEvent, enable: boolean) => {
    if (!this.containsFiles(event)) {
      /** @type {?HTMLElement} */
      const container = this.getTargetContainer(event.target as HTMLElement);
      if (container) {
        /** Añade un contador al elemento contenedor de la lista (Se usa para que el evento de los nodos hijos no afecten el del nodo padre) */
        const counter = container.getAttribute('data-counter');
        if (enable) {
          /** Aumenta el contador cada vez que ingresa al método */
          counter === null ? container.setAttribute('data-counter', '0') : container.setAttribute('data-counter', `${+counter + 1}`);
          container.classList.add('target-droppable-area');
          if (container.getAttribute('droppable') !== 'delete-option') {
            container.classList.add('container-droppable-area');
          }
        } else {
          /** Reduce el contador cada vez que ingresa al método */
          counter !== null && container.setAttribute('data-counter', `${+counter - 1}`);
          if ([null, 0, '0'].includes(counter)) {
            container.classList.remove('container-droppable-area');
            container.classList.remove('target-droppable-area');
            container.removeAttribute('data-counter');
          }
        }
      }
    }
  }

  /**
   * Añade la sección de "Suelte aquí" a los elementos de lista
   * @param {DragEvent} event Información del evento
   * @param {boolean} enable Habilitar/Deshabilitar
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

  /**
   * Elimina los datos de transferencia y oculta las zonas de modificación y eliminación
   * @param {DragEvent} event
   */
  breakOptionDragItem(event: DragEvent) {
    if (event.dataTransfer && event.dataTransfer.items.length > 0) {
      event.dataTransfer.items.remove(0);
      event.dataTransfer.items.clear();
    }
    /** @type {HTMLElement} Zona de eliminación */
    const dropBtn = document.querySelector('#programming-modal [droppable="delete-option"]') as HTMLElement;
    dropBtn.classList.add('fade');
  }

  /**
   * Muestra el botón de eliminar (programas) y define la data a enviar
   * @param {DragEvent} event
   */
  setOptionDragItem(event: DragEvent) {
    const eventTarget = event.target as HTMLElement;
    /** @type {string} Contenedor donde está ubiicado el elemento arrastrable */
    const from = this.getTargetContainer(eventTarget)?.getAttribute('droppable');
    /** @type {string} Identificador del elemento arrastrable */
    const target = eventTarget.getAttribute('data-index');

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.items.add(JSON.stringify({ dropZone: from, dragItem: target }), 'text/plain');
    }

    /** @type {HTMLElement} Zona de eliminación */
    const dropBtn = document.querySelector('#programming-modal [droppable="delete-option"]') as HTMLElement;
    dropBtn.classList.remove('fade');
  }

  /** Agrega una opcion al array de opciones que tiene un programa */
  agregarRecursoActa = (identificacion: string) => {
    const valor = this.summonList.find(item => item.identificacion === identificacion);
    if (!valor) { return alertify.error('El valor ingresado no es valido'); }

    const listadoOpciones = this.programmingForm.get('opciones')?.get('listadoOpciones') as FormArray;
    if (listadoOpciones.value.find((item: { titulo: string; }) => item.titulo === valor.identificacion)) {
      return alertify.error('El convocado ya ha sido postulado');
    };

    listadoOpciones.push(this.builder.group({
      titulo: [valor.identificacion, [Validators.required, Validators.maxLength(500)]],
      descripcion: [valor.nombre, [Validators.maxLength(5000)]],
      tipo: ['0'],
      estado: ['0'],
      id_rol_acta: [null],
      id_convocado_reunion: [null],
      opciones: this.builder.group({
        opcion_descripcion: [''],
        listadoOpciones: this.builder.array([])
      }),
      archivos: this.builder.group({
        listadoArchivos: this.builder.array([]),
        text_input: [''],
      }),
    }));
    alertify.success('Se postuló al convocado');
  }

  /** Agrega una opcion al array de opciones que tiene un programa */
  agregarRecursoActaOpcion = (opcion: FormGroup, identificacion: string) => {
    const valor = this.summonList.find(item => item.identificacion === identificacion);
    if (!valor) { return alertify.error('El valor ingresado no es valido'); }

    const listadoOpciones = opcion.get('opciones')?.get('listadoOpciones') as FormArray;
    if (listadoOpciones.value.find((item: { titulo: string; }) => item.titulo === valor.identificacion)) {
      return alertify.error('El convocado ya ha sido postulado');
    };

    listadoOpciones.push(this.builder.group({
      titulo: [valor.identificacion, [Validators.required, Validators.maxLength(500)]],
      descripcion: [valor.nombre, [Validators.maxLength(5000)]],
      estado: ['0'],
      tipo: ['0'],
    }));
    alertify.success('Se postuló al convocado');
  }

}
