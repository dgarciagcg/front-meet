import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { UserLocalService } from 'src/app/services/templateServices/user-local.service';
import { LoginService } from 'src/app/services/login.service';

// Alertify
declare let alertify: any;

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  selector: 'app-login'
})
export class LoginComponent implements OnInit {

  formularioLogin = new FormGroup({});
  formularioRecuperacion = new FormGroup({});

  constructor(
    private userLocalService: UserLocalService,
    private loginService: LoginService,
    private fb: FormBuilder,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initFormLogin();
    this.initFormRecuperacion();
  }

  /** Inicializa el formulario del login con la validaciones por defecto */
  initFormLogin = () => {
    this.formularioLogin = this.fb.group({
      id_usuario: ['', [Validators.required]],
      contrasena: ['', [Validators.required]],
    });
  }

  /** Me permite loguearme en la aplicación */
  loguearse = () => {
    if (this.formularioLogin.valid) {
      this.loginService.login(this.formularioLogin.value).subscribe((response: any) => {
        if (response?.status) {
          this.userLocalService.saveToken(response?.access_token);
          window.location.reload();
        } else {
          alertify.error(response.message);
        }
      });
    } else {
      alertify.error('Faltan campos por diligenciar')
    }
  }

  /** Inicializa el formulario de recuperaacion con la validaciones por defecto */
  initFormRecuperacion = () => {
    this.formularioRecuperacion = this.fb.group({
      id_usuario: ['', [Validators.required]],
    });
  }

  recuperar = () => {
    if (this.formularioRecuperacion.valid) {
      this.loginService.recuperarContrasena(this.formularioRecuperacion.value).subscribe((response: any) => {
        if (response?.status) {
          this.router.navigate(['/public/login']);
          alertify.success('Se ha enviado un link a su correo para continuar con el proceso', 10);
        } else {
          alertify.error('El usuario no se encuentra registrado');
        }
      });
    } else {
      alertify.error('Faltan campos por diligenciar')
    }
  }

}
