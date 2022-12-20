import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID, NgModule } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { CatchErrorInterceptor } from './interceptors/catch-error.interceptor';
import { SpinnerInterceptor } from './interceptors/spinner.interceptor';
import { LoginInterceptor } from './interceptors/login.interceptor';

// CONFIGURACION REGIONAL
import localeCOLExtra from '@angular/common/locales/extra/es-CO';
import localeCOL from '@angular/common/locales/es-CO';
import { SharedModule } from './shared.module';

registerLocaleData(localeCOL, 'es-CO', localeCOLExtra);

@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AppComponent
  ], imports: [
    BrowserAnimationsModule,
    AppRoutingModule,
    BrowserModule,
    CommonModule,
    SharedModule
  ], providers: [
    { provide: HTTP_INTERCEPTORS, useClass: CatchErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: SpinnerInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoginInterceptor, multi: true },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'COP' },
    { provide: LOCALE_ID, useValue: 'es-CO' }
  ],
})
export class AppModule { }
