import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Book } from './book';


@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http: HttpClient) { }

 // rootURL = '/api';

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>('http://localhost:3000/api/books');
  }
}
