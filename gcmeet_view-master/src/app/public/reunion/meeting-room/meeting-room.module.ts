import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared.module';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { EstructuraConvocadoComponent } from './estructura-convocado/estructura-convocado.component';
import { ResultadoSeleccionComponent } from './resultado-seleccion/resultado-seleccion.component';
import { ResultadosVotacionComponent } from './resultados-votacion/resultados-votacion.component';
import { ProgresoRespuestasComponent } from './progreso-respuestas/progreso-respuestas.component';
import { EstructuraProgramaComponent } from './estructura-programa/estructura-programa.component';
import { SeleccionMultipeComponent } from './seleccion-multipe/seleccion-multipe.component';
import { SeleccionUnicaComponent } from './seleccion-unica/seleccion-unica.component';
import { MeetingRoomComponent } from './meeting-room.component';

const routes: Routes = [
    { path: ':identificador', component: MeetingRoomComponent }, // Acceso Admin
    { path: '', redirectTo: '/public/home', pathMatch: 'full' },
    { path: '**', redirectTo: '/public/home' }
];

@NgModule({
    declarations: [
        EstructuraConvocadoComponent,
        ResultadosVotacionComponent,
        ResultadoSeleccionComponent,
        ProgresoRespuestasComponent,
        EstructuraProgramaComponent,
        SeleccionMultipeComponent,
        SeleccionUnicaComponent,
        MeetingRoomComponent,
    ],
    imports: [
        RouterModule.forChild(routes),
        CommonModule,
        SharedModule,
    ]
})
export class MeetingRoomModule { }
