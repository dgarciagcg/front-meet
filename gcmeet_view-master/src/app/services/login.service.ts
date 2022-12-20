import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

import { UserLocalService } from './templateServices/user-local.service';

import { AuthResponse } from '../public/login/login.interface';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  ruta = environment.api;

  constructor(
    private userLocalService: UserLocalService,
    private http: HttpClient,
  ) { }

  /**
   * Realiza la peticion para el ingreso a la aplicacion de un usuario
   * @param params Aqui van los datos del usuario
   * @returns Confirma o desaprueba el ingreso del usuario
   */
  login = (params: any): Observable<AuthResponse> => {
    return this.http.post<AuthResponse>(`${this.ruta}/auth/login`, params);
  }

  /**
   * Realiza la salida permanente de un usuario de la aplicacion
   * @returns 
   */
  logout = () => this.userLocalService.removeToken();

  /**
   * Realiza la peticion para el proceso de recuperar la contraseña de un usuario
   * @param id_usuario Aqui va el id del usuario
   * @returns Mensaje con la correcta ejecucion de la peticion o del posible fallo
   */
  recuperarContrasena = (id_usuario: string): Observable<any> => {
    return this.http.post<any>(`${this.ruta}/auth/recuperar`, id_usuario);
  }

  /**
   * Realiza la peticion para el proceso de restablecer la contraseña de un usuario
   * @param params Aqui van los datos para el restablecimiento como son el id del usuario y las contraseñas
   * @returns Mensaje con la correcta ejecucion de la peticion o del posible fallo
   */
  restablecerContrasena = (params: string): Observable<any> => {
    return this.http.post<any>(`${this.ruta}/auth/restablecer`, params);
  }
}
