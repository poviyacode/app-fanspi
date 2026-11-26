/* eslint-disable prettier/prettier */
import { Component, OnInit, OnDestroy, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { SocketService } from '@services/socket.service';
import { UserService } from '@services/user.service';
import { AgeValidator } from '@core/common/custom-validators.ts';
import { IconDirective } from '@directive/coin-svg.directive';
import { UIStyles } from '@core/common/uistyles';
import { CustomTranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'app-multi-chat',
  imports: [
    CommonModule,
    FormsModule,
    IconDirective,
    CustomTranslatePipe,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './multi-chat.component.html',
  styleUrl: './multi-chat.component.scss',
})
export default class MultiChatComponent {

  public className = UIStyles;
  isBrowser: boolean;
  isServer: boolean;

  totalPages: number = 0;
  currentPage = 0;
  limitPage = 25;
  hasMore: boolean = true;
  isLoading = signal(false);

  private socketService = inject(SocketService);
  private platformId = inject(PLATFORM_ID);

  private subscriptions = new Subscription();
  private destroy$ = new Subject<void>();
  myForm: FormGroup;

  public userService = inject(UserService);
  public searchQuery: string = '';
  public searchResults: any[] = [];

  // Lista inicial de creadoras gestionadas (vacía o con algunas por defecto)
  public managedCreators: any[] = [
    { _id: '64a1b2c3d4e5f67890123457', alias: 'Nayara', username: 'nayara', online: false },
  ];

  public selectedCreator: any = null;     // Perfil activo para responder
  public activeConversation: any = null;  // Cliente final seleccionado
  public messageText: string = '';

  public conversations: any[] = [
    {
      recipientId: 'client_user_001',
      recipientName: 'Juan Pérez',
      lastMessage: 'Hola, ¿estás disponible?',
      messages: []
    }
  ];

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.createFormControls();
      // 1. Conectar al socket
      this.socketService.connect();

      // 2. Esperar conexión y registrar las creadoras iniciales
      setTimeout(() => {
        this.syncManagedCreators();
      }, 600);

      // 3. Escuchar la confirmación del servidor y estados en línea
      this.subscriptions.add(
        this.socketService.onInitialOnlineUsers().subscribe((onlineUsers: any[]) => {
          this.updateOnlineStatus(onlineUsers);
        })
      );

      this.subscriptions.add(
        this.socketService.onUserOnlineStatus().subscribe((statusData: any) => {
          this.updateOnlineStatus([statusData]);
        })
      );

      // 4. Escuchar nuevos mensajes entrantes de los clientes
      this.subscriptions.add(
        this.socketService.onNewMessage().subscribe((msgData: any) => {
          const conv = this.conversations.find(c => c.recipientId === msgData.senderId || c.recipientId === msgData.recipientId);
          if (conv) {
            conv.messages.push({
              senderId: msgData.senderId,
              text: msgData.message || msgData.text,
              createdAt: msgData.createdAt || new Date(),
              isIncoming: true
            });
            conv.lastMessage = msgData.message || msgData.text;
          }
        })
      );
    }
  }

  createFormControls() {
    this.myForm = new FormGroup({
      search: new FormControl('', [Validators.required]),
      gender: new FormControl('', [Validators.required]),
      minAge: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(2), AgeValidator]),
      maxAge: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(2), AgeValidator]),
      country: new FormControl('', [Validators.required]),
    });
  }

  findSearch() {

    if (!this.hasMore) return;
    this.isLoading.set(true);

    let data: any = {};

    if (this.myForm?.value) {
      const { search, minAge, maxAge, country } = this.myForm.value;

      const gender = 'WOMAN';

      if (search) {
        data.search = `${search}`;
      }

      if (gender) {
        data.gender = `${gender}`;
      }

      if (minAge) {
        data.minAge = Number(minAge);
      }

      if (maxAge) {
        data.maxAge = Number(maxAge);
      }

      if (country) {
        data.Country = country;
      }

    }

    this.userService.userProfiles(data, this.limitPage, this.currentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          console.log(res);
          if (res && res.data.length > 0) {
            if (this.currentPage === 0) {
              this.totalPages = Number(res.total);
            }

            this.userService.addUsersProfile(res.data);

            this.hasMore = res.data.length <= this.limitPage;

          } else {
            this.hasMore = false;
          }

        },
        error: (err) => {
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
          console.log('Request completed');
        }
      });
  }

  // socket
  userOnlineSocket() {

    if (!this.socketService.socket) {
      this.socketService.connect();
    }

  }

  public toggleUserOnlineStatus(user: any, forceOnline?: boolean): void {
    if (!user?._id) return;

    const existing = this.managedCreators.find((c) => c._id === user._id);
    const nextState =
      typeof forceOnline === 'boolean'
        ? forceOnline
        : existing
          ? !existing.online
          : true;

    if (this.socketService.socket?.connected) {
      this.socketService.socket.emit('admin_force_user_online', {
        userId: user._id,
        online: nextState,
      });
    }

    if (existing) {
      existing.online = nextState;
    } else {
      this.managedCreators.push({
        _id: user._id,
        alias: user.alias || user.name || user.username || 'Usuario',
        username: user.username || '',
        online: nextState,
      });
      // Si el backend necesita recibir la lista actualizada de gestionados:
      this.syncManagedCreators();
    }
  }

  onSearch(): void {

    this.isLoading.set(true);

    this.hasMore = true;
    this.totalPages = 0;
    this.currentPage = 0;
    this.userService.resetUsersProfile();
    this.findSearch();

  }

  public toggleLeysiOnlineStatus(): void {
    const leysiId = '6487ef144d68a13e411cf349';

    const leysi = this.managedCreators.find(c => c._id === leysiId);
    const nextState = leysi ? !leysi.online : true;

    if (this.socketService.socket && this.socketService.socket.connected) {
      // Emitimos el evento hacia el backend
      this.socketService.socket.emit('admin_force_user_online', {
        userId: leysiId,
        online: nextState
      });

      // Actualizar localmente de inmediato el estado en la interfaz del admin
      if (leysi) {
        leysi.online = nextState;
      } else {
        this.managedCreators.push({
          _id: leysiId,
          alias: 'Leysi',
          username: 'leysi',
          online: nextState
        });
      }
    }
  }

  /**
   * Envía los IDs actuales al backend y solicita actualización de estado
   */
  private syncManagedCreators(): void {
    if (this.socketService.socket && this.socketService.socket.connected) {
      const creatorIds = this.managedCreators.map(c => c._id);

      // Emitimos al gateway la lista de IDs que este admin va a gestionar
      this.socketService.socket.emit('admin_set_managed_creators', { creatorIds });

      // Solicitamos la lista inicial de usuarios en línea
      this.socketService.socket.emit('request_initial_online_users');
    }
  }

  /**
   * Actualiza el indicador booleano 'online' en el arreglo local
   */
  private updateOnlineStatus(usersList: any[]): void {
    usersList.forEach(update => {
      const creator = this.managedCreators.find(c => c._id === update._id);
      if (creator) {
        creator.online = update.online;
      }
    });
  }

  public selectConversation(conv: any): void {
    this.activeConversation = conv;
  }

  public sendMessage(): void {
    if (!this.messageText.trim() || !this.activeConversation || !this.selectedCreator) return;

    if (this.socketService.socket) {
      this.socketService.socket.emit('admin_send_message', {
        creatorId: this.selectedCreator._id,
        recipientId: this.activeConversation.recipientId,
        message: this.messageText
      });

      this.activeConversation.messages.push({
        senderId: this.selectedCreator._id,
        text: this.messageText,
        createdAt: new Date(),
        isIncoming: false
      });

      this.activeConversation.lastMessage = this.messageText;
      this.messageText = '';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
