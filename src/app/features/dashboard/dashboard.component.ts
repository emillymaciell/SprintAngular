import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subscription, of } from 'rxjs';
import { debounceTime, filter, distinctUntilChanged, switchMap, catchError, map } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { Vehicle } from '../../core/models/models';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  public vehicleService = inject(VehicleService);

  vehicles: Vehicle[] = [];
  selectedVehicle$ = this.vehicleService.selectedVehicle$;
  selectedVehicleData$ = this.vehicleService.selectedVehicleData$;

  selectedVehicleDataArray$ = this.selectedVehicleData$.pipe(
    map(data => data ? [data] : [])
  );

  apiError$ = this.vehicleService.error$;
  currentUser$ = this.authService.currentUser$;

  searchControl = new FormControl('');
  selectedVehicleId: number | null = null;

  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.vehicleService.getVehicles().subscribe((list) => {
      this.vehicles = list;
    });

    this.subscriptions.add(
      this.selectedVehicle$.subscribe((vehicle) => {
        this.selectedVehicleId = vehicle ? vehicle.id : null;
      })
    );

    this.subscriptions.add(
      this.searchControl.valueChanges.pipe(
        map(val => (val ? val.trim() : '')),
        debounceTime(350),
        filter(val => val.length > 0),
        distinctUntilChanged(),
        switchMap((vin) => {
          return this.vehicleService.searchVehicleByVin(vin).pipe(
            catchError((err) => {
              return of(null);
            })
          );
        })
      ).subscribe()
    );
  }

  onVehicleChange(vehicleId: number | null): void {
    if (vehicleId === null) {
      this.vehicleService.selectVehicle(null);
      this.searchControl.setValue('', { emitEvent: false });
    } else {
      const match = this.vehicles.find(v => v.id === vehicleId);
      if (match) {
        this.vehicleService.selectVehicle(match);
        this.searchControl.setValue('', { emitEvent: false });
      }
    }
  }

  logout(): void {
    this.vehicleService.clearState();
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
