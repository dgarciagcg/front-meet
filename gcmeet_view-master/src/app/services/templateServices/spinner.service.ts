import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from 'src/environments/environment';

import { NgxSpinnerService } from 'ngx-spinner';

import { UserLocalService } from './user-local.service';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {

  ruta = environment.api;

  header = new HttpHeaders({
    Authorization: 'Bearer ' + this.userLocalService.getToken()
  });

  constructor(
    private userLocalService: UserLocalService,
    private spinnerService: NgxSpinnerService
  ) { }

  public llamarSpinner = () => {
    this.spinnerService.show();
  }

  public detenerSpinner = () => {
    this.spinnerService.hide();
  }
}
