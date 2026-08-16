# MeetScribe

Aplicación de escritorio para Windows que graba tus reuniones (audio del sistema + micrófono), las transcribe automáticamente y genera un resumen con acciones pendientes usando IA. Todo tu historial de reuniones queda guardado y es buscable.

El backend corre siempre en la nube (Render), así que la app funciona igual sin importar qué PC la esté usando.

## Tecnologías usadas

- **App de escritorio**: Electron + React + TypeScript
- **Transcripción de audio**: Whisper (whisper.cpp), 100% local en tu equipo — gratis y privado
- **Backend**: Node.js + Express + TypeScript, alojado en Render
- **Base de datos**: PostgreSQL (Render)
- **Resumen y acciones pendientes por IA**: OpenRouter (modelos gratuitos)

## Cómo correrla en tu equipo

### Requisitos

- [Node.js](https://nodejs.org/) 20 o superior
- Windows 10/11

### Instalación

```bash
npm install --workspace=backend
npm install --workspace=desktop
```

Descargar el binario y el modelo de Whisper (una sola vez, gratis):

```bash
cd desktop
npm run setup:whisper
```

### Configuración

Copiar `.env.example` a `.env` en la raíz del proyecto y completar las variables (API key de Render, API key de OpenRouter, URL de la base de datos, URL del backend).

### Arrancar

En una terminal, el backend:

```bash
npm run dev:backend
```

En otra terminal, la app de escritorio:

```bash
npm run dev:desktop
```

### Generar el instalador de Windows

```bash
cd desktop
npm run dist:win
```
