/**
 * Event bus for scan-to-dashboard communication
 * Allows ScanPage to emit scan events that DashboardPage can receive
 */

export interface ScanEvent {
    studentId: number;
    studentNis: string;
    studentName: string;
    scanTime: Date;
    token: string;
}

class ScanEventBus {
    private static readonly EVENT_NAME = 'scan-complete';

    /**
     * Emit a scan event
     */
    emit(event: ScanEvent): void {
        const customEvent = new CustomEvent(ScanEventBus.EVENT_NAME, {
            detail: event,
        });
        window.dispatchEvent(customEvent);
    }

    /**
     * Subscribe to scan events
     * Returns an unsubscribe function
     */
    subscribe(callback: (event: ScanEvent) => void): () => void {
        const handler = (e: Event) => {
            const customEvent = e as CustomEvent<ScanEvent>;
            callback(customEvent.detail);
        };

        window.addEventListener(ScanEventBus.EVENT_NAME, handler);

        // Return unsubscribe function
        return () => {
            window.removeEventListener(ScanEventBus.EVENT_NAME, handler);
        };
    }
}

// Export singleton instance
export const scanEventBus = new ScanEventBus();
