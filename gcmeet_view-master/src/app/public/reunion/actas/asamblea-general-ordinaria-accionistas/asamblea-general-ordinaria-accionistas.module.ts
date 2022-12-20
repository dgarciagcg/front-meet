import { RouterModule, Routes } from "@angular/router";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared.module";

import { AsambleaGeneralOrdinariaAccionistasComponent } from "./asamblea-general-ordinaria-accionistas.component";

const routes: Routes = [{ path: ':identificador', component: AsambleaGeneralOrdinariaAccionistasComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes), CommonModule, SharedModule],
    declarations: [AsambleaGeneralOrdinariaAccionistasComponent],
})
export class AsambleaGeneralOrdinariaAccionistasModule { }
