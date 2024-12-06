import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { OlympicCountry } from '../models/Olympic';

@Injectable({
  providedIn: 'root',
})
export class OlympicService {
  private olympicUrl = './assets/mock/olympic.json';
  private olympics$ = new BehaviorSubject<OlympicCountry[] | null>(null);

  constructor(private http: HttpClient) {}

  loadInitialData(): Observable<OlympicCountry[]> {
    return this.http.get<OlympicCountry[]>(this.olympicUrl).pipe(
      tap((countries) => this.olympics$.next(countries)),
      catchError((error) => {
        console.error('Error loading Olympic data:', error);
        this.olympics$.next(null);
        throw error;
      })
    );
  }

  getTotalMedalsByCountry(): Observable<{country: string, totalMedals: number}[]> {
    return this.olympics$.pipe(
      map((countries: OlympicCountry[] | null) => {
        if (!countries) {
          return [];
        }
        return countries.map(country => ({
          country: country.country,
          totalMedals: country.participations.reduce((sum, participation) => sum + participation.medalsCount, 0)
        }));
      })
    );
  }

  getCountryDetails(countryName: string): Observable<OlympicCountry | null> {
    return this.olympics$.pipe(
      map(countries => {
        if (!countries) return null;
        return countries.find(country => country.country === countryName) || null;
      })
    );
  }
}
