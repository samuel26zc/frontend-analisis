# Paisaje Cultural Cafetero — Frontend de Análisis de Algoritmos (Quindío 2026-2)

Sistema de información geográfica y optimización de rutas turísticas para el Departamento del Quindío, Colombia. Desarrollado como proyecto final de la asignatura **Análisis y Complejidad de Algoritmos (2026-2)**.

---

## 🎨 Identidad Visual "Aroma Andino"

Diseño orgánico, cultural y contemporáneo inspirado en el **Paisaje Cultural Cafetero (UNESCO)**:
- **Café Expreso y Grano Tostado** (`#2C1D11`, `#3E2718`): Textos con jerarquía tipográfica y estructura.
- **Verde Cordillera Central** (`#2E5A44`, `#1B3B2B`): Elementos de éxito, coberturas y componentes conexas.
- **Ámbar Maduro** (`#D97706`, `#B45309`): Acentos en métricas, advertencias y podas.
- **Terracota Andina** (`#C05638`, `#9E3E26`): Trayectos mínimos, arcos viales y estados críticos.
- **Crema de Café & Pergamino** (`#FBF9F5`, `#F3EFEA`): Fondos descansados y legibilidad de mapas.
- **Tipografía Editorial**: *Playfair Display* para encabezados institucionales y *Plus Jakarta Sans* para tablas numéricas y controles interactivos.

---

## 🗺️ Módulos Implementados

### 1. Módulo R1: Catálogo Territorial & Grafo Vial
- Visualización de 42 atractivos turísticos, cabeceras municipales y centros de acopio en mapa CartoDB Voyager.
- Filtros por categoría y municipio con popups detallados de coordenadas WGS84 y duración de visita.
- Análisis de memoria del grafo: **Matriz de Adyacencia (1,675 MB)** vs **Lista de Adyacencia (1.97 MB)** — Factor de optimización $\approx 850\times$.
- Componente Fuertemente Conexa (SCC) calculada con el **Algoritmo de Tarjan** $O(V + E)$ con 100% de retención de lugares.
- Tratamiento de 12 atractivos rurales a $>500$ m de la red mediante proyección virtual.

### 2. Módulo R2: Caminos Mínimos (Dijkstra) & Matriz Asimétrica
- Selección interactiva de origen y destino con autocompletado y botón de intercambio rápido.
- Comparación en vivo de **Min-Heap binario** $O((V+E)\log V)$ frente a **Búsqueda Lineal** $O(V^2)$ con verificación del invariante de optimalidad $d[v] \le d[u] + w(u, v)$.
- Representación cartográfica de la ruta proyectada y secuencia de intersecciones viales.
- Matriz de tiempos de viaje $42 \times 42$ (1,764 pares) calculada con Dijkstra sobre la SCC.
- Comprobador interactivo de asimetría $T(A \to B) \ne T(B \to A)$ debida a topografía de montaña, pendientes y sentidos únicos.
- Descarga de la matriz completa en formato **CSV**.

### 3. Módulo R3: Envolvente Convexa (QuickHull)
- Delimitación poligonal del departamento mediante el enfoque divide y vencerás **QuickHull** $T(n) = 2T(n/2) + O(n)$.
- Cálculo de área de cobertura ($km^2$), perímetro ($km$) y listado de vértices extremos en sentido antihorario (CCW).
- Proyección plana cartesiana **UTM Zona 18N** con aritmética entera de 64 bits (`long`) para evitar imprecisiones de coma flotante.
- Benchmark experimental vs **SciPy (Qhull en C)** para $N = 1,000$, $10,000$ y $50,000$ puntos con coincidencia geométrica del 100%.

### 4. Módulo R4: Viajante Asimétrico (ATSP) & Itinerario de 11 Horas con Poda
- **Solucionador ATSP Teórico**:
  - Algoritmo exacto **Bellman-Held-Karp** con programación dinámica y máscaras de bits $O(2^k k^2)$.
  - Comparativa con **Fuerza Bruta** $O(k!)$ (con corte de seguridad a 10s) y **Heurística Voraz** del vecino más cercano $O(k^2)$.
  - Medición de la brecha porcentual de calidad heurística.
- **Itinerario Turístico de un Día (11 Horas)**:
  - Planificación con límite de jornada estricto de 11 horas (660 minutos), considerando traslados viales y tiempo de estancia en cada sitio.
  - **Algoritmo de poda sistemática**: Descarte automático y justificado de atracciones cuando la jornada excede las 11 horas, con recálculo exacto del circuito restante mediante Held-Karp.
  - Cronograma de paradas detallado minuto a minuto (08:00 AM - 19:00 PM).

### 5. Módulo R5: Laboratorio Experimental (Anexo del Proyecto)
- Ficha técnica completa del entorno de pruebas (procesador, núcleos, RAM, Heap JVM, versión de Java y sistema operativo).
- Gráficos interactivos (Recharts) y tablas canónicas para las 4 dimensiones experimentales.
- Protocolo con 5 iteraciones de calentamiento JIT C2 y mediciones en nanosegundos.

---

## 🚀 Requisitos y Ejecución

### Requisitos Previos
- **Node.js** >= 18.x
- **npm** o **pnpm**
- Backend Spring Boot activo en `http://localhost:8080` (ver repositorio `backend-analisis`)

### Instalación de Dependencias
```bash
npm install
```

### Ejecutar Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

### Compilar para Producción
```bash
npm run build
```
Genera la carpeta `dist/` optimizada.

---

## 👥 Equipo de Trabajo

- **Samuel Ortiz** (`Samuxll0`) — *Arquitectura base, tema visual Aroma Andino, layout y Módulo R1 Catálogo.*
- **Samuel Zuluaga Castaño** (`samuel26zc`) — *Módulo R2 Caminos Mínimos Dijkstra, Matriz Asimétrica CSV y Módulo R3 Envolvente Convexa QuickHull.*
- **Juan Pablo Mejia Parada** (`jpelefantino`) — *Módulo R4 ATSP, Itinerario de 11h con Poda y Módulo R5 Laboratorio Experimental del Anexo.*
