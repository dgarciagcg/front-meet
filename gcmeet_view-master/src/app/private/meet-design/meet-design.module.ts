import { RouterModule, Routes } from "@angular/router";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "src/app/shared.module";

import { SummonManagementComponent } from './summon-management/summon-management.component';
import { MeetDesignComponent } from "./meet-design.component";

const routes: Routes = [{ path: ':action/:id', component: MeetDesignComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes), CommonModule, SharedModule],
    declarations: [MeetDesignComponent, SummonManagementComponent],
})
export class MeetDesignModule { }
