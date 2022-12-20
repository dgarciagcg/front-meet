import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Recursos } from 'src/app/interfaces/recursos.interface';
import { Roles } from 'src/app/interfaces/roles.interface';

type Convocados = 'arrayConvocadosA' | 'arrayConvocadosI';

declare const bootstrap: any;
declare const alertify: any;

@Component({
  templateUrl: './summon-management.component.html',
  styleUrls: ['./summon-management.component.scss'],
  selector: 'app-summon-management',
})
export class SummonManagementComponent {

  @Input() formularioAgregarAsistente = new FormGroup({});
  @Input() agregarAsistente!: () => void;

  @Input() autocompletarPorNit!: (nit: string) => void;
  @Input() autocompletar!: (value: string, tipoPersona: string) => void;

  @Input() recursosGc_MeetYGcm: Recursos[] = [];

  @Input() entidades: Recursos[] = [];

  @Input() arrayRoles: Roles[] = [];

  @Input() tipoPersona: string = '0';

}
