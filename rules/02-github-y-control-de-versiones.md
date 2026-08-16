# GitHub y control de versiones

- El repositorio en GitHub es y será siempre del usuario; la cuenta es 100% suya.
- Claude puede automatizar todo el flujo (init, commits, `git push`, crear el repo remoto) cuando el usuario lo pida, usando la sesión de Git/`gh` ya configurada en el equipo del usuario — nunca una cuenta, token o SSH key propios de Claude.
- Condición del usuario: que no quede registro de que Claude intervino en el repo (autor/nombre = el del usuario, sin menciones a Claude en commits/PRs).
- Límite no negociable: cuando Claude genera un commit, por regla fija de la herramienta el mensaje incluye la línea `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`. Esa línea Claude no la puede quitar.
  - Si se quiere cero rastro total, la alternativa es que Claude deje todo preparado (staging, mensaje de commit sugerido) y el usuario ejecute el `commit`/`push` final él mismo con los comandos exactos que Claude le entregue.
- Claude nunca: crea el repo bajo su propia cuenta, queda como colaborador/contribuidor a nivel de cuenta de GitHub, ni usa su propio `gh`/token/SSH key.
