import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from '../shared.module';

import { LoginGuard } from '../guards/login.guard';

import { RestablecerComponent } from './restablecer/restablecer.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { PublicComponent } from './public.component';

const routes: Routes = [{
  component: PublicComponent,
  path: '',
  children: [
    { path: 'reunion', loadChildren: () => import('./reunion/reunion.module').then(m => m.ReunionModule) },
    { path: 'restablecer/:id', component: RestablecerComponent, canActivate: [LoginGuard] },
    { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
    { path: 'home', component: HomeComponent },
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: '**', redirectTo: 'home' }
  ]
}];

@NgModule({
  declarations: [
    RestablecerComponent,
    PublicComponent,
    LoginComponent,
    HomeComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule
  ]
})
export class PublicModule { }
