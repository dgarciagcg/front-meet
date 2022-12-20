import { Injectable } from '@angular/core';

declare const alertify: any;

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() { }

  /**
   * Método que notifica al usuario con las alertas del sistema
   * @param message Información a notificar
   * @param timeToShowMessage Tiempo que durará en pantalla la alerta
   */
  showAlert(message: string, timeToShowMessage = 30) {

    const notificationOptions: NotificationOptions = {
      icon: 'src/favicon.ico',
      body: message
    }

    if (!("Notification" in window)) { // Verifica si el navegador soporta las notificaciones
      alertify.message(message, timeToShowMessage);
    } else if (Notification.permission === "granted") { // Notificaciones permitidas
      new Notification('GCmeet', notificationOptions);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission: string) => { // Pide permiso al usuario
        permission === "granted" ? (new Notification('GCmeet', notificationOptions)) : (alertify.message(message, timeToShowMessage));
      });
    } else { alertify.message(message, timeToShowMessage); }
  }

}
