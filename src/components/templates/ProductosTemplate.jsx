import React, { useEffect, useState, useMemo } from 'react';
import styled from "styled-components";
import {
  Btn1,
  Buscador,
  RegistrarProductos,
  TablaProductos,
  Title,
  useProductosStore,
  useEmpresaStore,
  useMostrarProductosQuery, // Hook de React Query
} from "../../index";
import { v } from "../../styles/variables";
import ConfettiExplosion from "react-confetti-explosion";
import { Toaster } from "sonner";

export function ProductosTemplate() {

  const [openRegistro, SetopenRegistro] = useState(false);
  const { setBuscador, generarCodigo } = useProductosStore();
  const { dataempresa } = useEmpresaStore();
  const [accion, setAccion] = useState("");
  const [dataSelect, setdataSelect] = useState([]);
  const [isExploding, setIsExploding] = useState(false);

  // Usa el hook de React Query
  const { data: dataProductos, isLoading, isError, error, refetch, isFetching, status } = // Añade status
    useMostrarProductosQuery(dataempresa?.id);

  useEffect(() => {
    // Llama a refetch solo si tenemos id_empresa.
    if (dataempresa?.id) {
       refetch();
    } 
  }, [dataempresa?.id, refetch]);


  function nuevoRegistro() {
    // ... (tu función)
    SetopenRegistro(!openRegistro);
    setAccion("Nuevo");
    setdataSelect([]);
    setIsExploding(false);
    generarCodigo();
  }

  // --- Lógica de Renderizado Condicional ---

  // 1. Estado de Carga Inicial (o si falta dataempresa)
  // Muestra "Cargando..." si está en 'pending' O si falta el id de empresa (query deshabilitada)
  if (status === 'pending' || !dataempresa?.id) {
    return <span>{ !dataempresa?.id ? 'Esperando datos de empresa...' : 'Cargando productos...' }</span>;
  }

  // 2. Estado de Error
  if (status === 'error') {
    return <span>Error al cargar productos: {error?.message || 'Error desconocido'}</span>;
  }
  
  // 3. Estado Éxito (status === 'success')
  // En este punto, sabemos que la carga terminó (o viene del caché) y no hubo error.
  // dataProductos debería ser un array (incluso vacío si no hay productos).
  return (
    <Container>
      <Toaster />
      {openRegistro && (
        <RegistrarProductos
          setIsExploding={setIsExploding}
          onClose={() => SetopenRegistro(!openRegistro)}
          dataSelect={dataSelect}
          accion={accion}
          state={openRegistro}
        />
      )}

      <section className="area1">
        <Title>Productos</Title>
        {/* Muestra un loader pequeño si está haciendo refetch en background */}
        {isFetching && <span style={{fontSize: '0.8em', opacity: 0.7}}>🔄</span>} 
        <Btn1
          funcion={nuevoRegistro}
          bgcolor={v.colorPrincipal}
          titulo="nuevo"
          icono={<v.iconoagregar />}
        />
      </section>
      <section className="area2">
        <Buscador setBuscador={setBuscador} />
      </section>

      <section className="main">
        {isExploding && <ConfettiExplosion />}
        <TablaProductos
          setdataSelect={setdataSelect}
          setAccion={setAccion}
          SetopenRegistro={SetopenRegistro}
           // Asegura pasar un array vacío si dataProductos es null/undefined
          data={dataProductos ?? []} 
        />
      </section>
    </Container>
  );
}
const Container = styled.div`
  height: calc(100vh - 80px);
  
  margin-top:50px;
  padding: 15px;
  display: grid;
  grid-template:
    "area1" 60px
    "area2" 60px
    "main" auto;
  .area1 {
    grid-area: area1;
    /* background-color: rgba(103, 93, 241, 0.14); */
    display: flex;
    justify-content: end;
    align-items: center;
    gap: 15px;
  }
  .area2 {
    grid-area: area2;
    /* background-color: rgba(7, 237, 45, 0.14); */
    display: flex;
    justify-content: end;
    align-items: center;
  }
  .main {
    grid-area: main;
    /* background-color: rgba(237, 7, 221, 0.14); */
  }
`;
