import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import styled from "styled-components";
import { v } from "../../../styles/variables";
import {
  InputText,
  Btn1,
  useProductosStore,
  ContainerSelector,
  useSucursalesStore,
  useCategoriasStore,
  Btngenerarcodigo,
  useAlmacenesStore,
} from "../../../index";
import { useForm } from "react-hook-form";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Device } from "../../../styles/breakpoints";
import { useEffect, useState, useMemo, useCallback } from "react";
import { SelectList } from "../../ui/lists/SelectList";
import { toast } from "sonner";
import { BtnClose } from "../../ui/buttons/BtnClose";

export function RegistrarProductos({
  onClose,
  dataSelect,
  accion,
  setIsExploding,
  state,
}) {
  if (!state) return null;

  const defaultNombre = dataSelect?.nombre || '';
  const defaultPVenta = dataSelect?.precio_venta || 0;
  const defaultPCompra = dataSelect?.precio_compra || 0; // Tu C/U
  const defaultCodBarras = dataSelect?.codigo_barras || '';
  const defaultCodInterno = dataSelect?.codigo_interno || '';
  const defaultDetalles = dataSelect?.detalles || '';
  
  const unidadesDeVenta = useMemo(() => [ 
    { id: "General", nombre: "General" },
    { id: "Bebida", nombre: "Bebida" }, { id: "Caja", nombre: "Caja" },
    { id: "Capsulas", nombre: "Capsulas" }, { id: "Gel", nombre: "Gel" },
    { id: "Pack", nombre: "Pack" }, { id: "Polvo", nombre: "Polvo" },
    { id: "Pote", nombre: "Pote" }, { id: "Sobre", nombre: "Sobre" },
  ], []);

  // Estados locales
  const [sevendePorItemSelect, setSevendePorItemSelect] = useState(
     unidadesDeVenta.find(u => u.nombre === dataSelect?.sevende_por) || unidadesDeVenta[0]
  );
  const [randomCodeinterno, setRandomCodeinterno] = useState(defaultCodInterno);
  const [randomCodebarras, setRandomCodebarras] = useState(defaultCodBarras);
  const [isCreatingMarca, setIsCreatingMarca] = useState(false);

// --- Stores ---
  const { insertarProductos, editarProductos, generarCodigo, codigogenerado } = useProductosStore(); 
  const { dataempresa } = useEmpresaStore();
  const { mostrarAlmacenesXSucursal } = useAlmacenesStore(); // Solo la función
  const { dataSucursales, sucursalesItemSelect } = useSucursalesStore(); // Global
  const { datacategorias, selectCategoria, categoriaItemSelect, insertarCategorias } = useCategoriasStore();
  const queryClient = useQueryClient();

  // --- Estados Locales del Modal ---
  // ESTA ES LA SOLUCIÓN: Estados locales para los dropdowns
  const [localSucursal, setLocalSucursal] = useState(null);
  const [localAlmacen, setLocalAlmacen] = useState(null);

  // --- Form ---
  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm({
      defaultValues: {
        nombre: defaultNombre,
        precio_venta: defaultPVenta,
        precio_compra: defaultPCompra,
        stock: 0,
        detalles: defaultDetalles,
      }
  });

  // --- React Query ---
  // 1. Cargar almacenes basado en el 'localSucursal'
  const { data: dataAlmacenes, isLoading: isLoadingAlmacenes } = useQuery({
    
    // 👇 CAMBIO AQUÍ: Usa '.id' para la query key
    queryKey: ["almacenesParaModal", localSucursal?.id], 
    
    // 👇 CAMBIO AQUÍ: Pasa '.id' como el parámetro que espera la función
    queryFn: () => mostrarAlmacenesXSucursal({ id_sucursal: localSucursal.id }),
    
    // 👇 CAMBIO AQUÍ: Habilita usando '.id'
    enabled: !!localSucursal?.id && accion === 'Nuevo' && state,
  });

  // --- EFECTOS ---

  // 2. Efecto Principal: Se activa cuando el modal se abre/cierra o cambia la data
  useEffect(() => {
    if (accion === "Editar" && dataSelect) {
      // Lógica para Editar (tu código original está bien)
      setValue("nombre", dataSelect.nombre || '');
      setValue("precio_venta", dataSelect.precio_venta || 0);
      setValue("precio_compra", dataSelect.precio_compra || 0);
      setValue("detalles", dataSelect.detalles || '');
      setRandomCodebarras(dataSelect.codigo_barras || '');
      setRandomCodeinterno(dataSelect.codigo_interno || '');
      const catInitial = datacategorias?.find(c => c.id === dataSelect.id_categoria);
      if (catInitial) selectCategoria(catInitial);
      const sevendeInitial = unidadesDeVenta.find(u => u.nombre === dataSelect.sevende_por);
      setSevendePorItemSelect(sevendeInitial || unidadesDeVenta[0]);

    } else if (accion === "Nuevo" && state) {
      // Lógica para Nuevo (cuando se abre)
      generarCodigoInterno();
      setRandomCodebarras('');
      selectCategoria(null);
      setSevendePorItemSelect(unidadesDeVenta[0]);
      
      // 👇 INICIALIZA el estado local con el global
      setLocalSucursal(sucursalesItemSelect); 
      setLocalAlmacen(null); // Resetea el almacén local
    }
  }, [accion, dataSelect, state]); // Depende de 'state' para saber cuándo se abre

  // 3. Efecto para auto-seleccionar el primer almacén
  useEffect(() => {
    // Si la carga terminó y hay almacenes, selecciona el primero
    if (!isLoadingAlmacenes && dataAlmacenes && dataAlmacenes.length > 0) {
      setLocalAlmacen(dataAlmacenes[0]);
    } else {
      // Si no hay almacenes, asegúrate que esté en null
      setLocalAlmacen(null);
    }
  }, [dataAlmacenes, isLoadingAlmacenes]); // Depende de la data del query


  // --- HANDLERS ---
  // 4. Handler para el dropdown de sucursal LOCAL
  const handleSucursalLocalChange = (sucursalSeleccionada) => {
    setLocalSucursal(sucursalSeleccionada);
    setLocalAlmacen(null); // Resetea el almacén
  };

  const generarCodigoBarras = useCallback(() => { 
    generarCodigo();
    setRandomCodebarras(codigogenerado);
  }, [generarCodigo, codigogenerado]);

  const generarCodigoInterno = useCallback(() => { 
    generarCodigo();
    setRandomCodeinterno(codigogenerado);
  }, [generarCodigo, codigogenerado]);

  // Crear Marca
  const handleCreateMarca = async (inputValue) => {
    if (isCreatingMarca || !inputValue || !dataempresa?.id) return;
    setIsCreatingMarca(true);
    const nombreMarca = inputValue.toUpperCase();
    const p = { _nombre: nombreMarca, _color: "#CCCCCC", _icono: "-", _id_empresa: dataempresa.id };
    try {
      await insertarCategorias(p, null); 
      const newOption = useCategoriasStore.getState().datacategorias.find(cat => cat.nombre === nombreMarca);
      if (newOption) selectCategoria(newOption);
      toast.success(`Marca "${nombreMarca}" creada.`);
    } catch (error) {
      toast.error(`Error al crear marca: ${error.message}`);
    } finally {
      setIsCreatingMarca(false);
    }
  };

  // --- MUTATION PRINCIPAL ---
  const { mutate: guardarProducto, isPending } = useMutation({
     mutationFn: async (formData) => {
      // Validaciones
      if (!categoriaItemSelect?.id) throw new Error("Seleccione una Marca.");
      
      // Almacén solo obligatorio si es Nuevo
      if (accion === 'Nuevo' && !localAlmacen?.id) throw new Error("Seleccione un Almacén para el stock inicial.");
      
      const nombreEnMayusculas = formData.nombre.toUpperCase();
      const codigoBarrasFinal = randomCodebarras || (accion === 'Editar' ? dataSelect.codigo_barras : '') || codigogenerado || '';
      const codigoInternoFinal = randomCodeinterno || (accion === 'Editar' ? dataSelect.codigo_interno : '') || codigogenerado || '';

      const baseData = {
        _nombre: nombreEnMayusculas,
        _precio_venta: parseFloat(formData.precio_venta || 0),
        _precio_compra: parseFloat(formData.precio_compra || 0),
        _id_categoria: categoriaItemSelect.id,
        _codigo_barras: codigoBarrasFinal,
        _codigo_interno: codigoInternoFinal,
        _id_empresa: dataempresa.id,
        _sevende_por: sevendePorItemSelect.nombre,
        _detalles: formData.detalles || '-',
      };

      if (accion === "Editar") {
        // EDITAR: Llama a la función SQL actualizada que recibe _detalles
        await editarProductos({ ...baseData, _id: dataSelect.id, _maneja_inventarios: true });
      } else {
        // NUEVO: Llama a crear_producto_con_stock que ahora recibe _detalles
        const dataInsertar = {
           ...baseData,
           _id_almacen: localAlmacen.id,
           _stock_inicial: parseFloat(formData.stock || 0)
        };
        await insertarProductos(dataInsertar);
      }
    },
    onSuccess: () => {
        toast.success("Producto guardado correctamente");
      setIsExploding(true);
      queryClient.invalidateQueries({ 
        queryKey: [
          'mostrarproductos',       // 1. El nombre base
          dataempresa?.id,          // 2. El ID de la empresa
          sucursalesItemSelect?.id_sucursal // 3. El ID de la sucursal que se está viendo
        ] 
      });
      onClose();
    },
    onError: (error) => {
       toast.error(`Error: ${error.message}`);
    },
  });

  return (
    <Container $state={state}>
      <div className="sub-contenedor">
        <div className="headers">
          <section>
            <h1>{accion === "Editar" ? "EDITAR PRODUCTO" : "REGISTRAR NUEVO PRODUCTO"}</h1>
          </section>
          <section>
            <BtnClose funcion={onClose} />
          </section>
        </div>

        <Form className="formulario" onSubmit={handleSubmit(guardarProducto)}>
          
          {/* --- COLUMNA IZQUIERDA --- */}
          <section className="seccion1">
            <article> 
               <InputText icono={<v.icononombre />}>
                <input className="form__field" type="text" placeholder="Nombre" {...register("nombre", { required: "Obligatorio" })} />
                <label className="form__label">Nombre</label>
              </InputText>
              {errors.nombre && <p className="error-message">{errors.nombre.message}</p>}
            </article>

             <div className="row-inputs">
              <article> 
                 <InputText icono={<v.iconoprecioventa />}>
                   <input className="form__field" type="number" step="0.01" placeholder=" " {...register("precio_venta")} />
                   <label className="form__label">Precio Venta</label>
                 </InputText>
              </article>
              <article> 
                 <InputText icono={<v.iconopreciocompra />}>
                   <input className="form__field" type="number" step="0.01" placeholder=" " {...register("precio_compra")} />
                   <label className="form__label">Costo (C/U)</label>
                 </InputText>
              </article>
            </div>

            {/* Stock Inicial: SOLO VISIBLE SI ES NUEVO */}
            {accion === "Nuevo" && (
              <>
                <article>
                     <InputText icono={<v.iconostock />}>
                       <input className="form__field" type="number" step="0.01" placeholder=" " {...register("stock")} />
                       <label className="form__label">Stock Inicial</label>
                     </InputText>
                </article>
                <div className="mensaje-aviso">
                  <small>📍 El stock inicial se asignará a la sucursal seleccionada.</small>
                </div>
              </>
            )}

            {/* Detalles: SIEMPRE VISIBLE (Ahora guarda en productos) */}
            <article>
                 <InputText icono={v.iconodetalles ? <v.iconodetalles /> : null}>
                   <input className="form__field" type="text" placeholder=" " autoComplete="off" {...register("detalles")} />
                   <label className="form__label">Detalles del Producto</label>
                 </InputText>
            </article>

          </section>

          {/* --- COLUMNA DERECHA --- */}
          <section className="seccion2">
            <div className="row-inputs">
                <ContainerSelector>
                  <label>Tipo:</label>
                  <Select
                    options={unidadesDeVenta}
                    value={sevendePorItemSelect}
                    onChange={setSevendePorItemSelect}
                    getOptionLabel={(opt) => opt.nombre}
                    getOptionValue={(opt) => opt.id}
                    placeholder="Tipo..."
                  />
                </ContainerSelector>

                <ContainerSelector> 
                  <label>Marca:</label>
                  <CreatableSelect
                    options={datacategorias || []} 
                    value={categoriaItemSelect}
                    onChange={selectCategoria}
                    onCreateOption={handleCreateMarca}
                    getOptionLabel={(opt) => opt.nombre}
                    getOptionValue={(opt) => opt.id}
                    placeholder="Marca..."
                    isDisabled={isCreatingMarca}
                    isLoading={isCreatingMarca}
                  />
                </ContainerSelector>
            </div>

            {/* Sucursal/Almacén: SOLO SI ES NUEVO */}
            {/* Al editar, ya no necesitamos esto porque los detalles están en el producto */}
            {accion === "Nuevo" && (
            <div className="row-inputs">
              <ContainerSelector>
                  <label>Sucursal:</label>
                  <SelectList 
                    data={dataSucursales} 
                    itemSelect={localSucursal} // 👈 USA ESTADO LOCAL
                    onSelect={handleSucursalLocalChange} // 👈 USA HANDLER LOCAL
                    displayField="nombre" 
                    placeholder="Seleccione..." 
                  />
              </ContainerSelector>
              <ContainerSelector>
                  <label>Almacén:</label>
                  <SelectList 
                    data={dataAlmacenes || []} // 👈 USA DATA DEL QUERY
                    itemSelect={localAlmacen} // 👈 USA ESTADO LOCAL
                    onSelect={setLocalAlmacen} // 👈 USA ESTADO LOCAL
                    displayField="nombre" 
                    placeholder={isLoadingAlmacenes ? "Cargando..." : "Seleccione..."}
                    disabled={isLoadingAlmacenes || !localSucursal} 
                  />
              </ContainerSelector>
            </div>
            )}

             {/* Códigos */}
             <article className="contentPadregenerar">
                 <InputText icono={<v.iconocodigobarras />}>
                <input className="form__field" value={randomCodebarras} onChange={(e) => setRandomCodebarras(e.target.value)} type="text" placeholder="Código de Barras" />
                <label className="form__label">Código de Barras</label>
              </InputText>
              <ContainerBtngenerar>
                <Btngenerarcodigo titulo="Generar" funcion={generarCodigoBarras} />
              </ContainerBtngenerar>
            </article>

            <article className="contentPadregenerar">
                <InputText icono={<v.iconocodigointerno />}>
                <input className="form__field" value={randomCodeinterno} onChange={(e) => setRandomCodeinterno(e.target.value)} type="text" placeholder="Código Interno" />
                <label className="form__label">Código Interno</label>
              </InputText>
              <ContainerBtngenerar>
                <Btngenerarcodigo titulo="Generar" funcion={generarCodigoInterno} />
              </ContainerBtngenerar>
            </article>

          </section>

           {/* Botón Guardar */}
          <div className="footer-buttons">
            <Btn1 type="submit" icono={<v.iconoguardar />} titulo="Guardar" bgcolor="#1d8850" disabled={isPending} color={"white"} />
          </div>
        </Form>
      </div>
    </Container>
  );
}

// --- ESTILOS (Asegúrate que sean los últimos que te pasé) ---
const Container = styled.div`
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
  opacity: ${({ $state }) => ($state ? "1" : "0")};
  visibility: ${({ $state }) => ($state ? "visible" : "hidden")};
  position: fixed;
  inset: 0;
  background-color: rgba(10, 9, 9, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);

  .sub-contenedor {
    background: ${({ theme }) => theme.bgtotal};
    box-shadow: ${v.boxshadowGray};
    padding: 25px; // Reduced padding slightly
    border-radius: ${v.borderRadius};
    width: 90%;
    max-width: 950px; // Increased width
    z-index: 101;
    max-height: 90vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    position: relative; // Needed if positioning button absolutely *relative to this*

    &::-webkit-scrollbar { width: 8px; }
    &::-webkit-scrollbar-thumb {
      background-color: ${({ theme }) => theme.colorScroll};
      border-radius: 10px;
    }

    .headers {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px; // Reduced margin slightly
      // border-bottom: 1px solid ${({ theme }) => theme.color2}; // Optional: Remove border if desired
      padding-bottom: 10px; // Reduced padding
      // position: relative; // Usually not needed if button is inside flex

      h1 {
        font-size: 1.5rem; // Slightly smaller title
        color: ${({ theme }) => theme.text};
        font-weight: 600;
        margin: 0; // Remove default margin if any
      }

      // Target the section containing the button OR the button directly
      section:last-child {
         // Option A: Keep button flow with flex (usually best)
         // No extra styles needed if BtnClose is just placed inside

         // Option B: Absolute positioning (use if flex doesn't work)
         /*
         position: absolute;
         top: 15px; // Adjust distance from top
         right: 15px; // Adjust distance from right
         */
      }

      button, svg { // Style for BtnClose icon/button
          font-size: 1.6rem; // Adjust size
          cursor: pointer;
          color: ${({ theme }) => theme.text};
          background: none;
          border: none;
          padding: 5px; // Add some clickable area
           &:hover { opacity: 0.7; }
      }
    }
  }
`;

// Ajusta el Form styled-component
const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr; // Por defecto una columna
  gap: 25px;

  @media ${Device.tablet} {
    grid-template-columns: 1fr 1fr; // Dos columnas en tablet+
    gap: 35px; // Aumenta un poco el gap entre columnas si quieres
  }

  section { // Estilos para seccion1 y seccion2
    display: flex;
    flex-direction: column;
    gap: 20px; // Espacio entre elementos de la columna
  }

  // Estilos para agrupar label + input/select
  article, .ContainerSelector {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  label:not(.form__label) { // Labels que NO son flotantes
    font-weight: 500;
    color: ${({ theme }) => theme.text};
    font-size: 0.9rem;
    margin-bottom: 2px;
  }

  // Contenedor para input + botón generar
  .contentPadregenerar {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  // Contenedor para elementos en fila (Precio/Costo Y Tipo/Marca)
  .row-inputs {
    display: grid;
    // Por defecto una columna (móvil), dos en tablet+
    grid-template-columns: 1fr;
    gap: 20px; // Espacio vertical en móvil

    @media ${Device.tablet} {
      grid-template-columns: 1fr 1fr; // Dos columnas iguales en tablet+
      gap: 25px; // Espacio horizontal en tablet+
    }
  }

  .error-message {
      color: ${v.rojo};
      font-size: 0.8rem;
      margin-top: 4px;
  }

  .footer-buttons {
    grid-column: 1 / -1; // Ocupa todo el ancho
    display: flex;
    justify-content: center;
    margin-top: 25px;
  }
`;

// ContainerStock, ContainerBtngenerar, ContainerMensajeStock
// y ContainerSelector (si lo defines aquí) permanecen igual que antes.
// Asegúrate de que ContainerSelector se importe o defina UNA SOLA VEZ.

const ContainerBtngenerar = styled.div`
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  button {
    padding: 6px 10px;
    font-size: 0.8em;
  }
`;

const ContainerMensajeStock = styled.div`
  text-align: center;
  color: #f57c00;
  background-color: rgba(255, 152, 0, 0.1);
  border-radius: ${v.borderRadius};
  padding: 10px;
  margin: 5px 0;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid rgba(255, 152, 0, 0.3);
`;