import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Pipe({
  name: 'filterProgramming',
  pure: false
})
export class FilterProgrammingPipe implements PipeTransform {

  transform(value: AbstractControl[]): AbstractControl[] {
    return value.filter(program => ![3, 4].includes(+program.value.estado));
  }

}
