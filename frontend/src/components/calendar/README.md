# Calendar Component Refactoring

## Estructura de Componentes

El componente Calendar ha sido refactorizado en varios componentes más pequeños y manejables para mejorar la mantenibilidad, reutilización y legibilidad del código.

### Componentes Principales

#### 1. **Calendar.jsx** (Componente Principal)
- Componente contenedor principal que orquesta todos los sub-componentes
- Maneja el estado global y la lógica de cambio entre vistas (mes/día)
- Utiliza el hook personalizado `useCalendarLogic` para la lógica de negocio

#### 2. **useCalendarLogic.js** (Hook Personalizado)
- Contiene toda la lógica de estado y funciones del calendario
- Maneja eventos de Google Calendar y eventos locales
- Funciones para navegación, creación, edición y eliminación de eventos
- Utilidades de tiempo y posicionamiento

### Componentes de UI

#### 3. **CalendarHeader.jsx**
- Cabecera del calendario con navegación y título
- Se adapta dinámicamente entre vista de mes y día
- Recibe children para contenido adicional (botones, leyenda, etc.)

#### 4. **DayView.jsx**
- Vista de día completa con timeline y eventos
- Maneja la visualización de eventos en formato de línea de tiempo
- Integra arrastrar y soltar para reposicionar eventos

#### 5. **MonthView.jsx**
- Vista de mes con cuadrícula de días
- Muestra indicadores de eventos para cada día
- Maneja la navegación a vista de día al hacer clic

#### 6. **Timeline.jsx**
- Componente de línea de tiempo para la vista de día
- Muestra etiquetas de horas, líneas de hora y línea de tiempo actual
- Completamente reutilizable e independiente

#### 7. **EventItem.jsx**
- Componente individual para mostrar eventos
- Maneja eventos de Google Calendar y eventos locales de forma diferente
- Incluye botones de acción (eliminar, abrir enlace externo)
- Calcula automáticamente posición y tamaño según duración

#### 8. **EventForm.jsx**
- Formulario para crear nuevos eventos locales
- Componente controlado que recibe props para estado y funciones
- Interfaz simple y clara para crear eventos

#### 9. **ScheduleDayButton.jsx**
- Leyenda que muestra los tipos de eventos (Google vs Local)
- Componente visual independiente y reutilizable

## Estructura de Archivos

```
frontend/src/components/
├── Calendar.jsx (componente principal)
├── calendar/
│   ├── index.js (exportaciones)
│   ├── CalendarHeader.jsx
│   ├── DayView.jsx
│   ├── EventForm.jsx
│   ├── EventItem.jsx
│   ├── ScheduleDayButton.jsx
│   ├── MonthView.jsx
│   └── Timeline.jsx
└── ...

frontend/src/hooks/
└── useCalendarLogic.js
```

## Beneficios de la Refactorización

### 1. **Separación de Responsabilidades**
- Cada componente tiene una responsabilidad específica y bien definida
- La lógica de negocio está separada de la presentación
- Facilita las pruebas unitarias

### 2. **Reutilización**
- Los componentes pueden reutilizarse en otras partes de la aplicación
- El hook `useCalendarLogic` puede utilizarse en otros componentes de calendario

### 3. **Mantenibilidad**
- Código más fácil de leer y entender
- Cambios localizados: modificar una funcionalidad no afecta otros componentes
- Debugging más sencillo

### 4. **Escalabilidad**
- Fácil agregar nuevas funcionalidades
- Estructura preparada para crecer
- Componentes independientes permiten desarrollo paralelo

### 5. **Performance**
- Componentes más pequeños pueden optimizarse individualmente
- React puede hacer mejor optimizaciones con componentes granulares
- Posibilidad de lazy loading de componentes específicos

## Guía de Uso

### Importar componentes individuales:
```jsx
import { CalendarHeader, EventForm } from '@/components/calendar';
```

### Usar el hook de lógica:
```jsx
import { useCalendarLogic } from '@/hooks/useCalendarLogic';

const MyCustomCalendar = () => {
    const { currentDate, events, navigateMonth } = useCalendarLogic();
    // ... resto del componente
};
```

### Extender funcionalidad:
Para agregar nuevas características, crear nuevos componentes en la carpeta `calendar/` y exportarlos en `index.js`

## Consideraciones Futuras

1. **Memorización**: Considerar usar `React.memo` para componentes que reciben muchas props
2. **Context**: Para estado muy complejo, considerar un Context específico del calendario
3. **PropTypes/TypeScript**: Agregar validación de tipos para mejor desarrollo
4. **Storybook**: Crear stories para cada componente para documentación visual
5. **Tests**: Agregar pruebas unitarias para cada componente y el hook personalizado
