# Seguridad y privacidad

Este repositorio debe contener únicamente código y recursos gráficos.

No se deben incorporar:

- contraseñas o claves de servicio;
- tokens de acceso;
- copias del libro contable;
- nombres, DNI u otros datos identificativos de pacientes;
- archivos CSV o Excel exportados con datos reales.

El visor autentica mediante Google y solicita únicamente el alcance necesario para identificar el correo principal de la cuenta. La lectura de `CAJA` se realiza en un servicio privado que se ejecuta como la cuenta de la clínica y aplica una lista cerrada de usuarios autorizados.

La contable no debe recibir permisos directos sobre `CAJA`. El servicio solo devuelve los rangos necesarios para Resumen, Visor, Gastos y Caja; las columnas con nombre y DNI no se solicitan ni se transmiten.

El identificador público del cliente OAuth puede estar en el repositorio. No debe existir ningún secreto de cliente en una web estática.
