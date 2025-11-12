import styled from "styled-components";
import { v } from "../../styles/variables";
import {
  InputText,
  Btn1,
  useSucursalesStore,
  useProductosStore,
  useAlmacenesStore,
} from "../../index";
import { useForm } from "react-hook-form";
import { BtnClose } from "../../components/ui/buttons/BtnClose";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// import { useStockStore } from "../../../store/StockStore"; // Ya no se usa
import { useBuscarProductosQuery } from "../../tanstack/ProductosStack";
import { 
  useMostrarAlmacenesXSucursalQuery, // Hook parametrizado (lo crearemos)
} from "../../tanstack/AlmacenesStack";
// ¡Hook corregido!
import { useMostrarStockXAlmacenYProductoQuery } from "../../tanstack/StockStack"; 
import { BuscadorList } from "../../components/ui/lists/BuscadorList";
import { SelectList } from "../../components/ui/lists/SelectList";
import { useUsuariosStore } from "../../store/UsuariosStore";
import { TransferirStock } from "../../supabase/crudStock"; 
import { useState } from "react";
import { useMostrarSucursalesQuery } from "../../tanstack/SucursalesStack"; // Importamos sucursales

export function TransferenciaStockModal({ onClose }) {
  const { datausuarios } = useUsuariosStore();
  const queryClient = useQueryClient();
  const { setBuscador, productosItemSelect, dataProductos, resetProductosItemSelect } = useProductosStore();
  const { data: dataSucursales } = useMostrarSucursalesQuery();
  
  // Origen
  const [sucursalOrigen, setSucursalOrigen] = useState(null);
  const [almacenOrigen, setAlmacenOrigen] = useState(null);
  const { data: dataAlmacenesOrigen } = useMostrarAlmacenesXSucursalQuery(sucursalOrigen?.id);

  // Destino
  const [sucursalDestino, setSucursalDestino] = useState(null);
  const [almacenDestino, setAlmacenDestino] = useState(null);
  const { data: dataAlmacenesDestino } = useMostrarAlmacenesXSucursalQuery(sucursalDestino?.id);

  // Stock (ahora usa el hook parametrizado)
  const { data: dataStockOrigen, isLoading: isLoadingStock } = useMostrarStockXAlmacenYProductoQuery(
    almacenOrigen?.id, 
    productosItemSelect?.id
  );

  const { register, handleSubmit, formState: { errors } } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      // ... (Toda la lógica de validación se queda igual)
      if (!productosItemSelect?.id || !almacenOrigen?.id || !almacenDestino?.id) {
        throw new Error("Debe seleccionar un producto, almacén de origen y almacén de destino.");
      }
      if (almacenOrigen.id === almacenDestino.id) {
        throw new Error("El almacén de origen y destino no pueden ser el mismo.");
      }
      const cantidad = parseFloat(data.cantidad);
      if (cantidad <= 0) {
        throw new Error("La cantidad debe ser mayor a 0.");
      }
      if (!dataStockOrigen || dataStockOrigen.stock < cantidad) {
        throw new Error(`Stock insuficiente en origen. Solo hay ${dataStockOrigen?.stock || 0}.`);
      }

      const p = {
        cantidad: cantidad,
        id_producto: productosItemSelect.id,
        id_almacen_origen: almacenOrigen.id,
        id_almacen_destino: almacenDestino.id,
        id_usuario: datausuarios.id
      };
      await TransferirStock(p);
    },
    onSuccess: () => {
      toast.success("Transferencia registrada con éxito.");
      queryClient.invalidateQueries(["mostrar stock actual"]); 
      queryClient.invalidateQueries(["mostrar stock xalmacenyproducto"]); // Invalida todos
      resetProductosItemSelect();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return (
  	<Container>
  	  {isPending ? (
  		<span>guardando...🔼</span>
  	  ) : (
  		<div className="sub-contenedor">
  		  <div className="headers">
  			<section>
  			  <h1>Transferir Stock</h1>
  			</section>
  			<section>
  			  <BtnClose
  				funcion={() => {
  				  resetProductosItemSelect();
  				  onClose();
  				}}
  			  />
  			</section>
  		  </div>

          {/* Buscador de Producto */}
  		  <section className="containerListas">
  			<BuscadorList
  			  data={dataProductos}
  			  onSelect={selectProductos}
  			  setBuscador={setBuscador}
  			/>
  			<span>
  			  Producto:{" "}
  			  <strong>
  				{productosItemSelect?.nombre ? productosItemSelect?.nombre : "-"}
  			  </strong>
  			</span>
  		  </section>
          
          <form className="formulario" onSubmit={handleSubmit(mutate)}>
            <Row>
              {/* Columna Origen */}
              <Col>
                <h3>Origen</h3>
                <ContainerSelector>
  	  			  <label>Sucursal Origen:</label>
  	  			  <SelectList
  		  	  		data={dataSucursales}
  	  	  	  		itemSelect={sucursalOrigen}
  	  	  	  		onSelect={setSucursalOrigen}
  	  	  	  		displayField="nombre"
  	  	  	      />
  	  		    </ContainerSelector>
  	  		    <ContainerSelector>
  	  			  <label>Almacen Origen:</label>
  	  			  <SelectList
  	  	  	  		data={dataAlmacenesOrigen}
  	  	  	  		itemSelect={almacenOrigen}
  	  	  	  		onSelect={setAlmacenOrigen}
  	  	  	  		displayField="nombre"
  	  	  	      />
  	  		    </ContainerSelector>
                <span>
  	  			  Stock disponible:{" "}
  	  			  <strong>{dataStockOrigen?.stock ? dataStockOrigen?.stock : "-"} </strong>
  	  			</span>
              </Col>
              
              {/* Columna Destino */}
              <Col>
                <h3>Destino</h3>
                <ContainerSelector>
  	  			  <label>Sucursal Destino:</label>
  	  			  <SelectList
  		  	  		data={dataSucursales}
  	  	  	  		itemSelect={sucursalDestino}
  	  	  	  		onSelect={setSucursalDestino}
  	  	  	  		displayField="nombre"
  	  	  	      />
  	  		    </ContainerSelector>
  	  		    <ContainerSelector>
  	  			  <label>Almacen Destino:</label>
  	  			  <SelectList
  	  	  	  		data={dataAlmacenesDestino}
  	  	  	  		itemSelect={almacenDestino}
  	  	  	  		onSelect={setAlmacenDestino}
  	  	  	  		displayField="nombre"
  	  	  	      />
  	  		    </ContainerSelector>
              </Col>
            </Row>

  			  <section className="form-subcontainer">
  				<article>
  				  <InputText icono={<v.iconoflechaderecha />}>
  					<input
  					  className="form__field"
  					  type="number"
                      step="0.01"
  					  {...register("cantidad", { required: true })}
  					/>
  					<label className="form__label">Cantidad a transferir</label>
                    {errors.cantidad && <p>La cantidad es requerida.</p>}
  				  </InputText>
  				</article>
  				<Btn1
  				  disabled={!productosItemSelect?.nombre || !almacenOrigen || !almacenDestino}
  				  icono={<v.iconoguardar />}
  				  titulo="Transferir"
  				  bgcolor="#0d6efd"
  				/>
  			  </section>
  			</form>
  		</div>
  	  )}
  	</Container>
  );
}
const Container = styled.div`
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
    width: 500px;
    max-width: 85%;
    border-radius: 20px;
    background: ${({ theme }) => theme.body};
    box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
    padding: 13px 36px 20px 36px;
    z-index: 100;
    max-height: 80vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    .containerListas {
      gap: 20px;
      display: flex;
      flex-direction: column;
    }
    .contentSucursal {
      display: flex;
      gap: 10px;
    }
    .headers {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h1 {
        font-size: 30px;
        font-weight: 700;
        text-transform: uppercase;
      }
      span {
        font-size: 20px;
        cursor: pointer;
      }
    }
    .formulario {
      .form-subcontainer {
        gap: 20px;
        display: flex;
        flex-direction: column;
        .colorContainer {
          .colorPickerContent {
            padding-top: 15px;
            min-height: 50px;
          }
        }
      }
    }
  }
`;

const ContainerSelector = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  position: relative;
`;

const Row = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;
  flex-wrap: wrap; // Para pantallas pequeñas
  & > div {
    flex: 1;
    min-width: 200px; // Evita que se encojan demasiado
  }
`;
const Col = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  border: 1px solid ${({ theme }) => theme.bordercolorDash};
  padding: 15px;
  border-radius: 10px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
  span {
    font-size: 14px;
  }
`;