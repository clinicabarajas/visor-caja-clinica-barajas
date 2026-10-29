# VISOR CAJA CLÍNICA BARAJAS

Interfaz web de solo consulta para revisar el resumen contable, la facturación, los gastos y la caja de Clínica Barajas.

## Funcionamiento

- Datos reales leídos en el momento de la consulta desde el libro privado `CAJA`.
- Acceso con Google limitado a identificar la cuenta autorizada.
- Lectura mediante un servicio privado que se ejecuta como la clínica; la contable no recibe acceso al libro `CAJA`.
- Filtros por día, intervalo y mes.
- Exportación a CSV y Excel (`.xls`).
- Número de paciente como único identificador visible.
- Las columnas con nombre y DNI no se solicitan a Google.
- Ningún dato contable ni token de acceso se almacena en GitHub.

## Publicación en GitHub Pages

El flujo incluido en `.github/workflows/deploy-pages.yml` publica la web desde la rama `main`.

El código puede estar en GitHub, pero los datos reales y las credenciales nunca deben guardarse en el repositorio.

## Autorización de Google

La web utiliza Google Identity Services y un servicio privado de Google Apps Script. Es necesario:

- crear un cliente OAuth de aplicación web con origen autorizado `https://clinicabarajas.github.io`;
- copiar únicamente su identificador público en `assets/config.js`;
- publicar el servicio privado para que se ejecute como la cuenta de la clínica;
- mantener en las propiedades privadas del servicio la lista de cuentas autorizadas.

No se usa secreto de cliente en GitHub. El visor solicita únicamente el correo principal de Google; el token temporal permanece en la memoria del navegador y desaparece al cerrar la sesión o la pestaña. La contable no necesita ni recibe permisos sobre el archivo `CAJA`.

## Fuente contable

Libro: `CAJA`

Pestañas de consulta previstas:

- `DASHBOARD_RESUMEN`, `DASHBOARD_DIARIO` y `DASHBOARD_MENSUAL` para el resumen;
- rangos separados de `BASEP` para facturación, excluyendo nombre y DNI desde la consulta;
- `BASEGASTOS` para gastos;
- `BASECAJA` para el histórico de arqueos y saldos.
