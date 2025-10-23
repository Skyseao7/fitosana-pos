import styled from "styled-components";
import { v } from "../../../styles/variables";
import {
  InputText,
  Btn1,
  ConvertirCapitalize,
  useProductosStore,
  ContainerSelector,
  Switch1,
  Selector,
  useSucursalesStore,
  ListaDesplegable,
  useCategoriasStore,
  Btngenerarcodigo,
  useAlmacenesStore,
  ConvertirMinusculas,
} from "../../../index";
import { useForm } from "react-hook-form";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Device } from "../../../styles/breakpoints";
import { useEffect, useRef, useState } from "react";
import { Checkbox1 } from "../Checkbox1";
import Swal from "sweetalert2";
import { SelectList } from "../../ui/lists/SelectList";
import { useStockStore } from "../../../store/StockStore";
import { toast } from "sonner";
import { BtnClose } from "../../ui/buttons/BtnClose";

export function RegistrarProductos({
  onClose,
  dataSelect,
  accion,
  setIsExploding,
  state,
}) {
  if (!state) return;
  //Lista de prueba, se modificará en un futuro
  const unidadesDeVenta = [
    { id: "Bebida", nombre: "Bebida" },
    { id: "Caja", nombre: "Caja" },
    { id: "Capsulas", nombre: "Capsulas" },
    { id: "Gel", nombre: "Gel" },
    { id: "Pack", nombre: "Pack" },
    { id: "Polvo", nombre: "Polvo" },
    { id: "Pote", nombre: "Pote" },
    { id: "Sobre", nombre: "Sobre" },
  ];
  //validar checkboxs
  /* const [isChecked1, setIsChecked1] = useState(true);
  const [isChecked2, setIsChecked2] = useState(false);
  const [sevendepor, setSevendepor] = useState("UNIDAD");
  const [stock, setStock] = useState(""); */
  
  //selector de tipo
  const [sevendepor, setSevendepor] = useState("Bebida"); // Estado para guardar el string
  const [sevendePorItemSelect, setSevendePorItemSelect] = useState({ id: "Bebida", nombre: "Bebida" }); // Estado para el <SelectList>
  const [stock, setStock] = useState("");

  const [stockMinimo, setStockMinimo] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  /* const handleCheckboxChange = (checkboxNumber) => {
    if (checkboxNumber === 1) {
      setIsChecked1(true);
      setIsChecked2(false);
      setSevendepor("UNIDAD");
    } else {
      setIsChecked1(false);
      setIsChecked2(true);
      setSevendepor("GRANEL");
    }
  }; */
  //
  //Manejador
  const handleSeVendePorSelect = (item) => {
  setSevendePorItemSelect(item); // Actualiza el objeto (para la UI)
  setSevendepor(item.nombre); // Actualiza el string (para la BD)
  };


  const {
    insertarProductos,
    editarProductos,
    generarCodigo,
    codigogenerado,
    refetchs,
  } = useProductosStore();
  const { insertarStock, mostrarStockXAlmacenYProducto } = useStockStore();
  const { dataempresa } = useEmpresaStore();
  const {
    dataalmacen,
    eliminarAlmacen,
    mostrarAlmacenesXSucursal,
    almacenSelectItem,
    setAlmacenSelectItem,
  } = useAlmacenesStore();
  const [stateInventarios, setStateInventarios] = useState(true);
  const [stateEnabledStock, setStateEnabledStock] = useState(false);

  const [stateSucursalesLista, setStateSucursalesLista] = useState(false);
  const [stateCategoriasLista, setStateCategoriasLista] = useState(false);
  const inputcodigointerno = useRef();
  const { dataSucursales, selectSucursal, sucursalesItemSelect } =
    useSucursalesStore();
  const { datacategorias, selectCategoria, categoriaItemSelect } =
    useCategoriasStore();
  const {
    data: dataStockXAlmacenYProducto,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "mostrar stock almacen y producto",
      { id_producto: dataSelect?.id, id_almacen: almacenSelectItem?.id },
    ],
    queryFn: () =>
      mostrarStockXAlmacenYProducto({
        id_almacen: almacenSelectItem?.id,
        id_producto: dataSelect?.id,
      }),
  });
  const {
    data: dataAlmacenes,
    error: errorAlmacenes,
    isLoading: isLoadingAlmacenes,
  } = useQuery({
    queryKey: [
      "mostrar almacenes x sucursal",
      { id_producto: dataSelect.id, id_sucursal: sucursalesItemSelect.id },
    ],
    queryFn: () =>
      mostrarAlmacenesXSucursal({
        id_sucursal: sucursalesItemSelect.id,
      }),
  });

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();
  const { isPending, mutate: doInsertar } = useMutation({
    mutationFn: insertar,
    mutationKey: "insertar productos",
    onError: (error) => toast.error(`Errror: ${error.message}`),
    onSuccess: () => {
      toast.success("Producto guardado correctamente");
      cerrarFormulario();
    },
  });
  const handlesub = (data) => {
    doInsertar(data);
  };
  const cerrarFormulario = () => {
    onClose();
    setIsExploding(true);
  };
  async function insertar(data) {
    validarVacios(data);
    if (accion === "Editar") {
      const p = {
        _id: dataSelect.id,
        _nombre: ConvertirMinusculas(data.nombre),
        _precio_venta: parseFloat(data.precio_venta),
        _precio_compra: parseFloat(data.precio_compra),
        _id_categoria: categoriaItemSelect.id,
        _codigo_barras: randomCodebarras ? randomCodebarras : codigogenerado,
        _codigo_interno: randomCodeinterno ? randomCodeinterno : codigogenerado,
        _id_empresa: dataempresa.id,
        _sevende_por: sevendepor,
        _maneja_inventarios: stateInventarios,
      };
      console.log(p);
      await editarProductos(p);
      if (stateInventarios) {
        if (!dataStockXAlmacenYProducto) {
          const pStock = {
            id_almacen: almacenSelectItem?.id,
            id_producto: dataSelect?.id,
            stock: parseFloat(data.stock),
            stock_minimo: parseFloat(data.stock_minimo),
            ubicacion: data.ubicacion,
          };
          await insertarStock(pStock);
        }
      }
    } else {
      const p = {
        _nombre: ConvertirMinusculas(data.nombre),
        _precio_venta: parseFloat(data.precio_venta),
        _precio_compra: parseFloat(data.precio_compra),
        _id_categoria: categoriaItemSelect.id,
        _codigo_barras: randomCodebarras ? randomCodebarras : codigogenerado,
        _codigo_interno: randomCodeinterno ? randomCodeinterno : codigogenerado,
        _id_empresa: dataempresa.id,
        _sevende_por: sevendepor,
        _maneja_inventarios: stateInventarios,
        _maneja_multiprecios: false,
      };

      const id_producto_nuevo = await insertarProductos(p);
      if (stateInventarios) {
        const pStock = {
          id_almacen: almacenSelectItem?.id,
          id_producto: id_producto_nuevo,
          stock: parseFloat(data.stock),
          stock_minimo: parseFloat(data.stock_minimo),
          ubicacion: data.ubicacion,
        };

        await insertarStock(pStock);
      }
    }
  }

  //#region validar check inventarios
  function checkUseInventarios() {
    if (accion === "Editar") {
      if (dataalmacen) {
        if (stateInventarios) {
          Swal.fire({
            title: "¿Estás seguro(a)?",
            text: "Si desactiva esta opción se eliminara el stock!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Si, eliminar",
          }).then(async (result) => {
            if (result.isConfirmed) {
              setStateInventarios(false);
              await eliminarAlmacen({ id: dataalmacen.id });
            }
          });
        } else {
          setStateInventarios(true);
        }
      } else {
        setStateInventarios(!stateInventarios);
      }
    } else {
      setStateInventarios(!stateInventarios);
    }
  }
  //#endregion
  //#region validar vacios
  function validarVacios(data) {
    if (!randomCodeinterno) {
      generarCodigoInterno();
    }
    if (!randomCodebarras) {
      generarCodigoBarras();
    }
    if (data.precio_venta.trim() === "") {
      data.precio_venta = 0;
    }
    if (data.precio_compra.trim() === "") {
      data.precio_compra = 0;
    }
    if (stateInventarios) {
      if (!dataalmacen) {
        if (data.stock.trim() === "") {
          data.stock = 0;
        }
        if (data.stock_minimo.trim() === "") {
          data.stock_minimo = 0;
        }
      }
    }
  }
  //#endregion
  //#region generar codigo automatico
  const [randomCodeinterno, setRandomCodeinterno] = useState("");
  const [randomCodebarras, setRandomCodebarras] = useState("");
  function generarCodigoBarras() {
    generarCodigo();
    setRandomCodebarras(codigogenerado);
  }
  function generarCodigoInterno() {
    generarCodigo();
    setRandomCodeinterno(codigogenerado);
  }
  const handleChangeinterno = (event) => {
    setRandomCodeinterno(event.target.value);
  };
  const handleChangebarras = (event) => {
    setRandomCodebarras(event.target.value);
  };
  //#endregion

  //#region validar_accion

  useEffect(() => {
    if (accion != "Editar") {
      generarCodigoInterno();
    } else {
      selectCategoria({
        id:dataSelect.id_categoria,
        nombre:dataSelect.categoria
      })
      setRandomCodeinterno(dataSelect.codigo_interno);
      setRandomCodebarras(dataSelect.codigo_barras);
      /* dataSelect.sevende_por === "UNIDAD"
        ? handleCheckboxChange(1)
        : handleCheckboxChange(0); */
      
        // Setea el estado del selector "Se vende por"
      const sevendePorValor = dataSelect.sevende_por;
      setSevendepor(sevendePorValor);
      setSevendePorItemSelect({ id: sevendePorValor, nombre: sevendePorValor });  
      dataSelect.maneja_inventarios
        ? setStateInventarios(true)
        : setStateInventarios(false);
      dataSelect.maneja_inventarios
        ? setStateEnabledStock(true)
        : setStateEnabledStock(false);
    }
  }, []);
  //#endregion validar_accion

  return (
    <Container>
      {isPending ? (
        <span>...🔼</span>
      ) : (
        <div className="sub-contenedor">
          <div className="headers">
            <section>
              <h1>
                {accion == "Editar"
                  ? "Editar productos"
                  : "REGISTRAR NUEVO PRODUCTO"}
              </h1>
            </section>

            <section>
              <BtnClose
                funcion={() => {
                  refetchs();
                  onClose();
                }}
              />
            </section>
          </div>

          <form className="formulario" onSubmit={handleSubmit(handlesub)}>
            <section className="seccion1">
              <article>
                <InputText icono={<v.iconoflechaderecha />}>
                  <input
                    className="form__field"
                    defaultValue={dataSelect.nombre}
                    type="text"
                    placeholder="nombre"
                    {...register("nombre", {
                      required: true,
                    })}
                  />
                  <label className="form__label">Nombre</label>
                  {errors.nombre?.type === "required" && <p>Campo requerido</p>}
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconoflechaderecha />}>
                  <input
                    step="0.01"
                    className="form__field"
                    defaultValue={dataSelect.precio_venta}
                    type="number"
                    placeholder="precio venta"
                    {...register("precio_venta")}
                  />
                  <label className="form__label">Precio</label>
                </InputText>
              </article>
              <article>
                <InputText icono={<v.iconoflechaderecha />}>
                  <input
                    step="0.01"
                    className="form__field"
                    defaultValue={dataSelect.precio_compra}
                    type="number"
                    placeholder="precio compra"
                    {...register("precio_compra")}
                  />
                  <label className="form__label">C/U</label>
                </InputText>
              </article>
              <article className="contentPadregenerar">
                <InputText icono={<v.iconoflechaderecha />}>
                  <input
                    className="form__field"
                    value={randomCodebarras}
                    onChange={handleChangebarras}
                    type="number"
                    placeholder="codigo de barras"
                  />
                  <label className="form__label">Codigo de barras</label>
                </InputText>
                <ContainerBtngenerar>
                  <Btngenerarcodigo
                    titulo="Generar"
                    funcion={generarCodigoBarras}
                  />
                </ContainerBtngenerar>
              </article>
              <article className="contentPadregenerar">
                <InputText icono={<v.iconoflechaderecha />}>
                  <input
                    className="form__field"
                    value={randomCodeinterno}
                    onChange={handleChangeinterno}
                    type="number"
                    placeholder="codigo interno"
                    // {...register("codigo_interno")}
                  />
                  <label className="form__label">Codigo interno</label>
                </InputText>
                <ContainerBtngenerar>
                  <Btngenerarcodigo
                    titulo="Generar"
                    funcion={generarCodigoInterno}
                  />
                </ContainerBtngenerar>
              </article>
            </section>
            <section className="seccion2">
              <ContainerSelector>
                <label>Tipo: </label>
                <SelectList
                  data={unidadesDeVenta}
                  itemSelect={sevendePorItemSelect}
                  onSelect={handleSeVendePorSelect}
                  displayField="nombre"
                />
              </ContainerSelector>

              <ContainerSelector>
                <label>Marca: </label>
                <SelectList data={datacategorias} itemSelect={categoriaItemSelect} onSelect={selectCategoria} displayField="nombre"/>
                
              </ContainerSelector>
              {/* <ContainerSelector>
                <label>Controlar stock: </label>
                <Switch1
                  state={stateInventarios}
                  setState={checkUseInventarios}
                />
              </ContainerSelector> */}
              {stateInventarios && (
                <ContainerStock>
                  <ContainerSelector>
                    <label>Sucursal: </label>
                    <SelectList
                      data={dataSucursales}
                      itemSelect={sucursalesItemSelect}
                      onSelect={selectSucursal}
                      displayField="nombre"
                    />
                  </ContainerSelector>
                  <br />
                  <ContainerSelector>
                    <label>Almacen: </label>
                    <SelectList
                      data={dataAlmacenes}
                      itemSelect={almacenSelectItem}
                      onSelect={setAlmacenSelectItem}
                      displayField="nombre"
                    />
                  </ContainerSelector>
                  {stateEnabledStock && dataStockXAlmacenYProducto && (
                    <ContainerMensajeStock>
                      <span>
                        💀 para editar el stock vaya al módulo de kardex
                      </span>
                    </ContainerMensajeStock>
                  )}

                  <article>
                    <InputText icono={<v.iconoflechaderecha />}>
                      <input
                        disabled={!!dataStockXAlmacenYProducto}
                        className="form__field"
                        value={
                          accion === "Editar"
                            ? dataStockXAlmacenYProducto
                              ? dataStockXAlmacenYProducto?.stock
                              : stock
                            : stock
                        }
                        step="0.01"
                        type="number"
                        placeholder="stock"
                        {...register("stock")}
                        onChange={(e) => setStock(e.target.value)}
                      />
                      <label className="form__label">stock</label>
                    </InputText>
                  </article>
                  <article>
                    {/* <InputText icono={<v.iconoflechaderecha />}>
                      <input
                        disabled={!!dataStockXAlmacenYProducto}
                        className="form__field"
                        value={
                          accion === "Editar"
                            ? dataStockXAlmacenYProducto
                              ? dataStockXAlmacenYProducto?.stock_minimo
                              : stockMinimo
                            : stockMinimo
                        }
                        step="0.01"
                        type="number"
                        placeholder="stock minimo"
                        {...register("stock_minimo")}
                        onChange={(e) => setStockMinimo(e.target.value)}
                      />
                      <label className="form__label">stock minimo</label>
                    </InputText> */}
                  </article>
                  <article>
                    <InputText icono={<v.iconoflechaderecha />}>
                      <input
                        disabled={!!dataStockXAlmacenYProducto}
                        className="form__field"
                        value={
                          accion === "Editar"
                            ? dataStockXAlmacenYProducto
                              ? dataStockXAlmacenYProducto?.ubicacion
                              : ubicacion
                            : ubicacion
                        }
                        type="text"
                        placeholder="ubicacion"
                        {...register("ubicacion")}
                        onChange={(e) => setUbicacion(e.target.value)}
                      />
                      <label className="form__label">Ubicacion</label>
                    </InputText>
                  </article>
                </ContainerStock>
              )}
            </section>

            <Btn1
              icono={<v.iconoguardar />}
              titulo="Guardar"
              bgcolor="#F9D70B"
            />
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
  background-color: rgba(10, 9, 9, 0.5);
  display: flex;
  width: 100%;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);

  .sub-contenedor {
    position: relative;
    background: ${({ theme }) => theme.bgtotal};
    box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
    padding: 13px 36px 13px 36px;
    z-index: 100;
    height: calc(100vh - 40px);
    overflow-y: auto;
    border-radius: 8px;

    .headers {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h1 {
        font-size: 30px;
      }
      span {
        font-size: 20px;
        cursor: pointer;
      }
    }
    .formulario {
      display: grid;
      grid-template-columns: 1fr;
      gap: 15px;
      @media ${Device.tablet} {
        grid-template-columns: repeat(2, 1fr);
      }
      .seccion1,
      .seccion2 {
        gap: 20px;
        display: flex;
        flex-direction: column;
      }
      .contentPadregenerar {
        position: relative;
      }
    }
  }
`;
const ContainerStock = styled.div`
  display: flex;
  border-radius: 15px;
  padding: 12px;
  flex-direction: column;
`;
const ContainerBtngenerar = styled.div`
  position: absolute;
  right: 0;
  top: 10%;
`;
const ContainerMensajeStock = styled.div`
  text-align: center;
  color: #f9184c;
  background-color: rgba(249, 24, 61, 0.2);
  border-radius: 10px;
  padding: 5px;
  margin: 10px;
  font-weight: 600;
`;
