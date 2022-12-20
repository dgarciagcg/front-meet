import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Recursos } from 'src/app/interfaces/recursos.interface';
import { ConvocadoAdicional } from 'src/app/interfaces/reuniones.interface';
import { Roles } from 'src/app/interfaces/roles.interface';

// Alertify
declare let alertify: any;
declare let bootstrap: any;

type Convocados = 'arrayConvocadosA' | 'arrayConvocadosI';

@Component({
  selector: 'app-convocatoria',
  templateUrl: './convocatoria.component.html',
  styleUrls: ['../meet-management.component.scss'],
})
export class ConvocatoriaComponent implements OnInit {

  @Input() arrayConvocadosA: ConvocadoAdicional[] = [];
  @Input() arrayConvocadosI: ConvocadoAdicional[] = [];
  @Input() formularioAgregarAsistente = new FormGroup({});
  @Input() formularioReunion = new FormGroup({});
  @Input() agregarAsistente!: () => void;
  @Input() autocompletar!: (value: string) => void;
  @Input() recursosGc_MeetYGcm: Recursos[] = [];
  @Input() arrayRoles: Roles[] = [];
  @Input() autocompletarPorNit!: (nit: string) => void;
  @Input() entidades: Recursos[] = [];
  @Input() containsFiles!: (event: DragEvent) => boolean;
  @Input() getRealContainer!: (item: HTMLElement) => HTMLElement | null;
  @Input() getTargetContainer!: (item: HTMLElement) => HTMLElement | null;
  @Input() allowDropItem!: (event: DragEvent) => void;
  @Input() seItemDropArea!: (event: DragEvent, enable: boolean, selector?: string) => void;

  @Output() eliminado = new EventEmitter<{ index: number, convocado: ConvocadoAdicional, zona: Convocados }>();

  tipoPersona: string = '0';

  constructor() { }

  ngOnInit(): void {
  }

  /**
   * Muestra el botón de eliminar (Convocados) y define la data a enviar
   * @param {DragEvent} event 
   */
  setDragItem(event: DragEvent) {
    const eventTarget = event.target as HTMLElement;
    /** @type {string} Contenedor donde está ubiicado el elemento arrastrable */
    const from = this.getTargetContainer(eventTarget)?.getAttribute('droppable');
    /** @type {string} Identificador del elemento arrastrable */
    const target = eventTarget.getAttribute('data-id');

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.items.add(JSON.stringify({ dropZone: from, dragItem: target }), 'text/plain');
    }

    /** @type {HTMLElement} Zona de actualización */
    const updateSection = document.querySelector('#summon-form-update');
    updateSection?.classList.remove('fade');
    /** @type {HTMLElement} Zona de eliminación */
    const dropBtn = document.querySelector('#summon-modal .drop-btn');
    dropBtn?.classList.remove('fade');
  }

  /**
   * Elimina los datos de transferencia y oculta las zonas de modificación y eliminación
   * @param {DragEvent} event 
   */
  breakDragItem(event: DragEvent) {
    if (event.dataTransfer && event.dataTransfer.items.length > 0) {
      event.dataTransfer.items.remove(0);
      event.dataTransfer.items.clear();
    }
    /** @type {HTMLElement} Zona de actualización */
    const updateSection = document.querySelector('#summon-form-update');
    updateSection?.classList.add('fade');
    /** @type {HTMLElement} Zona de eliminación */
    const dropBtn = document.querySelector('#summon-modal .drop-btn');
    dropBtn?.classList.add('fade');
  }

  /**
   * Añade la sección de "Suelte aquí" a los contenedores de lista y borde a los contenedores de caída
   * @param {DragEvent} event Información del evento
   * @param {boolean} enable Habilitar/Deshabilitar
   */
  setContainerDropArea(event: DragEvent, enable: boolean) {
    if (!this.containsFiles(event)) {
      const container = this.getTargetContainer(event.target as HTMLElement);
      if (container) {
        /** Añade un contador al elemento contenedor de la lista (Se usa para que el evento de los nodos hijos no afecten el del nodo padre) */
        const counter = container.getAttribute('data-counter');
        if (enable) {
          /** Aumenta el contador cada vez que ingresa al método */
          counter === null ? container.setAttribute('data-counter', '0') : container.setAttribute('data-counter', `${+counter + 1}`);
          container.classList.add('target-droppable-area');
          if (!['update', 'delete'].includes(container.getAttribute('droppable') as string)) {
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
  dropDragItem(event: DragEvent) {
    if (!this.containsFiles(event)) {
      event.preventDefault();
      if (event.dataTransfer && event.dataTransfer.items.length > 0) {
        event.dataTransfer.items[0].getAsString((jsonData) => {
          const data = JSON.parse(jsonData);
          /** @type {?HTMLElement} */
          const element = this.getRealContainer(event.target as HTMLElement);
          /** @type {?HTMLElement} */
          const target = this.getTargetContainer(event.target as HTMLElement);
          const targetZone = target?.getAttribute('droppable');
          if (element) {
            element.classList.remove('item-droppable-area');
            element.removeAttribute('data-counter');
            this.changeUbication({ ...data, targetItem: element.getAttribute('data-id'), targetZone });
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
              if (targetZone !== 'update') {
                this.changeUbication({ ...data, targetItem: null, targetZone: targetZone !== 'delete' ? targetZone : null });
              } else { this.updateSummonForm(data); }
            }
          }
        });
      }
    }
  }

  /** Actualiza la ubicación del elemento movido */
  changeUbication({ dropZone, dragItem, targetItem, targetZone }: { dropZone: Convocados; dragItem: string; targetItem: string; targetZone: Convocados | 'delete'; }) {
    if (dropZone !== targetZone || dragItem !== targetItem) {
      const dragItemIndex = this[dropZone].findIndex(elm => +elm.identificacion === +dragItem);
      const dragItemElement = this[dropZone].splice(dragItemIndex, 1);
      if (targetZone) {
        const targetItemIndex = targetItem !== null ? this[targetZone as Convocados].findIndex(elm => +elm.identificacion === +targetItem) : this[targetZone as Convocados].length;
        this[targetZone as Convocados].splice(targetItemIndex, 0, dragItemElement[0]);
        if (dragItemElement[0]) {
          dragItemElement[0].tipo = (targetZone === 'arrayConvocadosA' ? (+dragItemElement[0].tipo === 2 ? '2' : '0') : '1');
          alertify.success('Elemento movido correctamente');
        }
      } else {

        this.eliminado.emit({ index: dragItemIndex, convocado: dragItemElement[0], zona: dropZone});

        const modalConfirmacion = document.querySelector('#summon-remove-modal') as HTMLElement;
        const modalToOpenInstance = bootstrap.Modal.getOrCreateInstance(modalConfirmacion);

        const modalConvocatoria = document.querySelector('#summon-modal') as HTMLElement;
        const modalToCloseInstance = bootstrap.Modal.getOrCreateInstance(modalConvocatoria);
        modalToCloseInstance?.hide();

        modalToOpenInstance?.show();

        modalConfirmacion.addEventListener('hidden.bs.modal', (event: any) => {
          this.abrirModalConvocados();
        });
      }
    }
  }

  /**
   * Busca en el html el modal y lo cierra o lo abre
   */
  abrirModalConvocados = () => {
    const modalConfirmacion = document.querySelector('#summon-remove-modal') as HTMLElement;
    const modalToOpenInstance = bootstrap.Modal.getOrCreateInstance(modalConfirmacion);
    modalToOpenInstance?.hide();

    const modalConvocatoria = document.querySelector('#summon-modal') as HTMLElement;
    const modalToCloseInstance = bootstrap.Modal.getOrCreateInstance(modalConvocatoria);
    modalToCloseInstance?.show();
  }

  /** Actualiza los datos del formulario con base en el elemento arrastrado */
  updateSummonForm({ dropZone, dragItem }: { dropZone: Convocados; dragItem: string; }) {
    const dragItemElement = this[dropZone].find(elm => +elm.identificacion === +dragItem);
    if (dragItemElement) {
      Object.keys(dragItemElement).forEach(key => {
        const inputTarget = this.formularioAgregarAsistente.get(key);
        if (inputTarget) {
          inputTarget.setValue(![null, undefined].includes(dragItemElement[key as keyof ConvocadoAdicional] as any) ? `${dragItemElement[key as keyof ConvocadoAdicional]}` : '');
        }
      });
    }
  }

  /**
   * Verifica el valor del check y lo cambia para actorizar el acta de un convocado
   * @param i Aqui viene el index del convocado a verificar y actualizar
   */
  actorizacionActa = (i: number) => {
    if (this.arrayConvocadosA[i].acta === '0') {
      this.arrayConvocadosA[i].acta = '1';
    } else {
      this.arrayConvocadosA[i].acta = '0';
    } 
  }

  /**
   * Verifica el valor del check y lo cambia para actorizar la firma de un convocado
   * @param i Aqui viene el index del convocado a verificar y actualizar
   */
  actorizacionFirma = (i: number) => {
    if (this.arrayConvocadosA[i].firma === '0') {
      this.arrayConvocadosA[i].firma = '1';
    } else {
      this.arrayConvocadosA[i].firma = '0';
    } 
  }
}
