import { Pipe, PipeTransform } from '@angular/core';

import { ASProgram } from '../public/reunion/meeting-room/meeting-room.component';
import { Convocado, Respuesta } from '../services/acceso-reunion.service';

@Pipe({
  name: 'getCommentList'
})
export class GetCommentListPipe implements PipeTransform {

  transform(program: ASProgram, answerList: Respuesta[], summonedList: Convocado[]): { summoned: string; comment: string; }[] {
    answerList = answerList.filter(aws => aws.id_programa === program.id_programa);
    return answerList.map(answer => {
      const comment: { text: string; } = JSON.parse(answer.descripcion);
      const summoned = summonedList.find(summon => +summon.id_convocado_reunion === +answer.id_convocado_reunion);
      return { summoned: summoned ? summoned.nombre : 'Convocado', comment: comment.text };
    });
  }

}
