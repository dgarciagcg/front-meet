import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { MeetManagementService } from 'src/app/services/meet-management.service';
import { AccesoReunionService } from 'src/app/services/acceso-reunion.service';

import { ConvocadoAdicional, Reuniones } from 'src/app/interfaces/reuniones.interface';
import { Recursos } from 'src/app/interfaces/recursos.interface';
import { Roles } from 'src/app/interfaces/roles.interface';

declare const bootstrap: any;
declare const alertify: any;

@Component({
  selector: 'app-estructura-convocado',
  templateUrl: './estructura-convocado.component.html',
  styleUrls: ['./estructura-convocado.component.scss']
})
export class EstructuraConvocadoComponent implements OnInit {

  @Output() saved = new EventEmitter<boolean>();

  @Input() meet!: Reuniones;

  tipoPersona: string = '0';

  summonedForm = new FormGroup({});

  // Roles
  arrayRoles: Roles[] = [];

  // Recursos
  dataCompleta: Recursos[] = [];
  recursosGc_MeetYGcm: Recursos[] = [];
  recursosParaVerificar: Recursos[] = [];
  entidadesUnicas: Recursos[] = [];
  recursos: Recursos[] = [];
  entidades: Recursos[] = [];
  recursos_gcm: Recursos[] = [];

  // Convocados
  arrayConvocadosA: ConvocadoAdicional[] = [];
  arrayConvocadosI: ConvocadoAdicional[] = [];
  convocadosMeet: ConvocadoAdicional[] = [];
  arrayCompleto: ConvocadoAdicional[] = [];

  constructor(
    private meetManagementService: MeetManagementService,
    private accesoService: AccesoReunionService,
    private cdr: ChangeDetectorRef,
    private builder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForm(this.meet.id_reunion);

    const recursosPromise = firstValueFrom(this.meetManagementService.getRecursos(this.meet.id_grupo));
    const recursosGCMPromise = firstValueFrom(this.meetManagementService.getRecursosGcm());
    const summonedPromise = firstValueFrom(this.meetManagementService.getConvocadosMeet(this.meet.id_reunion));
    const rolesPromise = firstValueFrom(this.meetManagementService.getRoles(this.meet.id_reunion));

    Promise.all([summonedPromise, recursosPromise, recursosGCMPromise, rolesPromise]).then(([convocados, recursos, recursos_gcm, data]) => {
      this.convocadosMeet = convocados;
      for (let i = 0; i < this.convocadosMeet.length; i++) {
        if (this.convocadosMeet[i].tipo === '0' || this.convocadosMeet[i].tipo === '2') {
          this.arrayConvocadosA.push(this.convocadosMeet[i]);
        } else {
          this.arrayConvocadosI.push(this.convocadosMeet[i]);
        }
      }

      this.dataCompleta = recursos;
      this.dataCompleta.sort(function (a, b) {
        if (a.nombre < b.nombre) { return -1; }
        if (a.nombre > b.nombre) { return 1; }
        return 0;
      });

      this.recursosParaVerificar = this.dataCompleta;
      // .filter(elm => elm.nit === null);
      this.entidadesUnicas = this.dataCompleta.filter(elm => elm.nit !== null).sort((a, b) => {
        if (a.fecha && b.fecha) {
          let fechaA = new Date(+a.fecha.slice(0, 4), +a.fecha.slice(5, 7) - 1, +a.fecha.slice(8, 10), +a.fecha.slice(11, 13), +a.fecha.slice(14, 16), +a.fecha.slice(17, 19)).getTime();
          let fechaB = new Date(+b.fecha.slice(0, 4), +b.fecha.slice(5, 7) - 1, +b.fecha.slice(8, 10), +b.fecha.slice(11, 13), +b.fecha.slice(14, 16), +b.fecha.slice(17, 19)).getTime();
          if (fechaA >= fechaB) {
            return -1;
          } else {
            return 1;
          }
        }
        return 1;
      });

      this.entidadesUnicas = Array.from(new Set(this.entidadesUnicas.map(item => `${item.nit}`))).map(item => this.entidadesUnicas.find(elm => `${elm.nit}` === item)) as Recursos[];
      this.arrayCompleto = [...this.arrayConvocadosA, ...this.arrayConvocadosI];

      for (let i = 0; i < this.recursosParaVerificar.length; i++) {
        let existe = false;
        for (let j = 0; j < this.arrayCompleto.length; j++) {
          if (this.arrayCompleto[j].identificacion === this.recursosParaVerificar[i].identificacion) {
            existe = true;
            j = this.arrayCompleto.length;
          }
        }
        if (existe === false) { this.recursos.push(this.recursosParaVerificar[i]); }
      }

      for (let i = 0; i < this.entidadesUnicas.length; i++) {
        let existe = false;
        for (let j = 0; j < this.arrayCompleto.length; j++) {
          if (this.arrayCompleto[j].identificacion === this.entidadesUnicas[i].identificacion) {
            existe = true;
            j = this.arrayCompleto.length;
          }
        }
        if (existe === false) { this.entidades.push(this.entidadesUnicas[i]); }
      }

      this.recursos_gcm = recursos_gcm;
      this.recursosGc_MeetYGcm = [...this.recursos, ...this.recursos_gcm];

      this.arrayRoles = data;

      this.cdr.markForCheck();
    });
  }

  /**
  * Inicializa el formulario para agregar un asistente a la reunión, se inicia con valores por defecto y validaciones
  */
  initForm = (id_reunion: number) => {
    this.summonedForm = this.builder.group({
      id_reunion: [id_reunion],
      identificacion: ['', [Validators.required, Validators.maxLength(20)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      telefono: ['', [Validators.maxLength(20)]],
      tipo: ['0'],
      rol: ['', [Validators.required, Validators.maxLength(50)]],
      nit: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(20)]],
      razon_social: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(100)]],
      participacion: [{ value: '', disabled: true }],
      firma: ['0'],
      acta: ['0'],
    });
    this.summonedForm.get('tipo')?.valueChanges.subscribe(this.toggle);
    this.toggle('0');
  }

  /**
   * Al escribir una identificacion o darle click a alguna de las listadas para auto completar de inmediato me consulta los registros pertenecientes a ese recurso y los auto completa en el formulario
   * @param value Aqui llega la identificacion que fue escrita o seleccionada
   */
  autocompletar = (value: string) => {
    const info = this.recursosGc_MeetYGcm.find(elm => elm.identificacion === value);
    this.setValueConvocado(info ? info : { identificacion: value, nombre: '', correo: '', telefono: '', rol: '', tipo: '0', nit: '', razon_social: '', participacion: '', firma: '0', acta: '0' });
    if (info?.nit && info?.razon_social) {
      this.summonedForm.get('nit')?.disable();
      this.summonedForm.get('razon_social')?.disable();
    }
  }

  /**
 * Cuando es ejecutado, recorre el formulario y asigna los valores en cada parametro
 * @param recurso Aqui viene un objeto con clave valor de cada parametro del recurso
 * @returns Retorna un formulario diligenciado con los datos obtenidos
 */
  setValueConvocado = (recurso: any) => Object.keys(recurso).forEach(elm =>
    this.summonedForm.get(elm)?.setValue(recurso[elm])
  );

  toggle = (type: string) => {
    // habilitar/deshabilitar inputs de "nit" y "razón social"
    document.querySelectorAll('.entity-input').forEach(item => {
      const name = item.getAttribute('formcontrolname') as string;
      if (+type === 2) {
        this.summonedForm.get(name)?.enable();
        item.setAttribute('type', 'text');
      } else {
        this.summonedForm.get(name)?.disable();
        item.setAttribute('type', +type === 2 ? 'text' : 'hidden');
      }
    });

    // habilitar/deshabilitar input de "participación"
    const require: boolean = +this.meet.quorum === 1;
    const participationInput = document.querySelector('[formcontrolname="participacion"]') as HTMLInputElement;
    if (require === true && +type !== 1) {
      this.summonedForm.get('participacion')?.enable();
      participationInput.setAttribute('type', 'text');
    } else {
      this.summonedForm.get('participacion')?.disable();
      participationInput.setAttribute('type', 'hidden');
    }
  }

  /**
 * Al escribir un nit o darle click a alguna de las opciones listadas para auto completar de inmediato me consulta los registros pertenecientes a ese recurso y los auto completa en el formulario
 * @param value Aqui llega el nit que fue escrita o seleccionado
 */
  autocompletarPorNit = (nit: string) => {
    const info = this.entidades.find(elm => elm.nit === nit);
    if (info) {
      this.setValueConvocado(info ? info : { identificacion: '', nombre: '', correo: '', telefono: '', rol: '', tipo: '0', nit: nit, razon_social: '', participacion: '', firma: '0', acta: '0' });
    }

  }

  /**
 * Agrega un participante o invitado a un array temporal dependiendo del tipo
 */
  agregarConvocado = () => {

    if (this.summonedForm.valid) {

      const enabled = this.summonedForm.get('nit')?.enabled;

      this.summonedForm.get('nit')?.enable();
      this.summonedForm.get('razon_social')?.enable();

      if (+this.summonedForm.value.tipo === 2) {
        /** Verifica que no se agreguen recursos que representen a varias entidades */
        const recurso = this.recursosParaVerificar.find(elm => elm.identificacion === this.summonedForm.value.identificacion);
        if (recurso && recurso.nit && recurso.nit !== this.summonedForm.value.nit) {
          return alertify.error(`La persona seleccionada ya es representante legal de la entidad (${recurso.nit} - ${recurso.razon_social})`);
        }
        /** Verifica que no se registren varios representantes legales en la misma entidad */
        const entidad = this.recursosParaVerificar.find(elm => elm.nit === this.summonedForm.value.nit);
        if (entidad && entidad.identificacion !== this.summonedForm.value.identificacion) {
          return alertify.error(`La entidad seleccionada ya tiene un representante legal (${entidad.identificacion} - ${entidad.nombre})`);
        }
      }

      if (!enabled) {
        this.summonedForm.get('nit')?.disable();
        this.summonedForm.get('razon_social')?.disable();
      }

      this.arrayCompleto = [...this.arrayConvocadosA, ...this.arrayConvocadosI];
      let filtro = this.arrayCompleto.filter(elm => elm.identificacion === this.summonedForm.value.identificacion);
      let roles = this.arrayRoles.filter(elm => elm.descripcion === this.summonedForm.value.rol);

      if (filtro.length) { return alertify.error('El usuario ya ha sido convocado'); }

      if (roles.length === 0) {
        this.arrayRoles.push({
          id_rol: 0,
          descripcion: this.summonedForm.value.rol,
          relacion: 0,
          estado: '1',
        });
      }

      let elm = this.recursos.findIndex(elm => elm.identificacion === this.summonedForm.value.identificacion);
      if (elm != -1) {
        this.recursos.splice(elm, 1);
      }
      let elm2 = this.entidades.findIndex(elm2 => elm2.identificacion === this.summonedForm.value.identificacion);
      if (elm2 != -1) {
        this.entidades.splice(elm2, 1);
      }

      this.openModal('#summoned-add-confirm-modal', '#summoned-modal');

    } else {
      const controles = Object.keys(this.summonedForm.controls);
      for (let index = 0; index < controles.length; index++) {
        if (this.summonedForm.get(controles[index])?.invalid) {
          alertify.error(`El campo: ${controles[index]} no es válido`);
          return;
        }
      }
      alertify.error('Faltan campos por diligenciar');
    }
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

  limpiarFormulario() {
    if (this.summonedForm.value.tipo == 0) {
      this.arrayConvocadosA.push(this.summonedForm.value);
      alertify.success('Participante convocado correctamente', 2);
      this.setValueConvocado({ identificacion: '', nombre: '', telefono: '', correo: '', tipo: '0', nit: '', razon_social: '', participacion: '', firma: '0', acta: '0' });
    } else if (this.summonedForm.value.tipo == 2) {
      this.arrayConvocadosA.push(this.summonedForm.value);
      alertify.success('Entidad convocada correctamente', 2);
      this.setValueConvocado({ identificacion: '', nombre: '', telefono: '', correo: '', tipo: '2', nit: '', razon_social: '', participacion: '', firma: '0', acta: '0' });
    } else if (this.summonedForm.value.tipo == 1) {
      this.arrayConvocadosI.push(this.summonedForm.value);
      alertify.success('Invitado convocado correctamente', 2);
      this.setValueConvocado({ identificacion: '', nombre: '', telefono: '', correo: '', tipo: '1', nit: '', razon_social: '', participacion: '', firma: '0', acta: '0' });
    }
  }

  confirmarConvocado() {
    this.accesoService.summon(this.meet.id_grupo as number, this.meet.id_reunion, this.summonedForm.value).subscribe(data => {
      if (!data.status) { return alertify.error(data.message); }
      this.limpiarFormulario();
      const formData = new FormData();
      formData.append('summonedList', JSON.stringify([data.message]));
      this.accesoService.sendMailToSummonRunning(formData).subscribe(response => {
        if (!response.status) { return alertify.error(response.message); }
        alertify.success('Se ha enviado una notificación al correo');
        this.saved.emit(true);
      });
    });
  }

}

