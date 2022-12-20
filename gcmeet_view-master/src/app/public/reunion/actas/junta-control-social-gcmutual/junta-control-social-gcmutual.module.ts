import { RouterModule, Routes } from "@angular/router";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared.module";

import { JuntaControlSocialGcmutualComponent } from './junta-control-social-gcmutual.component';

const routes: Routes = [{ path: ':identificador', component: JuntaControlSocialGcmutualComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes), CommonModule, SharedModule],
    declarations: [JuntaControlSocialGcmutualComponent],
})
export class JuntaControlSocialGcmutualModule { }
