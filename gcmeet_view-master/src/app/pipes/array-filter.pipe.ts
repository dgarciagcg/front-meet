import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'arrayFilter'
})
export class ArrayFilterPipe implements PipeTransform {

  transform<T extends Record<string, any>>(value: T[], filter: Partial<Record<keyof T, any>>): T[] {
    return value.filter(item => {
      const filters = Object.entries(filter);
      for (let index = 0; index < filters.length; index++) {
        switch (typeof filters[index][1]) {
          case 'object':
            if (Array.isArray(filters[index][1])) {
              if (!(filters[index][1] as any[]).includes(item[filters[index][0]])) { return false; };
            }
            break;
          default:
            if (item[filters[index][0]] !== filters[index][1]) { return false; };
            break;
        }
      }
      return true;
    });
  }

}
