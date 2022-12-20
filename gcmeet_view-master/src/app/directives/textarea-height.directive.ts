import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appTextareaHeight]'
})
export class TextareaHeightDirective {

  constructor(private elementRef: ElementRef<HTMLTextAreaElement>) {
    this.elementRef.nativeElement.addEventListener('resize', this.updateHeight);
    this.elementRef.nativeElement.addEventListener('input', this.updateHeight);
  }

  updateHeight = () => {
    this.elementRef.nativeElement.style.height = "auto";
    this.elementRef.nativeElement.style.height = (this.elementRef.nativeElement.scrollHeight) + 1 + "px";
  }

}
