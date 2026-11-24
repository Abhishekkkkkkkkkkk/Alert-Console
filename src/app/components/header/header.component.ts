import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-header" role="banner">
      <h1 class="header-title">Alert Console — Optimistic Resolution</h1>
    </header>
  `,
  styles: [`
    .app-header {
      background: #1e293b;
      padding: 14px 28px;
      display: flex;
      align-items: center;
    }
    .header-title {
      color: #ffffff;
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      margin: 0;
    }
  `]
})
export class HeaderComponent {}
