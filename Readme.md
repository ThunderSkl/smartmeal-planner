# 🍽️ SmartMeal Planner

SmartMeal Planner es una aplicación web desarrollada para **planificar y regular menús personalizados** en función de las **preferencias, restricciones y objetivos del usuario**, como mejorar la alimentación, organizar mejor la semana o ahorrar tiempo en la toma de decisiones.

El proyecto ha sido desarrollado con un enfoque académico y práctico, aplicando tecnologías modernas de desarrollo web y una arquitectura escalable.

---

## 📌 Objetivo del proyecto

El objetivo principal de SmartMeal Planner es ofrecer una herramienta que permita:

- Definir preferencias alimenticias
- Establecer objetivos personales
- Generar menús personalizados de forma inteligente
- Visualizar y modificar la planificación semanal de comidas

---

## 🧱 Arquitectura general

El proyecto sigue una arquitectura **full-stack**, separando claramente frontend, backend y código compartido.

smartmeal-planner/
├── apps/
│ ├── web/ # Frontend (React)
│ └── server/ # Backend (Node.js)
├── shared/ # Código y tipos compartidos
├── types/ # Tipos globales
└── package.json

yaml
Copiar código

Esta separación facilita el mantenimiento, la escalabilidad y la reutilización del código.

---

## 🎨 Frontend (`apps/web`)

El frontend está desarrollado como una **Single Page Application (SPA)** usando React y TypeScript.

### Tecnologías utilizadas

- React
- TypeScript
- Vite
- Tailwind CSS

### Estructura del frontend

apps/web/
├── src/
│ ├── components/ # Componentes reutilizables
│ ├── pages/ # Páginas principales
│ ├── hooks/ # Hooks personalizados
│ ├── services/ # Comunicación con el backend
│ ├── styles/ # Estilos globales
│ ├── utils/ # Funciones auxiliares
│ └── main.tsx # Punto de entrada

yaml
Copiar código

### Responsabilidades del frontend

El frontend se encarga de:

- Mostrar la interfaz de usuario
- Permitir introducir preferencias y objetivos
- Mostrar el menú semanal generado
- Enviar solicitudes al backend
- Actualizar dinámicamente los datos sin recargar la página

Gracias a React, los cambios en las preferencias del usuario se reflejan inmediatamente en la interfaz.

---

## 🧠 Backend (`apps/server`)

El backend está desarrollado con **Node.js y TypeScript**, siguiendo una arquitectura modular.

### Funciones principales del backend

- Procesar las preferencias del usuario
- Aplicar la lógica de generación de menús
- Comunicarse con servicios externos de IA
- Validar datos y controlar errores

### Estructura del backend

apps/server/
├── routers/ # Rutas y controladores
├── services/ # Lógica de negocio
├── types/ # Tipos específicos del backend
├── systemRouter.ts # Router principal
├── trpc.ts # Configuración de tRPC
├── voiceTranscription.ts # Funcionalidades adicionales

yaml
Copiar código

---

## 🔌 API y comunicación frontend-backend

La comunicación entre frontend y backend se realiza mediante **tRPC**, lo que permite:

- Compartir tipos entre cliente y servidor
- Evitar errores de comunicación
- Mantener coherencia en las estructuras de datos

Esto es especialmente útil en una aplicación donde se intercambian datos complejos como preferencias y menús personalizados.

---

## 🤖 Integración con IA (DeepSeek)

SmartMeal Planner integra la **API de DeepSeek** para la generación inteligente de menús.

### Uso de la IA

La IA se utiliza para:

- Generar menús personalizados
- Adaptar las recomendaciones a los objetivos del usuario
- Ofrecer propuestas coherentes y variadas

### Control de costes

Las llamadas a la API están optimizadas para:

- Evitar peticiones innecesarias
- Reducir el consumo de tokens
- Mantener los costes bajos en un entorno académico

---

## 🔁 Código compartido (`shared`)

La carpeta `shared` contiene código reutilizado tanto en frontend como en backend.

shared/
├── const.ts # Constantes globales
├── schema.ts # Esquemas de validación
├── types.ts # Tipos compartidos
└── \_core/
└── errors.ts # Manejo de errores comunes

yaml
Copiar código

Esto permite:

- Evitar duplicación de código
- Mantener coherencia de tipos
- Facilitar el mantenimiento

---

## 🧪 Tipado y validación

El proyecto utiliza **TypeScript** de forma intensiva para:

- Detectar errores en tiempo de desarrollo
- Garantizar la correcta estructura de los datos
- Mejorar la calidad y robustez del código

Los esquemas de validación aseguran que las preferencias y objetivos del usuario sean consistentes.

---

## ⚙️ Instalación y ejecución

### Requisitos previos

- Node.js
- PNPM

### Instalación de dependencias

```bash
pnpm install

Ejecución en entorno de desarrollo
bash
Copiar código
pnpm dev
📈 Escalabilidad y mejoras futuras
La arquitectura del proyecto permite implementar fácilmente:

Nuevos tipos de dietas

Listas de la compra automáticas

Recomendaciones nutricionales avanzadas

Aplicación móvil

Integración con APIs nutricionales externas

📄 Licencia
Proyecto desarrollado con fines académicos.
```
