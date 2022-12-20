import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { environment } from 'src/environments/environment';

import { Programacion } from 'src/app/services/acceso-reunion.service';

@Component({
  selector: 'app-seleccion-unica',
  templateUrl: './seleccion-unica.component.html',
  styleUrls: ['./seleccion-unica.component.scss']
})
export class SeleccionUnicaComponent implements OnChanges {

  storage = `${environment.storage}/`;

  @Output() response: EventEmitter<number> = new EventEmitter<number>();

  @Input() quorum = true;

  @Input() opciones: Programacion['opciones'] = [];

  @Input() program?: Programacion;

  form: FormGroup = this.builder.group({ opcion: { disabled: false, value: undefined } });

  constructor(private builder: FormBuilder) { }

  ngOnChanges(changes: SimpleChanges): void {
    if ('opciones' in changes) { this.form.get('opcion')?.setValue(undefined); }
  }

  submit() { this.quorum && this.response.emit(this.form.value.opcion); }

}
