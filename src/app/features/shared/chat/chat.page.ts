import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon, IonFooter, IonInput, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, sendOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { ChatMessage } from '../../../core/interfaces/chat.interface';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonIcon, IonFooter, IonInput, IonButton],
})
export class ChatPage implements OnInit {
  bookingId = '';
  newMessage = '';
  messages: ChatMessage[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private authService: AuthService) {
    addIcons({logOutOutline,sendOutline,arrowBackOutline});
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') ?? '';
  }

  ngOnInit(): void {
    // TODO: cargar mensajes desde Firestore con listener en tiempo real
  }

  get currentUser() { return this.authService.currentUser; }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      bookingId: this.bookingId,
      senderId: this.currentUser?.uid ?? '',
      senderName: this.currentUser?.fullName ?? '',
      content: this.newMessage.trim(),
      createdAt: new Date(),
    };
    this.messages.push(msg);
    this.newMessage = '';
    // TODO: persistir en Firestore
  }

  isOwn(msg: ChatMessage): boolean { return msg.senderId === this.currentUser?.uid; }

  goBack(): void {
    const role = this.authService.currentUser?.role;
    this.router.navigate([role === 'admin' ? '/admin/confirmation' : '/student/confirmation/' + this.bookingId]);
  }
}
