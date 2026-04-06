import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function VistaInventario() {
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [movimientos, setMovimientos] = useState([])

  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)

  const [formProducto, setFormProducto] = useState({
    nombre: '',
    categoria: '',
    marca: '',
    modelo: '',
    stock_minimo: '',
    precio_compra: '',
    precio_venta: ''
  })

  const [formMovimiento, setFormMovimiento] = useState({
    producto_id: '',
    tipo: 'Entrada',
    cantidad: '',
    cliente_id: '',
    descripcion: ''
  })

  useEffect(() => {
    cargarProductos()
    cargarClientes()
    cargarMovimientos()
  }, [])

  const cargarProductos = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error('Error cargando productos:', error)
      return
    }

    setProductos(data || [])
  }

  const cargarClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nombres, apellidos')
      .order('nombres', { ascending: true })

    if (error) {
      console.error('Error cargando clientes:', error)
      return
    }

    setClientes(data || [])
  }

  const cargarMovimientos = async () => {
    const { data, error } = await supabase
      .from('movimientos_inventario')
      .select(`
        *,
        productos ( id, nombre ),
        clientes ( id, nombres, apellidos )
      `)
      .order('id', { ascending: false })

    if (error) {
      console.error('Error cargando movimientos:', error)
      return
    }

    setMovimientos(data || [])
  }

  const guardarProducto = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!formProducto.nombre) {
      setMensaje('El nombre del producto es obligatorio')
      return
    }

    const { error } = await supabase
      .from('productos')
      .insert([
        {
          nombre: formProducto.nombre,
          categoria: formProducto.categoria || null,
          marca: formProducto.marca || null,
          modelo: formProducto.modelo || null,
          stock_minimo: Number(formProducto.stock_minimo || 0),
          precio_compra: Number(formProducto.precio_compra || 0),
          precio_venta: Number(formProducto.precio_venta || 0),
          stock_actual: 0,
          estado: 'Activo'
        }
      ])

    if (error) {
      console.error('Error guardando producto:', error)
      setMensaje('Error al guardar producto')
      return
    }

    setMensaje('Producto guardado correctamente')

    setFormProducto({
      nombre: '',
      categoria: '',
      marca: '',
      modelo: '',
      stock_minimo: '',
      precio_compra: '',
      precio_venta: ''
    })

    await cargarProductos()
  }

  const registrarMovimiento = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!formMovimiento.producto_id || !formMovimiento.tipo || !formMovimiento.cantidad) {
      setMensaje('Debes seleccionar producto, tipo y cantidad')
      return
    }

    const producto = productos.find(
      (p) => p.id === Number(formMovimiento.producto_id)
    )

    if (!producto) {
      setMensaje('No se encontró el producto seleccionado')
      return
    }

    const cantidad = Number(formMovimiento.cantidad)

    if (isNaN(cantidad) || cantidad <= 0) {
      setMensaje('La cantidad debe ser mayor que cero')
      return
    }

    let nuevoStock = Number(producto.stock_actual || 0)

    if (formMovimiento.tipo === 'Entrada') {
      nuevoStock += cantidad
    } else {
      nuevoStock -= cantidad
    }

    if (nuevoStock < 0) {
      setMensaje('No hay stock suficiente para registrar la salida')
      return
    }

    const { error: errorMovimiento } = await supabase
      .from('movimientos_inventario')
      .insert([
        {
          producto_id: Number(formMovimiento.producto_id),
          tipo: formMovimiento.tipo,
          cantidad,
          cliente_id: formMovimiento.cliente_id ? Number(formMovimiento.cliente_id) : null,
          descripcion: formMovimiento.descripcion || null
        }
      ])

    if (errorMovimiento) {
      console.error('Error guardando movimiento:', errorMovimiento)
      setMensaje('Error al registrar movimiento')
      return
    }

    const { error: errorActualizar } = await supabase
      .from('productos')
      .update({ stock_actual: nuevoStock })
      .eq('id', Number(formMovimiento.producto_id))

    if (errorActualizar) {
      console.error('Error actualizando stock:', errorActualizar)
      setMensaje('Movimiento guardado, pero falló la actualización del stock')
      return
    }

    setMensaje(`Movimiento registrado correctamente. Nuevo stock: ${nuevoStock}`)

    setFormMovimiento({
      producto_id: '',
      tipo: 'Entrada',
      cantidad: '',
      cliente_id: '',
      descripcion: ''
    })

    await cargarProductos()
    await cargarMovimientos()
  }

  const productosFiltrados = productos.filter((producto) => {
    const texto = busqueda.toLowerCase()

    return (
      producto.nombre?.toLowerCase().includes(texto) ||
      producto.categoria?.toLowerCase().includes(texto) ||
      producto.marca?.toLowerCase().includes(texto) ||
      producto.modelo?.toLowerCase().includes(texto)
    )
  })

  const movimientosDelProducto = productoSeleccionado
    ? movimientos.filter((mov) => mov.producto_id === productoSeleccionado.id)
    : []

  return (
    <div>
      <h2>Inventario Pro</h2>

      <div
        style={{
          background: 'linear-gradient(135deg, #1d4ed8, #111827)',
          color: '#fff',
          padding: '25px',
          borderRadius: '18px',
          marginTop: '20px',
          marginBottom: '25px',
          boxShadow: '0 6px 18px rgba(0,0,0,0.12)'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '28px' }}>Control de Inventario ISP</h3>
        <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
          Gestiona productos, stock, entradas, salidas e historial
        </p>
      </div>

      {mensaje && (
        <div
          style={{
            backgroundColor: '#ecfccb',
            border: '1px solid #84cc16',
            color: '#365314',
            padding: '12px',
            borderRadius: '10px',
            marginBottom: '15px'
          }}
        >
          {mensaje}
        </div>
      )}

      <div style={gridDoble}>
        <div style={cardEstilo}>
          <h3>Registrar Producto</h3>

          <form onSubmit={guardarProducto} style={gridEstilo}>
            <input
              placeholder="Nombre"
              value={formProducto.nombre}
              onChange={(e) => setFormProducto({ ...formProducto, nombre: e.target.value })}
              style={inputEstilo}
            />
            <input
              placeholder="Categoría"
              value={formProducto.categoria}
              onChange={(e) => setFormProducto({ ...formProducto, categoria: e.target.value })}
              style={inputEstilo}
            />
            <input
              placeholder="Marca"
              value={formProducto.marca}
              onChange={(e) => setFormProducto({ ...formProducto, marca: e.target.value })}
              style={inputEstilo}
            />
            <input
              placeholder="Modelo"
              value={formProducto.modelo}
              onChange={(e) => setFormProducto({ ...formProducto, modelo: e.target.value })}
              style={inputEstilo}
            />
            <input
              placeholder="Stock mínimo"
              value={formProducto.stock_minimo}
              onChange={(e) => setFormProducto({ ...formProducto, stock_minimo: e.target.value })}
              style={inputEstilo}
            />
            <input
              placeholder="Precio compra"
              value={formProducto.precio_compra}
              onChange={(e) => setFormProducto({ ...formProducto, precio_compra: e.target.value })}
              style={inputEstilo}
            />
            <input
              placeholder="Precio venta"
              value={formProducto.precio_venta}
              onChange={(e) => setFormProducto({ ...formProducto, precio_venta: e.target.value })}
              style={inputEstilo}
            />

            <button type="submit" style={botonGuardar}>
              Guardar producto
            </button>
          </form>
        </div>

        <div style={cardEstilo}>
          <h3>Registrar Movimiento</h3>

          <form onSubmit={registrarMovimiento} style={gridEstilo}>
            <select
              value={formMovimiento.producto_id}
              onChange={(e) => setFormMovimiento({ ...formMovimiento, producto_id: e.target.value })}
              style={inputEstilo}
            >
              <option value="">Producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>

            <select
              value={formMovimiento.tipo}
              onChange={(e) => setFormMovimiento({ ...formMovimiento, tipo: e.target.value })}
              style={inputEstilo}
            >
              <option value="Entrada">Entrada</option>
              <option value="Salida">Salida</option>
            </select>

            <input
              placeholder="Cantidad"
              value={formMovimiento.cantidad}
              onChange={(e) => setFormMovimiento({ ...formMovimiento, cantidad: e.target.value })}
              style={inputEstilo}
            />

            <select
              value={formMovimiento.cliente_id}
              onChange={(e) => setFormMovimiento({ ...formMovimiento, cliente_id: e.target.value })}
              style={inputEstilo}
            >
              <option value="">Cliente (opcional)</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombres} {c.apellidos || ''}
                </option>
              ))}
            </select>

            <input
              placeholder="Descripción"
              value={formMovimiento.descripcion}
              onChange={(e) => setFormMovimiento({ ...formMovimiento, descripcion: e.target.value })}
              style={inputEstilo}
            />

            <button type="submit" style={botonAzul}>
              Registrar movimiento
            </button>
          </form>
        </div>
      </div>

      <div style={cardEstilo}>
        <h3>Productos</h3>

        <input
          type="text"
          placeholder="Buscar por nombre, categoría, marca o modelo"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ ...inputEstilo, marginBottom: '15px' }}
        />

        {productosFiltrados.length === 0 ? (
          <p>No hay productos registrados todavía.</p>
        ) : (
          <div style={gridProductos}>
            {productosFiltrados.map((producto) => {
              const estadoStock = obtenerEstadoStock(producto.stock_actual, producto.stock_minimo)

              return (
                <div
                  key={producto.id}
                  style={{
                    backgroundColor: '#fff',
                    border: `2px solid ${estadoStock.colorBorde}`,
                    borderRadius: '16px',
                    padding: '18px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setProductoSeleccionado(producto)}
                >
                  <div style={{ fontSize: '26px', marginBottom: '10px' }}>
                    {estadoStock.icono}
                  </div>

                  <h4 style={{ margin: '0 0 8px 0' }}>{producto.nombre}</h4>

                  <p style={{ margin: '5px 0' }}>
                    <strong>Categoría:</strong> {producto.categoria || 'N/A'}
                  </p>

                  <p style={{ margin: '5px 0' }}>
                    <strong>Marca:</strong> {producto.marca || 'N/A'}
                  </p>

                  <p style={{ margin: '5px 0' }}>
                    <strong>Modelo:</strong> {producto.modelo || 'N/A'}
                  </p>

                  <p
                    style={{
                      margin: '10px 0 0 0',
                      fontSize: '22px',
                      fontWeight: 'bold',
                      color: estadoStock.colorTexto
                    }}
                  >
                    Stock: {producto.stock_actual || 0}
                  </p>

                  <p style={{ margin: '5px 0', color: '#6b7280' }}>
                    Mínimo: {producto.stock_minimo || 0}
                  </p>

                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '10px',
                      padding: '6px 10px',
                      borderRadius: '20px',
                      backgroundColor: estadoStock.colorFondo,
                      color: estadoStock.colorTexto,
                      fontWeight: 'bold',
                      fontSize: '13px'
                    }}
                  >
                    {estadoStock.texto}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {productoSeleccionado && (
        <div style={cardEstilo}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div>
              <h3 style={{ marginBottom: '8px' }}>Detalle del producto</h3>
              <p style={{ margin: 0 }}>
                <strong>{productoSeleccionado.nombre}</strong> — {productoSeleccionado.categoria || 'Sin categoría'}
              </p>
            </div>

            <button
              onClick={() => setProductoSeleccionado(null)}
              style={botonGris}
            >
              Cerrar detalle
            </button>
          </div>

          <div style={{ marginTop: '20px' }}>
            <p><strong>Marca:</strong> {productoSeleccionado.marca || 'N/A'}</p>
            <p><strong>Modelo:</strong> {productoSeleccionado.modelo || 'N/A'}</p>
            <p><strong>Precio compra:</strong> ${Number(productoSeleccionado.precio_compra || 0).toLocaleString()}</p>
            <p><strong>Precio venta:</strong> ${Number(productoSeleccionado.precio_venta || 0).toLocaleString()}</p>
            <p><strong>Stock actual:</strong> {productoSeleccionado.stock_actual || 0}</p>
            <p><strong>Stock mínimo:</strong> {productoSeleccionado.stock_minimo || 0}</p>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4>Historial de movimientos</h4>

            {movimientosDelProducto.length === 0 ? (
              <p>Este producto no tiene movimientos todavía.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thEstilo}>ID</th>
                      <th style={thEstilo}>Tipo</th>
                      <th style={thEstilo}>Cantidad</th>
                      <th style={thEstilo}>Cliente</th>
                      <th style={thEstilo}>Descripción</th>
                      <th style={thEstilo}>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientosDelProducto.map((mov) => (
                      <tr key={mov.id}>
                        <td style={tdEstilo}>{mov.id}</td>
                        <td style={tdEstilo}>
                          <span
                            style={{
                              padding: '5px 10px',
                              borderRadius: '20px',
                              backgroundColor: mov.tipo === 'Entrada' ? '#dcfce7' : '#fee2e2',
                              color: mov.tipo === 'Entrada' ? '#166534' : '#991b1b',
                              fontWeight: 'bold',
                              fontSize: '13px'
                            }}
                          >
                            {mov.tipo}
                          </span>
                        </td>
                        <td style={tdEstilo}>{mov.cantidad}</td>
                        <td style={tdEstilo}>
                          {mov.clientes?.nombres || ''} {mov.clientes?.apellidos || ''}
                        </td>
                        <td style={tdEstilo}>{mov.descripcion || ''}</td>
                        <td style={tdEstilo}>
                          {mov.created_at ? new Date(mov.created_at).toLocaleString() : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function obtenerEstadoStock(stockActual, stockMinimo) {
  const actual = Number(stockActual || 0)
  const minimo = Number(stockMinimo || 0)

  if (actual <= 0) {
    return {
      texto: 'Agotado',
      icono: '🔴',
      colorTexto: '#991b1b',
      colorFondo: '#fee2e2',
      colorBorde: '#f87171'
    }
  }

  if (actual <= minimo) {
    return {
      texto: 'Stock bajo',
      icono: '🟡',
      colorTexto: '#92400e',
      colorFondo: '#fef3c7',
      colorBorde: '#fbbf24'
    }
  }

  return {
    texto: 'Stock OK',
    icono: '🟢',
    colorTexto: '#166534',
    colorFondo: '#dcfce7',
    colorBorde: '#4ade80'
  }
}

const cardEstilo = {
  backgroundColor: '#fff',
  padding: '25px',
  borderRadius: '14px',
  marginTop: '20px',
  marginBottom: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
}

const gridDoble = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '20px'
}

const gridEstilo = {
  display: 'grid',
  gap: '12px'
}

const gridProductos = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '18px'
}

const inputEstilo = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  boxSizing: 'border-box'
}

const thEstilo = {
  textAlign: 'left',
  padding: '10px',
  backgroundColor: '#f3f4f6',
  borderBottom: '1px solid #ddd'
}

const tdEstilo = {
  padding: '10px',
  borderBottom: '1px solid #eee'
}

const botonGuardar = {
  padding: '12px 20px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#16a34a',
  color: '#fff',
  cursor: 'pointer'
}

const botonAzul = {
  padding: '12px 20px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#2563eb',
  color: '#fff',
  cursor: 'pointer'
}

const botonGris = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#6b7280',
  color: '#fff',
  cursor: 'pointer'
}

export default VistaInventario