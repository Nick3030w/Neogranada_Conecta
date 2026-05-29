import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonIcon, IonFooter, IonInput,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sendOutline, logOutOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
import { ChatMessage } from '../../../core/interfaces/chat.interface';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonIcon, IonFooter, IonInput],
})
export class ChatPage implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollAnchor') private scrollAnchor!: ElementRef<HTMLDivElement>;

  bookingId  = '';
  newMessage = '';
  messages: ChatMessage[] = [];
  sending = false;

  private msgSub?: Subscription;
  private shouldScroll = false;

  constructor(
    private route:       ActivatedRoute,
    private router:      Router,
    private authService: AuthService,
    private chatService: ChatService,
  ) {
    addIcons({ sendOutline, logOutOutline });
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') ?? '';
  }

  ngOnInit(): void {
    if (!this.bookingId) return;

    this.msgSub = this.chatService.getMessages(this.bookingId).subscribe(msgs => {
      this.messages    = msgs;
      this.shouldScroll = true;
    });
  }

  ngOnDestroy(): void {
    this.msgSub?.unsubscribe();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  get currentUser() { return this.authService.currentUser; }

  isOwn(msg: ChatMessage): boolean {
    return msg.senderId === this.currentUser?.uid;
  }

  async sendMessage(): Promise<void> {
    const text = this.newMessage.trim();
    if (!text || this.sending || !this.currentUser) return;

    this.sending    = true;
    this.newMessage = '';

    try {
      await this.chatService.sendMessage({
        bookingId:  this.bookingId,
        senderId:   this.currentUser.uid,
        senderName: this.currentUser.fullName,
        content:    text,
      });
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      // Restaura el texto si falla
      this.newMessage = text;
    } finally {
      this.sending = false;
    }
  }

  private scrollToBottom(): void {
    try {
      this.scrollAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch { /* noop */ }
  }

  goBack(): void {
    const role = this.currentUser?.role;
    if (role === 'admin') {
      this.router.navigate(['/admin/confirmation']);
    } else {
      this.router.navigate(['/student/confirmation', this.bookingId]);
    }
  }
}
