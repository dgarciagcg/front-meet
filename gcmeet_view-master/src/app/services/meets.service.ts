import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

import { UserLocalService } from './templateServices/user-local.service';

import { ConvocadoAdicional, Programas, Reuniones } from 'src/app/interfaces/reuniones.interface';
import { Grupos } from 'src/app/interfaces/grupos.interface';

@Injectable({
  providedIn: 'root'
})
export class MeetsService {

  ruta = environment.api;

  header = new HttpHeaders({
    Authorization: 'Bearer ' + this.userLocalService.getToken()
  });

  constructor(private http: HttpClient, private userLocalService: UserLocalService) { }

  /**
   * Consulta los grupos registrados con un usuario en comun
   * @param id_usuario Aqui va el id del usuario
   * @returns Arreglo con los grupos encontrados
   */
  getGrupos = (): Observable<Grupos[]> => {
    return this.http.get<Grupos[]>(`${this.ruta}/meets/traer-grupos`, { headers: this.header })
  }

  /**
   * Consulta las reuniones que su tipo tiene en comun un grupo
   * @param id_grupo Aqui va el id del grupo
   * @returns Arreglo con las reuniones encontradas
   */
  getReuniones = (id_grupo: any): Observable<Reuniones[]> => {
    return this.http.get<Reuniones[]>(`${this.ruta}/meets/traer-reuniones/${id_grupo}`, { headers: this.header })
  }

  /**
   * Consulta los datos de una reunión en especifico
   * @param id_reunion Aqui va el id de la reunión
   * @returns Objeto con los datos de una reunión
   */
  getReunion = (id_reunion: number): Observable<Reuniones[]> => {
    return this.http.get<Reuniones[]>(`${this.ruta}/meets/traer-reunion/${id_reunion}`, { headers: this.header })
  }

  /**
   * Consulta todas los programas de una reunión en especifico
   * @param id_reunion Aqui va el id de la reunión
   * @returns Array con los programas encontrados
   */
  getProgramas = (id_reunion: number): Observable<Programas[]> => {
    return this.http.get<Programas[]>(`${this.ruta}/meets/traer-programas/${id_reunion}`, { headers: this.header })
  }

  /**
   * Consulta todos los convocados de una reunión en especifico
   * @param id_reunion Aqui va el id de la reunión
   * @returns Array con los convocados encontrados
   */
  getConvocados = (id_reunion: number): Observable<ConvocadoAdicional[]> => {
    return this.http.get<ConvocadoAdicional[]>(`${this.ruta}/meets/traer-convocados/${id_reunion}`, { headers: this.header })
  }

  /**
   * Envia informacion con el objetivo de reenviar la invitacion de la reunion a los convocados
   * @param data Aqui van los id, los correos de los convocados seleccionados, ademas tambien se envia el id_reunion
   * @returns Mensaje con la confirmación o el posible error de la petición
   */
  reenviarCorreos = (data: any): Observable<any[]> => {
    return this.http.post<any>(`${this.ruta}/meets/reenviar-correos`, data, { headers: this.header });
  }

  /**
   * Se encarga de cambiar el estado de una reunion a iniciada
   * @param id_reunion Aqui va el id de la reunion a iniciar
   * @returns Mensaje con la confirmación o el posible error de la petición
   */
  iniciarReunion = (id_reunion: number): Observable<any> => {
    return this.http.get<any>(`${this.ruta}/meets/iniciar-reunion/${id_reunion}`, { headers: this.header });
  }

  /**
   * Se encarga de cambiar el estado de una reunion a cancelada
   * @param id_reunion Aqui va el id de la reunion a cancelar
   * @returns Mensaje con la confirmación o el posible error de la petición
   */
  cancelarReunion = (data: any): Observable<any> => {
    return this.http.post<any>(`${this.ruta}/meets/cancelar-reunion`, data, { headers: this.header });
  }

  /**
   * Aqui se envía el correo dando informe de la cancelación de una reunión
   * @param data Aqui va los datos de la reunion y de cada convocado
   * @returns Mensaje con la confirmación o el posible error de la petición
   */
  correoCancelacion = (data: any): Observable<any> => {
    return this.http.post<any>(`${this.ruta}/meets/correo-cancelacion-reunion`, data, { headers: this.header });
  }

  /**
   * Elimina una reunión y todos los datos relaciados con ella
   * @param id_reunion Aqui va el id de la reunión a eliminar
   * @returns Mensaje con la confirmación o el posible error de la petición
   */
  eliminarReunion = (id_reunion: number): Observable<any> => {
    return this.http.get<any>(`${this.ruta}/meets/eliminar-reunion/${id_reunion}`, { headers: this.header });
  }

  /**
   * Reprograma o actualiza la fecha de una reunión que estaba en estado de cancelada y tambien cambia este estado a 'en espera'
   * @param detalle Aqui van los datos para la actualizacion como son el id_reunion, la fecha y la hora
   * @returns Mensaje con la confirmación o el posible error de la petición
   */
  reprogramarReunion = (data: any): Observable<any[]> => {
    return this.http.post<any>(`${this.ruta}/meets/reprogramar-reunion`, data, { headers: this.header });
  }

  /**
   * Descarga en documento pdf el acta de una reunion
   * @param data Aqui va la informacion de una reunion terminada
   * @returns Retorna archivo pata descargar en el pc
   */
  downloadPDFDocument = (data: any): Observable<Blob> => {
    return this.http.post(`${this.ruta}/meets/downloadPDF-document`, data, { responseType: 'blob', headers: this.header });
  }

  registerMeet = (id_reunion: number): Observable<{ status: boolean; message: string; }> => {
    return this.http.post<{ status: boolean; message: string; }>(`${environment.sockets}/registerMeet`, { id_reunion });
  }

}
