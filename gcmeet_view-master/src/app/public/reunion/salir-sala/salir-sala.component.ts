import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-salir-sala',
  templateUrl: './salir-sala.component.html',
  styleUrls: ['./salir-sala.component.scss']
})
export class SalirSalaComponent implements OnInit {

  /**
   * Variable para guardar el texto a mostrar en el componente
   */
  txtPagina: string = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    /**
     * Se capturan parametros de URL
     */
    const tipo = this.route.snapshot.params['tipo'];

    switch (+tipo) {
      case 2:
        this.txtPagina = 'finalizado';
        break;

      case 3:
        this.txtPagina = 'sido cancelada';
        break;
      default:
        break;
    }
  }

}
