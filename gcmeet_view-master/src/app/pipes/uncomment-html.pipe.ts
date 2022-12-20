import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'uncommentHtml' })
export class UncommentHtmlPipe implements PipeTransform {

  /* transform(): Pipe que elimina los comentarios de un segmento html recibido
    value: fragmento HTML ejemplo: <p>Hola mundo <!-- mensaje --></p> --> <p>Hola mundo </p>
  */
  transform = (value: string): string => value.split("<!--")[0] + value.split("<!--").map((elm: string) => elm.split("-->")[1]).join("");

}
