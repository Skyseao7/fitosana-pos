// En: SelectAlmacenModal.jsx
// ¡VERSIÓN 100% LIMPIA!

import { useState } from "react";
import styled from "styled-components";

// --- STORES QUE SÍ NECESITAMOS ---
import { useProductosStore } from "../../../store/ProductosStore";
import { useCartVentasStoreTemporal } from "../../../store/CartVentasStoreTemporal"; // El store correcto
import { useAsignacionCajaSucursalStore } from "../../../store/AsignacionCajaSucursalStore";
import { useAlmacenesStore } from "../../../store/AlmacenesStore";
import { useStockStore } from "../../../store/StockStore";

// --- STORES Y LÓGICA DE BASE DE DATOS (¡ELIMINADOS!) ---
// import { useVentasStore } from "../../../store/VentasStore";
// import { useDetalleVentasStore } from "../../../store/DetalleVentasStore";
// import { useClientesProveedoresStore } from "../../../store/ClientesProveedoresStore";
// import { useCierreCajaStore } from "../../../store/CierreCajaStore";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { toast } from "sonner";
// import { useFormattedDate } from "../../../hooks/useFormattedDate";
// import { useUsuariosStore } from "../../../store/UsuariosStore";

// --- COMPONENTES DE UI ---
import { slideBackground } from "../../../styles/keyframes";
import { Btn1 } from "../../moleculas/Btn1";
import { BtnClose } from "../../ui/buttons/BtnClose";
import { Icon } from "@iconify/react/dist/iconify.js";
import { InputText2 } from "../formularios/InputText2";

export const SelectAlmacenModal = () => {
  const [cantidadInput, setCantidadInput] = useState(1);

  // --- STORES DE UI Y DATOS ---
  const { productosItemSelect } = useProductosStore();
  const { sucursalesItemSelectAsignadas } = useAsignacionCajaSucursalStore();
  const { setAlmacenSelectItem } = useAlmacenesStore();
  const { setStateModal, dataStockXAlmacenesYProducto: data } = useStockStore();

  // --- STORE DEL CARRITO ---
  const { addItem } = useCartVentasStoreTemporal();

  // --- ¡TODA LA LÓGICA ANTIGUA FUE ELIMINADA! ---
  // - No más 'fechaactual'
  // - No más 'dataempresa', 'datausuarios', 'dataCierreCaja'
  // - No más 'insertarVentas', 'insertarDetalleVentas'
  // - No más 'Controladorinsertarventas'
  // - No más 'useMutation' (¡La causa de tu pantalla en blanco!)

  async function agregarAlCarrito(almacenSeleccionado) {
    // 1. Guardar almacén (para UI)
    setAlmacenSelectItem(almacenSeleccionado);

    // 2. Construir el producto para el carrito
    // ¡OBJETO ACTUALIZADO!
    const productoParaCarrito = {
      _id_producto: productosItemSelect.id,
      nombre: productosItemSelect.nombre,
      _precio_venta: productosItemSelect.precio_venta,
      _precio_compra: productosItemSelect.precio_compra,
      _cantidad: parseFloat(cantidadInput) || 1,
      _id_almacen: almacenSeleccionado?.id_almacen,
      nombre_almacen: almacenSeleccionado?.almacen.nombre,
      _id_sucursal: sucursalesItemSelectAsignadas.id_sucursal,
      // (Campos nuevos por defecto)
      id: Date.now(),
      precio_modificado: null,
      nombre_modificado: null,
      descuento: 0,
      descuento_es_porcentaje: false,
      detalle: "",
      _total: (parseFloat(cantidadInput) || 1) * productosItemSelect.precio_venta,
      _stock_maximo: almacenSeleccionado.stock,
    };
    
    // 3. Añadir al carrito local
    addItem(productoParaCarrito);

    // 4. Cerrar el modal
    setStateModal(false);
  }

  const ValidarCantidad = (e) => {
    // No permitir cantidades menores a 1
    const value = Math.max(1, parseFloat(e.target.value) || 1);
    setCantidadInput(value);
  };

  return (
    <Container>
      <SubContainer>
        <BtnClose funcion={() => setStateModal(false)} />
        <HeaderContainer>
          <SubContainerHeader>
            <ContainerLabel>
              <span>producto:</span>
            </ContainerLabel>
            <ContainerProducto>{productosItemSelect?.nombre}</ContainerProducto>
            <CommandText>
              <Icon icon="fluent-emoji:cat-face" width="32" height="32" />
            </CommandText>
          </SubContainerHeader>
        </HeaderContainer>
        <ContentMensaje>
          <SubTitle>
            Se encontro <strong>stock</strong> en estos otros almacenes,
            seleccione un almacen a usar.
          </SubTitle>
        </ContentMensaje>
        <div className="contentCantidad">
          <InputText2>
            <input
              type="number"
              min="1"
              value={cantidadInput}
              onChange={ValidarCantidad}
              placeholder="cantidad..."
              className="form__field"
            />
          </InputText2>
        </div>
        <Avatar $bg="#d7360e">
          <ContainerTable>
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>
                    Almacen <span style={{ cursor: "pointer" }}>🔶</span>
                  </th>
                  <th>
                    Stock <span style={{ cursor: "pointer" }}>🔷</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.map((item, index) => {
                  return (
                    <tr
                      key={index}
                      // Esto llama a la función CORRECTA
                      onClick={() => agregarAlCarrito(item)}
                    >
                      <td>{item?.almacen.nombre} </td>
                      <td>{item?.stock} </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ContainerTable>
          <Btn1
            bgcolor={"#d7360e"}
            color={"#fff"}
            titulo={"Volver"}
            funcion={() => setStateModal(false)}
            // Ya no hay 'isPending', quitamos el 'disabled'
          />
        </Avatar>
      </SubContainer>
    </Container>
  );
};

// ... (Pega aquí TODOS tus styled-components sin ningún cambio) ...
// (ContainerTable, SubTitle, Container, Avatar, etc.)

const ContainerTable = styled.div`
  position: relative;

  .responsive-table {
    width: 100%;
    margin-bottom: 1.5em;
    border-spacing: 0;
    font-size: 0.9em; /* Tamaño de fuente predeterminado */

    thead {
      position: relative;
      padding: 0;
      border: 0;
      height: auto;
      width: auto;
      overflow: auto;

      th {
        border-bottom: 1px solid ${({ theme }) => theme.color2};
        font-weight: 700;
        text-align: center;
        color: ${({ theme }) => theme.text};
        &:first-of-type {
          text-align: center;
        }
      }
    }

    tbody {
      tr {
        display: table-row; /* Siempre se mantendrá como fila */
        margin-bottom: 0;
        cursor: pointer;

        &:nth-of-type(even) {
          background-color: rgba(161, 161, 161, 0.1);
        }

        td {
          text-align: center;
          padding: 0.5em;
          border-bottom: 1px solid rgba(161, 161, 161, 0.32);

          @media (max-width: 768px) {
            padding: 0.4em;
          }
        }
      }
    }
  }
`;
const SubTitle = styled.span`
  font-size: 18px;
`;
const CommandText = styled.p`
  font-size: 14px;
  margin: 0;
`;

const ContainerProducto = styled.div`
  display: flex;
  gap: 10px;
  flex-direction: column;
  text-align: start;
`;
const SubContainer = styled.div`
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.bgtotal};
  position: relative;
`;
const ContainerLabel = styled.div`
  display: flex;
  gap: 10px;
  flex-direction: column;
  text-align: end;
  font-weight: bold;
`;
const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  position: relative;
  border-bottom: solid 1px ${({ theme }) => theme.bg};
M margin-bottom: 20px;
`;

const SubContainerHeader = styled.div`
  display: flex;
  gap: 12px;
  font-size: 22px;
`;
const ContentMensaje = styled.section`
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
`;
const Container = styled.div`
  background-color: rgba(18, 18, 18, 0.5);
  border-radius: 10px;
  margin: auto;
  height: 100vh;
  display: flex;
  align-items: center;
  position: fixed;
  z-index: 100;
  width: 100%;
  justify-content: center;
`;

const Title = styled.span`
  font-size: 44px;
  margin-bottom: 20px;
  font-weight: bold;
  position: absolute;
  top: 50px;
  right: 0;
  left: 0;
  text-align: center;
`;

const Avatar = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
  border-radius: 10px;
  height: 200px;
  flex-direction: column;
  justify-content: center;
  gap: 10px;

  .nombre {
    font-size: 30px;
    font-weight: bold;
    cursor: pointer;
  }
  .anuncio {
    text-align: center;
    font-weight: bold;
S color: #fff;
  }
  background-color: ${(props) => props.$bg};
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 120 120'%3E%3Cpolygon fill='%23000' fill-opacity='0.19' points='120 0 120 60 90 30 60 0 0 0 0 0 60 60 0 120 60 120 90 90 120 60 120 0'/%3E%3C/svg%3E");

s background-size: 60px 60px;
  animation: ${slideBackground} 10s linear infinite;
`;