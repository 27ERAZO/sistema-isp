import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import '../styles/inventario.css'

function VistaInventario() {
  const [productos, setProductos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const [formProducto, setFormProducto] = useState({
    nombre: '',
    categoria: '',
    marca: '',
    modelo: '',
    stock_minimo: '',
    precio_compra: '',
    precio_venta: '',
  })

  const [formMovimiento, setFormMovimiento] = useState({
    producto_id: '',
    tipo: 'Entrada',
    cantidad: '',
    descripcion: '',
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setCargando(true)
    setMensaje('')
    setError('')

    try {
      const [resProductos, resMovimientos] = await Promise.all([
        supabase
          .from('inventario_productos')
          .select('*')
          .order('id', { ascending: false }),

        supabase
          .from('inventario_movimientos')
          .select(`
            *,
            inventario_productos (
              id,
              nombre,
              marca,
              modelo
            )
          `)
          .order('id', { ascending: false }),
      ])

      if (resProductos.error) throw resProductos.error
      if (resMovimientos.error) throw resMovimientos.error

      setProductos(resProductos.data || [])
      setMovimientos(resMovimientos.data || [])
    } catch (err) {
      console.error('Error real al cargar inventario:', err)
      setError(`Error al cargar inventario: ${err.message || JSON.stringify(err)}`)
    } finally {
      setCargando(false)
    }
  }

  function handleProductoChange(e) {
    const { name, value } = e.target
    setFormProducto((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleMovimientoChange(e) {
    const { name, value } = e.target
    setFormMovimiento((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function guardarProducto(e) {
    e.preventDefault()
    setMensaje('')
    setError('')

    if (!formProducto.nombre.trim()) {
      setError('Debes ingresar el nombre del producto.')
      return
    }

    setCargando(true)

    try {
      const payload = {
        nombre: formProducto.nombre.trim(),
        categoria: formProducto.categoria.trim(),
        marca: formProducto.marca.trim(),
        modelo: formProducto.modelo.trim(),
        stock_minimo: Number(formProducto.stock_minimo || 0),
        precio_compra: Number(formProducto.precio_compra || 0),
        precio_venta: Number(formProducto.precio_venta || 0),
        stock_actual: 0,
      }

      const { data, error } = await supabase
        .from('inventario_productos')
        .insert([payload])
        .select()

      console.log('Producto guardado:', data)

      if (error) throw error

      setMensaje('Producto guardado correctamente.')
      setFormProducto({
        nombre: '',
        categoria: '',
        marca: '',
        modelo: '',
        stock_minimo: '',
        precio_compra: '',
        precio_venta: '',
      })

      await cargarDatos()
    } catch (err) {
      console.error('Error real al guardar producto:', err)
      setError(`Error al guardar producto: ${err.message || JSON.stringify(err)}`)
    } finally {
      setCargando(false)
    }
  }

  async function guardarMovimiento(e) {
    e.preventDefault()
    setMensaje('')
    setError('')

    if (!formMovimiento.producto_id) {
      setError('Debes seleccionar un producto.')
      return
    }

    if (!formMovimiento.cantidad || Number(formMovimiento.cantidad) <= 0) {
      setError('Debes ingresar una cantidad válida.')
      return
    }

    setCargando(true)

    try {
      const productoSeleccionado = productos.find(
        (p) => String(p.id) === String(formMovimiento.producto_id)
      )

      if (!productoSeleccionado) {
        setError('Producto no encontrado.')
        setCargando(false)
        return
      }

      const cantidad = Number(formMovimiento.cantidad)
      const stockActual = Number(productoSeleccionado.stock_actual || 0)

      let nuevoStock = stockActual

      if (formMovimiento.tipo === 'Entrada') {
        nuevoStock = stockActual + cantidad
      } else {
        if (cantidad > stockActual) {
          setError('No hay stock suficiente para registrar la salida.')
          setCargando(false)
          return
        }
        nuevoStock = stockActual - cantidad
      }

      const { data: dataMovimiento, error: errorMovimiento } = await supabase
        .from('inventario_movimientos')
        .insert([
          {
            producto_id: Number(formMovimiento.producto_id),
            tipo: formMovimiento.tipo,
            cantidad,
            descripcion: formMovimiento.descripcion.trim(),
          },
        ])
        .select()

      console.log('Movimiento guardado:', dataMovimiento)

      if (errorMovimiento) throw errorMovimiento

      const { error: errorProducto } = await supabase
        .from('inventario_productos')
        .update({ stock_actual: nuevoStock })
        .eq('id', formMovimiento.producto_id)

      if (errorProducto) throw errorProducto

      setMensaje('Movimiento registrado correctamente.')
      setFormMovimiento({
        producto_id: '',
        tipo: 'Entrada',
        cantidad: '',
        descripcion: '',
      })

      await cargarDatos()
    } catch (err) {
      console.error('Error real al registrar movimiento:', err)
      setError(`Error al registrar movimiento: ${err.message || JSON.stringify(err)}`)
    } finally {
      setCargando(false)
    }
  }

  const productosConAlerta = useMemo(() => {
    return productos.filter((p) => {
      const stockActual = Number(p.stock_actual || 0)
      const stockMinimo = Number(p.stock_minimo || 0)
      return stockActual <= stockMinimo
    })
  }, [productos])

  return (
    <div className="inventario-wrapper">
      <header className="inventario-header">
        <h1>Control de Inventario ISP</h1>
        <p>Gestiona productos, stock, entradas, salidas e historial</p>
      </header>

      {(mensaje || error) && (
        <div className="inventario-alertas">
          {mensaje && <div className="alerta-exito">{mensaje}</div>}
          {error && <div className="alerta-error">{error}</div>}
        </div>
      )}

      <section className="inventario-paneles">
        <form className="inventario-card" onSubmit={guardarProducto}>
          <h2>Registrar producto</h2>

          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={formProducto.nombre}
            onChange={handleProductoChange}
          />

          <input
            type="text"
            name="categoria"
            placeholder="Categoría"
            value={formProducto.categoria}
            onChange={handleProductoChange}
          />

          <input
            type="text"
            name="marca"
            placeholder="Marca"
            value={formProducto.marca}
            onChange={handleProductoChange}
          />

          <input
            type="text"
            name="modelo"
            placeholder="Modelo"
            value={formProducto.modelo}
            onChange={handleProductoChange}
          />

          <input
            type="number"
            name="stock_minimo"
            placeholder="Stock mínimo"
            value={formProducto.stock_minimo}
            onChange={handleProductoChange}
          />

          <input
            type="number"
            name="precio_compra"
            placeholder="Precio compra"
            value={formProducto.precio_compra}
            onChange={handleProductoChange}
          />

          <input
            type="number"
            name="precio_venta"
            placeholder="Precio venta"
            value={formProducto.precio_venta}
            onChange={handleProductoChange}
          />

          <button
            type="submit"
            className="btn-guardar"
            disabled={cargando}
          >
            {cargando ? 'Guardando...' : 'Guardar producto'}
          </button>
        </form>

        <form className="inventario-card" onSubmit={guardarMovimiento}>
          <h2>Registrar movimiento</h2>

          <select
            name="producto_id"
            value={formMovimiento.producto_id}
            onChange={handleMovimientoChange}
          >
            <option value="">Producto</option>
            {productos.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.nombre} {producto.marca ? `- ${producto.marca}` : ''}
              </option>
            ))}
          </select>

          <select
            name="tipo"
            value={formMovimiento.tipo}
            onChange={handleMovimientoChange}
          >
            <option value="Entrada">Entrada</option>
            <option value="Salida">Salida</option>
          </select>

          <input
            type="number"
            name="cantidad"
            placeholder="Cantidad"
            value={formMovimiento.cantidad}
            onChange={handleMovimientoChange}
          />

          <input
            type="text"
            name="descripcion"
            placeholder="Descripción / referencia"
            value={formMovimiento.descripcion}
            onChange={handleMovimientoChange}
          />

          <button
            type="submit"
            className="btn-movimiento"
            disabled={cargando}
          >
            {cargando ? 'Registrando...' : 'Registrar movimiento'}
          </button>
        </form>
      </section>

      <section className="inventario-resumen">
        <div className="inventario-card resumen-card">
          <h2>Resumen</h2>

          <div className="resumen-grid">
            <div className="resumen-item">
              <span>Total productos</span>
              <strong>{productos.length}</strong>
            </div>

            <div className="resumen-item">
              <span>Alertas de stock</span>
              <strong>{productosConAlerta.length}</strong>
            </div>

            <div className="resumen-item">
              <span>Movimientos</span>
              <strong>{movimientos.length}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="inventario-listados">
        <div className="inventario-card">
          <h2>Productos registrados</h2>

          <div className="tabla-responsive">
            <table className="tabla-inventario">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th>Stock actual</th>
                  <th>Stock mínimo</th>
                  <th>Compra</th>
                  <th>Venta</th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan="8">No hay productos registrados.</td>
                  </tr>
                ) : (
                  productos.map((producto) => (
                    <tr key={producto.id}>
                      <td>{producto.nombre}</td>
                      <td>{producto.categoria || '-'}</td>
                      <td>{producto.marca || '-'}</td>
                      <td>{producto.modelo || '-'}</td>
                      <td>{producto.stock_actual ?? 0}</td>
                      <td>{producto.stock_minimo ?? 0}</td>
                      <td>${Number(producto.precio_compra || 0).toLocaleString()}</td>
                      <td>${Number(producto.precio_venta || 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="inventario-card">
          <h2>Historial de movimientos</h2>

          <div className="tabla-responsive">
            <table className="tabla-inventario">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan="4">No hay movimientos registrados.</td>
                  </tr>
                ) : (
                  movimientos.map((mov) => (
                    <tr key={mov.id}>
                      <td>{mov.inventario_productos?.nombre || productos.find(p => p.id === mov.producto_id)?.nombre || 'Producto'}</td>
                      <td>{mov.tipo}</td>
                      <td>{mov.cantidad}</td>
                      <td>{mov.descripcion || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

export default VistaInventario