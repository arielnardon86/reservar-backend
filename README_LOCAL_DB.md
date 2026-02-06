# 🗄️ Configuración de Base de Datos Local

## Opción 1: Docker (Recomendado - Más Fácil)

### Requisitos
- Docker Desktop instalado: https://www.docker.com/products/docker-desktop

### Pasos

1. **Iniciar PostgreSQL con Docker:**
   ```bash
   docker-compose up -d
   ```

2. **Verificar que esté corriendo:**
   ```bash
   docker ps
   ```
   Deberías ver el contenedor `reservar-postgres` corriendo.

3. **Configurar .env:**
   Crea un archivo `.env` en la carpeta `backend` con:
   ```env
   DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/reservar_db?schema=public"
   ```

4. **Ejecutar migraciones:**
   ```bash
   npx prisma migrate dev --name add_super_admin_and_tenant_active
   ```

### Comandos útiles de Docker

- **Detener PostgreSQL:**
  ```bash
  docker-compose down
  ```

- **Ver logs:**
  ```bash
  docker-compose logs -f postgres
  ```

- **Reiniciar:**
  ```bash
  docker-compose restart
  ```

---

## Opción 2: PostgreSQL Local (Windows)

### Instalación

1. **Descargar PostgreSQL:**
   - Ve a: https://www.postgresql.org/download/windows/
   - Descarga el instalador oficial

2. **Instalar:**
   - Ejecuta el instalador
   - Durante la instalación, configura una contraseña para el usuario `postgres`
   - **Importante:** Marca la opción para agregar PostgreSQL al PATH

3. **Verificar instalación:**
   ```powershell
   psql --version
   ```

### Configuración

1. **Crear base de datos:**
   ```powershell
   # Conectar a PostgreSQL (te pedirá la contraseña)
   psql -U postgres
   
   # Dentro de psql, crear la base de datos:
   CREATE DATABASE reservar_db;
   
   # Salir
   \q
   ```

2. **Configurar .env:**
   Crea un archivo `.env` en la carpeta `backend` con:
   ```env
   DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/reservar_db?schema=public"
   ```
   Reemplaza `TU_CONTRASEÑA` con la contraseña que configuraste durante la instalación.

3. **Ejecutar migraciones:**
   ```bash
   npx prisma migrate dev --name add_super_admin_and_tenant_active
   ```

---

## Opción 3: Script Automatizado (PowerShell)

Ejecuta el script interactivo que te guiará paso a paso:

```powershell
cd backend
.\scripts\setup-local-db.ps1
```

El script detectará automáticamente si tienes Docker o PostgreSQL instalado y te guiará en la configuración.

---

## Verificar Conexión

Después de configurar, puedes verificar la conexión:

```bash
# Usando Prisma Studio (interfaz visual)
npx prisma studio

# O usando psql directamente
psql "postgresql://postgres:postgres123@localhost:5432/reservar_db"
```

---

## Solución de Problemas

### Error: "port 5432 is already in use"
- PostgreSQL ya está corriendo en tu máquina
- Usa ese PostgreSQL existente o detén el servicio:
  ```powershell
  # Ver servicios de PostgreSQL
  Get-Service | Where-Object {$_.Name -like "*postgres*"}
  
  # Detener servicio
  Stop-Service postgresql-x64-15  # Ajusta el nombre según tu versión
  ```

### Error: "password authentication failed"
- Verifica que la contraseña en `.env` sea correcta
- Si usas Docker, la contraseña por defecto es `postgres123`

### Error: "database does not exist"
- Crea la base de datos manualmente:
  ```sql
  CREATE DATABASE reservar_db;
  ```

---

## Credenciales por Defecto (Docker)

- **Usuario:** `postgres`
- **Contraseña:** `postgres123`
- **Base de datos:** `reservar_db`
- **Puerto:** `5432`
- **Host:** `localhost`

⚠️ **Nota de Seguridad:** Estas credenciales son solo para desarrollo local. En producción, usa credenciales seguras.
