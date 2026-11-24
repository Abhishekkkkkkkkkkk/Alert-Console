import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResolveFormComponent } from './resolve-form.component';
import { Alert } from '../../models/alert.model';

describe('ResolveFormComponent', () => {
  let component: ResolveFormComponent;
  let fixture: ComponentFixture<ResolveFormComponent>;

  const mockOpenAlert: Alert = {
    id: 'AL-898',
    source: 'billing-svc',
    severity: 'HIGH',
    status: 'ESCALATED',
    createdAt: '2026-08-17T22:10:00Z',
    history: [
      { state: 'OPEN', ts: '2026-08-17T22:10:00Z' },
      { state: 'ESCALATED', ts: '2026-08-18T06:00:00Z' }
    ]
  };

  const mockResolvedAlert: Alert = {
    id: 'AL-882',
    source: 'auth-svc',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    createdAt: '2026-08-16T10:00:00Z',
    history: [
      { state: 'OPEN', ts: '2026-08-16T10:00:00Z' },
      { state: 'RESOLVED', ts: '2026-08-16T10:30:00Z', note: 'Token renewed' }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolveFormComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ResolveFormComponent);
    component = fixture.componentInstance;
  });

  it('should render form controls when alert is ESCALATED and isSaving is false', async () => {
    fixture.componentRef.setInput('alert', mockOpenAlert);
    fixture.componentRef.setInput('isSaving', false);
    fixture.detectChanges();
    await fixture.whenStable();

    const inputEl = fixture.nativeElement.querySelector('input.resolve-input');
    const buttonEl = fixture.nativeElement.querySelector('button.resolve-btn');

    expect(inputEl).toBeTruthy();
    expect(buttonEl).toBeTruthy();
    expect(buttonEl.textContent.trim()).toBe('Resolve');
  });

  it('should hide resolve form and display resolved summary badge for RESOLVED alerts', async () => {
    fixture.componentRef.setInput('alert', mockResolvedAlert);
    fixture.componentRef.setInput('isSaving', false);
    fixture.detectChanges();
    await fixture.whenStable();

    const inputEl = fixture.nativeElement.querySelector('input.resolve-input');
    const badgeEl = fixture.nativeElement.querySelector('.resolved-badge');

    expect(inputEl).toBeNull();
    expect(badgeEl).toBeTruthy();
    expect(badgeEl.textContent).toContain('Status: RESOLVED');
  });

  it('should reject whitespace-only note with inline error message without emitting resolve', async () => {
    fixture.componentRef.setInput('alert', mockOpenAlert);
    fixture.componentRef.setInput('isSaving', false);
    fixture.detectChanges();
    await fixture.whenStable();

    let emitted = false;
    component.resolve.subscribe(() => {
      emitted = true;
    });

    component.noteText = '     ';
    component.handleSubmit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(emitted).toBe(false);
    expect(component.validationError()).toContain('cannot be whitespace only');

    const errorEl = fixture.nativeElement.querySelector('.inline-error-message');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('cannot be whitespace only');
  });

  it('should clear inline validation error when user types into the input', async () => {
    fixture.componentRef.setInput('alert', mockOpenAlert);
    fixture.componentRef.setInput('isSaving', false);
    fixture.detectChanges();
    await fixture.whenStable();

    component.validationError.set('Error present');
    component.onInputChange();

    expect(component.validationError()).toBe('');
  });

  it('should emit resolve with trimmed note on valid submit', async () => {
    fixture.componentRef.setInput('alert', mockOpenAlert);
    fixture.componentRef.setInput('isSaving', false);
    fixture.detectChanges();
    await fixture.whenStable();

    let emittedPayload: { alertId: string; note: string } | null = null;
    component.resolve.subscribe((payload) => {
      emittedPayload = payload;
    });

    component.noteText = '   Restarted consumer group   ';
    component.handleSubmit();

    expect(emittedPayload).toEqual({
      alertId: 'AL-898',
      note: 'Restarted consumer group'
    });
    expect(component.validationError()).toBe('');
  });

  it('should render loading spinner and disable button while isSaving is true', async () => {
    fixture.componentRef.setInput('alert', mockOpenAlert);
    fixture.componentRef.setInput('isSaving', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const buttonEl = fixture.nativeElement.querySelector('button.resolve-btn');
    const spinnerEl = fixture.nativeElement.querySelector('.spinner-ring');
    const inputEl = fixture.nativeElement.querySelector('input.resolve-input');

    expect(buttonEl.disabled).toBe(true);
    expect(inputEl.disabled).toBe(true);
    expect(spinnerEl).toBeTruthy();
    expect(buttonEl.textContent).toContain('Resolving (~800ms)...');
  });
});
