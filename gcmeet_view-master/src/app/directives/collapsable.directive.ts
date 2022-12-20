import { AfterViewInit, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Directive } from '@angular/core';

import { Collapsable, CollapsableOptions } from '../classes/collapsable.class';

@Directive({ selector: '[appCollapsable]' })
export class CollapsableDirective implements AfterViewInit, OnChanges, OnDestroy {

  @Input() collapsableAllowClick: CollapsableOptions['allowClick'];
  @Input() collapsableDirection: CollapsableOptions['direction'];
  @Input() appCollapsable: CollapsableOptions['target'];

  /** Instancia del componente plegable */
  public collapsableInstance!: Collapsable;
  /** Opciones del plegable */
  public collapsableOptions: Partial<CollapsableOptions> = {};

  constructor(private el: ElementRef<Element>) { }

  ngOnChanges(changes: SimpleChanges) {
    if ('collapsableDirection' in changes) {
      const direction: this['collapsableDirection'] = changes['collapsableDirection'].currentValue;
      this.collapsableOptions.direction = direction;
      if (this.collapsableInstance instanceof Collapsable) {
        this.collapsableInstance.direction = direction;
      }
    }
    if ('collapsableAllowClick' in changes) {
      const allowClick: this['collapsableAllowClick'] = changes['collapsableAllowClick'].currentValue;
      this.collapsableOptions.allowClick = allowClick;
      if (this.collapsableInstance instanceof Collapsable) {
        this.collapsableInstance.allowClick = allowClick;
      }
    }
    if ('appCollapsable' in changes) {
      const target: this['appCollapsable'] = changes['appCollapsable'].currentValue;
      this.collapsableOptions.target = target;
    }
  }

  ngAfterViewInit() {
    this.collapsableInstance = new Collapsable(this.el.nativeElement, this.collapsableOptions);
  }

  ngOnDestroy() { this.collapsableInstance.destroy(); }

}
