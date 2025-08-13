"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { ScheduleSummary } from '@/types';

interface ScheduleSummaryPanelProps {
    summary: ScheduleSummary;
    onConfirm: () => void;
    onCancel: () => void;
    isConfirming: boolean;
    proposedEventsCount: number;
}

const ScheduleSummaryPanel = ({
    summary,
    onConfirm,
    onCancel,
    isConfirming,
    proposedEventsCount
}: ScheduleSummaryPanelProps) => {
    return (
        <Card className="mb-4 border-l-4 border-l-blue-500 bg-blue-50/50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Propuesta de Horario
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Estadísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{proposedEventsCount}</div>
                        <div className="text-xs text-gray-600">Tareas programadas</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{summary.totalHours}h</div>
                        <div className="text-xs text-gray-600">Tiempo ocupado</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{summary.freeHours}h</div>
                        <div className="text-xs text-gray-600">Tiempo libre</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{summary.totalTasks}</div>
                        <div className="text-xs text-gray-600">Tareas totales</div>
                    </div>
                </div>

                {/* Estado */}
                <div className="flex items-center justify-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Propuesta pendiente
                    </Badge>
                </div>

                {/* Instrucciones */}
                <div className="text-sm text-gray-600 text-center bg-white/50 p-3 rounded-lg">
                    <p className="font-medium mb-1">📝 Puedes editar los eventos propuestos:</p>
                    <p>• Arrastra para cambiar la hora • Redimensiona para ajustar duración • Elimina los que no necesites</p>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={onConfirm}
                        disabled={isConfirming || proposedEventsCount === 0}
                        className="flex-1"
                    >
                        {isConfirming ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creando eventos...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirmar y crear ({proposedEventsCount})
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isConfirming}
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancelar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default ScheduleSummaryPanel;
