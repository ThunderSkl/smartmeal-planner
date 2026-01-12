# SmartMeal Planner - TODO

## Fase 1: Arquitectura de Base de Datos y Estructura del Proyecto
- [x] Diseñar esquema de base de datos (usuarios, preferencias, menús, ingredientes)
- [x] Crear tablas en drizzle/schema.ts
- [x] Definir tipos TypeScript para entidades principales
- [x] Crear helpers de base de datos en server/db.ts

## Fase 2: Migración a React Router v7
- [x] Instalar React Router v7
- [x] Reemplazar wouter con React Router v7
- [x] Configurar estructura de rutas
- [x] Crear layouts base (autenticado, público)
- [x] Implementar redirecciones de autenticación

## Fase 3: Backend - Autenticación y Preferencias
- [x] Crear endpoints de autenticación (login, logout, me)
- [x] Crear endpoints de gestión de preferencias
- [x] Crear endpoints de almacenamiento de menús
- [x] Implementar validación de datos con Zod
- [x] Escribir tests vitest para endpoints críticos

## Fase 4: Integración con DeepSeek API (OpenRouter)
- [x] Configurar credenciales de OpenRouter
- [x] Crear función de generación de menús con IA
- [x] Implementar endpoint para generar menú semanal
- [ ] Implementar regeneración de días específicos
- [ ] Manejar errores y timeouts de API

## Fase 5: Formulario de Preferencias Alimentarias
- [x] Crear componente de formulario de preferencias
- [x] Implementar selección de alergias
- [x] Implementar selección de restricciones dietéticas
- [x] Implementar selección de objetivos nutricionales
- [x] Implementar preferencias de sabores/ingredientes
- [x] Validación de formulario con react-hook-form

## Fase 6: Visualización de Menús y Lista de Compra
- [x] Crear componente de calendario semanal
- [x] Implementar visualización de menú diario
- [x] Mostrar detalles nutricionales de cada comida
- [x] Crear componente de lista de compra
- [x] Implementar funcionalidad de marcar ingredientes
- [x] Permitir exportar lista de compra

## Fase 7: Panel de Usuario
- [ ] Crear página de perfil de usuario
- [ ] Implementar gestión de preferencias
- [ ] Crear historial de menús generados
- [ ] Permitir ver detalles de menús anteriores
- [ ] Implementar regeneración de menús
- [ ] Permitir ajustar días específicos del menú

## Fase 8: Pruebas y Despliegue
- [ ] Escribir tests para componentes críticos
- [ ] Realizar pruebas de integración
- [ ] Optimizar rendimiento
- [ ] Crear checkpoint final
- [ ] Desplegar aplicación


## Bugs Reportados
- [x] Error en endpoint menus.getActive retorna undefined en lugar de null
- [x] Página /menus falla al cargar sin menú activo
- [ ] Error en /preferences: servidor retorna HTML en lugar de JSON en endpoints de preferencias
- [x] Error en /preferences: servidor retorna HTML en lugar de JSON en endpoints de preferencias (Resuelto: era problema de imports de wouter no actualizados)
