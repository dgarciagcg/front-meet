import { AbstractControl, FormArray } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'getFormArray' })
export class GetFormArrayPipe implements PipeTransform {

  transform(value: AbstractControl | null | undefined): FormArray {
    return value as FormArray;
  }

}
