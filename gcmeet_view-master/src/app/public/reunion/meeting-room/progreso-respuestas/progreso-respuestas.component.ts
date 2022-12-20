import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { Convocado, Respuesta } from 'src/app/services/acceso-reunion.service';

@Component({
  selector: 'app-progreso-respuestas',
  templateUrl: './progreso-respuestas.component.html',
  styleUrls: ['./progreso-respuestas.component.scss']
})
export class ProgresoRespuestasComponent implements OnChanges {

  @Input() summonList: (Convocado & { hasLoggedin: number; })[] = [];
  @Input() answerList: Respuesta[] = [];

  length = 0;
  voted = 0;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if ('answerList' in changes) {
      this.updateVoteLength();
    }
    if ('summonList' in changes) {
      this.updateVoteLength();
    }
  }

  updateVoteLength() {
    const length = this.summonList.reduce((result, summon) => result + summon.hasLoggedin, 0);
    this.voted = length ? (this.answerList.length / length) : 0;
    this.length = length;
  }

}
