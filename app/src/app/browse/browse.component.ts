import { Component, OnInit } from '@angular/core';
import { HttpService } from '../http.service';
@Component({
  selector: 'app-browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.css']
})
export class BrowseComponent implements OnInit {

  constructor( private _http: HttpService ) { }

  genres;

  ngOnInit(): void {
    this._http.getGenres().subscribe(data => {
      console.log(data);
      this.genres = data;
    });  
  }

}
