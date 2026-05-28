import { DatabaseService } from './services/database.service';
import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private databaseService: DatabaseService
  ) {
    this.inicializarApp()
  }

  async inicializarApp() {
    await this.platform.ready()

    await this.databaseService.inicializarBanco()
  }
}
