import styled from "styled-components";
import { Btn1 } from "../../moleculas/Btn1";
import { TotalPos } from "./TotalPos";
import { Device } from "../../../styles/breakpoints";
import { useCartVentasStoreTemporal } from "../../../store/CartVentasStoreTemporal";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useMetodosPagoStore } from "../../../store/MetodosPagoStore";
import { useValidarPermisosOperativos } from "../../../hooks/useValidarPermisosOperativos";

export function AreaTecladoPos() {
  const { setStatePantallaCobro, stateMetodosPago } = useCartVentasStoreTemporal();
  const { dataempresa } = useEmpresaStore();
  const { dataMetodosPago: datametodospago } = useMetodosPagoStore();
  const { validarPermiso } = useValidarPermisosOperativos();

  const ValidarPermisocobrar = (p) => {
    // --- DEBUG ---
    console.log("1. Clic en botón de pago:", p.nombre);

    const response = validarPermiso("Cobrar venta");
    
    // --- DEBUG ---
    console.log("2. ¿Tiene permiso para 'Cobrar venta'?", response);

    if (!response) {
      // --- DEBUG ---
      console.error("3. ¡Fallo! El usuario no tiene el permiso 'Cobrar venta'.");
      return; // La función se detiene aquí
    }
    
    setStatePantallaCobro({ tipocobro: p.nombre });
  };

  return (
    // ¡LA CORRECCIÓN ESTÁ AQUÍ! ($stateMetodosPago)
  	<Container $stateMetodosPago={stateMetodosPago}>
  	  <section className="areatipopago">
        {datametodospago?.map((item, index) => {
          return (
            <article className="box" key={index}>
              <Btn1
                imagen={item.icono != "-" ? item.icono : null}
                funcion={() => ValidarPermisocobrar( item )}
                titulo={item.nombre}
                border="0"
                height="70px"
                width="100%"
              />
          	</article>
      	  );
  		})}
  	  </section>
  	  <section className="totales">
  		<TotalPos />
  	  </section>
  	</Container>
  );
}
const Container = styled.div`
  border: 1px solid ${({ theme }) => theme.color2};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: absolute;
  bottom: 10px;
  width: calc(100% - 5px);
  border-radius: 15px;
  @media ${Device.desktop} {
    position: relative;
    width: 450px;
    bottom: initial;
  }
.areatipopago {
    /* Corregido para usar transient props ($) */
  	display: ${({ $stateMetodosPago }) => ($stateMetodosPago ? "flex" : "none")};
  	flex-wrap: wrap;
  	gap: 10px;
  	padding: 10px;
  	@media ${Device.desktop} {
  	  display: flex;
  	  flex-wrap: wrap;
  	  gap: 10px;
  	  padding: 10px;
  	}
  	.box {
  	  flex: 1 1 40%;
  	  display: flex;
  	  gap: 10px;
  	}
  }
  .totales {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    .subtotal {
      display: none;
      flex-direction: column;
      justify-content: end;
      text-align: end;
      gap: 10px;
      font-weight: 500;
      @media ${Device.desktop} {
        display: flex;
      }
    }
  }
`;
