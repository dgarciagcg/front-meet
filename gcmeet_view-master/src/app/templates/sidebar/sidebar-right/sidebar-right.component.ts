import { Component } from '@angular/core';

import { UserLocalService } from 'src/app/services/templateServices/user-local.service';

@Component({
  templateUrl: './sidebar-right.component.html',
  styleUrls: ['./sidebar-right.component.scss'],
  selector: 'app-sidebar-right'
})
export class SidebarRightComponent {

  constructor(public UserLocalService: UserLocalService) { }

}
