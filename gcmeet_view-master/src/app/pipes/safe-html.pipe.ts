import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'safeHtml' })
export class SafeHtmlPipe implements PipeTransform {

    constructor(private domSanitizer: DomSanitizer) { }

    /* transform(): Pipe que devuelve HTML de forma segura (proporcionado por angular), para inyectar código correctamente
      value: fragmento HTML.
      └ ejemplo: <p class="clase" atributo-n>Hola Mundo</p> -> sin Pipe -> <p>Hola Mundo</p> -> con pipe -> <p class="clase" atributo-n>Hola Mundo</p>
    */
    transform = (value: string): SafeHtml => this.domSanitizer.bypassSecurityTrustHtml(value);

}