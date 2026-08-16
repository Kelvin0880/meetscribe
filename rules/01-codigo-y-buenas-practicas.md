# Código y buenas prácticas

- Mejores prácticas siempre, sin atajos que sacrifiquen calidad.
- **Modularidad**: separar responsabilidades (UI, lógica de negocio, acceso a datos, servicios externos/API) en módulos y carpetas propias. Nada de archivos gigantes con todo mezclado.
- **Reutilización**: funciones, componentes y utilidades compartidas en vez de duplicar código (DRY). Antes de escribir algo nuevo, revisar si ya existe algo reutilizable en el proyecto.
- **Manejo de errores en todo**:
  - Todo I/O (red, disco, IPC, base de datos, llamadas al backend en Render) va envuelto en try/catch o su equivalente.
  - Validar inputs (formularios, respuestas de API, variables de entorno) antes de usarlos.
  - Nunca fallos silenciosos: loguear con contexto útil y devolver mensajes claros y entendibles al usuario final.
  - Manejar estados de carga, error y vacío en la UI, no solo el "happy path".
  - El backend nunca debe crashear por un input inválido o un servicio caído; responder con errores controlados.
- Nombres claros y consistentes para funciones, variables, archivos y carpetas.
- Comentarios solo donde aportan valor real (el "por qué", no el "qué" obvio).
- Configuración siempre vía variables de entorno, nunca hardcodeada en el código.
- Mismo estilo de código en todo el proyecto (linter/formatter configurado desde el inicio).
