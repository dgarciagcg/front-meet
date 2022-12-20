import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { environment } from 'src/environments/environment';

import { Convocado, Respuesta } from 'src/app/services/acceso-reunion.service';
import { Reuniones } from 'src/app/interfaces/reuniones.interface';
import { ASProgram } from '../meeting-room.component';

@Component({
  selector: 'app-resultado-seleccion',
  templateUrl: './resultado-seleccion.component.html',
  styleUrls: ['./resultado-seleccion.component.scss']
})
export class ResultadoSeleccionComponent implements OnChanges {

  @Input() program?: ASProgram;

  @Input() summonList: (Convocado & { hasLoggedin: number; })[] = [];
  @Input() answerList: Respuesta[] = [];
  @Input() meet?: Reuniones;

  public answers: Record<string, { votes: number; percentage: number; }> = {};
  public noResponse: { votes: number; percentage: number; } = { votes: 0, percentage: 0 };
  public total = 0;

  public storage = `${environment.storage}/`;


  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if ('answerList' in changes) { this.update(); }
    if ('summonList' in changes) { this.update(); }
    if ('meet' in changes) { this.update(); }
  }

  update() {
    this.answers = {};
    this.total = 0;
    this.answerList.forEach(item => {
      const response: { seleccion: number[]; } = JSON.parse(item.descripcion);
      response.seleccion.forEach(vote => {
        !(vote in this.answers) && (this.answers[vote] = { votes: 0, percentage: 0 });
        this.answers[vote].votes++;
        this.total++;
      });

      const length = this.summonList.reduce((result, summon) => result + summon.hasLoggedin, 0);
      this.noResponse.votes = length - this.total;
      this.noResponse.percentage = (length ? (this.noResponse.votes / length) : 0);

      Object.values(this.answers).forEach(item => {
        if (false) {
          item.percentage = this.total ? (item.votes / this.total) : 0;
        } else {
          item.percentage = (length ? (item.votes / length) : 0);
        }
      });

    });
  }

}
