import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared.module';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AccesoReunionComponent } from './acceso-reunion/acceso-reunion.component';
import { SalaEsperaComponent } from './sala-espera/sala-espera.component';
import { SalirSalaComponent } from './salir-sala/salir-sala.component';
import { FirmaComponent } from './firma/firma.component';
import { ReunionComponent } from './reunion.component';

const routes: Routes = [{
    component: ReunionComponent,
    path: '',
    children: [
        { path: 'meeting-room', loadChildren: () => import('./meeting-room/meeting-room.module').then(m => m.MeetingRoomModule) }, // Acceso Admin
        { path: 'actas', loadChildren: () => import('./actas/actas.module').then(m => m.ActasModule) },
        { path: 'acceso/:id_convocado_reunion/:identificacion', component: AccesoReunionComponent }, // Acceso y validación directa
        { path: 'sala-espera/:id_convocado_reunion', component: SalaEsperaComponent },
        { path: 'acceso/:id_convocado_reunion', component: AccesoReunionComponent },
        { path: 'firma/:id_convocado_reunion', component: FirmaComponent },
        { path: 'salir-sala/:tipo', component: SalirSalaComponent },
        { path: '**', redirectTo: '/public/home' }
    ]
}];

@NgModule({
    declarations: [AccesoReunionComponent, SalaEsperaComponent, SalirSalaComponent, ReunionComponent, FirmaComponent,],
    imports: [RouterModule.forChild(routes), CommonModule, SharedModule]
})
export class ReunionModule { }
