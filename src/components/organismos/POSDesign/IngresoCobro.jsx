import styled from "styled-components";
import { Icon } from "@iconify/react/dist/iconify.js";
import { InputText } from "../formularios/InputText";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Btn1 } from "../../moleculas/Btn1";
import { useUsuariosStore } from "../../../store/UsuariosStore";
import { useEmpresaStore } from "../../../store/EmpresaStore";

// --- ¡EL ÚNICO STORE DE DATOS QUE NECESITAMOS! ---
import { useCartVentasStoreTemporal } from "../../../store/CartVentasStoreTemporal";

// --- STORES DE FUNCIONES (Para guardar en DB) ---
import { useVentasStore } from "../../../store/VentasStore";
import { useDetalleVentasStore } from "../../../store/DetalleVentasStore";
// ---------------------------------------------------

import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PanelBuscador } from "./PanelBuscador";
import { useClientesProveedoresStore } from "../../../store/ClientesProveedoresStore";
import { useMetodosPagoStore } from "../../../store/MetodosPagoStore";
import { useCierreCajaStore } from "../../../store/CierreCajaStore";
import { useMovCajaStore } from "../../../store/MovCajaStore";
import { useFormattedDate } from "../../../hooks/useFormattedDate";
import { useSerializacionStore } from "../../../store/SerializacionStore";
import { useImpresorasStore } from "../../../store/ImpresorasStore";
import ticket from "../../../reports/TicketVenta";
import { RegistrarClientesProveedores } from "../formularios/RegistrarClientesProveedores";
import { useGlobalStore } from "../../../store/GlobalStore";

export const IngresoCobro = forwardRef((props, ref) => {
  const fechaActual = useFormattedDate();
// --- ¡LEYENDO TODO DEL STORE CORRECTO! ---
  const { 
    items: itemsDelCarrito,
    total: totalDelCarrito,
    tipocobro,
    resetState: resetCarrito,
    getItemTotal
  } = useCartVentasStoreTemporal();

  // --- STORES DE FUNCIONES (¡SIN DATOS!) ---
  const { confirmarVenta, insertarVentas } = useVentasStore();
  const { insertarDetalleVentas } = useDetalleVentasStore();
  
  const [stateBuscadorClientes, setStateBuscadorClientes] = useState(false);
  const [precioVenta, setPrecioVenta] = useState(totalDelCarrito); 
  const [valoresPago, setValoresPago] = useState({});
  const [vuelto, setVuelto] = useState(0);
  const [restante, setRestante] = useState(0);

  const { dataMetodosPago } = useMetodosPagoStore();
  const { datausuarios } = useUsuariosStore();
  const { dataempresa } = useEmpresaStore();
  const { dataComprobantes, itemComprobanteSelect, setItemComprobanteSelect } = useSerializacionStore();
  const { dataImpresorasPorCaja } = useImpresorasStore();
  
  //#region Clientes (Esto está bien)
  const {
    buscarCliPro,
    setBuscador,
  	buscador,
  	selectCliPro,
  	cliproItemSelect,
  } = useClientesProveedoresStore();
  const queryClient = useQueryClient();
  const { data: dataBuscadorcliente } = useQuery({
  	  queryKey: ["buscar cliente", [dataempresa?.id, "cliente", buscador]],
  	  queryFn: () =>
  		buscarCliPro({
  		  id_empresa: dataempresa?.id,
  		  tipo: "cliente",
  		  buscador: buscador,
  		}),
  	  enabled: !!dataempresa,
  	  refetchOnWindowFocus: false,
  	});
  //#endregion
  
  const { dataCierreCaja } = useCierreCajaStore();
  const { insertarMovCaja } = useMovCajaStore();
  const calcularVueltoYRestante = () => {
    const totalPagado = Object.values(valoresPago).reduce(
      (acc, curr) => acc + curr,
      0
    );
    const totalSinEfectivo = totalPagado - (valoresPago["Efectivo"] || 0);
    // Si el total sin efectivo excede el precio de venta, no permitir el exceso
    if (totalSinEfectivo > precioVenta) {
      setVuelto(0);
      setRestante(precioVenta - totalSinEfectivo); //Restante negativo para indicar que se excede sin efectivo
    } else {
      // Permitir el exceso solo si es en efectivo
      if (totalPagado >= precioVenta) {
        const exceso = totalPagado - precioVenta;
        setVuelto(valoresPago["Efectivo"] ? exceso : 0);
        setRestante(0);
      } else {
        // Si el total pagado no cubre el precio de venta, calcular el restante
        setVuelto(0);
        setRestante(precioVenta - totalPagado);
      }
    }
  };
  
  const handleChangePago = (tipo, valor) => {
  	setValoresPago((prev) => ({
  	  ...prev,
  	  [tipo]: parseFloat(valor) || 0,
  	}));
  	console.log(valoresPago);
  };
  
  useImperativeHandle(ref, () => ({
  	mutateAsync: mutation.mutateAsync,
  }));
  
  //Funcion para realizar la venta
const mutation = useMutation({
  	mutationKey: ["insertar ventas"],
  	mutationFn: ConfirmarVenta, // La función de abajo
  	onSuccess: () => {
  	  if (restante != 0) {
  		return;
  	  }
  	  resetCarrito(); // ¡Limpia el carrito local y cierra la pantalla de cobro!
  	  toast.success("🎉 venta generada correctamente!!!");
  	},
    onError: (error) => {
      // Manejo de errores
      toast.error(`Error al confirmar venta: ${error.message}`);
    }
  });

  async function ConfirmarVenta() {
    // 0. Validar que hay productos
    if (itemsDelCarrito.length === 0) {
      toast.error("No hay productos en el carrito.");
      return;
    }
    // 1. Validar que el pago está completo
  	if (restante === 0) {
      
      // 2. Crear la VENTA (Cabecera)
  	  const pventasHead = {
  		fecha: fechaActual,
  		id_usuario: datausuarios?.id,
  		id_sucursal: dataCierreCaja?.caja?.id_sucursal,
  		id_empresa: dataempresa?.id,
  		id_cierre_caja: dataCierreCaja?.id,
  		monto_total: totalDelCarrito,
  		id_cliente: cliproItemSelect?.id || null,
        estado: 'pendiente' // Empezamos como pendiente
  	  };
  	  
  	  const nuevaVenta = await insertarVentas(pventasHead);
  	  const newVentaId = nuevaVenta.id;
  	  if (!newVentaId) throw new Error("Error al crear la cabecera de la venta");

      // 3. Preparar e Insertar DETALLES (¡LÓGICA CORREGIDA!)
  	  const detallesParaInsertar = itemsDelCarrito.map(item => {
        const totalFinalItem = getItemTotal(item); 
        const precioUnitarioFinal = (item._cantidad > 0) ? (totalFinalItem / item._cantidad) : 0;
        
        return {
          id_venta: newVentaId,
          cantidad: item._cantidad,
          precio_venta: precioUnitarioFinal,
          total: totalFinalItem, 
          descripcion: item.nombre_modificado ?? item.nombre, 
          id_producto: item.es_fraccionada ? null : item._id_producto, 
          id_almacen: item.es_fraccionada ? null : item._id_almacen, 
          precio_compra: item.es_fraccionada ? 0 : item._precio_compra, 
          id_sucursal: item._id_sucursal, 
        }
  	  });
      // (Tu trigger de stock se disparará aquí)
  	  await insertarDetalleVentas(detallesParaInsertar); 

      // 4. Confirmar la VENTA (RPC)
  	  const pventasConfirm = {
  		_id_venta: newVentaId,
  		_id_usuario: datausuarios?.id,
  		_vuelto: vuelto,
  		_id_tipo_comprobante: itemComprobanteSelect?.id_tipo_comprobante,
  		_serie: itemComprobanteSelect?.serie,
  		_id_sucursal: dataCierreCaja?.caja?.id_sucursal,
  		_id_cliente: cliproItemSelect?.id || null,
  		_fecha: fechaActual,
  		_monto_total: totalDelCarrito,
  	  };
  	  const dataVentaConfirmada = await confirmarVenta(pventasConfirm);

      // 5. Insertar Movimientos de Caja
  	  const nuevosMetodosPago = [];
  	  for (const [tipo, monto] of Object.entries(valoresPago)) {
  		if (monto > 0) {
  		  const metodoPago = dataMetodosPago.find(
  			(item) => item.nombre === tipo
  		  );
  		  const pmovcaja = {
  			tipo_movimiento: "ingreso",
  			monto: monto,
  			id_metodo_pago: metodoPago?.id,
  			descripcion: `Pago de venta con ${tipo}`,
  			id_usuario: datausuarios?.id,
        id_cierre_caja: dataCierreCaja?.id,
  			id_ventas: newVentaId,
  			vuelto: tipo === "Efectivo" ? vuelto : 0,
  			fecha_movimiento: fechaActual,
  		  };
  		  await insertarMovCaja(pmovcaja);
  		  nuevosMetodosPago.push({ tipo, monto, vuelto });
  		}
  	  }
  	  
      // 6. Imprimir Ticket
      console.log("PASO 6: Preparando para imprimir ticket...");
  	  const pPrint = {
  		dataempresa: dataempresa || {},
  		productos: itemsDelCarrito || [], 
  		dataventas: dataVentaConfirmada || {},
        // ¡AQUÍ ESTÁ EL ARREGLO!
  		nombreComprobante: itemComprobanteSelect?.tipo_comprobantes?.nombre || "Ticket", // Valor por defecto
  		nombrecajero: datausuarios?.nombres || "Cajero",
  		dataCliente: cliproItemSelect || { nombres: "Cliente Genérico" }, // Objeto por defecto
  		metodosPago: nuevosMetodosPago || [],
  	  };
      console.log("Datos de Impresora:", dataImpresorasPorCaja);
      console.log("¿Impresión directa activada?", dataImpresorasPorCaja?.state);
      console.log("Datos enviados al ticket (pPrint):", pPrint);
  	  dataImpresorasPorCaja?.state
  		? await imprimirDirectoTicket(pPrint) // Añadido await
  		: await imprimirConVentanaEmergente(pPrint); // Añadido await
  	} else {
  	  toast.warning("Falta completar el pago, el restante tiene que ser 0");
  	}
  }
  const imprimirConVentanaEmergente = async (p) => {
  	console.log("Intentando imprimir con Pop-up (imprimirConVentanaEmergente)...");
    try {
  	  await ticket("print", p);
      console.log("¡Llamada a ticket('print') exitosa!");
    } catch (error) {
      console.error("¡ERROR al generar PDF (ticket 'print')!", error);
      toast.error(`Error al generar PDF: ${error.message}`);
    }
  };
  const imprimirDirectoTicket = async (p) => {
    console.log("Intentando imprimir (imprimirDirectoTicket)...");
  	if (dataImpresorasPorCaja?.name === "-") {
      console.error("Error: Impresora no reconocida.");
  	  return toast.error(
  		"Impresora no reconocida, configura tu impresora desde modulo de configuración"
  	  );
  	}
    
    try {
  	  const response = await ticket("b64", p);
      console.log("PDF generado en base64, enviando a API de impresión...");
  	  const binaryString = atob(response.content);
  	  const binaryLen = binaryString.length;
  	  const bytes = new Uint8Array(binaryLen);
  	  for (let i = 0; i < binaryLen; i++) {
  		bytes[i] = binaryString.charCodeAt(i);
  	  }
  	  const blob = new Blob([bytes], { type: "application/pdf" });
  	  const file = new File([blob], "GeneratedTicket.pdf", {
  		type: "application/pdf",
  	  });
  	  const formData = new FormData();
  	  formData.append("file", file);
  	  formData.append("printerName", dataImpresorasPorCaja?.name);

      const responseApi = await fetch("http://localhost:5075/api/print-ticket", {
  		method: "POST",
  		body: formData,
  	  });

  	  if (responseApi.ok) {
  		toast.success("El PDF se envió a imprimir correctamente.");
      } else {
  		const error = await responseApi.text();
        console.error("Error de la API de impresión:", error);
  		toast.error("Error al imprimir (API): " + error);
  	  }
    } catch (error) {
      console.error("¡ERROR al imprimir (directo)!", error);
      toast.error(`Error al imprimir: ${error.message}`);
    }
  };
  const { setTipo: setTipocliente } = useClientesProveedoresStore();
  const { setStateClose, setAccion, stateClose, accion, setIsExploding } =
    useGlobalStore();
  function registrarNuevoCliente() {
    const tipo = "cliente";
    setTipocliente(tipo);
    setAccion("Nuevo");
    setStateClose(true);
  }
//useEffect para recalcular cuando los valores cambian
  useEffect(() => {
  	if (tipocobro !== "Mixto" && valoresPago[tipocobro] != totalDelCarrito) {
  	  setValoresPago((prev) => ({
  		...prev,
  		[tipocobro]: totalDelCarrito,
  	  }));
  	}
  }, [tipocobro, totalDelCarrito]);

  useEffect(() => {
  	calcularVueltoYRestante();
  }, [precioVenta, tipocobro, valoresPago]);
return (
  	<Container>
  	  {mutation.isPending ? (
  		<span>guardando...🐖</span>
  	  ) : (
  		<>
  		  {mutation.isError && <span>error: {mutation.error.message}</span>}
   		  <section className="area1">
  			<span className="tipocobro">{tipocobro}</span>
  			<section>
  			  <span>
  				{itemComprobanteSelect?.tipo_comprobantes?.nombre}:{" "}
  				<strong>
  				  {itemComprobanteSelect?.serie}-
  				  {itemComprobanteSelect?.correlativo}{" "}
  				</strong>{" "}
  			  </span>
  			</section>

  			<section className="areacomprobantes">
  			  {dataComprobantes?.map((item, index) => {
  				return (
  				  <article className="box" key={index}>
  					<Btn1
  					  titulo={item?.tipo_comprobantes?.nombre}
  					  border="0"
  					  height="70px"
  					  width="100%"
  					  funcion={() => setItemComprobanteSelect(item)}
  					/>
  				  </article>
  				);
  			  })}
  			</section>
  			<span>cliente</span>
  			<EditButton
  			  onClick={() => setStateBuscadorClientes(!stateBuscadorClientes)}
   			>
  			  <Icon className=" icono" icon="lets-icons:edit-fill" />
  			</EditButton>
  			<span className="cliente">{cliproItemSelect?.nombres}</span>
  		  </section>
  		  <Linea />
  		  <section className="area2">
  			{dataMetodosPago?.map((item, index) => {
  			  return (tipocobro === "Mixto" && item.nombre !== "Mixto") ||
  				(tipocobro === item.nombre && item.nombre !== "Mixto") ? (
  				<InputText textalign="center" key={index}>
  				  <input
  					onChange={(e) =>
  					  handleChangePago(item.nombre, e.target.value)
  					}
  					defaultValue={tipocobro === item.nombre ? totalDelCarrito : ""}
  					className="form__field"
  					type="number"
  					disabled={
  					  tipocobro === "Mixto" || tipocobro === "Efectivo"
  						? false
  						: true
  					}
  				  />
  				  <label className="form__label">{item.nombre} </label>
  				</InputText>
  			  ) : null;
  			})}
  		  </section>
  		  <Linea />
  		  <section className="area3">
  			<article className="etiquetas">
  			  <span className="total">Total: </span>
  			  <span>Vuelto: </span>
  			  <span>Restante: </span>
  			</article>
  			<article>
  			  <span className="total">
  				{FormatearNumeroDinero(
  				  totalDelCarrito, // <-- ¡CORRECTO!
  				  dataempresa?.currency,
  				  dataempresa?.iso
  				)}
  			  </span>
  			  <span>
  				{FormatearNumeroDinero(
  				  vuelto,
  				  dataempresa?.currency,
  				  dataempresa?.iso
  				)}
  			  </span>
  			  <span>
  				{FormatearNumeroDinero(
  				  restante,
  				  dataempresa?.currency,
  				  dataempresa?.iso
  				)}
  			  </span>
  			</article>
  		  </section>
  		  <Linea />
  		  <section className="area4">
  			<Btn1
  			  funcion={() => mutation.mutateAsync()}
  			  border="2px"
  			  titulo="COBRAR (enter)"
  			  bgcolor="#0aca21"
  			  color="#ffffff"
  			  width="100%"
  			/>
  		  </section>
  		  {stateBuscadorClientes && (
  			<PanelBuscador
  			  funcion={registrarNuevoCliente}
   			  selector={selectCliPro}
  			  setBuscador={setBuscador}
  			  displayField="nombres"
  			  data={dataBuscadorcliente}
  			  setStateBuscador={() =>
  				setStateBuscadorClientes(!stateBuscadorClientes)
  			  }
  			/>
  		  )}
  		  {stateClose && (
  			<RegistrarClientesProveedores
  			  setIsExploding={setIsExploding}
   			  accion={accion}
  			  onClose={() => setStateClose(false)}
  			/>
  		  )}
  		</>
  	  )}
  	</Container>
  );
});
const Container = styled.div`
  position: relative;
  box-sizing: border-box;
  width: 400px;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 2px 2px 15px 0px #e2e2e2;
  gap: 12px;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  color: #000;
  min-height: 100%;
  align-items: center;
  justify-content: center;
  font-size: 22px;

  input {
    color: #000 !important;
    font-weight: 700;
  }
  &:before,
  &:after {
    content: "";
    position: absolute;
    left: 5px;
    height: 6px;
    width: 380px;
  }
  &:before {
    top: -5px;
    background: radial-gradient(
        circle,
        transparent,
        transparent 50%,
        #fbfbfb 50%,
        #fbfbfb 100%
      ) -7px -8px / 16px 16px repeat-x;
  }
  &:after {
    bottom: -5px;
    background: radial-gradient(
        circle,
        transparent,
        transparent 50%,
        #fbfbfb 50%,
        #fbfbfb 100%
      ) -7px -2px / 16px 16px repeat-x;
  }
  .area1 {
    display: flex;
    flex-direction: column;
    align-items: center;
    .areacomprobantes {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding: 10px;
      .box {
        flex: 1 1 40%;
        display: flex;
        gap: 10px;
      }
    }
    .tipocobro {
      position: absolute;
      right: 6px;
      top: 6px;
      background-color: rgba(233, 6, 184, 0.2);
      padding: 5px;
      color: #e61eb1;
      border-radius: 5px;
      font-size: 15px;
      font-weight: 650;
    }
    .cliente {
      font-weight: 700;
    }
  }
  .area2 {
    input {
      font-size: 40px;
    }
  }
  .area3 {
    display: flex;
    justify-content: space-between;
    width: 100%;

    article {
      display: flex;
      flex-direction: column;
    }
    .total {
      font-weight: 700;
    }
    .etiquetas {
      text-align: end;
    }
  }
`;

const Linea = styled.span`
  width: 100%;
  border-bottom: dashed 1px #d4d4d4;
`;
const EditButton = styled.button`
  background-color: #62c6f7;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: auto;
  .icono {
    font-size: 20px;
  }
`;
