import { Component, OnInit } from '@angular/core';
import { HttpService } from '../http.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  
  books: Array<object> = []; 

  constructor(private _http: HttpService) { }

  ngOnInit(): void {
    this._http.getBooks().subscribe(data => {
      this.books = data;
    });    
  }
}
