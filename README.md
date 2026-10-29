# VISOR CAJA CLÍNICA BARAJAS

Interfaz web de solo consulta para revisar el resumen contable, la facturación, los gastos y la caja de Clínica Barajas.

## Estado actual

- Primera versión visual y funcional.
- Filtros por día, intervalo y mes.
- Exportación a CSV y Excel (`.xls`).
- Número de paciente como único identificador visible.
- Datos de demostración: no contiene información real de la clínica.
- Preparada para publicarse como sitio estático en GitHub Pages.

## Publicación en GitHub Pages

1. Crear un repositorio privado o público en la cuenta de la clínica.
2. Subir todo el contenido de esta carpeta a la rama `main`.
3. En GitHub, abrir **Settings → Pages**.
4. Seleccionar **GitHub Actions** como origen.
5. El flujo incluido en `.github/workflows/deploy-pages.yml` publicará la web.

El código puede estar en GitHub, pero los datos reales y las credenciales nunca deben guardarse en el repositorio.

## Conexión con los datos privados

La maqueta utiliza `assets/demo-data.js`. Para la publicación final se configurarán:

- acceso con Google;
- correo de la contable autorizado;
- una fuente de datos separada con solo las vistas permitidas;
- credenciales de lectura almacenadas fuera de GitHub;
- `demoMode: false` y `apiBaseUrl` en `assets/config.js`.

## Fuente contable

Libro: `CAJA`

Pestañas de consulta previstas:

- `DASHBOARD_RESUMEN`, `DASHBOARD_DIARIO` y `DASHBOARD_MENSUAL` para el resumen;
- `VISITAS` para facturación, sustituyendo nombre y DNI por número de paciente;
- `GASTOS`, conservando su estructura;
- `CAJA` para arqueo y saldos.
