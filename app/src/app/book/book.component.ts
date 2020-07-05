import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from '../http.service';
import { Book } from '../book';

@Component({
  selector: 'app-book',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.css']
})
export class BookComponent implements OnInit {

  constructor(public router:Router, private _http: HttpService) { }

  book: Book;

  ngOnInit(): void {
    this._http.getBook(parseInt(window.location.href.substr(window.location.href.lastIndexOf('/') + 1))).subscribe(data => {
      console.log(data);
      this.book = data;
    });  
  }

}
