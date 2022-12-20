import { HttpInterceptor, HttpHandler, HttpRequest, HttpEvent } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { tap } from "rxjs/operators";
import { Observable } from 'rxjs';

import { MeetUtilitiesService } from "../services/templateServices/meet-utilities.service";

declare let alertify: any;

@Injectable()
export class CatchErrorInterceptor implements HttpInterceptor {

  constructor(private meetUtilities: MeetUtilitiesService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    let authorization = request.headers.get('Authorization');

    if (authorization !== null) {
      const summonedToken = this.meetUtilities.currentToken;
      if (summonedToken) {
        const summoned = this.meetUtilities.getMeet(summonedToken);
        authorization = `${summoned.id_convocado_reunion}|${summoned.identificacion}|${summoned.id_reunion}`;
      } else { authorization = localStorage.getItem('access_token'); }
    }

    const customReq = request.clone({
      headers: authorization !== null ? request.headers.set('Authorization', `Bearer ${authorization}`) : request.headers,
    });

    return next.handle(customReq).pipe(
      tap(
        next => { },
        error => {
          if (error.status === 500) {
            if (error.error?.id_error) {
              alertify.error('No es posible realizar la acción, comuníquese con un asesor. Ticket # ' + error.error.id_error, 60);
            } else {
              alertify.error('No es posible realizar la acción, comuníquese con un asesor.', 60);
            }
          } else if ('error' in error && typeof error.error === 'object') {
            Object.entries(error.error).forEach(([key, item]) => {
              alertify.error(`Error (${key}): ${item}`, 5);
            });
          }
        }
      )
    );
  }

}