import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-availability',
  templateUrl: './availability.page.html',
  styleUrls: ['./availability.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonIcon, IonButton],
})
export class AvailabilityPage {
  resourceId = '';
  constructor(private route: ActivatedRoute, private router: Router, private authService: AuthService) {
    addIcons({ arrowBackOutline, logOutOutline });
    this.resourceId = this.route.snapshot.paramMap.get('resourceId') ?? '';
  }
  goBack(): void { this.router.navigate(['/student/catalog']); }
  goToBooking(): void { this.router.navigate(['/student/booking', this.resourceId]); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
