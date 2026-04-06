import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

function SelectorUbicacion({ posicion, setPosicion }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      setPosicion([lat, lng])
    },
  })

  return posicion ? (
    <Marker position={posicion}>
      <Popup>Ubicación seleccionada</Popup>
    </Marker>
  ) : null
}

function MapaSelector({ posicion, setPosicion }) {
  const centroInicial = posicion || [1.4376, -76.1460]

  return (
    <MapContainer
      center={centroInicial}
      zoom={13}
      style={{ height: '400px', width: '100%', borderRadius: '10px' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />

      <SelectorUbicacion posicion={posicion} setPosicion={setPosicion} />
    </MapContainer>
  )
}

export default MapaSelector