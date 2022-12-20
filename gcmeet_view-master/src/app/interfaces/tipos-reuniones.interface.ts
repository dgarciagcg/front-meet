export interface TipoReunion {
    id_tipo_reunion: number;
    id_grupo: number;
    titulo: string;
    honorifico_participante: string;
    honorifico_invitado: string;
    honorifico_representante: string;
    imagen: string;
    estado: string;
}

export interface Restricciones {
    id_tipo_reunion: number;
    id_rol: number;
    descripcion: string;
    estado: string;
}
