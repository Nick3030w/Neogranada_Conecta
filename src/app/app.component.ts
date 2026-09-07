import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private themeService = inject(ThemeService);

  constructor() {
    // Aplica el tema guardado de inmediato y lo sincroniza con el perfil de usuario
    this.themeService.init();
  }
}
