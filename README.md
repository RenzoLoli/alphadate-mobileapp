# Alphadate

Aplicación móvil para organizar citas basadas en las letras del abecedario. Permite crear, editar y eliminar citas, marcar su estado y consultar recomendaciones para completar las letras pendientes.

## Tabla de contenidos

- [Características](#caracteristicas)
- [Tecnologías](#tecnologias)
- [Requisitos](#requisitos)
- [Instalación](#instalacion)
- [Configuración](#configuracion)
- [Ejecución](#ejecucion)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Autenticación y API](#autenticacion-y-api)
- [Calidad de código](#calidad-de-codigo)
- [Licencia](#licencia)

## Características

- Registro e inicio de sesión con correo electrónico y contraseña.
- Autenticación mediante Amazon Cognito.
- Creación, edición y eliminación de citas.
- Organización de citas por letra del abecedario.
- Seguimiento de citas pendientes y completadas.
- Recomendaciones para descubrir nuevas citas.
- Ruleta para elegir una letra disponible.
- Opciones para compartir el contenido de Alphadate.
- Preferencia de apariencia clara u oscura.

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| Expo SDK 57 | Entorno de desarrollo y compilación |
| Expo Router | Navegación basada en archivos |
| React 19 | Interfaz de usuario |
| React Native 0.86 | Aplicación móvil |
| TypeScript | Tipado estático |
| AWS Amplify 6 | Integración de autenticación |
| Amazon Cognito | Gestión de usuarios y sesiones |
| Axios | Peticiones HTTP |
| NativeWind 4 | Estilos con utilidades de Tailwind CSS |
| React Native Reanimated | Animaciones |
| React Native Gesture Handler | Gestos |
| React Native Safe Area Context | Adaptación a áreas seguras |
| Lucide React Native | Iconografía |

## Requisitos

- Node.js y npm.
- Un User Pool de Amazon Cognito y un App Client configurado.
- Una API de Alphadate accesible desde el dispositivo.
- Android Studio y Android SDK para ejecutar en Android.
- macOS y Xcode para ejecutar en iOS.
- Un navegador compatible para ejecutar la versión web.

## Instalación

Clona el repositorio e instala las dependencias:

```bash
git clone <URL_DEL_REPOSITORIO>
cd alphadate-mobileapp
npm install
```

Crea el archivo de variables de entorno a partir del ejemplo:

```bash
cp .env.example .env
```

## Configuración

Configura las siguientes variables en el archivo `.env` ubicado en la raíz del proyecto:

```dotenv
EXPO_PUBLIC_API_URL=https://tu-api.example.com
EXPO_PUBLIC_COGNITO_CLIENT_ID=tu_cognito_app_client_id
EXPO_PUBLIC_COGNITO_POOL_ID=tu_cognito_user_pool_id
```

| Variable | Descripción |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | URL base de la API de Alphadate. |
| `EXPO_PUBLIC_COGNITO_CLIENT_ID` | ID del App Client del User Pool de Cognito. |
| `EXPO_PUBLIC_COGNITO_POOL_ID` | ID del User Pool de Cognito. |

Las variables llevan el prefijo `EXPO_PUBLIC_` porque se utilizan en el código cliente y pueden quedar incluidas en el bundle de la aplicación. No guardes secretos, claves privadas ni credenciales sensibles en ellas.

Asegúrate de que `.env.example` incluya las mismas variables necesarias para configurar el proyecto desde cero.

## Ejecución

Inicia el servidor de desarrollo de Expo:

```bash
npm run start
```

También puedes ejecutar la aplicación directamente en una plataforma:

```bash
npm run android
npm run ios
npm run web
```

Los comandos `android` e `ios` requieren que sus respectivos entornos nativos estén instalados y configurados.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run start` | Inicia el servidor de desarrollo de Expo. |
| `npm run android` | Compila e inicia la aplicación en Android. |
| `npm run ios` | Compila e inicia la aplicación en iOS. |
| `npm run web` | Inicia la versión web. |
| `npm run lint` | Ejecuta Expo Lint. |
| `npm run format` | Aplica Prettier a los archivos compatibles del proyecto. |
| `npm run clear` | Elimina la caché local de Expo y las cachés temporales de Metro y Watchman. No inicia el servidor. |

Para limpiar las cachés y después iniciar Expo manualmente:

```bash
npm run clear
npm run start
```

## Estructura del proyecto

```text
.
├── assets/
│   └── images/                  # Iconos, splash screen y recursos gráficos
├── src/
│   ├── app/                     # Rutas y pantallas de Expo Router
│   │   ├── (tabs)/              # Pestañas principales
│   │   ├── _layout.tsx          # Layout raíz y protección de rutas
│   │   ├── index.tsx            # Redirección según la sesión
│   │   ├── login.tsx            # Inicio de sesión
│   │   └── register.tsx         # Registro
│   ├── components/
│   │   ├── home/                # Componentes de citas y recomendaciones
│   │   ├── settings/            # Componentes de ajustes
│   │   ├── shared/              # Componentes compartidos
│   │   └── ui/                  # Componentes de interfaz reutilizables
│   ├── constants/
│   │   └── config/              # Configuración de servicios
│   ├── hooks/                   # Hooks de la aplicación
│   ├── lib/
│   │   ├── services/
│   │   │   ├── api/             # Cliente HTTP, servicios y modelos
│   │   │   └── storage/         # Persistencia local
│   │   ├── utils/               # Funciones auxiliares
│   │   └── theme.ts             # Tema de navegación
│   ├── providers/               # Context providers
│   └── global.css               # Estilos globales
├── .env.example
├── app.json
├── package.json
└── README.md
```

## Autenticación y API

La autenticación se integra mediante AWS Amplify y Amazon Cognito. La navegación de la aplicación tiene en cuenta el estado de la sesión.

El cliente HTTP utiliza `EXPO_PUBLIC_API_URL` como URL base, configura un tiempo de espera de 10 segundos y adjunta el access token de Cognito como token Bearer cuando existe una sesión.

### Endpoints utilizados

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/alphabets/dates` | Obtiene las citas del usuario. |
| `POST` | `/alphabets/dates` | Crea una cita. |
| `PUT` | `/alphabets/dates/:dateId` | Actualiza una cita o su estado. |
| `DELETE` | `/alphabets/dates/:dateId` | Elimina una cita. |
| `GET` | `/alphabets/recommendations` | Obtiene recomendaciones. |

La API debe implementar estos endpoints y respetar los modelos de datos definidos por el cliente en `src/lib/services/api/`.

## Calidad de código

Ejecuta el linter antes de integrar cambios:

```bash
npm run lint
```

Para aplicar el formato del proyecto:

```bash
npm run format
```

## Licencia

El proyecto indica utilizar la licencia MIT. Consulta el archivo [`LICENSE`](./LICENSE) si está disponible en el repositorio.

