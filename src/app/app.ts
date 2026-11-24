import { Component, inject, computed, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { AlertService } from './services/alert.service';
import { HeaderComponent } from './components/header/header.component';
import { FilterBarComponent } from './components/filter-bar/filter-bar.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { AlertTableComponent } from './components/alert-table/alert-table.component';
import { DetailPanelComponent } from './components/detail-panel/detail-panel.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { AlertFilters } from './models/alert.model';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent,
    FilterBarComponent,
    EmptyStateComponent,
    AlertTableComponent,
    DetailPanelComponent,
    ToastContainerComponent
  ],
  templateUrl: './app.html'
})
export class App {
  public readonly alertService = inject(AlertService);

  public readonly activeFilterCount = computed(() => {
    const f = this.alertService.filters();
    return (
      (f.status !== 'ALL' ? 1 : 0) +
      (f.severity !== 'ALL' ? 1 : 0) +
      (f.source !== 'ALL' ? 1 : 0)
    );
  });

  // Keyboard accessibility: Escape to dismiss detail panel
  @HostListener('window:keydown', ['$event'])
  public handleGlobalKey(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.alertService.selectedAlertId()) {
      this.alertService.selectAlert(null);
    }
  }

  public onFilterChange(change: { key: keyof AlertFilters; value: string }): void {
    this.alertService.setFilter(change.key, change.value);
  }

  public onClearFilters(): void {
    this.alertService.clearFilters();
  }

  public onSelectAlert(id: string): void {
    this.alertService.selectAlert(id);
  }

  public async onResolve(payload: { alertId: string; note: string }): Promise<void> {
    try {
      await this.alertService.resolveAlert(payload.alertId, payload.note);
    } catch {
      // In case of error (optimistic rollback), the error toast is fired by alertService
    }
  }
}
