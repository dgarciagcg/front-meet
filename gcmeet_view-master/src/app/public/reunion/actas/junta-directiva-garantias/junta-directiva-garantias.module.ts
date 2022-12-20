import { RouterModule, Routes } from "@angular/router";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared.module";
import { JuntaDirectivaGarantiasComponent } from './junta-directiva-garantias.component';


const routes: Routes = [{ path: ':identificador', component: JuntaDirectivaGarantiasComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes), CommonModule, SharedModule],
    declarations: [JuntaDirectivaGarantiasComponent],
})
export class JuntaDirectivaGarantiasModule { }
