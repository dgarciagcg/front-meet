import { Component, OnDestroy, OnInit } from '@angular/core';

import { MeetUtilitiesService } from 'src/app/services/templateServices/meet-utilities.service';

@Component({
    selector: 'app-reunion',
    templateUrl: './reunion.component.html',
    styleUrls: ['./reunion.component.scss']
})
export class ReunionComponent implements OnInit, OnDestroy {

    constructor(private meetUtilities: MeetUtilitiesService) { }

    ngOnInit(): void {
        const meets = this.meetUtilities.getMeets();
        Object.entries(meets).forEach(([key, item]) => this.meetUtilities.checkExpiration(item) && delete meets[key]);
        localStorage.setItem('meeting-rooms', JSON.stringify(meets));
    }

    ngOnDestroy(): void { this.meetUtilities.currentToken = undefined; }

}
