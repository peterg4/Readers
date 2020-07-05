import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  @ViewChild('navbar') nav: ElementRef;

  @HostListener('document:scroll', ['$event']) onScrollEvent($event){
    window.onscroll = () => { 
      "use strict";
      if (document.body.scrollTop >= 20 || document.documentElement.scrollTop >= 20 ) {
        this.nav.nativeElement.classList.add("scrolled-nav");
      } 
      else {
        this.nav.nativeElement.classList.remove("scrolled-nav");
      }
    } 
  }
}
document.addEventListener('DOMContentLoaded', function() {
  let elems = document.querySelectorAll('.sidenav');
  let options = {
    
  }
  var instances = M.Sidenav.init(elems, options);
});


/*
var nav = document.getElementsByClassName("nav-wrapper");
console.log(nav);
window.onscroll = function () { 
  "use strict";
  if (document.body.scrollTop >= 20 || document.documentElement.scrollTop >= 20 ) {
    nav.classList.remove("scolled-nav");
  } 
  else {
    nav.classList.add("scolled-nav");
  }
};*/