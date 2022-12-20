import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'letrasOrdenadas'
})
export class LetrasOrdenadasPipe implements PipeTransform {
  /**
   * Obtiene una letra (minuscula) de acuerdo a un índice
   * Funciona hasta el índice 24
   * @param index 
   * @returns 
   */
  transform(index: number, start = 0): string {
    return String.fromCharCode(97 + index - start);
  }

}
