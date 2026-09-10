# Manchas Plein Air

Web institucional y comercial para **Manchas Plein Air**, una comunidad de experiencias que conecta arte, viajes, naturaleza, cultura y comunidad.

La propuesta visual combina estudio artístico, revista de viajes, galería y agencia de experiencias boutique. La web prioriza el paisaje y la experiencia artística por encima del turismo tradicional.

## Contenido

- Hero editorial: **Viajar para crear**.
- Presentación de la filosofía de la marca.
- Categorías de experiencias.
- Explorador de próximos viajes con filtros.
- Destinos destacados.
- Sección de residencias artísticas.
- Galería visual con lightbox.
- Sección de comunidad y testimonio.
- Newsletter con estados de validación, carga, éxito y error.
- Formulario de contacto con nombre, email, WhatsApp, interés, experiencia y mensaje.
- Captura de interés específica desde cada card de viaje.
- Botón `Reservar la experiencia` conectado a la plataforma externa de reservas.
- Modales reutilizables con itinerario, incluye y WhatsApp por experiencia.
- Lightbox con navegación anterior/siguiente, contador y teclado.
- Contador de resultados y transición suave en filtros.
- Menú responsive para mobile.

## Viajes actuales

- **Panamá**: viaje artístico internacional.
- **Ushuaia**: viaje artístico nacional.
- **El Calafate**: viaje artístico nacional.
- **Talampaya**: residencia artística plein air.

Filtros disponibles:

- Todas.
- Viajes internacionales.
- Viajes nacionales.
- Jornadas plein air.

El filtro de jornadas plein air ya está preparado para recibir nuevas experiencias y muestra un estado vacío mientras no haya jornadas cargadas.

## Estructura

```text
manchas-principal/
├── index.html   # Estructura y contenido de la web
├── styles.css   # Sistema visual responsive
├── script.js    # Datos e interacciones
├── api/          # Funciones serverless para leads y emails
│   ├── _lib.js
│   ├── newsletter.js
│   ├── contact.js
│   └── experience-interest.js
└── README.md    # Documentación del proyecto
```

## Tecnologías

- HTML5
- CSS3
- JavaScript vanilla
- Google Fonts: DM Serif Display y DM Sans
- Imágenes remotas desde Unsplash

No utiliza frameworks ni dependencias de instalación.

## Cómo abrir la web

La forma más simple es abrir directamente `index.html` en un navegador.

También puede ejecutarse desde un servidor local si se dispone de Node.js:

```bash
npx serve .
```

Después, abrir la URL local que indique el comando.

## Interacciones

- Filtros de experiencias sin recargar la página, con conteos y transición corta.
- Botones `Conocer la experiencia` y `Quiero información` en cada viaje.
- Modal contextual: carga automáticamente el nombre y tipo de experiencia.
- Menú mobile de pantalla completa.
- Animaciones de aparición al hacer scroll.
- Hover sobre imágenes y categorías.
- Lightbox para ampliar imágenes de la galería.
- Cierre del lightbox con botón, click fuera o tecla `Escape`.
- Formularios en modo demo si no se configura un endpoint, sin usar `alert()`.

## Escalabilidad

Las experiencias se encuentran centralizadas en el array `experiences` dentro de `script.js`. Para agregar un viaje nuevo, se puede incorporar un objeto con esta estructura:

```js
{
  type: 'nacional',
  title: 'Nuevo destino',
  category: 'Viaje artístico nacional',
  place: 'Provincia · País',
  date: 'FECHA DEL VIAJE',
  price: 'Desde U$S XXXX',
  status: 'Próximamente',
  image: 'URL_DE_LA_IMAGEN'
}
```

Los tipos de filtro actuales son:

- `internacional`
- `nacional`
- `plein-air`

## Servicios y configuración

Los formularios funcionan con estos endpoints JSON:

```text
POST /api/newsletter
POST /api/contact
POST /api/experience-interest
```

La configuración está en `index.html`, antes de cargar `script.js`:

```html
<script>
  window.MPA_CONFIG = {
    newsletterEndpoint: '/api/newsletter',
    contactEndpoint: '/api/contact',
    experienceInterestEndpoint: '/api/experience-interest',
    whatsappNumber: '5491123456789',
    bookingUrl: 'https://manchas-plen-air-eccomerce.vercel.app/',
    analyticsMeasurementId: ''
  };
</script>
<script src="script.js"></script>
```

Cada endpoint recibe `POST` con JSON y devuelve `{ "success": true }` o un error JSON. Las funciones serverless validan, sanitizan, aplican honeypot y rate limiting básico, guardan leads en Supabase si está configurado y envían emails mediante Resend.

La capa `emailService` está definida en `script.js` con tres métodos preparados para conectar un backend:

```js
emailService.sendNewsletter(data)
emailService.sendContact(data)
emailService.sendExperienceInterest(data)
```

Para producción, colocar la configuración antes de cargar `script.js`. No incluir claves privadas en el frontend. El backend debe validar y almacenar los datos recibidos.

El formulario de interés envía automáticamente `experience` y `type`, por ejemplo:

```json
{
  "name": "María Pérez",
  "email": "maria@example.com",
  "whatsapp": "549...",
  "experience": "Panamá",
  "experienceId": "panama",
  "type": "internacional",
  "status": "Nuevo",
  "source": "manchas_web",
  "createdAt": "2026-09-10T10:35:00.000Z"
}
```

### Variables de entorno en Vercel

Configurar en el proyecto desplegado, nunca en `index.html` ni `script.js`:

```text
RESEND_API_KEY=
EMAIL_FROM=Manchas Plein Air <hola@tudominio.com>
CONTACT_EMAIL=equipo@tudominio.com
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Sin estas variables, las funciones responden error de configuración en vez de fingir un envío exitoso.

### Leads

La colección o tabla `leads` debe soportar como mínimo:

```text
id
name
email
whatsapp
experience_id
experience_name
interest_type
message
status
source
page
created_at
```

Los estados previstos son `Nuevo`, `Contactado`, `En conversación`, `Interesado`, `Reservó` y `No interesado`. Analytics no recibe nombre, email ni WhatsApp.

El newsletter envía un email de bienvenida al suscriptor. Las consultas de contacto se envían a `CONTACT_EMAIL`; el interés por experiencia envía una notificación al negocio y una confirmación al interesado.

## Analytics y conversiones

La función reutilizable `trackEvent(eventName, data)` escribe en `window.dataLayer` y, si `analyticsMeasurementId` está configurado, también envía eventos a Google Analytics 4. Los eventos implementados son:

```text
page_view
view_experience
interest_experience
whatsapp_click
click_reservation
newsletter_signup
contact_form_submit
gallery_open
filter_experience
```

Para activar GA4, colocar el ID de medición en `MPA_CONFIG.analyticsMeasurementId`. Se usa `anonymize_ip` y no se envían datos personales. Plausible o Google Tag Manager pueden conectarse reemplazando o ampliando `trackEvent`.

## Ecommerce y reservas

La web institucional no crea checkout ni procesa pagos. Cada botón de reserva redirige al ecommerce existente usando:

```text
?experiencia=panama
&product=panama
&utm_source=manchas_web
&utm_medium=experience
&utm_campaign=panama
```

El slug y `productId` se mantienen en el array `experiences` de `script.js`. Para atribuir la compra final, el ecommerce debe conservar estos UTMs y emitir posteriormente un evento `purchase` o `reservation_completed`. No se almacenan datos de tarjeta.

La estructura puede evolucionar posteriormente hacia rutas independientes como:

```text
/experiencias/panama
/experiencias/ushuaia
/experiencias/el-calafate
/experiencias/talampaya
```

## Próximos pasos sugeridos

- Reemplazar las imágenes de Unsplash por fotografías propias.
- Crear páginas individuales para cada experiencia.
- Configurar `MPA_CONFIG` con el proveedor de email y contacto elegido.
- Agregar itinerarios, alojamientos, cupos y condiciones de pago.
- Incorporar un CMS o API para administrar viajes sin editar código.
- Configurar dominio, analítica y SEO técnico para producción.

## Identidad verbal

La comunicación de la marca busca ser:

- Cercana.
- Artística.
- Inspiradora.
- Profesional.
- Humana.
- Aventurera.

Frase principal de la marca:

> Viajamos para mirar distinto.
