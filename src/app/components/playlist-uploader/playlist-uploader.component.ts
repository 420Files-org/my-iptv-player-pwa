import { Component, EventEmitter } from '@angular/core';
import {
    UploadOutput,
    UploadInput,
    UploadFile,
    humanizeBytes,
    UploaderOptions,
} from 'ngx-uploader';
import { ChannelStore, createChannel } from 'src/app/state';
import { M3uService } from 'src/app/services/m3u-service.service';
import { Router } from '@angular/router';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { PLAYLISTS_STORE } from 'src/app/db.config';
import { MatSnackBar } from '@angular/material/snack-bar';
import { guid, ID } from '@datorama/akita';

/**
 * Describes playlist interface
 */
export interface Playlist {
    id?: ID;
    title: string;
    filename: string;
    playlist: any;
    importDate: number;
    lastUsage: number;
    favorites: string[];
}

@Component({
    selector: 'app-playlist-uploader',
    templateUrl: './playlist-uploader.component.html',
    styleUrls: ['./playlist-uploader.component.css'],
})
export class PlaylistUploaderComponent {
    formData: FormData;
    files: UploadFile[];
    uploadInput: EventEmitter<UploadInput>;
    humanizeBytes: Function;
    dragOver: boolean;
    options: UploaderOptions;
    playlists: Playlist[] = [];
    isLoading = false;

    /**
     * Creates an instanceof PlaylistUploaderComponent
     * @param channelStore channels store
     * @param dbService indexeddb service
     * @param m3uService m3u service
     * @param router angulars router
     * @param snackBar snackbars with notification messages
     */
    constructor(
        private channelStore: ChannelStore,
        private dbService: NgxIndexedDBService,
        private m3uService: M3uService,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        this.getPlaylists();

        this.options = {
            concurrency: 1,
            maxUploads: 1,
        };
        this.files = [];
        this.uploadInput = new EventEmitter<UploadInput>();
        this.humanizeBytes = humanizeBytes;
    }

    /**
     * Handles file upload
     * @param output
     */
    onUploadOutput(output: UploadOutput): void {
        if (output.type === 'allAddedToQueue') {
            this.isLoading = true;
            if (this.files.length > 0) {
                const fileReader = new FileReader();
                fileReader.onload = (fileLoadedEvent) =>
                    this.handlePlaylist(fileLoadedEvent);
                fileReader.readAsText(this.files[0].nativeFile);
            }
        } else if (
            output.type === 'addedToQueue' &&
            typeof output.file !== 'undefined'
        ) {
            this.files.push(output.file);
        } else if (
            output.type === 'uploading' &&
            typeof output.file !== 'undefined'
        ) {
            const index = this.files.findIndex(
                (file) =>
                    typeof output.file !== 'undefined' &&
                    file.id === output.file.id
            );
            this.files[index] = output.file;
        } else if (output.type === 'cancelled' || output.type === 'removed') {
            this.files = this.files.filter(
                (file: UploadFile) => file !== output.file
            );
        } else if (output.type === 'dragOver') {
            this.dragOver = true;
        } else if (output.type === 'dragOut') {
            this.dragOver = false;
        } else if (output.type === 'drop') {
            this.dragOver = false;
        } else if (
            output.type === 'rejected' &&
            typeof output.file !== 'undefined'
        ) {
            console.log(output.file.name + ' rejected');
        }
    }

    /**
     * Parse and store uploaded playlist
     * @param fileLoadedEvent
     */
    handlePlaylist(fileLoadedEvent: any): void {
        const result = (fileLoadedEvent.target as FileReader).result;
        const array = (result as string).split('\n');
        const playlist = this.m3uService.parsePlaylist(array);
        const playlistObject = this.savePlaylist(this.files[0].name, playlist);
        this.setPlaylist(playlistObject);
    }

    /**
     * Navigates to the video player route
     */
    navigateToPlayer(): void {
        this.isLoading = false;
        this.router.navigateByUrl('/iptv', { skipLocationChange: true });
    }

    /**
     * Saves playlist to the localStorage
     * @param name name of the playlist
     * @param playlist playlist to save
     */
    savePlaylist(name: string, playlist: any): Playlist {
        const playlistObject = {
            id: guid(),
            filename: name,
            title: name,
            playlist,
            importDate: new Date().getMilliseconds(),
            lastUsage: new Date().getMilliseconds(),
            favorites: [],
        };
        this.dbService.add<Playlist>('playlists', playlistObject).then(() => {
            console.log('playlist saved!');
        });
        return playlistObject;
    }

    /**
     * Reads all saved playlists from the browser store
     */
    getPlaylists(): void {
        this.dbService.getAll('playlists').then(
            (playlists: Playlist[]) => (this.playlists = playlists),
            (error) => {
                console.error(error);
            }
        );
    }

    /**
     * Sets the given playlist as active for the current session
     * @param playlist playlist object
     */
    setPlaylist(playlist: Playlist): void {
        this.channelStore.reset();
        const favorites = playlist.favorites || [];
        const channels = playlist.playlist.items.map((element) =>
            createChannel(element, favorites)
        );
        this.channelStore.upsertMany(channels);
        this.channelStore.update(() => ({
            favorites,
            playlistId: playlist.id,
        }));
        this.navigateToPlayer();
    }

    /**
     * Removes the provided playlist from the indexedDb
     * @param playlist playlist to remove
     */
    removePlaylist(playlist: Playlist): void {
        this.dbService.delete(PLAYLISTS_STORE, playlist.id);
        this.getPlaylists();
        this.snackBar.open('Done! Playlist was removed.', null, {
            duration: 2000,
        });
    }
}
