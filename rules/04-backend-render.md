# Backend en Render

- Todo backend/servidor del proyecto corre siempre en Render (nunca solo en local), para que la app de escritorio funcione para cualquier persona a la que se le pase, sin depender de que el usuario tenga su PC o un servidor propio encendido.
- El usuario provee la API key de Render cuando se le pida. Se pasa por sesión/entorno, nunca se commitea al repo.
- Una sola API key de Render normalmente puede gestionar todos los servicios de su workspace. Solo pedir una key adicional si:
  - un servicio vive en otra cuenta/workspace de Render, o
  - el usuario quiere aislar permisos por proyecto.
  - No asumir "una key por servidor" por defecto.
- Link directo para crear una API key: https://dashboard.render.com/u/settings?add-api-key
- Link a la sección de Account Settings (API Keys) en general: https://dashboard.render.com/u/settings
- Automatizar todo lo posible con la **Render CLI** (`render`) y la **Render API**: creación de servicios, variables de entorno, deploys, logs, dominios, etc. Minimizar los pasos manuales que el usuario tiene que hacer a mano en el dashboard.
- Nunca exponer la API key en código, commits, logs compartidos o el README. Los secretos del backend en producción se configuran como variables de entorno directamente en Render, no en el código.
