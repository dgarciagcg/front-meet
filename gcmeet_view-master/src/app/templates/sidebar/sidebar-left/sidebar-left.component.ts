import { Component, OnInit } from '@angular/core';

import { LoginService } from 'src/app/services/login.service';

@Component({
  templateUrl: './sidebar-left.component.html',
  styleUrls: ['./sidebar-left.component.scss'],
  selector: 'app-sidebar-left'
})
export class SidebarLeftComponent {

  accion!: string;

  constructor(private loginService: LoginService) { }

  // Cerrar sesión, destruye el token de seguridad
  logout = () => {
    this.loginService.logout();
    window.location.reload();
  }

}
