import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, IconComponent, AsyncPipe],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  readonly auth = inject(AuthService);
  readonly year = new Date().getFullYear();
}
