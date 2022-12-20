import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'src/app/shared.module';

import { MeetsComponent } from './meets.component';

const routes: Routes = [{ path: '', component: MeetsComponent }];

@NgModule({
  declarations: [MeetsComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule
  ]
})
export class MeetsModule { }
