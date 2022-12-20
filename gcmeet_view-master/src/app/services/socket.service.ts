import { Injectable } from '@angular/core';

import { DefaultEventsMap } from "@socket.io/component-emitter";
import { io, Socket } from 'socket.io-client';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketServiceService {

  public socket?: Socket<DefaultEventsMap, DefaultEventsMap>;

  constructor() { }

  connect() {
    this.socket = io(environment.sockets, { transports: ['polling'] });
  }

  disconnect() {
    this.socket instanceof Socket && this.socket.disconnect();
    this.socket = undefined;
  }

}