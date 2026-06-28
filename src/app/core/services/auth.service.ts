import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {}

  login(nome: string, senha: string): Observable<User> {
    if (nome !== 'admin' || senha !== '123456') {
      return throwError(() => new Error('Usuário ou senha incorretos! (Validação local)'));
    }

    const loginUrl = `${environment.apiUrl}/login`;

    return this.http.post<User>(loginUrl, { nome, senha }).pipe(
      map((user: User) => {
        if (user && user.nome === 'admin') {
          this.currentUserSubject.next(user);
          this.router.navigate(['/home']);
          return user;
        } else {
          throw new Error('Usuário inválido retornado pelo servidor.');
        }
      }),
      catchError((error) => {
        let errorMsg = 'Falha na autenticação!';
        if (error.error && error.error.message) {
          errorMsg = error.error.message;
        } else if (error.message) {
          errorMsg = error.message;
        }
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  logout(): void {
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }
}
