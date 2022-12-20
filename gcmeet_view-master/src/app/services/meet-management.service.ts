import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

import { UserLocalService } from './templateServices/user-local.service';

import { ConvocadoAdicional, Convocados, Programas, Reuniones, RolesActas } from 'src/app/interfaces/reuniones.interface';
import { TipoReunion } from 'src/app/interfaces/tipos-reuniones.interface';
import { Recursos } from 'src/app/interfaces/recursos.interface';
import { Grupos } from 'src/app/interfaces/grupos.interface';
import { Roles } from 'src/app/interfaces/roles.interface';
import { Response2 } from './acceso-reunion.service';

export interface Acta {
  descripcion: string;
  id_acta: number;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class MeetManagementService {

  ruta = environment.api;

  header = new HttpHeaders({
    Authorization: 'Bearer ' + this.userLocalService.getToken()
  });

  constructor(private http: HttpClient, private userLocalService: UserLocalService) { }

  /**
   * Consulta los datos de una reunión en especifico
   * @param id_reunion Aqui va el id de la reunión a consultar
   * @returns Objeto con los datos de uan reunión
   */
  getReunion = (id_reunion: number): Observable<Reuniones[]> => {
    return this.http.get<Reuniones[]>(`${this.ruta}/meet-management/traer-reunion/${id_reunion}`, { headers: this.header })
  }

  getRolesActas = (id_acta: string): Observable<RolesActas[]> => {
    return this.http.get<RolesActas[]>(`${this.ruta}/meet-management/traer-roles-actas/${id_acta}`, { headers: this.header })
  }

  /**
   * Consulta todas las preguntas que pertenecen a una reunión
   * @param id_reunion Aqui va el id de la reunión
   * @returns Array con las preguntas encontradas
   */
  getProgramas = (id_reunion: number): Observable<Programas[]> => {
    return this.http.get<Programas[]>(`${this.ruta}/meet-management/traer-programas/${id_reunion}`, { headers: this.header })
  }

  /**
   * Consulta todos los convocados de una reunión con el tipo participantes
   * @param id_reunion Aqui va el id de la reunión
   * @returns Array de convocados encontrados
   */
  getConvocados = (id_reunion: number): Observable<Convocados[]> => {
    return this.http.get<Convocados[]>(`${this.ruta}/meet-management/traer-convocados/${id_reunion}`, { headers: this.header })
  }

  /**
   *
   * @param id_reunion
   * @returns
   */
  getConvocadosMeet = (id_reunion: number): Observable<ConvocadoAdicional[]> => {
    return this.http.get<ConvocadoAdicional[]>(`${this.ruta}/meet-management/traer-convocados/${id_reunion}`, { headers: this.header })
  }

  /**
   * Consulta los roles que se tienen registrados que tiene relacion con una relacion que a su vez tiene relacion con un grupo que a su vez tiene relacion con un tipo que a su vez tiene relacion cona reunion
   * @param id_reunion Aqui va el id de la reunión
   * @returns Array de roles encontrados
   */
  getRoles = (id_reunion: number): Observable<Roles[]> => {
    return this.http.get<Roles[]>(`${this.ruta}/meet-management/traer-roles/${id_reunion}`, { headers: this.header })
  }

  /**
   * Consulta los roles que se tienen registrados que tiene relacion con una relacion que a su vez tiene relacion con un grupo que a su vez tiene relacion con un tipo que a su vez tiene relacion cona reunion
   * @param id_reunion Aqui va el id de la reunión
   * @returns Array de roles encontrados
   */
  getRolesRegistrar = (id_grupo: number): Observable<Roles[]> => {
    return this.http.get<Roles[]>(`${this.ruta}/meet-management/traer-roles-registrar/${id_grupo}`, { headers: this.header });
  }

  /**
   * Consulta todos los recursos registrados
   * @returns Array con los recursos encontrados
   */
  getRecursos = (id_grupo: number | undefined): Observable<Recursos[]> => {
    return this.http.get<Recursos[]>(`${this.ruta}/meet-management/traer-recursos/${id_grupo}`, { headers: this.header });
  }

  /**
   * Consulta todos los recursos registrados en gcm
   * @returns Array con los recursos encontrados
   */
  getRecursosGcm = (): Observable<Recursos[]> => {
    return this.http.get<Recursos[]>(`${this.ruta}/meet-management/traer-recursos-gcm`, { headers: this.header });
  }

  /**
   * Consulta todos los recursos registrados
   * @returns Array con los recursos encontrados
   */
  getGrupo = (id_grupo: number): Observable<Grupos[]> => {
    return this.http.get<Grupos[]>(`${this.ruta}/meet-management/traer-grupo/${id_grupo}`, { headers: this.header });
  }

  /**
   * Consulta la informacion de los tipos de reunion con un id_grupo en comun y con estado activo
   * @param id_grupo Aqui va el id del grupo
   * @returns Retorna array de objetos con los datos de los tipos de reunion
   */
  getTiposReuniones = (id_grupo: number | undefined): Observable<TipoReunion[]> => {
    return this.http.get<TipoReunion[]>(`${this.ruta}/meet-management/traer-tiposReuniones/${id_grupo}`, { headers: this.header });
  }

  /**
   * Realiza el envio de toda la informacion para poder realizar el envio de los correos a los convocados de una reunion
   * @param data Aqui va tanto la informacion de toda la reunion como la de los convocados y los programas
   * @returns Mensaje con la confirmacion o la posible falla del envio de los correos
   */
  enviarCorreos = (data: FormData): Observable<any[]> => {
    return this.http.post<any>(`${this.ruta}/acceso-reunion/send-mail-to-summon`, data, { headers: this.header });
  }

  /**
   * Consulta los datos reunión de la fecha mas actualizada con un tipo de reunion en comun
   * @param id_tipo_reunion Aqui va el id del tipo reunion
   * @returns Retorna objeto con la informacion de la reunion encontrada
   */
  traerReunion = (id_tipo_reunion: number): Observable<Reuniones[]> => {
    return this.http.get<Reuniones[]>(`${this.ruta}/meet-management/traer-ultima-reunion/${id_tipo_reunion}`, { headers: this.header })
  }

  /**
   * Consulta los datos de un tipo de reunion en especifico
   * @param id_tipo_reunion Aqui va el id del tipo reunion
   * @returns Retorna objeto con los datos del tipo de reunion encontrado
   */
  traerTipo = (id_tipo_reunion: number): Observable<TipoReunion> => {
    return this.http.get<TipoReunion>(`${this.ruta}/meet-management/traer-tipo-reunion/${id_tipo_reunion}`, { headers: this.header })
  }

  /**
   * Se encarga de guardar o modificar los datos de una reunión
   * @param data Aqui va toda la informacion de la reunion, de los convocados y de la programacion
   * @returns Mensaje con la confirmacion o la posible falla de la insercion o actualizacion de la reunion
   */
  insertarReunion = (data: FormData): Observable<any> => {
    return this.http.post<any>(`${this.ruta}/meet-management/editar-reunion`, data, { headers: this.header });
  }

  /**
   * Descarga documento PDF con la programacion de la reunion
   * @param data Aqui va el html de la programacion con los estilos a aplicar
   * @returns retorna documento descargado en el pc
   */
  descargarPDFProgramacion = (data: any): Observable<Blob> => {
    return this.http.post(`${this.ruta}/meet-management/downloadPDF-programacion`, data, { responseType: 'blob', headers: this.header });
  }

  getActas = (): Observable<Response2<Acta[]>> => {
    return this.http.get<Response2<Acta[]>>(`${this.ruta}/meet-management/get-actas`, { headers: this.header });
  }

}
