import { HttpEvent, HttpHandler, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

import { UserLocalService } from '../services/templateServices/user-local.service';
import { SpinnerService } from '../services/templateServices/spinner.service';

@Injectable({
  providedIn: 'root'
})
export class SpinnerInterceptor {

  ruta = environment.api;

  header = new HttpHeaders({
    Authorization: 'Bearer ' + this.userLocalService.getToken()
  });

  peticiones = 0;

  constructor(
    private userLocalService: UserLocalService,
    private spinnerService: SpinnerService
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.peticiones === 0) {
      this.spinnerService.llamarSpinner();
    }
    this.peticiones++;
    return next.handle(req).pipe(
      finalize(() => {
        this.peticiones--;
        if (this.peticiones === 0) {
          this.spinnerService.detenerSpinner();
        }
      })
    );
  }
}
