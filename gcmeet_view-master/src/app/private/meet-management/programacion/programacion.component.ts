import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Recursos } from 'src/app/interfaces/recursos.interface';
import { Programas, RolesActas } from 'src/app/interfaces/reuniones.interface';
import { GetFormArrayPipe } from 'src/app/pipes/get-form-array.pipe';
import { environment } from 'src/environments/environment';

interface ProgramasForm extends Omit<Programas, 'opciones' | 'archivos'> {
    opciones: {
        listadoOpciones: Programas['opciones'];
        opcion_descripcion: string;
    }
    archivos: {
        listadoArchivos: Programas['archivos'];
        text_input: string;
    }
    rolesActas: {

    }
}

declare let alertify: any;
declare let bootstrap: any;

@Component({
    selector: 'app-programacion',
    templateUrl: './programacion.component.html',
    providers: [GetFormArrayPipe],
    styleUrls: ['../meet-management.component.scss'],
})
export class ProgramacionComponent implements OnInit {

    @Output() eliminado = new EventEmitter<{ form: FormArray; control: FormGroup; index: number; }>();
    @Output() removerRecursoActaEmitter = new EventEmitter<number>();
    storage = `${environment.storage}/`;

    @Input() getRealContainer!: (item: HTMLElement) => HTMLElement | null;
    @Input() getTargetContainer!: (item: HTMLElement) => HTMLElement | null;
    @Input() containsFiles!: (event: DragEvent) => boolean;
    @Input() programacion = new FormGroup({});
    @Input() agregarPrograma!: () => void;
    @Input() detectFiles!: (event: Event, archivos: FormArray) => void;
    @Input() removeArchivo!: (i: number, archivos: FormArray) => void;
    @Input() agregarOpcion!: () => void;
    @Input() agregarRecursoActa!: (identificacion: string) => void;
    @Input() seItemDropArea!: (event: DragEvent, enable: boolean, selector?: string) => void;
    @Input() cancelarModificacion!: () => void;
    @Input() dataCompleta: Recursos[] = [];
    @Input() formularioReunion = new FormGroup({});
    @Input() rolesActas: RolesActas[] = [];

    tipoRespuesta: string = '';
    recurso!: Recursos | undefined;

    public message = alertify;

    constructor(
        private fb: FormBuilder,
        public domSanitizer: DomSanitizer,
        public getFormArray: GetFormArrayPipe
    ) { }

    ngOnInit(): void { }

    /**
     * Consulta todos los programas
     */
    get controlProgramas(): FormArray { return this.programacion.get('programas') as FormArray; }
    get programas(): ProgramasForm[] { return this.programacion.get('programas')?.value; }
    getValue(control: AbstractControl): ProgramasForm { return control.value; }

    get archivos(): FormArray {
        return this.programacion.get('formulario')?.get('archivos')?.get('listadoArchivos') as FormArray;
    };

    /**
     * Obtiene un elemento por el que se intercambiará otro
     * @param {HTMLElement} item Elemento objetivo
     */
    getProgrammingRealContainer(item: HTMLElement) { return item ? (item.draggable === true && !item.classList.contains('first-lvl') ? item : (item.parentElement ? this.getRealContainer(item.parentElement) : null)) : null; }

    /**
     * Habilita/Deshabilita la capacidad de los elementos de ser soltados en el contenedor
     * @returns Verdadero cuando el elemento agarrado se puede soltar o falso cuando no
     */
    checkPermission() {
        return document.querySelector('[grabbing-area="programming-list"]') ? true : false;
    }

    /**
     * Habilita la opciónde soltar en las zonas de destino de los convocados
     * @param {DragEvent} event
    */
    allowProgrammingDropItem(event: DragEvent) {
        if (this.checkPermission()) {
            event.preventDefault();
        }
    }

    /**
     * Muestra el botón de eliminar (programación) y define la data a enviar
     * @param {DragEvent} event
     */
    setProgrammingDragItem(event: DragEvent) {
        const eventTarget = event.target as HTMLElement;
        eventTarget.setAttribute('grabbing-area', 'programming-list');
        /** @type {string} Contenedor donde está ubiicado el elemento arrastrable */
        const from = this.getTargetContainer(eventTarget)?.getAttribute('droppable');
        /** @type {string} Identificador del elemento arrastrable */
        const target = eventTarget.getAttribute('data-index');

        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.items.add(JSON.stringify({ type: 'list', dropZone: from, dragItem: target }), 'text/plain');
        }
        /** @type {HTMLElement} Zona de actualización */
        const updateSection = document.querySelector('#programming-form-update') as HTMLElement;
        updateSection.classList.remove('fade');
        /** @type {HTMLElement} Zona de eliminación */
        const dropBtn = document.querySelector('#programming-modal [droppable="delete"]') as HTMLElement;
        dropBtn.classList.remove('fade');
    }

    /**
     * Elimina los datos de transferencia y oculta las zonas de modificación y eliminación
     * @param {DragEvent} event
     */
    breakProgrammingDragItem(event: DragEvent) {
        const eventTarget = event.target as HTMLElement;
        eventTarget.removeAttribute('grabbing-area');
        if (event.dataTransfer && event.dataTransfer.items.length > 0) {
            event.dataTransfer.items.remove(0);
            event.dataTransfer.items.clear();
        }
        /** @type {HTMLElement} Zona de actualización */
        const updateSection = document.querySelector('#programming-form-update') as HTMLElement;
        updateSection.classList.add('fade');
        /** @type {HTMLElement} Zona de eliminación */
        const dropBtn = document.querySelector('#programming-modal [droppable="delete"]') as HTMLElement;
        dropBtn.classList.add('fade');
    }

    /**
     * Añade la sección de "Suelte aquí" a los contenedores de lista y borde a los contenedores de caídas
     * @param {DragEvent} event Información del evento
     * @param {boolean} enable Habilitar/Deshabilitar
     */
    setProgrammingContainerDropArea(event: DragEvent, enable: boolean) {
        if (!this.containsFiles(event)) {
            if (this.checkPermission()) {
                const eventTarget = event.target as HTMLElement;
                /** @type {?HTMLElement} */
                const container = this.getTargetContainer(eventTarget) as HTMLElement;
                /** @type {?HTMLElement} */
                let parentContainer = this.getTargetContainer(container.parentElement as HTMLElement) as HTMLElement;
                !parentContainer && (parentContainer = container);
                if (container) {
                    /** Añade un contador al elemento contenedor de la lista (Se usa para que el evento de los nodos hijos no afecten el del nodo padre) */
                    const counter = parentContainer.getAttribute('data-counter');
                    if (enable) {
                        /** Aumenta el contador cada vez que ingresa al método */
                        counter === null ? parentContainer.setAttribute('data-counter', '0') : parentContainer.setAttribute('data-counter', `${+counter + 1}`);
                        parentContainer.classList.add('programming-target-droppable-area');
                        if (!['update', 'delete'].includes(container.getAttribute('droppable') as string)) {
                            parentContainer.classList.add('programming-container-droppable-area');
                        }
                    } else {
                        /** Reduce el contador cada vez que ingresa al método */
                        counter !== null && parentContainer.setAttribute('data-counter', `${+counter - 1}`);
                        if ([null, 0, '0'].includes(counter)) {
                            parentContainer.classList.remove('programming-target-droppable-area');
                            parentContainer.classList.remove('programming-container-droppable-area');
                            parentContainer.removeAttribute('data-counter');
                        }
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
    seProgrammingDropArea(event: DragEvent, enable: boolean) {
        if (!this.containsFiles(event)) {
            if (this.checkPermission()) {
                const grabElement = document.querySelector('[grabbing-area="programming-list"]') as HTMLElement;
                const allow = grabElement.classList.contains('option-dragged') || (grabElement !== event.target && !grabElement.contains(event.target as HTMLElement));
                /** @type {HTMLElement} */
                const element = this.getProgrammingRealContainer(event.target as HTMLElement);
                if (element) {
                    /** Añade un contador al elemento contenedor de la lista (Se usa para que el evento de los nodos hijos no afecten el del nodo padre) */
                    const counter = element.getAttribute('data-counter');
                    if (enable) {
                        /** Aumenta el contador cada vez que ingresa al método */
                        counter === null ? element.setAttribute('data-counter', '0') : element.setAttribute('data-counter', `${+counter + 1}`);
                        allow && element.classList.add('programming-item-droppable-area');
                    } else {
                        /** Reduce el contador cada vez que ingresa al método */
                        counter !== null && element.setAttribute('data-counter', `${+counter - 1}`);
                        if ([null, 0, '0'].includes(counter)) {
                            element.classList.remove('programming-item-droppable-area');
                            element.removeAttribute('data-counter');
                        }
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
    seOptionDropArea(event: DragEvent, enable: boolean) {
        if (!this.containsFiles(event)) {
            if (this.checkPermission()) {
                const grabElement = document.querySelector('[grabbing-area="programming-list"]') as HTMLElement;
                const allow = grabElement !== event.target && !grabElement.contains(event.target as HTMLElement);
                /** @type {HTMLElement} */
                const element = this.getRealContainer(event.target as HTMLElement);
                if (element) {
                    /** Añade un contador al elemento contenedor de la lista (Se usa para que el evento de los nodos hijos no afecten el del nodo padre) */
                    const counter = element.getAttribute('data-counter');
                    if (enable) {
                        /** Aumenta el contador cada vez que ingresa al método */
                        counter === null ? element.setAttribute('data-counter', '0') : element.setAttribute('data-counter', `${+counter + 1}`);
                        allow && element.classList.add('option-item-droppable-area');
                        element.classList.add('option-dragged');
                    } else {
                        /** Reduce el contador cada vez que ingresa al método */
                        counter !== null && element.setAttribute('data-counter', `${+counter - 1}`);
                        if ([null, 0, '0'].includes(counter)) {
                            element.classList.remove('option-dragged');
                            element.classList.remove('option-item-droppable-area');
                            element.removeAttribute('data-counter');
                        }
                    }
                }
            }
        }
    }

    /**
     * Actualiza el diseño de las areas de soltar
     * @param {DragEvent} event
     */
    dropProgrammingDragItem(event: DragEvent) {

        if (!this.containsFiles(event)) {
            event.preventDefault();
            if (this.checkPermission()) {
                if (event.dataTransfer && event.dataTransfer.items.length > 0) {
                    event.dataTransfer.items[0].getAsString((jsonData) => {
                        const eventTarget = event.target as HTMLElement;
                        const data = JSON.parse(jsonData);

                        const objective: { element: HTMLElement, target: HTMLElement } = { target: this.getTargetContainer(eventTarget) as HTMLElement, element: this.getRealContainer(eventTarget) as HTMLElement };
                        const programming: { element: HTMLElement, target?: HTMLElement } = { element: this.getProgrammingRealContainer(eventTarget) as HTMLElement };
                        programming.target = this.getTargetContainer(programming.element) as HTMLElement;

                        if (objective.element) {
                            programming.element?.classList.remove('programming-item-droppable-area');
                            objective.element.classList.remove('option-item-droppable-area');
                            programming.element?.removeAttribute('data-counter');
                            objective.element.removeAttribute('data-counter');
                            if (programming.target) {
                                programming.target.classList.remove('programming-container-droppable-area');
                                programming.target.classList.remove('programming-target-droppable-area');
                                programming.target.removeAttribute('data-counter');
                            }
                            this.changeProgrammingUbication({
                                objective: { item: objective.element.getAttribute('data-index'), zone: objective.target.getAttribute('droppable') },
                                drag: { item: data.dragItem, zone: data.dropZone },
                            });
                        } else if (objective.target) {
                            objective.target.classList.remove('programming-container-droppable-area');
                            objective.target.classList.remove('programming-target-droppable-area');
                            objective.target.removeAttribute('data-counter');
                            const targetZone = objective.target.getAttribute('droppable');
                            if (targetZone !== 'update') {
                                this.changeProgrammingUbication({
                                    objective: { item: null, zone: targetZone !== 'delete' ? targetZone : null },
                                    drag: { item: data.dragItem, zone: data.dropZone },
                                });
                            } else { this.updateProgrammingForm({ item: data.dragItem, zone: data.dropZone }); }
                        }
                    });
                }
            }
        }
    }
    /** Actualiza la ubicaciión del elemento movido */
    changeProgrammingUbication({ drag, objective }: { drag: { zone: string, item: string }, objective: { zone: string | null, item: string | null } }) {
        // Valida que un programa no se suelte sobre el mismo programa o sus opciones
        if ((drag.zone !== objective.zone || drag.item !== objective.item) && drag.item !== objective.zone) {
            if (drag.zone === 'programming') {
                const dragZone = this.controlProgramas;
                const dragIndex = +drag.item;
                const dragElement = dragZone.controls[dragIndex] as FormGroup;
                dragZone.removeAt(dragIndex);
                if (objective.zone === 'programming') {
                    const objectiveZone = this.controlProgramas;
                    if (objective.item !== null) {
                        let objectiveIndex = +objective.item;
                        objectiveIndex > dragIndex && (objectiveIndex--);
                        objectiveZone.insert(objectiveIndex, dragElement);
                    } else { objectiveZone.insert(objectiveZone.controls.length, dragElement); }
                    objectiveZone.updateValueAndValidity();
                    alertify.success('Elemento movido correctamente');
                }
                else if (objective.zone !== null) {
                    dragElement.get('tipo')?.setValue(0);
                    dragElement.removeControl('opciones');
                    const zoneIndex = +objective.zone > dragIndex ? (+objective.zone - 1) : +objective.zone;
                    const objectiveZone = this.controlProgramas.controls[zoneIndex]?.get('opciones')?.get('listadoOpciones') as FormArray;
                    if (objective.item?.includes('-')) {
                        const realIndex = objective.item.split('-')[1];
                        const objectiveIndex = +realIndex;
                        objectiveZone.insert(objectiveIndex, dragElement);
                    } else { objectiveZone.insert(objectiveZone.controls.length, dragElement); }
                    objectiveZone.updateValueAndValidity();
                    alertify.success('Elemento movido correctamente');
                }
                else if (objective.zone === null) {

                    this.eliminado.emit({ form: dragZone, index: dragIndex, control: dragElement });

                    const modalConfirmacion = document.querySelector('#programming-remove-modal') as HTMLElement;
                    const modalToOpenInstance = bootstrap.Modal.getOrCreateInstance(modalConfirmacion);

                    const modalConvocatoria = document.querySelector('#programming-modal') as HTMLElement;
                    const modalToCloseInstance = bootstrap.Modal.getOrCreateInstance(modalConvocatoria);
                    modalToCloseInstance?.hide();

                    modalToOpenInstance?.show();

                    modalConfirmacion.addEventListener('hidden.bs.modal', (event: any) => {
                        this.abrirModalProgramacion();
                    });

                }
                dragZone.updateValueAndValidity();
            } else {
                const dragZone = this.controlProgramas.get(drag.zone)?.get('opciones')?.get('listadoOpciones') as FormArray;
                const realIndex = drag.item.split('-')[1];
                const dragIndex = +realIndex;
                const dragElement = dragZone.controls[dragIndex] as FormGroup;
                dragZone.removeAt(dragIndex);
                if (objective.zone === 'programming') {
                    dragElement.get('tipo')?.setValue(0);
                    dragElement.addControl('opciones', this.fb.group({
                        opcion_descripcion: [''],
                        listadoOpciones: this.fb.array([])
                    }));
                    const objectiveZone = this.controlProgramas;
                    if (objective.item !== null) {
                        const objectiveIndex = +objective.item;
                        objectiveZone.insert(objectiveIndex, dragElement);
                    } else { objectiveZone.insert(objectiveZone.controls.length, dragElement); }
                    objectiveZone.updateValueAndValidity();
                    alertify.success('Elemento movido correctamente');
                } else if (objective.zone !== null) {
                    const objectiveZone = this.controlProgramas.get(objective.zone)?.get('opciones')?.get('listadoOpciones') as FormArray;
                    if (drag.zone === objective.zone) {
                        if (objective.item?.includes('-')) {
                            const objRealIndex = objective.item.split('-')[1];
                            const objectiveIndex = +objRealIndex > dragIndex ? (+objRealIndex - 1) : +objRealIndex;
                            objectiveZone.insert(objectiveIndex, dragElement);
                        } else { objectiveZone.insert(objectiveZone.controls.length, dragElement); }
                    } else {
                        if (objective.item?.includes('-')) {
                            const objRealIndex = objective.item.split('-')[1];
                            const objectiveIndex = +objRealIndex;
                            objectiveZone.insert(objectiveIndex, dragElement);
                        } else { objectiveZone.insert(objectiveZone.controls.length, dragElement); }
                    }
                    objectiveZone.updateValueAndValidity();
                    alertify.success('Elemento movido correctamente');
                } else if (objective.zone === null) {
                    this.eliminado.emit({ form: dragZone, index: dragIndex, control: dragElement });

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
                dragZone.updateValueAndValidity();
            }
        }
    }

    abrirModalProgramacion = () => {
        const modalConfirmacion = document.querySelector('#programming-remove-modal') as HTMLElement;
        const modalToOpenInstance = bootstrap.Modal.getOrCreateInstance(modalConfirmacion);
        modalToOpenInstance?.hide();

        const modalConvocatoria = document.querySelector('#programming-modal') as HTMLElement;
        const modalToCloseInstance = bootstrap.Modal.getOrCreateInstance(modalConvocatoria);
        modalToCloseInstance?.show();
    }

    abrirModalOpciones = () => {
        const modalConfirmacion = document.querySelector('#programming-option-remove-modal') as HTMLElement;
        const modalToOpenInstance = bootstrap.Modal.getOrCreateInstance(modalConfirmacion);
        modalToOpenInstance?.hide();

        const modalConvocatoria = document.querySelector('#programming-modal') as HTMLElement;
        const modalToCloseInstance = bootstrap.Modal.getOrCreateInstance(modalConvocatoria);
        modalToCloseInstance?.show();
    }

    /** Actualiza los datos del formulario con base en el elemento arrastrado */
    updateProgrammingForm({ item, zone }: { zone: string, item: string }) {
        const index = zone === 'programming' ? item : zone;
        const contenedorInput = document.querySelector('#programming-form #index-programa') as HTMLElement;
        const inputIndice = contenedorInput.querySelector('input') as HTMLInputElement;
        contenedorInput.hidden = false;
        inputIndice.setAttribute('data-value', index)
        inputIndice.value = `Modificando programa # ${+index + 1}`;
        const dragItemElement = this.controlProgramas.controls[+index];
        this.programacion.removeControl('formulario');
        this.programacion.addControl('formulario', this.copyFormControl(dragItemElement));
        document.querySelector('#programming-list-update')?.classList.remove('fade');
    }


    /**OPCIONES */

    /**
     * Habilita la opciónde soltar en las zonas de destino de los convocados
     * @param {DragEvent} event
     */
    allowOptionDropItem = (event: DragEvent) => {
        const eventTarget = event.target as HTMLElement;
        (eventTarget.tagName !== 'INPUT' || (event.dataTransfer && event.dataTransfer.effectAllowed === 'copyLink')) && event.preventDefault();
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

    /** Actualiza la ubicaciión del elemento movido */
    changeOptionUbication = ({ drag, objective }: { drag: { zone: string, item: string }, objective: { zone: string | null, item: string | null } }) => {
        if (drag.item !== objective.item) {
            const optionList = this.programacion.get('formulario')?.get('opciones')?.get('listadoOpciones') as FormArray;
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

    copyFormControl(control: AbstractControl): AbstractControl {
        if (control instanceof FormControl) {
            return new FormControl(control.value);
        } else if (control instanceof FormGroup) {
            const copy = new FormGroup({});
            Object.keys(control.controls).forEach(key => {
                copy.addControl(key, this.copyFormControl(control.controls[key]));
            });
            return copy;
        } else if (control instanceof FormArray) {
            const copy = new FormArray([]);
            control.controls.forEach(control => {
                copy.push(this.copyFormControl(control));
            })
            return copy;
        } else { return control; }
    }

    leerValueOption = (value: string) => this.tipoRespuesta = value;

    autocompletarRolActa = (value: string) => {
        const rolActa = this.rolesActas.find(elm => elm.id_rol_acta === +value);
        if (rolActa) { this.programacion.get('formulario')?.get('rolesActas')?.get('descripcion')?.setValue(rolActa?.descripcion); }
    }

    removerRecursoActa = (index: number) => {
        this.removerRecursoActaEmitter.emit(index);
    }

}
