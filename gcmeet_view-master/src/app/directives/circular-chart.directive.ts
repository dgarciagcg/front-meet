import { AfterViewInit, Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

import am4themes_microchart from '@amcharts/amcharts4/themes/microchart';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import am4lang_es_Es from '@amcharts/amcharts4/lang/es_Es';
import * as am4charts from '@amcharts/amcharts4/charts';
import * as am4core from '@amcharts/amcharts4/core';

interface SuffixOptions {
    format: Intl.NumberFormatOptions;
    number: number;
    suffix: string;
    name: string;
}

@Directive({ selector: '[appCircularChart]' })
export class CircularChartDirective implements AfterViewInit, OnChanges, OnDestroy {

    /** Opciones del gráfico */
    @Input() public circularChartOptions!: Partial<{
        chart: Partial<Record<'innerRadius' | 'startAngle' | 'endAngle', number>>;
        label: Partial<{ fill: string; verticalCenter: am4core.VerticalCenter }>;
        valueAxis: Partial<Record<'min' | 'max', number>>;
        valueSerie: Partial<{ fill: string; }>
    }>;
    /** Data del gráfico */
    @Input() public appCircularChart!: number;
    /** Instancia de amcharts */
    @Input() public chartInstance!: am4charts.RadarChart;

    constructor(
        // private transformNumber: TransformNumberPipe,
        private el: ElementRef<HTMLElement>,
        // private amcharts: AmchartsService,
        // private system: SystemService
    ) { ['', null, undefined].includes(this.el.nativeElement.style.display) && (this.el.nativeElement.style.display = 'inline-block'); }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.chartInstance instanceof am4charts.RadarChart) {
            if ('appCircularChart' in changes) {
                const appCircularChart: this['appCircularChart'] = changes['appCircularChart'].currentValue;
                this.chartInstance.data = [{ category: 'default', value: appCircularChart * 100, full: 100 }];
                this.chartInstance.dummyData.label.text = this.setPercentage(appCircularChart);
                this.chartInstance.invalidateRawData();
            }
            if ('circularChartOptions' in changes) {
                const circularChartOptions: this['circularChartOptions'] = changes['circularChartOptions'].currentValue;
                if ('valueAxis' in circularChartOptions) {
                    const valueAxisItem = this.chartInstance.dummyData.valueAxis;
                    const valueAxis = circularChartOptions.valueAxis as Partial<Record<"min" | "max", number>>;
                    'max' in valueAxis && (valueAxisItem.max = valueAxis.max);
                    'min' in valueAxis && (valueAxisItem.min = valueAxis.min);
                }
                if ('chart' in circularChartOptions) {
                    const chart = circularChartOptions.chart as Partial<Record<"innerRadius" | "startAngle" | "endAngle", number>>;
                    const chartItem = this.chartInstance;
                    'innerRadius' in chart && (chartItem.innerRadius = am4core.percent(chart.innerRadius as number));
                    'startAngle' in chart && (chartItem.startAngle = chart.startAngle as number);
                    'endAngle' in chart && (chartItem.endAngle = chart.endAngle as number);
                }
                if ('label' in circularChartOptions) {
                    const labelItem = this.chartInstance.dummyData.label;
                    const label = circularChartOptions.label as Partial<{ fill: string; verticalCenter: am4core.VerticalCenter; }>;
                    'verticalCenter' in label && (labelItem.verticalCenter = label.verticalCenter);
                }
                if ('valueSerie' in circularChartOptions) {
                    const valueSerieItem = this.chartInstance.dummyData.valueSerie;
                    const valueSerie = circularChartOptions.valueSerie as Partial<{ fill: string; }>;
                    'fill' in valueSerie && (valueSerieItem.fill = am4core.color(valueSerie.fill));
                }
            }
        }
    }

    /** Sufijos para números grandes */
    getNumberSuffix = (): SuffixOptions[] => [
        // { number: 1e+3, suffix: 'm', name: 'miles', format: { minimumFractionDigits: 0, maximumFractionDigits: 1 } },
        { number: 1e+6, suffix: 'M', name: 'millones', format: { minimumFractionDigits: 0, maximumFractionDigits: 2 } },
        { number: 1e+9, suffix: 'MM', name: 'miles de millones', format: { minimumFractionDigits: 3, maximumFractionDigits: 3 } },
        { number: 1e+12, suffix: 'B', name: 'billones', format: { minimumFractionDigits: 0, maximumFractionDigits: 2 } },
        { number: 1e+15, suffix: 'MB', name: 'miles de billones', format: { minimumFractionDigits: 3, maximumFractionDigits: 3 } },
        { number: 1e+18, suffix: 'T', name: 'trillones', format: { minimumFractionDigits: 0, maximumFractionDigits: 2 } },
        { number: 1e+21, suffix: 'MT', name: 'miles de trillones', format: { minimumFractionDigits: 3, maximumFractionDigits: 3 } },
        { number: 1e+24, suffix: 'C', name: 'cuatrillones', format: { minimumFractionDigits: 0, maximumFractionDigits: 2 } }
    ]

    chart(target: any, sparkline = false): undefined | (() => void) {
        if (target instanceof am4charts.Chart) {
            target.numberFormatter.bigNumberPrefixes = this.getNumberSuffix();
            target.dateFormatter && target.dateFormatter.language && (target.dateFormatter.language.locale = am4lang_es_Es);
            target.svgContainer && (target.svgContainer.SVGContainer.style.zIndex = '1');
            target.numberFormatter.intlLocales = 'es-CO';
            target.hiddenState.properties.opacity = 0;
            target.fontFamily = 'Montserrat';
            target.margin(0, 0, 0, 0);
            target.paddingBottom = 0;
            target.paddingLeft = 0;
            return undefined;
        }
        return undefined;
    }

    ngAfterViewInit(): void {
        this.circularChartOptions === undefined && (this.circularChartOptions = {});
        this.circularChartOptions.valueAxis === undefined && (this.circularChartOptions.valueAxis = {});
        this.circularChartOptions.chart === undefined && (this.circularChartOptions.chart = {});
        this.circularChartOptions.label === undefined && (this.circularChartOptions.label = {});
        this.circularChartOptions.valueSerie === undefined && (this.circularChartOptions.valueSerie = {});
        am4core.useTheme(am4themes_animated);
        am4core.useTheme(am4themes_microchart);

        this.chartInstance = am4core.create(this.el.nativeElement, am4charts.RadarChart);
        this.chart(this.chartInstance);
        this.chartInstance.dummyData = {};

        this.appCircularChart !== undefined && (this.chartInstance.data = [{ category: 'default', value: this.appCircularChart * 100, full: 100 }]);

        // CHART
        this.chartInstance.innerRadius = am4core.percent(this.circularChartOptions.chart.innerRadius || 80);
        this.chartInstance.startAngle = 'startAngle' in this.circularChartOptions.chart ? (this.circularChartOptions.chart.startAngle as number) : -90;
        this.chartInstance.endAngle = 'endAngle' in this.circularChartOptions.chart ? (this.circularChartOptions.chart.endAngle as number) : 270;
        // CATEGORYAXIS
        const categoryAxis: am4charts.CategoryAxis = this.chartInstance.yAxes.push(new am4charts.CategoryAxis());
        this.chartInstance.dummyData.categoryAxis = categoryAxis;
        categoryAxis.dataFields.category = 'category';
        // VALUEAXIS
        const valueAxis: am4charts.ValueAxis = this.chartInstance.xAxes.push(new am4charts.ValueAxis());
        this.chartInstance.dummyData.valueAxis = valueAxis;
        valueAxis.max = this.circularChartOptions.valueAxis.max || 100;
        valueAxis.min = this.circularChartOptions.valueAxis.min || 0;
        valueAxis.strictMinMax = true;
        // VALUESERIE
        const series = this.chartInstance.series.push(new am4charts.RadarColumnSeries());
        this.chartInstance.dummyData.valueSerie = series;
        'fill' in this.circularChartOptions.valueSerie && (series.columns.template.fill = am4core.color(this.circularChartOptions.valueSerie.fill));
        series.columns.template.strokeWidth = 0;
        series.dataFields.categoryY = 'category';
        series.dataFields.valueX = 'value';
        series.clustered = false;
        // FILLSERIE
        const fillSerie: am4charts.RadarColumnSeries = this.chartInstance.series.push(new am4charts.RadarColumnSeries());
        this.chartInstance.dummyData.fillSerie = fillSerie;
        fillSerie.columns.template.fill = series.columns.template.fill;
        fillSerie.columns.template.fillOpacity = 0.2;
        fillSerie.dataFields.categoryY = 'category';
        fillSerie.columns.template.strokeWidth = 0;
        fillSerie.dataFields.valueX = 'full';
        fillSerie.clustered = false;
        // LABEL
        let color: string | am4core.iRGB;
        if ('fill' in this.circularChartOptions.label) { color = this.circularChartOptions.label.fill as string; } else {
            let defaultColor: string | string[] = window.getComputedStyle(this.el.nativeElement, null).getPropertyValue('color');
            defaultColor = defaultColor.replace(/rgb| |\(|\)/g, '').split(',');
            const rgbColor: am4core.iRGB = { r: +defaultColor[0], g: +defaultColor[1], b: +defaultColor[2] };
            defaultColor[3] !== undefined && (rgbColor.a = +defaultColor[3]);
            color = rgbColor;
        }
        const label = this.chartInstance.radarContainer.createChild(am4core.Label);
        this.chartInstance.dummyData.label = label;
        label.verticalCenter = 'verticalCenter' in this.circularChartOptions.label ? (this.circularChartOptions.label.verticalCenter as am4core.VerticalCenter) : 'middle';
        this.appCircularChart !== undefined && (label.text = this.setPercentage(this.appCircularChart));
        label.horizontalCenter = 'middle';
        label.fill = am4core.color(color);
        label.isMeasured = false;
        const setPixelValues = () => {
            const fontSize = window.getComputedStyle(this.el.nativeElement, null).getPropertyValue('font-size');
            label.fontSize = +fontSize.replace(/px/g, '');
        };
        setPixelValues();
        this.chartInstance.events.on('ready', setPixelValues);
        this.chartInstance.events.on('sizechanged', setPixelValues);
        am4core.unuseTheme(am4themes_microchart);
        am4core.unuseTheme(am4themes_animated);
    }

    /**
     * Formatea un número a porcentage
     * @param value Número a formatea
     * @returns Valor porcentual
     */
    private setPercentage = (value: number) => this.transformNumber(value, 'number', null, { style: 'percent', maximumFractionDigits: 2, minimumFractionDigits: 0 });

    transformNumber(value: number, type: string, suffix: string | null, options: Intl.NumberFormatOptions): string {
        switch (type) {
            case 'number':
                const suffixValue = this.getNumberSuffix().find(item => item.suffix === suffix) || { number: 1, suffix: '' };
                return `${new Intl.NumberFormat('es-CO', options).format(value / suffixValue.number)} ${suffixValue.suffix}`;
            default: return '';
        }
    }

    ngOnDestroy(): void { this.chartInstance instanceof am4charts.RadarChart && this.chartInstance.dispose(); }

}