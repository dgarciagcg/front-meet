import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'src/app/shared.module';

import { ConvocatoriaComponent } from './convocatoria/convocatoria.component';
import { ProgramacionComponent } from './programacion/programacion.component';
import { MeetManagementComponent } from './meet-management.component';

const routes: Routes = [
  { path: ':action/:id', component: MeetManagementComponent },
  { path: '**', redirectTo: '/public/login' }
];

@NgModule({
  declarations: [
    MeetManagementComponent,
    ConvocatoriaComponent,
    ProgramacionComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
  ]
})
export class MeetManagementModule { }
