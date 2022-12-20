import { Injectable } from '@angular/core';

export type MeetingType = 'Administrador' | 'Convocado' | 'Invitado';
export interface Meeting<T extends MeetingType | '' = ''> {
    tipo_usuario: T extends 'Administrador' ? never : ('Convocado' | 'Invitado');
    id_convocado_reunion: T extends 'Administrador' ? never : number;
    identificacion: T extends 'Administrador' ? never : string;
    convocatoria: T extends 'Administrador' ? never : number[];
    id_usuario: T extends 'Administrador' ? string : never;
    id_reunion?: number;
    expiration: number;
};

@Injectable({ providedIn: 'root' })
export class MeetUtilitiesService {

    currentToken?: string;

    checkExpiration(meet: Partial<Meeting<MeetingType | ''>>): boolean {
        if (!meet || !meet.expiration) { return true; };
        return meet.expiration > Date.now() ? false : true;
    }

    getMeets(): Record<string, Partial<Meeting<MeetingType | ''>>> {
        const storedMeets = localStorage.getItem('meeting-rooms');
        const meets: Record<string, Meeting<MeetingType | ''>> = storedMeets ? JSON.parse(storedMeets) : {};
        return meets;
    }

    getMeet(key: string): Partial<Meeting<MeetingType | ''>> {
        return this.getMeets()[key];
    }

    removeMeeting(key: string) {
        const meets = this.getMeets();
        delete meets[key];
        localStorage.setItem('meeting-rooms', JSON.stringify(meets));
        this.currentToken === key && (this.currentToken = undefined);
    }

    setMeeting(key: string, value: Partial<Meeting<MeetingType | ''>>) {
        const meets = this.getMeets();
        meets[key] = value;
        meets[key].expiration = Date.now() + 72e5;
        localStorage.setItem('meeting-rooms', JSON.stringify(meets));
    }

}