import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RedirectingService {

  constructor(private router: Router) {
  }

  navigate(destinationPath: string) {
    this.router.navigate(['/redirecting']).then(() => this.router.navigate([destinationPath]));
  }

}
