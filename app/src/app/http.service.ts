import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, Observer } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { Book } from './book';


@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http: HttpClient) { }

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>('/api/books');
  }

  getBook(isbn: number): Observable<Book> {
    return this.http.get<Book>('/api/book/details?isbn=' + isbn);
  }

  getGenres(): Observable<any> {
    return this.http.get('/api/genres');
  }

  getGenre(genre): Observable<any> {
    return this.http.get('/api/genres/genre?genre=' + genre);
  }
}
