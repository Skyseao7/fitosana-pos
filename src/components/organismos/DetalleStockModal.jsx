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

// Asumo que creaste este hook para la función 'mostrar_stock_desglosado'
import { useMostrarStockDesglosadoQuery } from '../../tanstack/StockStack'; 

export function DetalleStockModal({ producto, onClose }) {
  // Estado para los modales de ACCIÓN (Ingreso, Salida, Transfer)
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState('ingreso');
  const [modalTransferAbierto, setModalTransferAbierto] = useState(false);

  // 1. Query para el desglose de stock de ESTE producto
  const { data: desgloseStock, isLoading } = useMostrarStockDesglosadoQuery(producto.id_producto);

  // Funciones para abrir los modales de ACCIÓN
  const abrirModalRegistro = (tipo) => {
    setTipoMovimiento(tipo);
    setModalRegistroAbierto(true);
  };

  return (
    <>
      <Container>
        <div className="sub-contenedor">
          <div className="headers">
            <section>
              <h1>{producto.nombre_producto}</h1>
              <p>Stock Total: {producto.stock_total}</p>
            </section>
            <section>
              <BtnClose funcion={onClose} />
            </section>
          </div>

          {/* 2. Botones de Acción */}
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

          {/* 3. Tabla de Desglose */}
          <TablaDesglose>
            <thead>
              <tr>
                <th>Sucursal</th>
                <th>Almacén</th>
                <th>Stock</th>
                <th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan="4">Cargando...</td></tr>}
              {desgloseStock?.map((item) => (
                <tr key={item.id_stock}>
                  <td>{item.nombre_sucursal}</td>
                  <td>{item.nombre_almacen}</td>
                  <td><strong>{item.stock_actual}</strong></td>
                  <td>{item.ubicacion || "-"}</td>
                </tr>
              ))}
            </tbody>
          </TablaDesglose>
        </div>
      </Container>

      {/* 4. Renderiza los modales de acción SI se activan */}
      {modalRegistroAbierto && (
        <RegistrarInventario 
          tipo={tipoMovimiento} 
          onClose={() => setModalRegistroAbierto(false)} 
        />
      )}
      {modalTransferAbierto && (
        <TransferenciaStockModal 
          onClose={() => setModalTransferAbierto(false)} 
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
    width: 700px; /* Más ancho para la tabla */
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