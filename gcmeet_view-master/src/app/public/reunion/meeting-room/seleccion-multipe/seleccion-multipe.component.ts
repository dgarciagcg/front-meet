import { Component, EventEmitter, Input, Output } from '@angular/core';

import { environment } from 'src/environments/environment';

import { Programacion } from 'src/app/services/acceso-reunion.service';

@Component({
  selector: 'app-seleccion-multipe',
  templateUrl: './seleccion-multipe.component.html',
  styleUrls: ['./seleccion-multipe.component.scss']
})
export class SeleccionMultipeComponent {

  storage = `${environment.storage}/`;

  @Output() response: EventEmitter<number[]> = new EventEmitter<number[]>();

  @Input() opciones: Programacion['opciones'] = [];

  constructor() { }

  submit(form: HTMLFormElement) {
    const checkbox: NodeListOf<HTMLInputElement> = form.querySelectorAll('[type="checkbox"]');

    this.response.emit(Array.from(checkbox)
      .map((item: HTMLInputElement, i: number) => (item.checked ? this.opciones[i].id_programa : null))
      .filter((programa: null | number) => programa !== null) as number[]);
  }

}
