import React, { useState } from 'react';
import styled from 'styled-components';
import { v } from '../../styles/variables';
import { BtnClose } from '../ui/buttons/BtnClose';
import { Btn1 } from '../../index';
import { Icon } from '@iconify/react';
import { 
  RegistrarInventario, 
  TransferenciaStockModal 
} from "../../index"; // Importa los modales de acción

import { useMostrarStockDesglosadoQuery } from '../../tanstack/StockStack'; 
import { useQueryClient } from '@tanstack/react-query';

// --- CAMBIO: Props 'onIngresoClick', etc. eliminadas 
// ya que el componente maneja su propio estado ---
export function DetalleStockModal({ 
  producto, 
  onClose
}) {
  // Estado para los modales de ACCIÓN (Ingreso, Salida, Transfer)
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState('ingreso');
  const [modalTransferAbierto, setModalTransferAbierto] = useState(false);

  // Inicializa el queryClient
  const queryClient = useQueryClient();

  // 1. Query para el desglose (Añadimos 'refetch' para uso local)
  const { data: desgloseStock, isLoading, refetch: refetchDesglose } = 
    useMostrarStockDesglosadoQuery(producto.id_producto);

  const abrirModalRegistro = (tipo) => {
    setTipoMovimiento(tipo);
    setModalRegistroAbierto(true);
  };

  // Esta función se la pasaremos a los modales hijos.
  // Se ejecutará cuando la mutación (ingreso/salida/transfer) sea exitosa.
  const handleSuccess = () => {
    // 1. Cierra los modales de acción
    setModalRegistroAbierto(false);
    setModalTransferAbierto(false);
    
    // 2. Refresca la query del desglose (de ESTE modal)
    refetchDesglose(); 
    
    // 3. Invalida la query del inventario total (de la página principal)
    queryClient.invalidateQueries(['mostrar_inventario_total']); 
  };

  // --- CAMBIO: 'handleIngresoClick' eliminado por redundancia ---

  return (
    <>
      <Container>
        <div className="sub-contenedor">
          <div className="headers">
            <section>
              <h3>{producto.nombre_producto}</h3>
              <p className="marca">
                Marca: <strong>{producto.marca || 'Sin Marca'}</strong>
              </p>
              <p>Stock Total: <strong>{producto.stock_total}</strong></p>
            </section>
            <section>
              <BtnClose funcion={onClose} />
            </section>
          </div>

          {/* 2. Botones de Acción (Tu lógica original está perfecta) */}
          <ContenedorBotones>
            <Btn1 
              titulo="Ingreso" 
              icono={<v.iconoagregar />} 
              bgcolor="#198754" 
              color="#fff"
              funcion={() => abrirModalRegistro("ingreso")}
            />
            <Btn1 
              titulo="Salida" 
              icono={<Icon icon="fa6-solid:minus" />} 
              bgcolor="#dc3545" 
              color="#fff"
              funcion={() => abrirModalRegistro("salida")}
            />
            <Btn1 
              titulo="Transferencia" 
              icono={<Icon icon="fa6-solid:right-left" />} 
              bgcolor="#0d6efd" 
              color="#fff"
              funcion={() => setModalTransferAbierto(true)}
            />
          </ContenedorBotones>

          {/* 3. Tabla de Desglose (Con "Ubicación" eliminada) */}
          <TablaDesglose>
            <thead>
              <tr>
                <th>Sucursal</th>
                <th>Almacén</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {/* --- CAMBIO: colSpan actualizado a 3 --- */}
              {isLoading && <tr><td colSpan="3">Cargando...</td></tr>}
              
              {desgloseStock?.map((item) => (
                <tr key={item.id_stock}>
                  <td>{item.nombre_sucursal}</td>
                  <td>{item.nombre_almacen}</td>
                  <td><strong>{item.stock_actual}</strong></td>
                </tr>
              ))}
            </tbody>
          </TablaDesglose>
        </div>
      </Container>

      {/* 4. Modales (Esta lógica ya estaba correcta) */}
      {modalRegistroAbierto && (
        <RegistrarInventario 
          tipo={tipoMovimiento} 
          onClose={() => setModalRegistroAbierto(false)} 
          producto={producto} // Pasa la info del producto
          stockDesglosado={desgloseStock} // Pasa el desglose (para los <select>)
          onSuccess={handleSuccess} // Pasa la función de refresco
        />
      )}
      {modalTransferAbierto && (
        <TransferenciaStockModal 
          onClose={() => setModalTransferAbierto(false)} 
          producto={producto} // Pasa la info del producto
          stockDesglosado={desgloseStock} // Pasa el desglose (vital para transferir)
          onSuccess={handleSuccess} // Pasa la función de refresco
        />
      )}
    </>
  );
}

// ... (Estilos para el modal, similares a RegistrarInventario)
const Container = styled.div`
  /* (Pega los estilos del 'Container' de RegistrarInventario.jsx aquí) */
  transition: 0.5s;
  top: 0;
  left: 0;
  position: fixed;
  display: flex;
  width: 100%;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  .sub-contenedor {
    position: relative;
    width: 600px; /* Más ancho para la tabla */
    max-width: 90%;
    border-radius: 20px;
    background: ${({ theme }) => theme.body};
    box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
    padding: 20px 36px;
    z-index: 100;
    max-height: 90vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
    
    .headers {
      display: flex;
      justify-content: space-between;
      align-items: center;
      h1 { font-size: 24px; font-weight: 700; }
      p { font-size: 16px; opacity: 0.8; }
    }
  }
`;

const ContenedorBotones = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 15px;
`;

const TablaDesglose = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  
  th, td {
    border: 1px solid ${({ theme }) => theme.bg3};
    padding: 12px;
    text-align: left;
  }
  
  th {
    background-color: ${({ theme }) => theme.bg2};
    font-size: 14px;
  }
  
  td {
    font-size: 14px;
  }
  
  tbody tr:nth-of-type(even) {
    background-color: ${({ theme }) => theme.bg};
  }
`;