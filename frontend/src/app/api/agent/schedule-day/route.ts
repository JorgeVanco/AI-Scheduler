import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { NextResponse } from 'next/server';
import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { CallbackHandler } from "langfuse-langchain";
import { Calendar, Event, Task } from '@/types';

// Permitir respuestas hasta 30 segundos
export const maxDuration = 30;

interface ScheduleEvent {
    id: string;
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
    isProposed: boolean;
    taskId?: string; // Si está basado en una tarea
}

interface ScheduleDayRequest {
    date: string; // ISO date string
    existingEvents?: Event[]; // Eventos ya existentes del día
    availableTasks?: Task[]; // Tareas disponibles para programar
    calendars?: Calendar[]; // Información de calendarios
    preferences?: {
        workingHours?: {
            start: string; // "09:00"
            end: string;   // "18:00"
        };
        breakDuration?: number; // minutes
        taskPriority?: 'urgent' | 'important' | 'normal';
    };
}

interface ScheduleDayResponse {
    success: boolean;
    date: string;
    proposedEvents: ScheduleEvent[];
    existingEvents: ScheduleEvent[];
    summary: {
        totalTasks: number;
        scheduledTasks: number;
        totalHours: number;
        freeHours: number;
    };
    recommendations?: string[];
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { date, existingEvents, availableTasks, calendars, preferences }: ScheduleDayRequest = await req.json();

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        // Configurar modelo AI
        const model = new ChatTogetherAI({
            apiKey: process.env.TOGETHER_AI_API_KEY,
            model: process.env.TOGETHER_AI_MODEL || "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
            temperature: 0.1,
            maxTokens: 4000, // Aumentar límite de tokens
        });

        // Obtener datos del día
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        let eventsData;
        let allTasks: Task[];

        // Si tenemos datos del frontend, usarlos; si no, obtenerlos de la API
        if (existingEvents && availableTasks) {
            eventsData = { items: existingEvents };
            allTasks = availableTasks;
        } else {
            // Código de fallback: obtener datos de la API como antes
            // Obtener calendarios
            const calendarsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/agent/calendars`, {
                headers: {
                    'x-access-token': session.accessToken,
                    'Content-Type': 'application/json',
                },
            });

            if (!calendarsResponse.ok) {
                throw new Error('Failed to fetch calendars');
            }

            const calendarsData = await calendarsResponse.json();

            // Obtener eventos existentes para el día
            const eventsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/agent/events?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`, {
                headers: {
                    'x-access-token': session.accessToken,
                    'Content-Type': 'application/json',
                },
            });

            if (!eventsResponse.ok) {
                throw new Error('Failed to fetch events');
            }

            eventsData = await eventsResponse.json();

            // Obtener tareas
            const taskListsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/agent/tasks`, {
                headers: {
                    'x-access-token': session.accessToken,
                    'Content-Type': 'application/json',
                },
            });

            if (!taskListsResponse.ok) {
                throw new Error('Failed to fetch task lists');
            }

            const taskListsData = await taskListsResponse.json();

            // Obtener tareas de todas las listas
            allTasks = [];
            if (taskListsData.items && taskListsData.items.length > 0) {
                for (const taskList of taskListsData.items) {
                    try {
                        const tasksResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/google/tasks/${taskList.id}`, {
                            headers: {
                                'Content-Type': 'application/json',
                                'x-access-token': session.accessToken,
                            },
                        });

                        if (tasksResponse.ok) {
                            const tasksData = await tasksResponse.json();
                            if (tasksData.items) {
                                allTasks = allTasks.concat(tasksData.items);
                            }
                        }
                    } catch (error) {
                        console.warn(`Failed to fetch tasks for list ${taskList.id}:`, error);
                    }
                }
            }
        }

        // Construir prompt del sistema
        const systemPrompt = `Eres un asistente de planificación inteligente. Tu tarea es crear un horario optimizado para el día ${targetDate.toLocaleDateString('es-ES')}.

INSTRUCCIONES:
1. Respeta TODOS los eventos existentes - no los muevas ni cambies
2. Programa máximo 5-8 tareas en los espacios libres disponibles
3. Considera los horarios de trabajo preferidos del usuario
4. Asigna tiempo realista a cada tarea (30-60 minutos)
5. Deja tiempo para descansos entre tareas
6. Devuelve SOLO un JSON válido y completo

FORMATO DE RESPUESTA JSON (OBLIGATORIO):
{
  "proposedEvents": [
    {
      "id": "proposed-1",
      "title": "Título corto",
      "description": "Descripción breve",
      "startDateTime": "2025-08-13T09:00:00",
      "endDateTime": "2025-08-13T10:00:00",
      "isProposed": true,
      "taskId": "task-1"
    }
  ],
  "recommendations": ["Recomendación 1", "Recomendación 2"]
}

IMPORTANTE: Asegúrate de cerrar correctamente el JSON con todas las llaves y corchetes.`;

        // Construir prompt humano
        const userPrompt = `FECHA OBJETIVO: ${targetDate.toLocaleDateString('es-ES')}

EVENTOS EXISTENTES (NO MODIFICAR):
${eventsData.items?.map((event: Event) =>
            `- ${event.summary} (${event.start.dateTime || event.start.date} - ${event.end.dateTime || event.end.date})`
        ).join('\n') || 'No hay eventos existentes'}

TAREAS DISPONIBLES:
${allTasks?.filter((task: Task) => task.status === 'needsAction')
                .map((task: Task) =>
                    `- ${task.title}${task.notes ? ` (${task.notes})` : ''}${task.due ? ` - Vence: ${task.due}` : ''}`
                ).join('\n') || 'No hay tareas pendientes'}

PREFERENCIAS:
- Horario de trabajo: ${preferences?.workingHours?.start || '09:00'} - ${preferences?.workingHours?.end || '18:00'}
- Duración de descansos: ${preferences?.breakDuration || 15} minutos
- Prioridad: ${preferences?.taskPriority || 'normal'}

Genera un horario optimizado que incluya las tareas más importantes en los espacios libres.`;

        const langfuseHandler = new CallbackHandler({
            publicKey: process.env.LANGFUSE_PUBLIC_KEY,
            secretKey: process.env.LANGFUSE_SECRET_KEY,
            baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
        });
        // Generar respuesta del AI
        const response = await model.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt)
        ]);

        let aiResult;
        try {
            // Extraer JSON de la respuesta
            console.log('AI Response:', response.content);

            let jsonContent = response.content.toString();

            // Si el JSON está incompleto, intentar repararlo
            if (!jsonContent.includes('"recommendations"') && jsonContent.includes('"proposedEvents"')) {
                // Agregar el cierre faltante para eventos incompletos y recommendations
                const lastCommaIndex = jsonContent.lastIndexOf(',');
                if (lastCommaIndex > 0) {
                    jsonContent = jsonContent.substring(0, lastCommaIndex);
                }

                // Cerrar el array de proposedEvents y agregar recommendations
                if (!jsonContent.endsWith(']')) {
                    jsonContent = jsonContent.replace(/,\s*$/, '') + ']';
                }
                jsonContent += ',\n  "recommendations": ["Horario optimizado basado en tus tareas pendientes"]\n}';
            }

            // Intentar extraer JSON
            const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in AI response');
            }

            // Validar que proposedEvents existe y es un array
            if (!aiResult.proposedEvents || !Array.isArray(aiResult.proposedEvents)) {
                aiResult.proposedEvents = [];
            }

            // Asegurarse de que cada evento propuesto tenga un ID único
            aiResult.proposedEvents = aiResult.proposedEvents.map((event: ScheduleEvent, index: number) => ({
                ...event,
                id: event.id || `proposed-${Date.now()}-${index}`,
                isProposed: true
            }));

        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            console.log('Raw AI Response:', response.content);

            // Fallback mejorado: crear eventos básicos de las tareas
            const fallbackEvents = allTasks
                ?.filter((task: Task) => task.status === 'needsAction')
                .slice(0, 5) // Limitar a 5 tareas
                .map((task: Task, index: number) => {
                    const startTime = new Date(targetDate);
                    startTime.setHours(9 + index, 0, 0, 0); // Programar cada hora a partir de las 9:00
                    const endTime = new Date(startTime);
                    endTime.setHours(startTime.getHours() + 1); // 1 hora por defecto

                    return {
                        id: `fallback-${Date.now()}-${index}`,
                        title: task.title,
                        description: task.notes || `Completar tarea: ${task.title}`,
                        startDateTime: startTime.toISOString(),
                        endDateTime: endTime.toISOString(),
                        isProposed: true,
                        taskId: task.id
                    };
                }) || [];

            aiResult = {
                proposedEvents: fallbackEvents,
                recommendations: [
                    'Se generó un horario básico debido a problemas de procesamiento.',
                    'Puedes ajustar los horarios según tus preferencias.',
                    'Considera revisar las tareas y reorganizarlas según prioridad.'
                ]
            };
        }

        // Convertir eventos existentes al formato esperado
        const processedExistingEvents: ScheduleEvent[] = eventsData.items?.map((event: Event) => ({
            id: event.id,
            title: event.summary,
            description: event.description,
            startDateTime: event.start.dateTime || event.start.date,
            endDateTime: event.end.dateTime || event.end.date,
            location: event.location,
            isProposed: false
        })) || [];

        // Calcular resumen
        const totalTasks = allTasks?.filter((task: Task) => task.status === 'needsAction').length || 0;
        const scheduledTasks = aiResult.proposedEvents?.length || 0;

        const allEvents = [...processedExistingEvents, ...(aiResult.proposedEvents || [])];
        const totalHours = allEvents.reduce((acc: number, event: ScheduleEvent) => {
            const start = new Date(event.startDateTime);
            const end = new Date(event.endDateTime);
            return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0);

        const workingStart = parseInt(preferences?.workingHours?.start?.split(':')[0] || '9');
        const workingEnd = parseInt(preferences?.workingHours?.end?.split(':')[0] || '18');
        const workingHours = workingEnd - workingStart;
        const freeHours = Math.max(0, workingHours - totalHours);

        const result: ScheduleDayResponse = {
            success: true,
            date,
            proposedEvents: aiResult.proposedEvents || [],
            existingEvents: processedExistingEvents,
            summary: {
                totalTasks,
                scheduledTasks,
                totalHours: Math.round(totalHours * 100) / 100,
                freeHours: Math.round(freeHours * 100) / 100
            },
            recommendations: aiResult.recommendations || []
        };

        return NextResponse.json(result);

    } catch (error) {
        console.error('Schedule Day API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to generate day schedule',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
