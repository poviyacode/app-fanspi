import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Membership } from '@interfaces/membership';
import { AuthService } from '@services/auth.service';
import { MembershipService } from '@services/membership.service';

@Component({
    selector: 'app-subscription-setting',
    imports: [],
    templateUrl: './subscription-setting.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './subscription-setting.component.scss'
})
export class SubscriptionSettingComponent {

  membership: Membership[] = [];
  membershipPrimary: Membership[] = [];
  membershipBundles: Membership[] = [];

  private authService = inject(AuthService);
  private membershipService = inject(MembershipService);

  constructor() { }

  ngOnInit(): void {
    this.findAllUser();
  }

  findAllUser(): void {
    if (this.authService.user()) {
      const data = {
        User: this.authService.user()!._id
      };
      this.membershipService.findAllUser(data).subscribe(res => {
        if (res.length > 0) {
          this.membership = res;
          this.membershipPrimary = this.membership.filter(res => res.quantyTime == 1);
          this.membershipBundles = this.membership.filter(res => res.quantyTime == 3 || res.quantyTime == 6 || res.quantyTime == 12);
        }
      })
    }
  }
}
