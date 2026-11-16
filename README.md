# Paisaje Cultural Cafetero — Frontend de Análisis de Algoritmos (Quindío 2026-2)

Aplicación web demostrativa de análisis de algoritmos y planificación de rutas turísticas sobre la red vial de **OpenStreetMap** del Departamento del Quindío, Colombia. Desarrollada como parte del proyecto final de la asignatura **Análisis y Complejidad de Algoritmos (2026-2)**.

---

## 🗺️ Módulos Implementados (Requerimiento 5)

### 1. Módulo R1: Territorio & Red Vial de OpenStreetMap
- Visualización de los **42 lugares del catálogo** (12 cabeceras municipales, 15 atractivos turísticos, 8 fincas/hoteles rurales y 7 centros de acopio/trilladoras) sobre el mapa de la **Red Vial de OpenStreetMap**.
- Estadísticas de la red descargada (**37,117 nodos** y **73,615 aristas dirigidas**) y de su Mayor Componente Fuertemente Conexa (**35,442 nodos** y **70,837 aristas**).
- Estimación analítica de memoria: **Matriz de Adyacencia (10,511.65 MB)** frente a **Listas de Adyacencia (4.22 MB)** — Factor de optimización $\approx 2\,491.3\times$.
- Asociación de lugares al nodo más cercano en coordenadas métricas **UTM Zona 18N** y reporte de los lugares situados a más de 500 m.

### 2. Módulo R2: Caminos Mínimos (Dijkstra) & Matriz Asimétrica (42 × 42)
- Selección de origen y destino con cálculo en tiempo real mediante **Dijkstra con Cola de Prioridad** $O((V+E)\log V)$ y **Dijkstra con Búsqueda Lineal** $O(V^2)$.
- Trazado directo en el mapa de la secuencia de nodos viales de OpenStreetMap reconstruida a partir de los predecesores de Dijkstra.
- Visualización interactiva y descarga en formato **CSV** de la matriz asimétrica de tiempos de viaje $42 \times 42$.

### 3. Módulo R3: Envolvente Convexa (QuickHull 2D vs SciPy)
- Visualización del polígono de la envolvente convexa sobre los **35,442 nodos** de la componente fuertemente conexa en coordenadas enteras de 64 bits (UTM Zona 18N), delimitado por **17 vértices extremos** en sentido antihorario.
- Tabla y gráfica comparativa de tiempos medidos entre `QuickHull2D` propio (Java 21) y `scipy.spatial.ConvexHull` (Qhull en C, SciPy 1.18.1) para los nodos de la red y cuadrados de $1\,000$, $10\,000$ y $50\,000$ puntos (semilla fija `42`), con coincidencia de vértices del 100 %.

### 4. Módulo R4: Ruta Óptima ATSP e Itinerario de 11 Horas
- Selección del lugar de partida (por defecto Armenia, Plaza de Bolívar) y de los lugares/atractivos a visitar.
- Comparación en tiempo real entre **Bellman-Held-Karp** $\Theta(2^k k^2)$, **Fuerza Bruta** $\Theta(k!)$ y la **Heurística Voraz** del vecino más cercano $\Theta(k^2)$.
- Planificador de jornada de un día ($\le 11\text{ h} = 660\text{ min}$) con poda justificada de atractivos cuando se excede el límite y visualización del recorrido en el mapa **uniendo las rutas de Dijkstra entre paradas consecutivas**.

### 5. Módulo R5: Laboratorio Experimental y Tablas del Anexo
- Ficha técnica de la máquina reportada en vivo por la JVM.
- Tablas y gráficas generadas directamente desde los archivos de resultados experimentales del backend (`results/*.csv` y `experiments_results.json`), sin datos escritos a mano en el frontend.

---

## 🚀 Requisitos y Ejecución Local

### Requisitos Previos
- **Node.js** >= 18.x y **npm**
- Servidor Backend Spring Boot activo en `http://localhost:8080` (ver repositorio `backend-analisis`)

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

### 3. Compilar para producción
```bash
npm run build
```

---

## 👥 Equipo de Trabajo

- **Samuel Ortiz** (`Samuxll0`) — *Arquitectura base, layout y Módulo R1 (Territorio y Red Vial).*
- **Samuel Zuluaga Castaño** (`samuel26zc`) — *Módulo R2 (Caminos Mínimos Dijkstra y Matriz Asimétrica CSV) y Módulo R3 (Envolvente Convexa QuickHull).*
- **Juan Pablo Mejia Parada** (`jpelefantino`) — *Módulo R4 (ATSP e Itinerario de 11h con rutas de Dijkstra) y Módulo R5 (Laboratorio Experimental).*
