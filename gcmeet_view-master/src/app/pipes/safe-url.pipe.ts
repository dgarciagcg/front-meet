import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'safeUrl'
})
export class SafeUrlPipe implements PipeTransform {

    constructor(private sanitizer: DomSanitizer) { }

    transform(value: string): SafeResourceUrl { return this.sanitizer.bypassSecurityTrustResourceUrl(value); }

}
