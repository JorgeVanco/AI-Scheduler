"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCalendarContext } from '@/context/calendarContext';
import { useScheduleContext } from '@/context/scheduleContext';

const ScheduleDayButton = ({ selectedDate }) => {
    const { data: session } = useSession();
    const { tasks, calendars, getEventsForDate } = useCalendarContext();
    const { addProposedEvents } = useScheduleContext();
    const [isLoading, setIsLoading] = useState(false);

    const handleScheduleDay = async () => {
        if (!session?.accessToken) {
            toast.error('Necesitas estar autenticado para programar tu día');
            return;
        }

        if (!selectedDate) {
            toast.error('Selecciona una fecha para programar');
            return;
        }

        setIsLoading(true);

        try {
            // Filtrar eventos del día seleccionado
            const dayEvents = getEventsForDate(selectedDate);

            // Filtrar tareas pendientes
            const pendingTasks = tasks.filter(task => task.status === 'needsAction');

            const response = await fetch('/api/agent/schedule-day', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: selectedDate.toISOString(),
                    existingEvents: dayEvents,
                    availableTasks: pendingTasks,
                    calendars: calendars,
                    preferences: {
                        workingHours: {
                            start: '09:00',
                            end: '18:00'
                        },
                        breakDuration: 15,
                        taskPriority: 'important'
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al generar el horario');
            }

            const result = await response.json();

            if (result.success) {
                toast.success(`¡Horario generado! ${result.summary.scheduledTasks} tareas programadas`);
                addProposedEvents(result.proposedEvents, result.summary);

                // Mostrar recomendaciones si las hay
                if (result.recommendations && result.recommendations.length > 0) {
                    setTimeout(() => {
                        toast.info(`💡 ${result.recommendations[0]}`);
                    }, 2000);
                }
            } else {
                throw new Error(result.error || 'Error al generar el horario');
            }
        } catch (error) {
            console.error('Error scheduling day:', error);
            toast.error(error instanceof Error ? error.message : 'Error inesperado al generar el horario');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            size="sm"
            onClick={handleScheduleDay}
            disabled={isLoading || !selectedDate}
            className="relative"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
                <Sparkles className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Programando...' : 'Programar día'}
        </Button>
    );
};

export default ScheduleDayButton;
