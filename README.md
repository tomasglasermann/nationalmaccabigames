# NMB · Road to Austin 2027 — Landing page

Landing page de la delegación **NMB (North Miami Beach / MARJCC)** rumbo a los
**JCC Maccabi Games 2027** en Austin, Texas.

La página es un único archivo autónomo: **`index.html`** (HTML + CSS + JS en línea,
tipografía Montserrat desde Google Fonts). No requiere build ni dependencias.

## Secciones

- **Hero** — "LET'S GO NMB! · Road to Austin 2027"
- **Los Juegos** — qué son los JCC Maccabi Games
- **El Equipo** — por qué apoyar a NMB (desde 1992, +40 atletas, $2,650/atleta)
- **Deportes** — las 12 categorías (Soccer, Basketball, Volleyball, Tennis, Swimming)
- **Galería** — fotos del año pasado (marcadores de posición, ver abajo)
- **Registro** — formulario de atletas con los campos solicitados
- **Sponsorship** — los 6 niveles de patrocinio ($500 – $12,000)
- **Donar** — enlace a RedPodium

## Pendiente de ti (configuración)

Abre `index.html` y busca el bloque **`CONFIG`** cerca del final (dentro del `<script>`):

```js
const CONFIG = {
  salesforceRegistrationUrl: "#", // ← pega aquí el link de registro de Salesforce
  redpodiumDonationUrl: "#",      // ← pega aquí el link de donación de RedPodium
  ...
};
```

- Mientras estén en `"#"`, el botón **"Registro oficial"** y los botones **"Donar"**
  se comportan de forma elegante (no rompen nada) y muestran un aviso de "próximamente".
- Al pegar los enlaces reales, se abren automáticamente en una pestaña nueva.

### Otros reemplazos recomendados

- **Logo oficial:** el escudo es una recreación en SVG. Sustitúyelo por el archivo
  oficial del brand book (buscar `class="crest"` / `class="hero__crest"`).
- **Fotos del año pasado:** la galería usa marcadores de posición. Reemplaza los
  `<div class="ph">` por `<img>` con las fotos reales (carpeta de Drive).
  Publica fotos de menores solo con el consentimiento familiar que requiere el MARJCC.
- **Formulario → Salesforce:** hoy el formulario muestra una confirmación en pantalla.
  Para enviar los datos a Salesforce (Web-to-Lead), conecta el `submit` del
  formulario `#regForm` a tu endpoint y mapea los `name` de los campos a los
  IDs de Salesforce (ver nota en el HTML junto a `.formcard`).

## Branding

Navy `#0A2342` · Burgundy `#800020` · White `#FFFFFF` · tipografía Montserrat.
Basado en el *NMB Brand Book 2027*.
