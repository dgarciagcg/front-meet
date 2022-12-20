import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';

declare const M: any;

@Directive({
  selector: '[appDropdownMaterialize]'
})
export class DropdownMaterializeDirective implements AfterViewInit {

  @Input() appDropdownMaterialize!: string;

  dropdown: any;

  constructor(public elementRef: ElementRef) { }

  ngAfterViewInit(): void {
    this.dropdown = M.Dropdown.init(this.elementRef.nativeElement, { coverTrigger: false, constrainWidth: false, container: document.querySelector(this.appDropdownMaterialize || '.page-content') });
  }

  ngOnDestroy(): void {
    this.dropdown && this.dropdown.destroy();
  }

}
