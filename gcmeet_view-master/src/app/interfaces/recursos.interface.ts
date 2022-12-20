export interface Recursos {
    identificacion: string;
    tipo?: number | string;
    razon_social?: string;
    emp_username?: string;
    descripcion?: string;
    id_relacion?: number;
    id_recurso?: number;
    telefono: string;
    estado?: string;
    correo: string;
    nombre: string;
    fecha?: string;
    nit?: string;
}

export interface Relaciones {
    id_relacion: number;
    id_recurso: number;
    id_grupo: number;
    id_rol: number;
    estado: string;
}
