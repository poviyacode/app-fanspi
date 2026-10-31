
import { Component, effect, inject, input, Input, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { PaymentOrderService } from '@services/payment-order.service';
import { SpinnerService } from '@services/spinner.service';
import { ICreateOrderRequest, IPayPalConfig, ITransactionItem, NgxPayPalModule } from 'ngx-paypal';

interface PurchaseItems {
  name: string,
  quantity: number,
  price: number
}

@Component({
    selector: 'app-paypal-pay',
    imports: [
    RouterModule,
    NgxPayPalModule
],
    templateUrl: './paypal-pay.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './paypal-pay.component.scss'
})
export default class PaypalPayComponent {

  price = input.required<number>();      

  public payPalConfig?: IPayPalConfig;

  purchaseItems: PurchaseItems [];
  total!: string;

  public paymentOrderService = inject(PaymentOrderService);
  public spinnerService = inject(SpinnerService);

  ngOnInit(): void {
    this.purchaseItems = [
      //{ name: 'Donacion por uso de Plataforma miCybersecurityPRO', quantity: 1, price: 20 },
      { name: 'pago por suscription a plataforma', quantity: 1, price: this.paymentOrderService.amountCalculation()?.amountTransaction! },
      // { name: 'Smartphone Dual Camera', quantity: 2, price: 5 },
      // { name: 'Black Colour Smartphone', quantity: 1, price: 10 }
    ];

    this.findTotal();
    this.initConfig();
  }

  findTotal(): void {
    this.total = this.purchaseItems.map(x => x.quantity * x.price).reduce((a, b) => a + b, 0).toString();
  }

  // https://enngage.github.io/ngx-paypal/
  private initConfig(): void {
    // this.total = this.purchaseItems.map(x => x.quantity * x.price).reduce((a, b) => a + b, 0).toString();
    const currency = 'USD';

    this.payPalConfig = {
      currency: currency,
      clientId: 'AYqLdDuF_aFALAj-d6O0ujYghrCEhKjSIRzvd5aU9uORvJP9xMgKYYT-gJ-NY58VwBkt-tgw0QEIvt5o', // PRODUCTION
      //clientId: 'AfYy41p1Ze7Z1ZCGlc7vffKeIU_YlrebdpA63whYSlPj6uPBzQ2wou5oQjczNAj3-3poKY2XnMGx1qI-', // DEVELOPMENT

      createOrderOnClient: (data: any) => <ICreateOrderRequest>{
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: this.total,
              breakdown: {
                item_total: {
                  currency_code: currency,
                  value: this.total
                }
              }
            },
            items: this.purchaseItems.map(x => <ITransactionItem>
              {
                name: x.name,
                quantity: x.quantity.toString(),
                category: 'DIGITAL_GOODS',
                unit_amount: {
                  currency_code: currency,
                  value: x.price.toString(),
                },
              })
          }
        ]
      },
      advanced: {
        commit: 'true'
      },
      style: {
        label: 'paypal',
        layout: 'vertical'
      },
      onApprove: (data: any, actions: any) => {
        //console.log('onApprove: la transacción fue aprobada, pero no autorizada: ', data, actions);
        this.spinnerService.start();
        actions.order.get().then((res: any) => {
          //console.log('onApprove - Puede obtener los detalles completos del pedido en : ', res);
          
          const dataCustomer = {
            ...this.paymentOrderService.personal(),
            ...this.paymentOrderService.amountCalculation(),
            codeCollection: this.paymentOrderService.paymentOrder()?.codeCollection,
            paypal: res,
          }
          
          this.paymentOrderService.transactionPaypal(this.paymentOrderService.paymentOrder()?._id!, dataCustomer).subscribe({
            next: (res) => {
              let url = '';
              url = res.data.paymentDetails.urlReturn + '/' + this.paymentOrderService.paymentOrder()?.codeCollection;
              const link = document.createElement('a');
              link.href = url;
              link.target = '_self';
              document.body.appendChild(link);
              link.click();
              this.spinnerService.close();
            },
            error: (err) => {
              this.spinnerService.close();
              //console.log(err.error.message);
            },
            complete: () => {
              this.spinnerService.close();
              //console.log('Request completed');
            }
          });
        });
      },
      onClientAuthorization: (data: any) => {
        //console.log('onClientAuthorization - probablemente deberías informar a tu servidor sobre la transacción completada en este punto', data);
        // success notification
      },
      onCancel: (data: any, actions: any) => {
        //console.log('OnCancel', data, actions);
      },
      onError: (err: any) => {
        //console.log('OnError', err);
      },
      onClick: (data: any, actions: any) => {
        //console.log('onClick', data, actions);
      },
    };
  }

}

