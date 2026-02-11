import { apiFetch } from './api';

export interface ClassSchedule {
    id: number;
    class_name: string;
    late_threshold_time: string; // HH:MM format
    is_active: boolean;
}

export const classScheduleService = {
    // Get all class schedules
    getAll: async (): Promise<ClassSchedule[]> => {
        return apiFetch<ClassSchedule[]>('/class-schedules');
    },

    // Get class schedule by name
    getByName: async (className: string): Promise<ClassSchedule> => {
        return apiFetch<ClassSchedule>(`/class-schedules/${className}`);
    },

    // Create new class schedule
    create: async (className: string, lateThresholdTime: string = '07:30'): Promise<ClassSchedule> => {
        const params = new URLSearchParams();
        params.append('class_name', className);
        params.append('late_threshold_time', lateThresholdTime);

        return apiFetch<ClassSchedule>(`/class-schedules?${params}`, {
            method: 'POST',
        });
    },

    // Update class schedule
    update: async (id: number, lateThresholdTime: string, isActive?: boolean): Promise<ClassSchedule> => {
        return apiFetch<ClassSchedule>(`/class-schedules/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                late_threshold_time: lateThresholdTime,
                is_active: isActive,
            }),
        });
    },

    // Delete class schedule
    delete: async (id: number): Promise<void> => {
        await apiFetch(`/class-schedules/${id}`, {
            method: 'DELETE',
        });
    },
};
