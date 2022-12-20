import { Pipe, PipeTransform } from '@angular/core';

import { ConvocadoLogueado, Respuesta } from '../services/acceso-reunion.service';
import { ASProgram } from '../public/reunion/meeting-room/meeting-room.component';

@Pipe({
    name: 'getPercent',
    pure: false
})
export class GetPercentPipe implements PipeTransform {

    transform(quorum: number, program: ASProgram, answerList: Respuesta[], summonList: ConvocadoLogueado[]): number {
        answerList = answerList.filter(aws => aws.id_programa === program.id_programa);
        let approvedPercentage = 0;
        answerList.forEach(answer => {
            const vote = JSON.parse(answer.descripcion);
            if (vote.votacion) {
                approvedPercentage += (!summonList.length ? 0 : (1 / summonList.length));
            }
        });

        return approvedPercentage > 100 ? 100 : approvedPercentage;
    }

}
