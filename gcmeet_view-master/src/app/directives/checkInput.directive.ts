import { Directive, ElementRef, Input, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appCheckInput]'
})
export class CheckInputDirective {

  @Input() appCheckInput!: boolean;

  constructor(private el: ElementRef<HTMLInputElement>) { }

  // Directiva para validar el comportamiento del valor de los input tipo checkbox con el objetivo de ejecutar la función que estos tienen
  ngOnChanges(changes: SimpleChanges): void {
    if ('appCheckInput' in changes) {
      this.el.nativeElement.checked = changes['appCheckInput'].currentValue;
      setTimeout(() => this.el.nativeElement.dispatchEvent(new Event('change')), 0);
    }
  }

}
