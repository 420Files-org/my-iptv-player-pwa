import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ChannelListContainerComponent } from './components/channel-list-container/channel-list-container.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { FlexLayoutModule } from '@angular/flex-layout';
import { NgxUploaderModule } from 'ngx-uploader';
import { PlaylistUploaderComponent } from './components/playlist-uploader/playlist-uploader.component';
import { VideoPlayerComponent } from './components/video-player/video-player.component';
import { MaterialModule } from './material.module';
import { RecentPlaylistsComponent } from './components/recent-playlists/recent-playlists.component';
import { FilterPipeModule } from 'ngx-filter-pipe';
import { FormsModule } from '@angular/forms';
import { NgxIndexedDBModule } from 'ngx-indexed-db';
import { dbConfig } from './db.config';


@NgModule({
    declarations: [
        AppComponent,
        ChannelListContainerComponent,
        PlaylistUploaderComponent,
        VideoPlayerComponent,
        RecentPlaylistsComponent,
    ],
    imports: [
        AppRoutingModule,
        BrowserModule,
        BrowserAnimationsModule,
        FlexLayoutModule,
        FilterPipeModule,
        FormsModule,
        HttpClientModule,
        NgxIndexedDBModule.forRoot(dbConfig),
        MaterialModule,
        NgxUploaderModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: environment.production,
        }),
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
