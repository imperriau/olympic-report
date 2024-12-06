import { Component, OnInit, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ChartData, ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Router } from '@angular/router';
import { OlympicCountry } from 'src/app/core/models/Olympic';
import { OlympicService } from 'src/app/core/services/olympic.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private destroy$ = new Subject<void>();

  numberOfGames = 0;
  numberOfCountries = 0;

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      tooltip: {
        callbacks:{
          label: function(context) {
            return " " + context.formattedValue + " 🏅";
          }
        }
      }
    }
  };

  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#793d52',
        '#89a1db',
        '#bfe0f1',
        '#9780a1',
        '#b8cbe7',
        '#956065'
      ]
    }]
  };

  constructor(private olympicService: OlympicService, private router: Router) {}

  ngOnInit(): void {
    this.olympicService.loadInitialData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (countries: OlympicCountry[]) => {
          this.numberOfCountries = countries.length;
          
          const uniqueYears = new Set<number>();
          countries.forEach(country => {
            country.participations.forEach(participation => {
              uniqueYears.add(participation.year);
            });
          });
          this.numberOfGames = uniqueYears.size;
        }
      }
      )
  
    this.olympicService.getTotalMedalsByCountry()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (medalsByCountry) => {
          this.pieChartData.labels = medalsByCountry.map(item => item.country);
          this.pieChartData.datasets[0].data = medalsByCountry.map(item => item.totalMedals);
          if (this.chart) {
            this.chart.update();
          }
        },
        error: (error) => console.error('Error loading medals data:', error)
      });
  }

  onChartClick(event: { event?: unknown; active?: unknown[] }): void {
    if (event.active && event.active.length > 0) {
      const index = (event.active[0] as { index: number }).index;
      const countryName = this.pieChartData.labels?.[index];
      if (countryName) {
        this.router.navigate(['/detail', countryName]);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
