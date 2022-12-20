import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared.module';

import { RedirectingComponent } from './redirecting.component';

const routes: Routes = [{ path: '', component: RedirectingComponent }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule],
  declarations: [RedirectingComponent]
})
export class RedirectingModule { }
