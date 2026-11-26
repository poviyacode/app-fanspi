import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Component, HostListener, inject, PLATFORM_ID, signal } from '@angular/core';
import { IconDirective } from '@directive/coin-svg.directive';
import { PaymentOrder } from '@interfaces/paymentOrder';
import { PostMediaDetails } from '@interfaces/postMedia';
import { AuthService } from '@services/auth.service';
import { MessageService } from '@services/message.service';
import { PaymentOrderService } from '@services/payment-order.service';
import { PostMediaService } from '@services/post-media.service';
import { SocketService } from '@services/socket.service';
import { SpinnerService } from '@services/spinner.service';
import { ToastService } from '@services/toast.service';
import { ToolsService } from '@services/tools.service';
import { TransactionCreditService } from '@services/transaction-credit.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CustomTranslatePipe } from '@pipes/translate.pipe';
import { UIStyles } from '@core/common/uistyles';

@Component({
  selector: 'app-list-peer-transfer',
  imports: [
    CommonModule,
    IconDirective,
    RouterModule,
    CustomTranslatePipe
  ],
  templateUrl: './list-peer-transfer.component.html',
  styleUrl: './list-peer-transfer.component.scss',
})
export default class ListPeerTransferComponent {

  isBrowser: boolean;
  isServer: boolean;
  isLoading = signal(false);
  public className = UIStyles;

  totalPages: number = 0;
  currentPage = 0;
  limitPage = 25;
  hasMore: boolean = true;
  currentStatus: string = 'PENDING'; // Almacena el estado actual
  private destroy$ = new Subject<void>();

  private platformId = inject(PLATFORM_ID);
  private socketService = inject(SocketService);
  public paymentOrderService = inject(PaymentOrderService);
  public toolsService = inject(ToolsService);
  public postMediaService = inject(PostMediaService);
  public spinnerService = inject(SpinnerService);
  public toastService = inject(ToastService);
  public authService = inject(AuthService);
  public messageService = inject(MessageService);
  public transactionService = inject(TransactionCreditService);
  private router = inject(Router);
  private route = inject(ActivatedRoute); // Inyectamos ActivatedRoute

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // Escuchamos los cambios en el parámetro :status de la URL
      this.route.paramMap
        .pipe(takeUntil(this.destroy$))
        .subscribe(params => {
          const statusParam = params.get('status');
          if (statusParam) {
            // Mapeamos el parámetro de la URL al formato que espera tu backend (ej. pending -> PENDING)
            this.currentStatus = this.mapRouteStatusToApi(statusParam);

            // Reiniciamos variables de paginación al cambiar de pestaña
            this.currentPage = 0;
            this.hasMore = true;
            this.paymentOrderService.resetP2pPaymentOrders();

            // Ejecutamos la búsqueda con el nuevo estado
            this.findSearch();
          }
        });
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.destroy$.next();
      this.destroy$.complete();
      this.detachSocketEvents();
    }
  }

  // Mapeador opcional por si las rutas usan guiones o minúsculas diferentes a la BD
  mapRouteStatusToApi(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return 'PENDING';
      case 'processing': return 'PROCESSING'; // Ajusta según tu API
      case 'history': return 'PAID';       // Ajusta según tu API
      default: return status.toUpperCase();
    }
  }

  // find
  findSearch() {
    if (!this.hasMore) return;
    this.isLoading.set(true);

    let data: any = {
      movementType: "P2P",
      status: this.currentStatus // Usamos la variable dinámica en lugar de "PENDING" estático
    };

    this.paymentOrderService.findAll(data, this.limitPage, this.currentPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res && res.data.length > 0) {
            if (this.currentPage === 0) {
              this.totalPages = Number(res.total);
            }

            this.paymentOrderService.addP2pPaymentOrders(res.data);
            this.hasMore = res.data.length >= this.limitPage;
          } else {
            this.hasMore = false;
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.hasMore = false;
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      if (this.hasMore && !this.isLoading()) {
        this.currentPage = this.currentPage + this.limitPage;
        this.findSearch();
      }
    }
  }

  detachSocketEvents() {
    if (this.socketService.socket) {

    }
  }

  onAcceptP2p(item: PaymentOrder) {
    if (this.authService.user()!) {
      this.spinnerService.start();
      const id = item._id!;
      const targetProfile = item.User;
      const data = {}

      this.paymentOrderService.acceptP2Request(id, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res) {
              const { PaymentOrder, Chat, TransactionCredit } = res;
              this.messageService.addUserReceiver(targetProfile!);
              this.router.navigate(['/chats/messages', Chat._id]);
            }
          },
          error: (err) => {
            const errorObj = err?.error;
            const translationKey = errorObj?.errorCode || 'somethingWentWrong';
            this.toastService.start({ type: 'error', message: translationKey });
            this.spinnerService.close();
          },
          complete: () => {
            this.spinnerService.close();
            console.log('Request completed');
          }
        })
    }
  }

  onDeclineP2p(item: PaymentOrder) {

  }

  // get first letter
  getFirstLetter(name: string): string {
    return this.toolsService.getFirstLetter(name);
  }

  // get media details
  getMediaDetails(item: any): PostMediaDetails | null {
    return this.postMediaService.getBackgroundImageUrl(item);
  }

}