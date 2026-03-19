/**
 * src/pages/resident/ResidentVehicles.jsx
 * Solo muestra los vehículos del residente autenticado
 */

import { useState, useEffect } from 'react';
import { Car, RefreshCw } from 'lucide-react';
import { getMyVehicles } from '@/api/resident.api';

const TIPO_CFG = {
  carro:     { icon: '🚗', label: 'Carro' },
  moto:      { icon: '🏍️', label: 'Moto' },
  bicicleta: { icon: '🚲', label: 'Bicicleta' },
  patineta:  { icon: '🛴', label: 'Patineta' },
  otro:      { icon: '🚙', label: 'Otro' },
};

const ResidentVehicles = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading]     = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await getMyVehicles();
      setVehiculos(res.data?.vehicles || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-gray-400 mb-1">HomeAccess › Mis Vehículos</p>
          <h1 className="text-2xl font-bold text-gray-900">Mis Vehículos</h1>
        </div>
        <button onClick={cargar}
          className="p-2 bg-white border border-gray-300 rounded-lg
            text-gray-500 hover:bg-gray-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Cargando...</div>
      ) : vehiculos.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
          <Car size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No tienes vehículos registrados</p>
          <p className="text-gray-300 text-sm mt-1">
            Contacta a la administración para registrar un vehículo
          </p>
        </div>
      ) : (
        <>
          {/* Tabla */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
              {['Placa', 'Tipo / Vehículo', 'Puesto', 'Detalles'].map(h => (
                <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</p>
              ))}
            </div>
            {vehiculos.map((v, idx) => {
              const cfg = TIPO_CFG[v.tipo] || TIPO_CFG.otro;
              return (
                <div key={v._id}
                  className={`grid grid-cols-4 px-5 py-4 items-center hover:bg-gray-50
                    transition-colors ${idx < vehiculos.length - 1 ? 'border-b border-gray-100' : ''}`}>

                  <p className="text-gray-900 font-mono font-semibold text-sm">
                    {v.placa || 'Sin placa'}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cfg.icon}</span>
                    <div>
                      <p className="text-gray-700 text-sm font-medium">{cfg.label}</p>
                      {(v.marca || v.modelo) && (
                        <p className="text-gray-400 text-xs">
                          {[v.marca, v.modelo].filter(Boolean).join(' ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    {v.parqueadero_id ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold
                        px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                        📍 {v.parqueadero_id.numero}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin puesto</span>
                    )}
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm">
                      {[v.color, v.anio].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            Para registrar o modificar vehículos, contacta a la administración
          </p>
        </>
      )}
    </div>
  );
};

export default ResidentVehicles;
