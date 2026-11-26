import { AfterViewInit, ApplicationRef, Component, effect, ElementRef, EventEmitter, HostListener, inject, Output, PLATFORM_ID, QueryList, signal, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, isPlatformBrowser, isPlatformServer, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { Chat } from '@interfaces/chat';
import { ChatService } from '@services/chat.service';
import { SpinnerService } from '@services/spinner.service';
import { AuthService } from '@services/auth.service';
import { SocketService } from '@services/socket.service';
import { UIStyles } from '@core/common/uistyles';
import { User } from '@interfaces/user';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { first, Subject, Subscription, takeUntil } from 'rxjs';
import { MessageService } from '@services/message.service';
import { ToolsService } from '@services/tools.service';
import { Title } from '@angular/platform-browser';
import { IconDirective } from '@directive/coin-svg.directive';
import { DateAgoPipe } from '@pipes/date-ago.pipe';
import { DialogService } from '@services/dialog.service';
import { Country } from '@interfaces/country';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { AgeValidator } from '@core/common/custom-validators.ts';

@Component({
  selector: 'app-message-broadcast-chat',
  imports: [
    CustomTranslatePipe,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    IconDirective,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './message-broadcast-chat.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './message-broadcast-chat.component.scss'
})
export default class MessageBroadcastChatComponent {

  countries = signal<Country[] | null>(null);

  // message broadcast
  myFormMessageBroadcast: FormGroup;

  private destroy$ = new Subject<void>();
  @Output() closeModal = new EventEmitter<void>();

  public chatService = inject(ChatService);
  public messageService = inject(MessageService);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  public document = inject(DOCUMENT);
  private location = inject(Location);
  public router = inject(Router);
  private socketService = inject(SocketService);
  private activeRoute = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private applicationRef = inject(ApplicationRef);
  private toolsService = inject(ToolsService);
  private title = inject(Title);
  public dialogService = inject(DialogService);


  ngOnInit(): void {
    this.createFormControls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.dialogService.closeModal();
    this.countries.set(null);
  }

  createFormControls() {
    this.myFormMessageBroadcast = new FormGroup({
      search: new FormControl('', [Validators.required]),
      gender: new FormControl('', [Validators.required]),
      minAge: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(2), AgeValidator]),
      maxAge: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(2), AgeValidator]),
      country: new FormControl('', [Validators.required]),
      message: new FormControl('', [Validators.required]),
    });
  }

  onSearch(): void {

  }

  // modal
  onCloseModal() {
    this.closeModal.emit();
  }

  // input class
  selectClass(formGroup: FormGroup, controlName: string) {
    return UIStyles.inputClass(formGroup, controlName);
  }

  inputClass(formGroup: FormGroup, controlName: string) {
    return UIStyles.inputClass(formGroup, controlName);
  }

  textareaClass(formGroup: FormGroup, controlName: string, height: string) {
    return UIStyles.textareaClass(formGroup, controlName, height);
  }

  cardModalClass() {
    return UIStyles.cardModalClass();
  }

  buttonClass() {
    return UIStyles.buttonClass();
  }

  modalClass() {
    return UIStyles.modalClass();
  }
}
