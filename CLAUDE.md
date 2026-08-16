# Reglas del proyecto — obligatorias, no se olvidan ni se saltan

@rules/01-codigo-y-buenas-practicas.md
@rules/02-github-y-control-de-versiones.md
@rules/03-readme.md
@rules/04-backend-render.md
@rules/05-secretos-y-seguridad.md

## Resumen ejecutivo

- **Backend siempre en Render**, corriendo 24/7. La app de escritorio nunca depende de un server local del usuario; siempre apunta a Render.
- **GitHub es 100% del usuario**: Claude puede automatizar commits/push usando la sesión de Git/`gh` del propio usuario, sin quedar como colaborador/contribuidor ni usar cuenta propia. Único límite: el commit trailer `Co-Authored-By: Claude` es obligatorio por regla de la herramienta y no se puede quitar (ver detalle en rules/02). 
- **README** solo explica qué es la app, para qué sirve, tecnologías usadas y cómo correrla. Nada de arquitectura interna.
- **Código**: modular, reutilizable, con manejo de errores robusto en cada capa. Mejores prácticas siempre.
- **Automatización**: todo lo que se pueda automatizar con Render CLI/API lo hace Claude, minimizando pasos manuales.

## Estilo de comunicación

- Directo, sin rodeos. Ejecutar lo pedido en vez de explicar de más.
- Preguntar solo si falta información necesaria para avanzar.

## Estado del proyecto

**App elegida**: grabador/transcriptor de reuniones con resumen por IA.
- Captura audio del sistema (loopback) + micrófono en la app de escritorio.
- Transcripción local (Whisper on-device) para no pagar/depender de STT en la nube y mantener el audio privado.
- Backend en Render: recibe el transcript (texto, no audio), llama a OpenRouter (modelos gratis) para resumen + acciones pendientes, guarda todo en Postgres para historial buscable.
- Secretos ya provistos por el usuario y guardados en `.env` (no commiteado): `RENDER_API_KEY`, `OPENROUTER_API_KEY`.
- Rate limits de OpenRouter son a nivel de cuenta, no de API key: crear varias keys no da más cuota. Free sin créditos = 50 req/día; con ≥$10 comprados alguna vez = 1000 req/día. La cuota se comparte entre todos los usuarios de la app (una sola key del dueño del backend).
