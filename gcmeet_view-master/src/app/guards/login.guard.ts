import { CanActivate, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { UserLocalService } from '../services/templateServices/user-local.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {

  constructor(
    private userLocalService: UserLocalService,
    private router: Router
  ) { }

  canActivate(): Observable<boolean> | boolean {
    this.userLocalService.token = this.userLocalService.getToken();

    if (this.userLocalService.token) {
      this.router.navigate(['/private/meets']);
      return false;
    }

    return true;
  }

}
