import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { BrowseComponent } from './browse/browse.component';
import { UploadComponent } from './upload/upload.component';
import { LoginComponent } from './login/login.component';
import { SigninComponent } from './signin/signin.component';
import { BookComponent } from './book/book.component';
import { GenreComponent } from './genre/genre.component';
import { HttpClientModule } from '@angular/common/http';

import { StarRatingModule } from 'angular-star-rating';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    BrowseComponent,
    UploadComponent,
    LoginComponent,
    SigninComponent,
    BookComponent,
    GenreComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    StarRatingModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
