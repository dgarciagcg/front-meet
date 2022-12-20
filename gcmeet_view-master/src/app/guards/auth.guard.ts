import { CanActivate, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { UserLocalService } from '../services/templateServices/user-local.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private userLocalService: UserLocalService,
    private router: Router) { }

  canActivate(): Observable<boolean> | boolean {
    this.userLocalService.token = this.userLocalService.getToken();

    if (!this.userLocalService.token) {
      this.router.navigateByUrl('/public/login');
      return false;
    }
    this.userLocalService.getInfoUser();
    return true;
  }

}
