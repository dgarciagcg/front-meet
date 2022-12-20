import { Pipe, PipeTransform } from '@angular/core';

import { ConvocadoLogueado, Respuesta } from '../services/acceso-reunion.service';
import { ASProgram } from '../public/reunion/meeting-room/meeting-room.component';

@Pipe({
  name: 'getElectionPercent',
  pure: false
})
export class GetElectionPercentPipe implements PipeTransform {

  transform(quorum: number, program: ASProgram, answerList: Respuesta[], summonedList: ConvocadoLogueado[]): number {
    let approvedPercentage = 0;
    const summoned = summonedList.find(summon => summon.id_convocado_reunion === program.id_convocado_reunion);
    if (!summoned) { return 0; }
    const option = program.opciones.find(opt => opt.titulo === summoned?.identificacion);
    if (!option) { return 0; }
    const answers = answerList.filter(aws => {
      const vote: { seleccion: number[]; } = JSON.parse(aws.descripcion);
      return aws.id_programa === program.id_programa && vote.seleccion.includes(option.id_programa);
    });
    answers.forEach(aws => {
      const vote: { seleccion: number[]; } = JSON.parse(aws.descripcion);
      if (vote.seleccion) {
        // if (quorum === 1) {
        // const summoned = summonedList.find(summon => +summon.id_convocado_reunion === +aws.id_convocado_reunion);
        // summoned && (approvedPercentage += summoned.participacion !== null ? (+summoned.participacion / 100) : (!summonedList.length ? 0 : (1 / summonedList.length)));
        // } else { 
        approvedPercentage += (!summonedList.length ? 0 : (1 / summonedList.length));
        //  }
      }
    })
    return approvedPercentage > 100 ? 100 : approvedPercentage;
  }

}
