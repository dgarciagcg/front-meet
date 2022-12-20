import { RouterModule, Routes } from "@angular/router";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared.module";
import { NgxSpinnerModule } from 'ngx-spinner';


const routes: Routes = [
    {
        loadChildren: () => import('./asamblea-general-ordinaria-accionistas/asamblea-general-ordinaria-accionistas.module').then(m => m.AsambleaGeneralOrdinariaAccionistasModule),
        path: 'asamblea-general-ordinaria-accionistas',
    },
    {
        loadChildren: () => import('./junta-gc-mutual/junta-gc-mutual.module').then(m => m.JuntaGcMutualModule),
        path: 'junta-gc-mutual',
    },
    {
        loadChildren: () => import('./junta-control-social-gcmutual/junta-control-social-gcmutual.module').then(m => m.JuntaControlSocialGcmutualModule),
        path: 'junta-control-social-gcmutual',
    },
    {
        loadChildren: () => import('./junta-directiva-garantias/junta-directiva-garantias.module').then(m => m.JuntaDirectivaGarantiasModule),
        path: 'junta-directiva-garantias',
    },
    {
        loadChildren: () => import('./asamblea-general-asociados/asamblea-general-asociados.module').then(m => m.AsambleaGeneralAsociadosModule),
        path: 'asamblea-general-asociados',
    },
    { path: '**', redirectTo: '/' }
];


@NgModule({
    declarations: [],
    imports: [
        RouterModule.forChild(routes),
        CommonModule,
        SharedModule,
        NgxSpinnerModule
    ],
})
export class ActasModule { }
