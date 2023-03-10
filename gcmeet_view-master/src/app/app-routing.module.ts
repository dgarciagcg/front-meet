import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

const routes: Routes = [
  { path: 'private', loadChildren: () => import('./private/private.module').then(m => m.PrivateModule) },
  { path: 'public', loadChildren: () => import('./public/public.module').then(m => m.PublicModule) },
  { path: '', redirectTo: 'public', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
