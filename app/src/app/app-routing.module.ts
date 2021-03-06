import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { BrowseComponent } from './browse/browse.component';
import { GenreComponent } from './genre/genre.component';
import { BookComponent } from './book/book.component';
import { LoginComponent } from './login/login.component';
import { UploadComponent } from './upload/upload.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'browse', component: BrowseComponent },
 // { path: 'library', component: LibraryComponent }          
  { path: 'login', component: LoginComponent },
  { path: 'upload', component: UploadComponent },
  {
    path: 'book',
    component: BookComponent,
    children:[
               {
                 path:':type',
                 component:BookComponent
               }
             ]
  },
  {
    path: 'genre',
    component: GenreComponent,
    children:[
               {
                 path:':type',
                 component:GenreComponent
               }
             ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
