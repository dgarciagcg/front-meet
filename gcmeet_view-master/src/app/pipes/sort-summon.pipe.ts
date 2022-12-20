import { Pipe, PipeTransform } from '@angular/core';

import { ConvocadoAdicional } from 'src/app/interfaces/reuniones.interface';

@Pipe({
    name: 'sortSummon'
})
export class SortSummonPipe implements PipeTransform {

    transform(value: ConvocadoAdicional[]): ConvocadoAdicional[] {
        return value.sort((a, b) => {
            const nameA = (a.razon_social || a.nombre).toUpperCase();
            const nameB = (b.razon_social || b.nombre).toUpperCase();
            return nameA > nameB ? 1 : -1;
        });
    }

}
