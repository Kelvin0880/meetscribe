# Secretos y seguridad

- Ninguna API key, token o credencial se commitea al repositorio. Siempre en `.env` (con un `.env.example` sin valores reales) y `.env` listado en `.gitignore`.
- Los secretos del backend en producción se configuran como variables de entorno en Render, nunca hardcodeados en el código ni en el repo.
- Validar y sanear cualquier input que llegue del cliente de escritorio al backend antes de procesarlo.
- No loguear datos sensibles (API keys, tokens, contraseñas, datos personales) ni en logs de Render ni en logs de la app de escritorio.
- Comunicación entre la app de escritorio y el backend siempre sobre HTTPS.
