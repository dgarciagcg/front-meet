import { Recursos } from "./recursos.interface";

export interface Reuniones {
    id_reunion: number;
    plantilla: string;
    id_tipo_reunion: number;
    descripcion: string;
    fecha_actualizacion: string;
    fecha_reunion: string;
    hora: string;
    quorum: string;
    id_acta?: string;
    programacion?: string;
    titulo?: string;
    id_grupo?: number;
    url_logo?: string;
    logo?: string;
    validacion?: ConvocadoAdicional[];
    acta: string | null;
    estado: string;
    fecha_finalizacion: string | null;
    grupo: string;
}

export interface Convocados {
    id_convocado_reunion: number;
    id_reunion: number;
    representacion?: string;
    id_relacion: number;
    fecha: Date;
    tipo: string;
    nit?: string;
    razon_social?: string;
    participacion: number;
    soporte?: string;
    fecha_envio_invitacion?: string;
    firma: string;
    acta: string;
    estado: string;
}

export interface ConvocadoAdicional extends Recursos {
    id_convocado_reunion: number;
    id_rol: number;
    nit: string;
    razon_social: string;
    participacion: number;
    representacion: number;
    rol: string;
    tipo: string;
    fecha_envio_invitacion?: string;
    firma: string;
    acta: string;
    estado: string;
}

export interface RecursoUnico {
    id_recurso: number;
    correo: string;
    razon_social: string;
    relaciones: { descripcion: string; id_relacion: number; }[];
    relacion_seleccionada: number;
    completado?: boolean;
}

export interface Programas {
    id_convocado_reunion?: number;
    rol_acta_descripcion?: string;
    cantidadArchivos: Archivos[];
    rol_acta_firma?: string;
    rol_acta_acta?: string;
    opciones?: Programas[];
    archivos?: Archivos[];
    id_rol_acta?: number;
    id_programa: number;
    descripcion: string;
    id_reunion: number;
    numeracion: string;
    relacion: number;
    titulo: string;
    estado: string;
    orden: number;
    tipo: string;
}

export interface Archivos {
    id_archivo_programacion: number;
    id_programa: number;
    descripcion: string;
    peso: string;
    url: string;
}

export interface RolesActas {
    id_rol_acta: number;
    id_acta: number;
    descripcion: string;
    firma: string;
    acta: string;
    estado: string;
}
