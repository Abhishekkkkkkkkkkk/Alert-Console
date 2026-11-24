import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { AlertService } from './services/alert.service';
import { ToastService } from './services/toast.service';

describe('App Root Component', () => {
  let fixture: ComponentFixture<App>;
  let app: App;
  let alertService: AlertService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [AlertService, ToastService]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    alertService = TestBed.inject(AlertService);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the app component', () => {
    expect(app).toBeTruthy();
  });

  it('should render the executive header title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const titleEl = compiled.querySelector('.header-title');
    expect(titleEl?.textContent).toContain('Alert Console — Optimistic Resolution');
  });

  it('should render the filter bar with live showing count', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const countEl = compiled.querySelector('.filter-counter');
    expect(countEl?.textContent).toContain('Showing 60 of 60');
  });

  it('should render the alerts table with rows', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('.table-row');
    expect(rows.length).toBe(60);
  });

  it('should render the detail panel with default selection AL-898', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const detailTitle = compiled.querySelector('.panel-title');
    expect(detailTitle?.textContent).toContain('AL-898 — detail');
  });

  it('should dismiss detail panel on Escape key', () => {
    expect(alertService.selectedAlertId()).toBe('AL-898');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(alertService.selectedAlertId()).toBeNull();
  });
});
