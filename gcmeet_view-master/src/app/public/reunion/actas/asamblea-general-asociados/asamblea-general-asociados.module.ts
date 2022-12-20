import { RouterModule, Routes } from "@angular/router";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared.module";

import { AsambleaGeneralAsociadosComponent } from "./asamblea-general-asociados.component";

const routes: Routes = [{ path: ':identificador', component: AsambleaGeneralAsociadosComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes), CommonModule, SharedModule],
    declarations: [AsambleaGeneralAsociadosComponent],
})
export class AsambleaGeneralAsociadosModule { }
