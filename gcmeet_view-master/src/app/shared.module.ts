import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { SignaturePadModule } from 'angular2-signaturepad';
import { NgxSpinnerModule } from 'ngx-spinner';

import { SidebarRightComponent } from './templates/sidebar/sidebar-right/sidebar-right.component';
import { SidebarLeftComponent } from './templates/sidebar/sidebar-left/sidebar-left.component';

import { DropdownMaterializeDirective } from './directives/dropdown-materialize.directive';
import { TextareaHeightDirective } from './directives/textarea-height.directive';
import { CircularChartDirective } from './directives/circular-chart.directive';
import { CollapsableDirective } from './directives/collapsable.directive';
import { CheckInputDirective } from './directives/checkInput.directive';
import { TooltipDirective } from './directives/tooltip.directive';

import { GetElectionPercentPipe } from './pipes/get-election-percent.pipe';
import { FilterProgrammingPipe } from './pipes/filter-programming.pipe';
import { LetrasOrdenadasPipe } from './pipes/letras-ordenadas.pipe';
import { GetCommentListPipe } from './pipes/get-comment-list.pipe';
import { UncommentHtmlPipe } from './pipes/uncomment-html.pipe';
import { GetFormArrayPipe } from './pipes/get-form-array.pipe';
import { ArrayFilterPipe } from './pipes/array-filter.pipe';
import { GetPercentPipe } from './pipes/get-percent.pipe';
import { SortSummonPipe } from './pipes/sort-summon.pipe';
import { FormBytesPipe } from './pipes/form-bytes.pipe';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { SafeUrlPipe } from './pipes/safe-url.pipe';
import { ToFixedPipe } from './pipes/to-fixed.pipe';

const MODULES = [
  ReactiveFormsModule,
  SignaturePadModule,
  HttpClientModule,
  NgxSpinnerModule,
  RouterModule,
  FormsModule
];

const COMPONENTS = [
  SidebarRightComponent,
  SidebarLeftComponent,
];

const DIRECTIVES = [
  DropdownMaterializeDirective,
  TextareaHeightDirective,
  CircularChartDirective,
  CollapsableDirective,
  CheckInputDirective,
  TooltipDirective
];

const PIPES = [
  GetElectionPercentPipe,
  FilterProgrammingPipe,
  LetrasOrdenadasPipe,
  GetCommentListPipe,
  UncommentHtmlPipe,
  GetFormArrayPipe,
  ArrayFilterPipe,
  SortSummonPipe,
  GetPercentPipe,
  FormBytesPipe,
  SafeHtmlPipe,
  SafeUrlPipe,
  ToFixedPipe,
];

@NgModule({
  exports: [...MODULES, ...COMPONENTS, ...DIRECTIVES, ...PIPES],
  declarations: [...COMPONENTS, ...DIRECTIVES, ...PIPES],
  imports: [...MODULES, CommonModule]
})
export class SharedModule { }
