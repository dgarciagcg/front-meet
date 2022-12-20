import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../services/login.service';

// Alertify
declare let alertify: any;

@Component({
  templateUrl: './restablecer.component.html',
  styleUrls: ['./restablecer.component.scss'],
  selector: 'app-restablecer'
})
export class RestablecerComponent implements OnInit {

  formularioRestablecimiento = new FormGroup({});

  // Usuario
  id_usuario!: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private loginService: LoginService,
    private fb: FormBuilder,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initFormRecuperacion();
    this.id_usuario = this.activatedRoute.snapshot.params['id'];
  }

  /**
   * Inicializa el formulario de restablecimiento con la validaciones por defecto
   */
   initFormRecuperacion = () => {
    this.formularioRestablecimiento = this.fb.group({
      contrasena: ['', [Validators.required]],
      confirmar: ['', [Validators.required]],
    });
  }

  reestablecer = () => {

    if (this.formularioRestablecimiento.valid) {
      if (this.formularioRestablecimiento.value.contrasena === this.formularioRestablecimiento.value.confirmar) {
        const valor_formulario_completo = {...this.formularioRestablecimiento.value, id_usuario: this.id_usuario};
        this.loginService.restablecerContrasena(valor_formulario_completo).subscribe((response: any) => {

          if (response?.status) {
            this.router.navigate(['/public/login']);
            alertify.success('La contraseña a sido actualizada con exito', 3);
          } else {
            alertify.error(response.message);
          }
        })
      } else {
        alertify.error('Las contraseñas no coinciden');
      }
    } else {
      alertify.error('Faltan campos por diligenciar');
    }
  }

}
