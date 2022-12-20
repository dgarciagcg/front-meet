import { Directive, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

declare const bootstrap: any;

@Directive({
  selector: '[appTooltip]'
})
export class TooltipDirective implements OnInit, OnChanges {

  @Input() appTooltip!: string;

  tooltip: unknown;

  constructor(private elementRef: ElementRef) {
    this.elementRef.nativeElement.setAttribute('data-bs-toggle', 'tooltip');
  }

  ngOnInit(): void {
    this.tooltip = new bootstrap.Tooltip(this.elementRef.nativeElement, {
      boundary: document.body
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('appTooltip' in changes) { this.elementRef.nativeElement.setAttribute('title', changes['appTooltip'].currentValue); }
  }

}
