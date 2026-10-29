# Seguridad y privacidad

Este repositorio debe contener únicamente código y recursos gráficos.

No se deben incorporar:

- contraseñas o claves de servicio;
- tokens de acceso;
- copias del libro contable;
- nombres, DNI u otros datos identificativos de pacientes;
- archivos CSV o Excel exportados con datos reales.

El visor autentica mediante Google y solicita únicamente el alcance `spreadsheets.readonly`. El acceso efectivo lo determinan los permisos de lectura del libro `CAJA`; ocultar pestañas o botones no sustituye esos permisos.

El identificador público del cliente OAuth puede estar en el repositorio. No debe existir ningún secreto de cliente en una web estática.
