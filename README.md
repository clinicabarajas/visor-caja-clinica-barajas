# VISOR CAJA CLÍNICA BARAJAS

Interfaz web de solo consulta para revisar el resumen contable, la facturación, los gastos y la caja de Clínica Barajas.

## Funcionamiento

- Datos reales leídos en el momento de la consulta desde el libro privado `CAJA`.
- Acceso con Google y alcance de solo lectura de Google Sheets.
- Filtros por día, intervalo y mes.
- Exportación a CSV y Excel (`.xls`).
- Número de paciente como único identificador visible.
- Las columnas con nombre y DNI no se solicitan a Google.
- Ningún dato contable ni token de acceso se almacena en GitHub.

## Publicación en GitHub Pages

El flujo incluido en `.github/workflows/deploy-pages.yml` publica la web desde la rama `main`.

El código puede estar en GitHub, pero los datos reales y las credenciales nunca deben guardarse en el repositorio.

## Autorización de Google

La web utiliza Google Identity Services y la API de Google Sheets. Es necesario:

- habilitar Google Sheets API en el proyecto de Google Cloud de la clínica;
- crear un cliente OAuth de aplicación web con origen autorizado `https://clinicabarajas.github.io`;
- copiar únicamente su identificador público en `assets/config.js`;
- compartir el libro `CAJA` con la contable como lectora.

No se usa secreto de cliente. El token temporal permanece en la memoria del navegador y desaparece al cerrar la sesión o la pestaña.

## Fuente contable

Libro: `CAJA`

Pestañas de consulta previstas:

- `DASHBOARD_RESUMEN`, `DASHBOARD_DIARIO` y `DASHBOARD_MENSUAL` para el resumen;
- rangos separados de `BASEP` para facturación, excluyendo nombre y DNI desde la consulta;
- `BASEGASTOS` para gastos;
- `BASECAJA` para el histórico de arqueos y saldos.
