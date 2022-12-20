import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';

export interface Response<RT, T = boolean> {
  response: T extends boolean ? RT : string;
  ok: T;
}

export interface Response2<RT, T = boolean> {
  message: T extends boolean ? RT : string;
  status: boolean;
}

export interface Respuesta {
  id_convocado_reunion: number;
  id_programa: number;
  descripcion: string;
  tipo: string;
}

export interface Convocado {
  id_convocado_reunion: number;
  participacion: number | null;
  representacion?: number;
  identificacion: string;
  razon_social?: string;
  convocatoria: string;
  id_recurso: number;
  telefono: string;
  id_grupo: number;
  nombre: string;
  correo: string;
  estado: string;
  id_rol: number;
  tipo: string;
  nit?: string;
  rol: string;
}

export interface Archivo {
  id_archivo_programacion: number;
  id_programa: number;
  descripcion: string;
  peso: string;
  url: string;
}

export interface Programacion {
  opciones: Programacion[];
  id_convocado_reunion?: number;
  rol_acta_descripcion?: string;
  rol_acta_firma?: string;
  rol_acta_acta?: string;
  response: null | string;
  id_rol_acta?: number;
  descripcion: string;
  id_programa: number;
  archivos: Archivo[];
  numeracion: string;
  id_reunion: number;
  relacion?: number;
  titulo: string;
  estado: string;
  orden: number;
  tipo: string;
}

export interface Elected {
  elected: Programacion[];
  description: string;
}

export interface ConvocadoLogueado {
  identificacion_representante: number | null;
  nombre_representante: string | null;
  id_representante: number | null;
  id_convocado_reunion: number;
  participacion: string | null;
  razon_social: string | null;
  identificacion: string;
  nit: string | null;
  nombre: string;
  correo: string;
  tipo: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccesoReunionService {

  /**
   * API laravel
   */
  ruta = environment.api;

  reqHeader = new HttpHeaders({
    Authorization: ''
  });

  constructor(private http: HttpClient) { }

  /**
   * Servicio encargado de enviar invitaciones de reuniones para un recurso específico
   * 
   * @param documentoIdentidad 
   * @returns Observable
   */
  buscarInvitacion = (documentoIdentidad: string): Observable<any> => {
    return this.http.get(`${this.ruta}/acceso-reunion/buscar-invitacion/${documentoIdentidad}`, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de permitir o denegar acceso a un recurso en una reunión
   * 
   * @param documentoIdentidad
   * @param idConvocadoReunion 
   * @returns Observable
   */
  validacionConvocado = (documentoIdentidad: string, idConvocadoReunion: string): Observable<any> => {
    return this.http.get(`${this.ruta}/acceso-reunion/validacion-convocado/${documentoIdentidad}/${idConvocadoReunion}`, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de consultar los diferentes id_convocado_reunion
   * que pueda tener un convocado para una reunión específica
   * 
   * @param documentoIdentidad 
   * @param idReunion 
   * @returns Observable 
   */
  getIdConvocado = (documentoIdentidad: string, idReunion: number): Observable<any> => {
    return this.http.get(`${this.ruta}/acceso-reunion/get-id-convocado/${documentoIdentidad}/${idReunion}`, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de consultar si un representante tiene restricciones
   * 
   * @param idConvocadoReunion 
   * @param documentoIdentidad 
   * @returns Observable 
   */
  getRestricciones = (idConvocadoReunion: number, documentoIdentidad: string): Observable<any> => {
    return this.http.get(`${this.ruta}/acceso-reunion/get-restricciones/${idConvocadoReunion}/${documentoIdentidad}`, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de enviar SMS para firma
   * 
   * @param idConvocadoReunion
   * @param numeroCelular 
   * @returns Observable 
   */
  enviarSMSInvitacion = (idConvocadoReunion: number, numeroCelular: string): Observable<any> => {
    return this.http.post(`${this.ruta}/acceso-reunion/enviar-sms`, { idConvocadoReunion, numeroCelular }, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de enviar firma desde el celular
   * 
   * @param idConvocadoReunion
   * @param firmaBase64 
   * @returns Observable 
   */
  enviarFirma = (idConvocadoReunion: string, firmaBase64: string): Observable<any> => {
    return this.http.post(`${this.ruta}/acceso-reunion/enviar-firma`, { idConvocadoReunion, firmaBase64 }, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de consultar si el convocado ya realizó la firma
   * 
   * @param idConvocadoReunion
   * @returns Observable 
   */
  permitirFirma = (idConvocadoReunion: string): Observable<any> => {
    return this.http.get(`${this.ruta}/acceso-reunion/permitir-firma/${idConvocadoReunion}`, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de registrar un representante
   * 
   * @param params 
   * @returns Observable 
   */
  registrarRepresentante = (params: String[]): Observable<any> => {
    return this.http.post(`${this.ruta}/acceso-reunion/registrar-representante`, { params }, { headers: this.reqHeader });
  }

  /**
   * Servicio encargada de consultar si un convocado
   * tiene representante para la reunión actual
   * 
   * @param idConvocadoReunion
   * @returns Observable 
   */
  getRepresentante = (idConvocadoReunion: number): Observable<any> => {
    return this.http.get(`${this.ruta}/acceso-reunion/get-representante/${idConvocadoReunion}`, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de cancelar una designación de poder
   * 
   * @param idConvocadoReunion 
   * @returns Observable 
   */
  cancelarInvitacion = (idConvocadoReunion: string): Observable<any> => {
    return this.http.post(`${this.ruta}/acceso-reunion/cancelar-representacion`, { idConvocadoReunion }, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de consultar si un convocado es representante de otros
   * 
   * @param idConvocadoReunion 
   * @returns Observable 
   */
  getRepresentados = (idConvocadoReunion: Number[]): Observable<any> => {
    return this.http.post(`${this.ruta}/acceso-reunion/get-representados`, { idConvocadoReunion }, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de cancelarlas designaciones de poder
   * que le hayan otorgado otros convocados
   * 
   * @param params
   * @returns Observable 
   */
  cancelarRepresentaciones = (params: Record<string, any>[]): Observable<any> => {
    return this.http.post(`${this.ruta}/acceso-reunion/cancelar-representaciones`, { params }, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de obtener la programación de una reunión en curso
   * 
   * @param idConvocadoReunion 
   * @returns Observable 
   */
  getAvanceReunion = (idConvocadoReunion: number): Observable<any> => {
    return this.http.get(`${this.ruta}/acceso-reunion/get-avance-reunion/${idConvocadoReunion}`, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de consultar reuniones en espera ó en curso que tenga un convocado
   * 
   * @param identificacion
   * @param id_reunion 
   * @returns Observable 
   */
  getListadoReuniones = (identificacion: string, id_reunion: number): Observable<any> => {
    return this.http.get(`${this.ruta}/acceso-reunion/get-listado-reuniones/${id_reunion}/${identificacion}`, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de consultar el tipo de rol para un convocado en una reunión
   * 
   * @param idConvocadoReunion
   * @returns Observable 
   */
  getTipoConvocado = (idConvocadoReunion: number): Observable<any> => {
    return this.http.get(`${this.ruta}/acceso-reunion/get-tipo-convocado/${idConvocadoReunion}`, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de consultar la programación de una reunión
   * 
   * @param idReunion
   * @returns Observable 
   */
  getProgramacionReunion = (idReunion: number, idConvocadoReunion: undefined | number): Observable<Response<Programacion[]>> => {
    return this.http.get<Response<Programacion[]>>(`${this.ruta}/acceso-reunion/get-programacion/${idReunion}/${idConvocadoReunion || 0}`, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de actualizar el estado de un programa
   * 
   * @param id_programa 
   * @param estado 
   * @returns Observable
   */
  actualizarEstadoPrograma = (id_programa: number, estado: string): Observable<any> => {
    return this.http.post(`${this.ruta}/acceso-reunion/actualizar-estado-programa`, { id_programa, estado }, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de obtener las respuestas de un id_convocado_reunion
   * 
   * @param id_convocado_reunion 
   * @returns Observable
   */
  getRespuestasConvocado = (id_convocado_reunion: number): Observable<any> => {
    return this.http.get(`${this.ruta}/acceso-reunion/get-respuestas-convocado/${id_convocado_reunion}`, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de obtener la lista de convocados a una reunión
   * 
   * @param id_reunion 
   * @returns Observable
   */
  getListaConvocados = (id_reunion: number): Observable<Response<Convocado[]>> => {
    return this.http.get<Response<Convocado[]>>(`${this.ruta}/acceso-reunion/get-lista-convocados/${id_reunion}`, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de obtener las respuestas asociadas a una reunión específica
   * 
   * @param id_reunion 
   * @returns Observable
   */
  getRespuestasReunion = (id_reunion: number): Observable<Response2<Respuesta[]>> => {
    return this.http.get<Response2<Respuesta[]>>(`${this.ruta}/acceso-reunion/get-respuestas-reunion/${id_reunion}`, { headers: this.reqHeader });
  }

  /**
   * Servicio encargado de finalizar/cancelar una reunión
   * 
   * @param id_reunion 
   * @param estado 
   * @returns Observable
   */
  finalizarReunion = (id_reunion: number, estado: number): Observable<any> => {
    return this.http.post(`${this.ruta}/acceso-reunion/finalizar-reunion`, { id_reunion, estado }, { headers: this.reqHeader });
  }

  getRestriccionesPoder = (idConvocadoReunion: number, documentoIdentidad: string): Observable<any> => {
    return this.http.get(`${this.ruta}/acceso-reunion/get-otras-restricciones/${idConvocadoReunion}/${documentoIdentidad}`, { headers: this.reqHeader });
  }

  getDataAdmin = (token: string): Observable<Response<{ id_reunion: string; id_usuario: string; }>> => {
    return this.http.get<Response<{ id_reunion: string; id_usuario: string; }>>(`${this.ruta}/acceso-reunion/get-data-admin/${token}`, { headers: this.reqHeader });
  }

  getSummonedList = (id_reunion: number): Observable<Response2<number[]>> => {
    return this.http.get<Response2<number[]>>(`${environment.sockets}/getSummonedList?id_reunion=${id_reunion}`);
  }

  answerQuestion(convocatoria: number[], id_programa: number, response: any | { votacion: boolean; }): Observable<Response2<string>> {
    return this.http.post<Response2<string>>(`${this.ruta}/acceso-reunion/answer-question`, { convocatoria, id_programa, response: JSON.stringify(response) }, { headers: this.reqHeader });
  }

  saveLogin(id_convocado_reunion: number) {
    return this.http.post<Response2<string>>(`${this.ruta}/acceso-reunion/guardar-acceso-reunion`, { id_convocado_reunion }, { headers: this.reqHeader });
  }

  getAllSummonedList = (id_reunion: number): Observable<Response<(Convocado & { hasLoggedin: number; })[]>> => {
    return this.http.get<Response<(Convocado & { hasLoggedin: number; })[]>>(`${this.ruta}/acceso-reunion/get-all-summoned-list/${id_reunion}`, { headers: this.reqHeader });
  }

  saveProgram(data: FormData): Observable<Response2<string>> {
    return this.http.post<Response2<string>>(`${this.ruta}/acceso-reunion/save-program`, data, { headers: this.reqHeader });
  }

  summon(id_grupo: number, id_reunion: number, data: Record<string, any>): Observable<Response2<string>> {
    return this.http.post<Response2<string>>(`${this.ruta}/acceso-reunion/summon/${id_grupo}/${id_reunion}`, data, { headers: this.reqHeader });
  }

  sendMailToSummon(data: FormData): Observable<Response2<string>> {
    return this.http.post<Response2<string>>(`${this.ruta}/acceso-reunion/send-mail-to-summon`, data, { headers: this.reqHeader });
  }

  sendMailToSummonRunning(data: FormData): Observable<Response2<string>> {
    return this.http.post<Response2<string>>(`${this.ruta}/acceso-reunion/send-mail-to-summon-running`, data, { headers: this.reqHeader });
  }

  checkElection = (id_reunion: number): Observable<Response2<Record<string, Elected>>> => {
    return this.http.post<Response2<Record<string, Elected>>>(`${this.ruta}/acceso-reunion/check-election`, { id_reunion }, { headers: this.reqHeader });
  }

  saveElection = (data: Record<string, Elected>): Observable<any> => {
    return this.http.post(`${this.ruta}/acceso-reunion/save-election`, { data }, { headers: this.reqHeader });
  }

  checkFirmaActa = (id_reunion: number): Observable<any> => {
    return this.http.post(`${this.ruta}/acceso-reunion/check-firma-acta`, { id_reunion }, { headers: this.reqHeader });
  }

  getNumeroActa = (id_tipo_reunion: number): Observable<Response2<number>> => {
    return this.http.get<Response2<number>>(`${this.ruta}/acceso-reunion/get-numero-acta/${id_tipo_reunion}`, { headers: this.reqHeader });
  }

  getAnnouncementDate = (id_reunion: number): Observable<Response2<string>> => {
    return this.http.get<Response2<string>>(`${this.ruta}/acceso-reunion/get-announcement-date/${id_reunion}`, { headers: this.reqHeader });
  }

  getSummonedLoggedinList = (id_reunion: number): Observable<Response2<ConvocadoLogueado[]>> => {
    return this.http.get<Response2<ConvocadoLogueado[]>>(`${this.ruta}/acceso-reunion/get-summoned-loggedin-list/${id_reunion}`, { headers: this.reqHeader });
  }

  downloadActa = (data: { style: string; pageContent: string; headerContent: string; action: 'save' | 'download'; id_reunion: number; }): Observable<Blob> => {
    const formData = new FormData();
    formData.append('headerContent', data.headerContent.split('style').join('styli'));
    formData.append('pageContent', data.pageContent.split('style').join('styli'));
    formData.append('style', data.style.split('style').join('styli'));
    formData.append('id_reunion', `${data.id_reunion}`);
    formData.append('action', data.action);

    return this.http.post(`${this.ruta}/acceso-reunion/download-acta`, formData, { responseType: 'blob', headers: this.reqHeader });
  }

  getSignList = (id_reunion: number): Observable<Response2<{ path: string; rol: string; }[]>> => {
    return this.http.get<Response2<{ path: string; rol: string; }[]>>(`${environment.sockets}/getSignList?id_reunion=${id_reunion}`);
  }

  getUrlFirma = (id_convocado_reunion: string, url_firma: string) => {
    return this.http.get<{ ok: boolean; }>(`${environment.sockets}/get-url-firma?url_firma=${url_firma}&id_convocado_reunion=${id_convocado_reunion}`);
  }

}

