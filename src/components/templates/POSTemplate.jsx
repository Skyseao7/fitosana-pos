import styled from "styled-components";
import { Device } from "../../styles/breakpoints";
import { blur_in } from "../../styles/keyframes";
// import { v } from "../../styles/variables"; // No se usa
import { PantallaCierreCaja } from "../organismos/POSDesign/CajaDesign/PantallaCierreCaja";
import {
  AreaDetalleventaPos,
  AreaTecladoPos,
  FooterPos,
  HeaderPos,
} from "../../index";
import { PantallaCobro } from "../organismos/POSDesign/PantallaCobro";
import { Toaster } from "sonner";
import { PantallaIngresoSalidaDinero } from "../organismos/POSDesign/CajaDesign/PantallaIngresoSalidaDinero";
import { useCierreCajaStore } from "../../store/CierreCajaStore";
import { MenuFlotante } from "../organismos/POSDesign/MenuFlotante";
import { SelectAlmacenModal } from "../organismos/POSDesign/SelectAlmacenModal";
import { useStockStore } from "../../store/StockStore";
// (tus imports de tanstack...)
import { useBuscarProductosQuery } from "../../tanstack/ProductosStack";
import { useMostrarAlmacenesXSucursalQuery } from "../../tanstack/AlmacenesStack";
//import { useMostrarStockXAlmacenesYProductoQuery } from "../../tanstack/StockStack";
import { useMostrarMetodosPagoQuery } from "../../tanstack/MetodosPagoStack";
import { useMostrarSerializacionesVentasQuery } from "../../tanstack/SerializacionStack";
import { useMostrasrImpresorasPorCajaQuery } from "../../tanstack/ImpresorasStack";

// --- ¡IMPORTACIONES NUEVAS! ---
import { useState, useEffect } from "react"; // <-- ¡Añade useEffect aquí!
import { useCartVentasStoreTemporal } from "../../store/CartVentasStoreTemporal";
import { EditarItemModal } from "../organismos/POSDesign/EditarItemModal";

export function POSTemplate() {
  // --- ¡ESCUCHANDO AL STORE CORRECTO! ---
  const { statePantallaCobro, resetUiStates } = useCartVentasStoreTemporal(); // <-- Obtenemos la nueva función
  
  const { stateIngresoSalida, stateCierreCaja } = useCierreCajaStore();
  const { stateModal } = useStockStore();
  const [itemEditar, setItemEditar] = useState(null);
  
  // --- ¡LLAMADA AL 'RESET' EN LA CARGA! ---
  useEffect(() => {
    resetUiStates(); // Esto asegura que la pantalla de cobro esté cerrada al cargar
  }, []); // El array vacío [] significa "ejecutar solo una vez"

  // (Toda tu lógica de useQuery... se queda igual)
  useBuscarProductosQuery();
  useMostrarAlmacenesXSucursalQuery();
  //useMostrarStockXAlmacenesYProductoQuery();
  useMostrarMetodosPagoQuery();
  useMostrarSerializacionesVentasQuery();
  useMostrasrImpresorasPorCajaQuery();

  return (
  	<Container>
      {/* --- MODALES GLOBALES (Ahora el de Editar vive aquí) --- */}
  	  {stateModal && <SelectAlmacenModal />}
      {stateIngresoSalida && <PantallaIngresoSalidaDinero />}
  	  {stateCierreCaja && <PantallaCierreCaja />}
      {itemEditar && (
        <EditarItemModal 
          item={itemEditar} 
          onClose={() => setItemEditar(null)} 
        />
      )}
  	  {/* --- LÓGICA DE VISTA PRINCIPAL --- */}
  	  {statePantallaCobro ? (
        <PantallaCobro />
      ) : (
        <>
          <HeaderPos />
      	  <Main>
      		<Toaster position="top-center" />
            {/* ¡Le pasamos la función para que nos "avise"! */}
      		<AreaDetalleventaPos onEditItem={setItemEditar} />
      		<AreaTecladoPos />
      	  </Main>
      	  <FooterPos />
      	  <MenuFlotante />
        </>
      )}
  	</Container>
  );
}
const Container = styled.div`
  height: calc(100vh - 60px);
  padding: 10px;
  padding-top: 50px;
  display: grid;
  gap: 10px;
  grid-template:
    "header" 220px
    "main" auto;

  animation: ${blur_in} 0.5s linear both;
  @media ${Device.desktop} {
    grid-template:
      "header header" 140px
      "main main"
      "footer footer" 60px;
  }
`;

const Main = styled.div`
  grid-area: main;
  /* background-color: rgba(228, 20, 20, 0.5); */
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  overflow: hidden;
  gap: 10px;

  @media ${Device.desktop} {
    flex-direction: row;
  }
`;
