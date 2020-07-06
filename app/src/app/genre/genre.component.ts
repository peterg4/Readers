import { Component, OnInit } from '@angular/core';
import { HttpService } from '../http.service';
import { Book } from '../book';
@Component({
  selector: 'app-genre',
  templateUrl: './genre.component.html',
  styleUrls: ['./genre.component.css']
})
export class GenreComponent implements OnInit {

  constructor(private _http: HttpService) { }

  books: Array<Book>;

  ngOnInit(): void {
    let q = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
    q = decodeURIComponent(q);
    this._http.getGenre(q).subscribe(data => {
      this.books = data;
    });  
  }

}
