import styled from "styled-components";
import {
  //Btn1, // Ya no se usa aquí
  InputText2,
  ListaDesplegable,
  Reloj,
  useProductosStore,
  // --- STORES DE DB ELIMINADOS ---
  // useVentasStore,
  // useUsuariosStore,
  // useEmpresaStore,
  useAlmacenesStore,
  // useDetalleVentasStore,
} from "../../../index";
import { v } from "../../../styles/variables";
import { Device } from "../../../styles/breakpoints";
import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";

// --- LÓGICA DE DB ELIMINADA ---
// import { useFormattedDate } from "../../../hooks/useFormattedDate";
// import { useCierreCajaStore } from "../../../store/CierreCajaStore";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// import { SelectList } from "../../ui/lists/SelectList";
import { useStockStore } from "../../../store/StockStore";
import { useEliminarVentasIncompletasMutate } from "../../../tanstack/VentasStack";

// --- ¡EL STORE CORRECTO! ---
import { useCartVentasStoreTemporal } from "../../../store/CartVentasStoreTemporal";
import { useUsuariosStore } from "../../../store/UsuariosStore";
import { useCierreCajaStore } from "../../../store/CierreCajaStore";


export function HeaderPos() {
  const [cantidadInput, setCantidadInput] = useState(1);
  const [stateListaproductos, setStateListaproductos] = useState(false);
  
  // --- Stores que SÍ necesitamos ---
  const { setBuscador, dataProductos, selectProductos, buscador } = useProductosStore();
  const { datausuarios } = useUsuariosStore(); // Para el UI
  const { dataCierreCaja } = useCierreCajaStore(); // Para el UI y la sucursal
  
  // Carrito local y stock
  const { addItem } = useCartVentasStoreTemporal();
  const { dataStockXAlmacenesYProducto, setStateModal, mostrarStockXAlmacenesYProducto } = useStockStore(); // Asumimos que 'buscarStock' existe en tu store
  const { setAlmacenSelectItem } = useAlmacenesStore();

  const buscadorRef = useRef(null);

  // --- ¡TODA LA LÓGICA DE DB ANTIGUA (insertarventas, insertarDVentas, useMutation) HA SIDO ELIMINADA! ---
  
  // Nueva función controladora
  async function handleProductoSeleccionado(producto) {
    // 1. Limpiamos y seleccionamos el producto en la UI
    selectProductos(producto); 
    setBuscador("");
    buscadorRef.current.focus();

    // 3. Obtenemos el resultado del store (que se actualizó con buscarStock)
    const stockData = await mostrarStockXAlmacenesYProducto({ id_producto: producto.id });
    const cantidad = parseFloat(cantidadInput) || 1;

    // 4. Decidimos qué hacer
    if (!stockData || stockData.length === 0) {
      toast.error(`No hay stock disponible para ${producto.nombre}.`);
      setCantidadInput(1);
      return;
    }

    if (stockData.length === 1) {
      // --- CAMINO 2 (CORREGIDO) ---
      // Solo hay un almacén, lo añadimos al carrito directamente
      const almacenUnico = stockData[0];
      
      // Validar si hay stock suficiente
      if (almacenUnico.stock < cantidad) {
         toast.error(`Stock insuficiente. Solo quedan ${almacenUnico.stock} unidades.`);
         return;
      }

      // ¡OBJETO ACTUALIZADO!
      const productoParaCarrito = {
        _id_producto: producto.id,
        nombre: producto.nombre,
        _precio_venta: producto.precio_venta,
        p_compra: parseFloat(String(producto.p_compra).replace("s/.", "").replace("S/.", "")) || 0,
        _precio_compra: producto.precio_compra,
        _cantidad: cantidad,
        _id_almacen: almacenUnico.id_almacen,
        nombre_almacen: almacenUnico.almacen.nombre,
        _id_sucursal: dataCierreCaja?.caja?.id_sucursal,
        // (Campos nuevos por defecto)
        id: Date.now(),
        precio_modificado: null,
        nombre_modificado: null,
        descuento: 0,
        descuento_es_porcentaje: false,
        detalle: "",
        _total: cantidad * producto.precio_venta, // Este es el subtotal base
        _stock_maximo: almacenUnico.stock,
      };

      addItem(productoParaCarrito); // ¡Añadido al carrito local!
      toast.success(`${producto.nombre} añadido al carrito.`);
      setCantidadInput(1);

    } else {
      // --- CAMINO 1 (El modal) ---
      // Hay múltiples almacenes, abrimos el modal
      setAlmacenSelectItem(null); // Limpiamos selección previa
      setStateModal(true); // Abre SelectAlmacenModal.jsx (que ya está arreglado)
    }
  }

  //validar cantidad
  const ValidarCantidad = (e) => {
    const value = Math.max(1, parseFloat(e.target.value) || 1); // No permitir menos de 1
    setCantidadInput(value);
  };
  
  const {mutate} = useEliminarVentasIncompletasMutate();
  
  useEffect(() => {
    buscadorRef.current.focus();
    mutate() // Esto limpia ventas 'pendientes' al cargar, está bien.
  }, []);

  function buscar(e) {
    setBuscador(e.target.value);
    let texto = e.target.value;
    if (texto.trim() === "") {
      setStateListaproductos(false);
    }
  }
  
  // useEffect para el lector de código de barras
  useEffect(() => {
    let timeout;
    const texto = buscador.trim();
    // Expresión regular más simple para códigos de barras
    const isCodigoDeBarras = /^[0-9]{3,}$/.test(texto); 

    if (isCodigoDeBarras) {
      setStateListaproductos(false);
      timeout = setTimeout(() => {
        const productoEncontrado = dataProductos?.find(
          (p) => p.codigo_barras === texto
        );
        if (productoEncontrado) {
          // ¡LLAMAMOS A LA NUEVA FUNCIÓN!
          handleProductoSeleccionado(productoEncontrado);
        } else {
          toast.error("Producto no encontrado");
          setBuscador("");
        }
      }, 100); // 100ms de debounce
    } else {
      // Lógica para búsqueda manual
      if (texto.length > 1) {
        setStateListaproductos(true);
      } else {
        setStateListaproductos(false);
      }
    }
    
    // Limpiar el timeout
    return () => clearTimeout(timeout);
    
  }, [buscador, dataProductos]); // Depender de dataProductos también

  return (
    <Header>
      <ContentSucursal>
        <div>
          <strong>SUCURSAL:&nbsp; </strong>{" "}
          {dataCierreCaja.caja?.sucursales?.nombre}
        </div>
        |
        <div>
          <strong>CAJA:&nbsp; </strong> {dataCierreCaja.caja?.descripcion}
        </div>
      </ContentSucursal>
      
      <section className="contentprincipal">
        <Contentuser className="area1">
          <div className="textos">
            <span className="usuario">{datausuarios?.nombres} </span>
            <span>🧊{datausuarios?.roles?.nombre} </span>
          </div>
        </Contentuser>
        <article className="contentfecha area3">
          <Reloj />
        </article>
      </section>

      <section className="contentbuscador">
        <article className="area1">
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
          <InputText2>
            <input
              value={buscador}
              ref={buscadorRef}
              onChange={buscar}
              className="form__field"
              type="search"
              placeholder="buscar..."
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && stateListaproductos) {
                  e.preventDefault();
                  document.querySelector("[tabindex='0']").focus();
                }
              }}
            />
            <ListaDesplegable
              // ¡CAMBIADO! Ya no es 'funcioncrud'
              // Le pasamos la nueva función controladora
              funcion={(producto) => handleProductoSeleccionado(producto)}
              top="59px"
              // funcion={selectProductos} // La selección la hace el handle ahora
              setState={() => setStateListaproductos(!stateListaproductos)}
              data={dataProductos}
              state={stateListaproductos}
            />
          </InputText2>
        </article>
      </section>
    </Header>
  );
}

// ... (Pega aquí TODOS tus styled-components sin ningún cambio) ...
// (Header, ContentSucursal, Contentuser, etc.)
const Header = styled.div`
  grid-area: header;
  /* background-color: rgba(222, 18, 130, 0.5); */
  display: flex;
  height: 100%;

  flex-direction: column;
  gap: 20px;
  @media ${Device.desktop} {
    border-bottom: 1px solid ${({ theme }) => theme.color2};
  }

  .contentprincipal {
    width: 100%;
    display: grid;
    grid-template-areas:
      "area1 area2"
      "area3 area3";

    .area1 {
      grid-area: area1;
    }
    .area2 {
      grid-area: area2;
    }
    .area3 {
      grid-area: area3;
    }
    @media ${Device.desktop} {
      display: flex;
      justify-content: space-between;
    }
    .contentlogo {
      display: flex;
      align-items: center;
      font-weight: 700;
      gap: 8px;
      img {
        width: 30px;
        object-fit: contain;
      }
    }
  }
  .contentbuscador {
    display: grid;
    grid-template:
      "area2 area2"
      "area1 area1";
    gap: 10px;
    height: 100%;
    align-items: center;
    position: relative;

    .area1 {
      grid-area: area1;
      display: flex;
      gap: 30px;
      .contentCantidad {
        width: 150px;
      }
      /* background-color: #ff00ae; */
    }
    .area2 {
      grid-area: area2;
      display: flex;
      gap: 10px;
      /* background-color: #15ff00; */
    }
    @media ${Device.desktop} {
      display: flex;
      justify-content: flex-start;
      gap: 10px;
      .area1 {
        width: 40vw;
      }
    }
  }
`;
const ContentSucursal = styled.section`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  /* background-color: red; */
  align-items: center;
  height: 45px;
  border-bottom: 1px solid ${({ theme }) => theme.color2};
  gap:8px;
`;
const Contentuser = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .contentimg {
    display: flex;
    align-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    img {
      width: 100%;
      object-fit: cover;
    }
  }
  .textos {
    display: none;

    .usuario {
      font-weight: 700;
    }
    @media ${Device.laptop} {
      display: flex;
      flex-direction: column;
    }
  }
`;