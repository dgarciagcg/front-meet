
import { RouterModule, Routes } from "@angular/router";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared.module";
import { JuntaGcMutualComponent } from './junta-gc-mutual.component';

const routes: Routes = [{ path: ':identificador', component: JuntaGcMutualComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes), CommonModule, SharedModule],
  declarations: [JuntaGcMutualComponent],
})
export class JuntaGcMutualModule { }
