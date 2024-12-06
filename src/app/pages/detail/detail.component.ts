import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { OlympicService } from 'src/app/core/services/olympic.service';
import { OlympicCountry } from 'src/app/core/models/Olympic';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  private destroy$ = new Subject<void>();
  countryData: OlympicCountry | null = null;
  
  // stats
  numberOfEntries = 0;
  totalMedals = 0;
  totalAthletes = 0;

  // cahrt config
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    datasets: [
      {
        data: [],
        label: 'number of medals',
        backgroundColor: 'rgba(4,131,143,0.2)',
        borderColor: '#04838f',
        pointBackgroundColor: '#04838f',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#04838f',
        fill: 'origin',
      }
    ],
    labels: []
  };

  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    elements: {
      line: {
        tension: 0.5
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    },
    plugins: {
      legend: { 
        display: false,
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private olympicService: OlympicService
  ) {}

  ngOnInit(): void {
    const countryName = this.route.snapshot.paramMap.get('country');
    
    if (!countryName) {
      this.router.navigate(['/']);
      return;
    }

    this.olympicService.getCountryDetails(countryName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (country) => {
          if (!country) {
            this.router.navigate(['/']);
            return;
          }

          this.countryData = country;
          this.calculateStatistics(country);
          this.updateChartData(country);
        },
        error: (error) => {
          console.error('Error loading country details:', error);
          this.router.navigate(['/']);
        }
      });
  }

  private calculateStatistics(country: OlympicCountry): void {
    this.numberOfEntries = country.participations.length;
    this.totalMedals = country.participations.reduce(
      (sum, participation) => sum + participation.medalsCount, 
      0
    );
    this.totalAthletes = country.participations.reduce(
      (sum, participation) => sum + participation.athleteCount, 
      0
    );
  }

  private updateChartData(country: OlympicCountry): void {
    const sortedParticipations = [...country.participations].sort(
      (a, b) => a.year - b.year
    );

    this.lineChartData.labels = sortedParticipations.map(p => p.year.toString());
    this.lineChartData.datasets[0].data = sortedParticipations.map(p => p.medalsCount);

    if (this.chart) {
      this.chart.update();
    }
  }

  onBack(): void {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}