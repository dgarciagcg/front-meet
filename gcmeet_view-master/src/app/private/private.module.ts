import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from '../shared.module';

import { AuthGuard } from '../guards/auth.guard';

import { PrivateComponent } from './private.component';

const routes: Routes = [{
  component: PrivateComponent,
  path: '',
  children: [
    { path: 'meet-management', loadChildren: () => import('./meet-management/meet-management.module').then(m => m.MeetManagementModule), canActivate: [AuthGuard], },
    { path: 'meet-design', loadChildren: () => import('./meet-design/meet-design.module').then(m => m.MeetDesignModule), canActivate: [AuthGuard], },
    { path: 'meets', loadChildren: () => import('./meets/meets.module').then(m => m.MeetsModule), canActivate: [AuthGuard] },
    { path: '**', redirectTo: 'meets' }
  ]
}];

@NgModule({
  declarations: [
    PrivateComponent,
  ], imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
  ]
})
export class PrivateModule { }
