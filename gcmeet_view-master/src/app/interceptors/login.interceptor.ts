import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';

import { LoginService } from '../services/login.service';

@Injectable({
  providedIn: 'root'
})
export class LoginInterceptor implements HttpInterceptor {

  constructor(
    private loginService: LoginService,
  ) { }

  intercept = (req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> => {
    return next.handle(req).pipe(catchError(err => {
      if (err.status === 401) {
        // auto logout if 401 response returned from api
        this.loginService.logout();
        window.location.replace('/');
        // tambien puedo usar windows.location.reload();
      }
      const error = err.error.message || err.statusText;
      return throwError(() => new Error(error));
    }));
  }

}
