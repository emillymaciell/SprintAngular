import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Vehicle, VehicleData } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private http = inject(HttpClient);

  private vehiclesList: Vehicle[] = [];

  private selectedVehicleSubject = new BehaviorSubject<Vehicle | null>(null);
  public selectedVehicle$ = this.selectedVehicleSubject.asObservable();

  private selectedVehicleDataSubject = new BehaviorSubject<VehicleData | null>(null);
  public selectedVehicleData$ = this.selectedVehicleDataSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor() {}

  getVehicles(): Observable<Vehicle[]> {
    const url = `${environment.apiUrl}/vehicles`;
    return this.http.get<{ vehicles: Vehicle[] }>(url).pipe(
      map(response => response.vehicles),
      tap(vehicles => {
        this.vehiclesList = vehicles;
      }),
      catchError(error => {
        this.errorSubject.next('Erro ao carregar lista de veículos.');
        return throwError(() => error);
      })
    );
  }

  selectVehicle(vehicle: Vehicle | null): void {
    this.errorSubject.next(null);
    if (!vehicle) {
      this.selectedVehicleSubject.next(null);
      this.selectedVehicleDataSubject.next(null);
      return;
    }

    this.selectedVehicleSubject.next(vehicle);
    this.selectedVehicleDataSubject.next(null);
  }

  searchVehicleByVin(vin: string): Observable<VehicleData | null> {
    this.errorSubject.next(null);
    return this.fetchVehicleData(vin).pipe(
      tap((data) => {
        this.selectedVehicleDataSubject.next(data);
        this.selectedVehicleSubject.next(null);
      }),
      catchError((err) => {
        this.selectedVehicleSubject.next(null);
        this.selectedVehicleDataSubject.next(null);
        
        let errorMsg = 'VIN não encontrado.';
        if (err.error && err.error.message) {
          errorMsg = err.error.message;
        }
        this.errorSubject.next(errorMsg);
        
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  private fetchVehicleData(vin: string): Observable<VehicleData> {
    const url = `${environment.apiUrl}/vehicleData`;
    return this.http.post<VehicleData>(url, { vin }).pipe(
      map((data: VehicleData) => {
        if (!data) {
          throw new Error('Formato de dados de veículo inválido.');
        }
        return data;
      })
    );
  }

  clearState(): void {
    this.selectedVehicleSubject.next(null);
    this.selectedVehicleDataSubject.next(null);
    this.errorSubject.next(null);
  }
}
