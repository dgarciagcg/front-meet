import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { Convocado, Respuesta } from 'src/app/services/acceso-reunion.service';
import { Reuniones } from 'src/app/interfaces/reuniones.interface';

@Component({
  templateUrl: './resultados-votacion.component.html',
  styleUrls: ['./resultados-votacion.component.scss'],
  selector: 'app-resultados-votacion',
})
export class ResultadosVotacionComponent implements OnChanges {

  @Input() summonList: (Convocado & { hasLoggedin: number; })[] = [];
  @Input() answerList: Respuesta[] = [];
  @Input() meet?: Reuniones;

  public approved: number = 0;
  public rejected: number = 0;

  public approvedPercentage: number = 0;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if ('answerList' in changes) {
      this.updateVoteLength();
      this.updateVotePercentage();
    }
    if ('summonList' in changes) {
      this.updateVotePercentage();
    }
  }

  updateVoteLength() {
    this.approved = 0;
    this.rejected = 0;
    this.answerList.forEach(answer => {
      const vote = JSON.parse(answer.descripcion);
      vote.votacion ? this.approved++ : this.rejected++;
    });
  }

  updateVotePercentage() {
    this.approvedPercentage = 0;
    this.answerList.forEach(answer => {
      const vote = JSON.parse(answer.descripcion);
      if (vote.votacion) {
        // if (this.meet && +this.meet.quorum === 1) {
        //   const summoned = this.summonList.find(summon => +summon.id_convocado_reunion === +answer.id_convocado_reunion);
        //   summoned && (this.approvedPercentage += summoned.participacion !== null ? (+summoned.participacion / 100) : (!this.summonList.length ? 0 : (1 / this.summonList.length)));
        // } else {
        if (false) { // Total de convocados
          this.approvedPercentage += (!this.summonList.length ? 0 : (1 / this.summonList.length));
        } else if (false) { // Total de votos
          this.approvedPercentage += (!this.answerList.length ? 0 : (1 / this.answerList.length));
        } else { // Total de conectados
          const length = this.summonList.reduce((result, summon) => result + summon.hasLoggedin, 0);
          this.approvedPercentage += (!length ? 0 : (1 / length));
        }
        // }
      }
    });
    this.approvedPercentage > 100 && (this.approvedPercentage = 100);
  }

}
